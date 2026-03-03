"""
Billing Routes
Handles subscriptions, invoices, payment methods, and billing operations via Stripe
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from typing import Optional, List
import logging

from ..models import ApiResponse, User
from ..dependencies import get_current_user
from ..stripe_service import stripe_service
from ..database import get_firestore_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/plans", response_model=ApiResponse)
async def get_billing_plans():
    """Get list of available billing plans/prices"""
    try:
        prices = stripe_service.list_prices()
        
        plans = []
        for price in prices:
            plans.append({
                "id": price['id'],
                "name": price['product_name'],
                "amount": price['amount'],
                "currency": price['currency'],
                "billing_period": price['billing_period'],
                "interval_count": price['interval_count'],
                "created_at": datetime.fromtimestamp(price['created_at']),
            })
        
        return ApiResponse(
            success=True,
            data={"plans": sorted(plans, key=lambda x: x['amount'])}
        )
    except Exception as e:
        logger.error(f"Failed to list billing plans: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subscriptions", response_model=ApiResponse)
async def get_subscriptions(
    organization_id: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    """Get subscriptions for organization"""
    try:
        # TODO: Verify user has access to this organization
        firestore_db = get_firestore_db()
        
        org_doc = firestore_db.collection('organizations').document(organization_id).get()
        if not org_doc.exists:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        org_data = org_doc.to_dict()
        stripe_customer_id = org_data.get('stripe_customer_id')
        
        if not stripe_customer_id:
            return ApiResponse(success=True, data={"subscriptions": []})
        
        # List subscriptions for customer
        stripe_client = stripe_service.get_client()
        subscriptions = stripe_client.Subscription.list(customer=stripe_customer_id)
        
        subs = []
        for sub in subscriptions['data']:
            subs.append({
                "id": sub.id,
                "status": sub.status,
                "price_id": sub['items']['data'][0]['price']['id'] if sub['items']['data'] else None,
                "current_period_start": datetime.fromtimestamp(sub.current_period_start),
                "current_period_end": datetime.fromtimestamp(sub.current_period_end),
                "auto_renew": True,
                "created_at": datetime.fromtimestamp(sub.created),
                "canceled_at": datetime.fromtimestamp(sub.canceled_at) if sub.canceled_at else None,
            })
        
        return ApiResponse(success=True, data={"subscriptions": subs})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get subscriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subscriptions", response_model=ApiResponse)
async def create_subscription(
    organization_id: str = Query(...),
    price_id: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    """Create subscription for organization"""
    try:
        firestore_db = get_firestore_db()
        
        org_doc = firestore_db.collection('organizations').document(organization_id).get()
        if not org_doc.exists:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        org_data = org_doc.to_dict()
        stripe_customer_id = org_data.get('stripe_customer_id')
        
        # Create customer if doesn't exist
        if not stripe_customer_id:
            customer_info = stripe_service.create_customer(
                email=org_data.get('billing_email', f"billing@{organization_id}.local"),
                metadata={
                    'organization_id': organization_id,
                    'organization_name': org_data.get('name', ''),
                }
            )
            stripe_customer_id = customer_info['id']
            
            # Update org with customer ID
            firestore_db.collection('organizations').document(organization_id).update({
                'stripe_customer_id': stripe_customer_id,
                'updated_at': datetime.now(),
            })
        
        # Create subscription
        subscription = stripe_service.create_subscription(
            customer_id=stripe_customer_id,
            price_id=price_id,
            metadata={'organization_id': organization_id}
        )
        
        return ApiResponse(
            success=True,
            data={
                "subscription": {
                    "id": subscription['id'],
                    "status": subscription['status'],
                    "price_id": subscription['plan_id'],
                    "current_period_start": subscription['created_at'],
                    "current_period_end": subscription['current_period_end'],
                    "created_at": subscription['created_at'],
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/subscriptions/{subscription_id}", response_model=ApiResponse)
async def update_subscription(
    subscription_id: str,
    price_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),  # resume, cancel (soft)
    current_user: User = Depends(get_current_user)
):
    """Update subscription (change price, pause, resume)"""
    try:
        subscription = stripe_service.get_subscription(subscription_id)
        
        if status == 'resume':
            # Resume paused subscription
            stripe_client = stripe_service.get_client()
            stripe_subscription = stripe_client.Subscription.retrieve(subscription_id)
            if stripe_subscription.pause_collection:
                updated = stripe_client.Subscription.modify(
                    subscription_id,
                    pause_collection=None
                )
                subscription = stripe_service._map_subscription(updated)
        
        elif price_id:
            # Change price/plan
            subscription = stripe_service.update_subscription(
                subscription_id,
                price_id=price_id
            )
        
        return ApiResponse(
            success=True,
            data={"subscription": {
                "id": subscription['id'],
                "status": subscription['status'],
                "price_id": subscription['plan_id'],
                "current_period_start": subscription['current_period_start'],
                "current_period_end": subscription['current_period_end'],
            }}
        )
    except Exception as e:
        logger.error(f"Failed to update subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subscriptions/{subscription_id}/cancel", response_model=ApiResponse)
async def cancel_subscription(
    subscription_id: str,
    immediate: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Cancel subscription"""
    try:
        subscription = stripe_service.cancel_subscription(
            subscription_id,
            immediate=immediate
        )
        
        return ApiResponse(
            success=True,
            data={
                "subscription": {
                    "id": subscription['id'],
                    "status": subscription['status'],
                    "canceled_at": subscription['canceled_at'],
                }
            }
        )
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices", response_model=ApiResponse)
async def get_invoices(
    organization_id: str = Query(...),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """Get invoices for organization"""
    try:
        firestore_db = get_firestore_db()
        
        org_doc = firestore_db.collection('organizations').document(organization_id).get()
        if not org_doc.exists:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        org_data = org_doc.to_dict()
        stripe_customer_id = org_data.get('stripe_customer_id')
        
        if not stripe_customer_id:
            return ApiResponse(success=True, data={"invoices": [], "total": 0})
        
        invoices = stripe_service.list_invoices(stripe_customer_id, limit=limit)
        
        invoice_list = []
        for inv in invoices:
            invoice_list.append({
                "id": inv['id'],
                "amount": inv['amount'],
                "currency": inv['currency'],
                "status": inv['status'],
                "issued_at": inv['issued_at'],
                "paid_at": inv['paid_at'],
                "due_at": inv['due_at'],
                "invoice_pdf": inv['invoice_pdf'],
                "hosted_invoice_url": inv['hosted_invoice_url'],
            })
        
        return ApiResponse(
            success=True,
            data={
                "invoices": invoice_list[offset:offset+limit],
                "total": len(invoice_list),
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get invoices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices/{invoice_id}/pdf", response_model=ApiResponse)
async def get_invoice_pdf(
    invoice_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get invoice PDF URL"""
    try:
        invoice = stripe_service.get_invoice(invoice_id)
        
        return ApiResponse(
            success=True,
            data={
                "pdf_url": invoice['invoice_pdf'],
                "hosted_url": invoice['hosted_invoice_url'],
            }
        )
    except Exception as e:
        logger.error(f"Failed to get invoice PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payment-methods", response_model=ApiResponse)
async def get_payment_methods(
    organization_id: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    """Get payment methods for organization"""
    try:
        firestore_db = get_firestore_db()
        
        org_doc = firestore_db.collection('organizations').document(organization_id).get()
        if not org_doc.exists:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        org_data = org_doc.to_dict()
        stripe_customer_id = org_data.get('stripe_customer_id')
        
        if not stripe_customer_id:
            return ApiResponse(success=True, data={"payment_methods": []})
        
        methods = stripe_service.list_payment_methods(stripe_customer_id)
        
        payment_methods = []
        for method in methods:
            payment_methods.append({
                "id": method['id'],
                "type": method['type'],
                "card_brand": method['card_brand'],
                "card_last4": method['card_last4'],
                "card_exp_month": method['card_exp_month'],
                "card_exp_year": method['card_exp_year'],
                "created_at": method['created_at'],
            })
        
        return ApiResponse(success=True, data={"payment_methods": payment_methods})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get payment methods: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payment-methods", response_model=ApiResponse)
async def add_payment_method(
    organization_id: str = Query(...),
    payment_method_id: str = Query(...),
    set_default: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Add payment method to organization"""
    try:
        firestore_db = get_firestore_db()
        
        org_doc = firestore_db.collection('organizations').document(organization_id).get()
        if not org_doc.exists:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        org_data = org_doc.to_dict()
        stripe_customer_id = org_data.get('stripe_customer_id')
        
        if not stripe_customer_id:
            raise HTTPException(status_code=400, detail="Organization has no Stripe customer")
        
        # Attach payment method to customer
        method = stripe_service.attach_payment_method(
            payment_method_id,
            stripe_customer_id
        )
        
        # Set as default if requested
        if set_default:
            stripe_client = stripe_service.get_client()
            stripe_client.Customer.modify(
                stripe_customer_id,
                invoice_settings={"default_payment_method": payment_method_id}
            )
        
        return ApiResponse(
            success=True,
            data={
                "payment_method": {
                    "id": method['id'],
                    "type": method['type'],
                    "card_brand": method['card_brand'],
                    "card_last4": method['card_last4'],
                    "card_exp_month": method['card_exp_month'],
                    "card_exp_year": method['card_exp_year'],
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add payment method: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/payment-methods/{payment_method_id}", response_model=ApiResponse)
async def remove_payment_method(
    payment_method_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove payment method from organization"""
    try:
        stripe_service.detach_payment_method(payment_method_id)
        
        return ApiResponse(
            success=True,
            data={"message": "Payment method removed"}
        )
    except Exception as e:
        logger.error(f"Failed to remove payment method: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
