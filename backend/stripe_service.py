"""
Stripe Service Wrapper
Handles all Stripe subscription, invoice, and payment operations
"""

import os
import logging
from typing import Optional, List, Dict, Any
import stripe

logger = logging.getLogger(__name__)


class StripeService:
    """Singleton Stripe service wrapper"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        api_key = os.getenv('STRIPE_API_KEY')
        if not api_key:
            logger.warning("⚠️ STRIPE_API_KEY not configured - Stripe operations will fail")
            self.client = None
        else:
            stripe.api_key = api_key
            self.client = stripe
            logger.info("✓ Stripe API initialized")
        
        self._initialized = True
    
    def get_client(self):
        """Get Stripe client"""
        return self.client
    
    def create_customer(self, email: str, metadata: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        """Create Stripe customer"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            customer = self.client.Customer.create(
                email=email,
                metadata=metadata or {}
            )
            logger.info(f"Created Stripe customer: {customer.id}")
            return {
                'id': customer.id,
                'email': customer.email,
                'created_at': customer.created
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe customer: {str(e)}")
            raise ValueError(str(e))
    
    def create_subscription(self, customer_id: str, price_id: str, metadata: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Create subscription for customer"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            subscription = self.client.Subscription.create(
                customer=customer_id,
                items=[{'price': price_id}],
                metadata=metadata or {}
            )
            logger.info(f"Created subscription: {subscription.id}")
            return self._map_subscription(subscription)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create subscription: {str(e)}")
            raise ValueError(str(e))
    
    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get subscription details"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            subscription = self.client.Subscription.retrieve(subscription_id)
            return self._map_subscription(subscription)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve subscription: {str(e)}")
            raise ValueError(str(e))
    
    def update_subscription(self, subscription_id: str, price_id: Optional[str] = None, metadata: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Update subscription (e.g., change plan)"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            update_data = {}
            if metadata:
                update_data['metadata'] = metadata
            
            subscription = self.client.Subscription.retrieve(subscription_id)
            
            if price_id:
                # Update the price
                update_data['items'] = [{
                    'id': subscription['items']['data'][0]['id'],
                    'price': price_id
                }]
                # Prorate charges
                update_data['proration_behavior'] = 'create_prorations'
            
            updated = self.client.Subscription.modify(subscription_id, **update_data)
            logger.info(f"Updated subscription: {subscription_id}")
            return self._map_subscription(updated)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update subscription: {str(e)}")
            raise ValueError(str(e))
    
    def cancel_subscription(self, subscription_id: str, immediate: bool = False) -> Dict[str, Any]:
        """Cancel subscription"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            delete_params = {}
            if immediate:
                delete_params['invoice_now'] = True
            
            subscription = self.client.Subscription.delete(subscription_id, **delete_params)
            logger.info(f"Cancelled subscription: {subscription_id}")
            return self._map_subscription(subscription)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription: {str(e)}")
            raise ValueError(str(e))
    
    def list_invoices(self, customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """List invoices for customer"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            invoices = self.client.Invoice.list(customer=customer_id, limit=limit)
            return [self._map_invoice(inv) for inv in invoices['data']]
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list invoices: {str(e)}")
            raise ValueError(str(e))
    
    def get_invoice(self, invoice_id: str) -> Dict[str, Any]:
        """Get invoice details"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            invoice = self.client.Invoice.retrieve(invoice_id)
            return self._map_invoice(invoice)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve invoice: {str(e)}")
            raise ValueError(str(e))
    
    def list_payment_methods(self, customer_id: str) -> List[Dict[str, Any]]:
        """List payment methods for customer"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            methods = self.client.PaymentMethod.list(customer=customer_id, type="card")
            return [self._map_payment_method(method) for method in methods['data']]
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list payment methods: {str(e)}")
            raise ValueError(str(e))
    
    def attach_payment_method(self, payment_method_id: str, customer_id: str) -> Dict[str, Any]:
        """Attach payment method to customer"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            method = self.client.PaymentMethod.attach(payment_method_id, customer=customer_id)
            return self._map_payment_method(method)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to attach payment method: {str(e)}")
            raise ValueError(str(e))
    
    def detach_payment_method(self, payment_method_id: str) -> Dict[str, Any]:
        """Detach payment method from customer"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            method = self.client.PaymentMethod.detach(payment_method_id)
            return self._map_payment_method(method)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to detach payment method: {str(e)}")
            raise ValueError(str(e))
    
    def list_prices(self) -> List[Dict[str, Any]]:
        """List all available prices (plans)"""
        if not self.client:
            raise ValueError("Stripe not configured")
        
        try:
            prices = self.client.Price.list(active=True, expand=['data.product'])
            return [self._map_price(price) for price in prices['data']]
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list prices: {str(e)}")
            raise ValueError(str(e))
    
    @staticmethod
    def _map_subscription(subscription: Any) -> Dict[str, Any]:
        """Map Stripe subscription to app model"""
        return {
            'id': subscription.id,
            'customer_id': subscription.customer,
            'status': subscription.status,
            'current_period_start': subscription.current_period_start,
            'current_period_end': subscription.current_period_end,
            'auto_renew': subscription.auto_renew if hasattr(subscription, 'auto_renew') else True,
            'created_at': subscription.created,
            'canceled_at': subscription.canceled_at,
            'plan_id': subscription['items']['data'][0]['price']['id'] if subscription['items']['data'] else None,
            'plan_name': subscription['items']['data'][0]['price']['product'] if subscription['items']['data'] else None,
        }
    
    @staticmethod
    def _map_invoice(invoice: Any) -> Dict[str, Any]:
        """Map Stripe invoice to app model"""
        return {
            'id': invoice.id,
            'customer_id': invoice.customer,
            'subscription_id': invoice.subscription,
            'amount': invoice.amount_due,
            'amount_paid': invoice.amount_paid,
            'currency': invoice.currency,
            'status': invoice.status,
            'issued_at': invoice.created,
            'due_at': invoice.due_date,
            'paid_at': invoice.paid_at,
            'invoice_pdf': invoice.invoice_pdf,
            'hosted_invoice_url': invoice.hosted_invoice_url,
        }
    
    @staticmethod
    def _map_payment_method(method: Any) -> Dict[str, Any]:
        """Map Stripe payment method to app model"""
        return {
            'id': method.id,
            'customer_id': method.customer,
            'type': method.type,
            'card_brand': method.card.brand if hasattr(method, 'card') and method.card else None,
            'card_last4': method.card.last4 if hasattr(method, 'card') and method.card else None,
            'card_exp_month': method.card.exp_month if hasattr(method, 'card') and method.card else None,
            'card_exp_year': method.card.exp_year if hasattr(method, 'card') and method.card else None,
            'status': 'active',
            'created_at': method.created,
        }
    
    @staticmethod
    def _map_price(price: Any) -> Dict[str, Any]:
        """Map Stripe price to billing plan"""
        product = price.product if isinstance(price.product, dict) else {'name': 'Unknown', 'id': ''}
        return {
            'id': price.id,
            'product_id': price.product if isinstance(price.product, str) else product.get('id', ''),
            'product_name': product.get('name', 'Unknown') if isinstance(product, dict) else product.name,
            'amount': price.unit_amount,
            'currency': price.currency,
            'billing_period': price.recurring.interval if price.recurring else 'one-time',
            'interval_count': price.recurring.interval_count if price.recurring else 1,
            'created_at': price.created,
        }


# Singleton instance
stripe_service = StripeService()
