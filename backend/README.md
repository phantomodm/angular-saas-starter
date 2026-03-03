# Angular SaaS Backend API

FastAPI backend for the Angular SaaS Starter with Firebase JWT authentication and multi-tenant organization support.

## Overview

This backend provides:

- **Firebase JWT Authentication**: Secure token verification using Firebase Admin SDK
- **Multi-Tenant Architecture**: Organization scoping via headers and custom claims
- **Role-Based Access Control (RBAC)**: Admin, owner, member, viewer roles
- **Protected Routes**: Dependency injection for auth verification
- **CORS Support**: Configured for Angular frontend development and production

## Quick Start

### 1. Prerequisites

- Python 3.9+
- Firebase Project created
- Firebase service account key (JSON file)

### 2. Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration

#### Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file

#### Set Environment Variables

Create `.env` file in `backend/` directory:

```env
# Firebase
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id

# API
API_ALLOWED_ORIGINS=http://localhost:4200,https://yourdomain.com
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Claims
ORG_CLAIM_KEY=org_id
ROLE_CLAIM_KEY=role

# Logging
LOG_LEVEL=INFO
```

### 4. Run Server

```bash
python main.py
```

Or using Uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Authentication

- `POST /api/auth/verify-token` - Verify Firebase token (requires auth)

### User

- `GET /api/user/profile` - Get current user profile (requires auth)
- `POST /api/user/logout` - Logout user (requires auth)

### Organization

- `GET /api/org/{org_id}/info` - Get org info (requires auth + org membership)
- `GET /api/org/{org_id}/dashboard` - Get org dashboard (requires auth + org membership)

### Admin

- `GET /api/admin/users` - List all users (requires admin role)
- `GET /api/admin/organizations` - List all orgs (requires admin role)

### Protected

- `GET /api/protected-data` - Example protected endpoint (requires auth)

## Authentication Flow

### 1. Frontend Login

```
User enters email + password → Firebase Auth signs in → Gets ID token
```

### 2. Request with Token

```
Angular app → HTTP request with Authorization header:
Authorization: Bearer {firebase_id_token}
```

### 3. Backend Verification

```
FastAPI → verify_token dependency → Firebase Admin SDK verifies token
→ Extracts uid, email, custom claims → Route handler processes request
```

### 4. Token Refresh

```
Token expires → Frontend catches 401 → Calls Firebase getIdToken(true)
→ Gets new token → Retries request with new token
```

## Dependencies

### Authentication

- **verify_token**: Verifies Firebase token, returns TokenData
- **get_current_user**: Gets user info from Firebase
- **verify_organization_access**: Verifies user is in organization
- **require_admin**: Requires admin role
- **require_role(\*roles)**: Factory for role requirements
- **require_permission(\*permissions)**: Factory for permission requirements

### Usage Example

```python
from backend.dependencies import verify_token, get_current_user, verify_organization_access

@app.get("/api/protected")
async def protected_route(
    token_data: TokenData = Depends(verify_token),
    user: UserInfo = Depends(get_current_user)
):
    return {"user_id": user.uid, "email": user.email}

@app.get("/api/org/{org_id}/data")
async def org_data(
    org_id: str,
    org_access: dict = Depends(verify_organization_access)
):
    return {"org_id": org_access['organization_id']}
```

## Custom Claims

Set custom claims on users via Firebase Admin SDK:

```python
from backend.firebase_service import firebase_service

# Set role and org_id on user
firebase_service.set_custom_claims("user-uid", {
    "role": "admin",
    "org_id": "org-123",
    "permissions": ["user.create", "billing.manage"]
})
```

Then verify in routes:

```python
@app.delete("/api/users/{user_id}")
async def delete_user(
    token_data: TokenData = Depends(require_role("admin"))
):
    # User has admin role
    return {"success": True}
```

## Organization Scoping

### Header-Based Scoping

Angular sends organization ID in header:

```
GET /api/org/org-123/data
X-Organization-Id: org-123
```

Backend verifies user's org matches:

```python
async def verify_organization_access(
    token_data: TokenData = Depends(verify_token),
    x_organization_id: str = Header(None)
) -> dict:
    # Verifies user's org_id claim matches x_organization_id
```

### Custom Claims Scoping

Store org_id in Firebase custom claims:

```python
firebase_service.set_custom_claims("user-uid", {
    "org_id": "org-123"
})
```

Then in routes:

```python
org_id = token_data.custom_claims.get('org_id')
```

## Error Handling

### 401 Unauthorized

- Invalid token
- Expired token
- Missing Authorization header
- User not found

### 403 Forbidden

- User not in organization
- User doesn't have required role
- User doesn't have required permission

### 500 Internal Server Error

- Firebase initialization failed
- Unexpected server error

## Logging

Logs are configured with:

- Format: timestamp, logger name, level, message
- Level: Configurable via `LOG_LEVEL` env var
- Destinations: Console (add file handler as needed)

View logs during development:

```
2024-01-01 10:15:30,123 - backend.firebase_service - INFO - Firebase Admin SDK initialized successfully
```

## Testing

### Test Token Verification

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  http://localhost:8000/api/auth/verify-token
```

### Test Protected Route

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  http://localhost:8000/api/user/profile
```

### Test Organization Access

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "X-Organization-Id: org-123" \
  http://localhost:8000/api/org/org-123/dashboard
```

## Production Deployment

### Environment Variables

```env
DEBUG=False
API_ALLOWED_ORIGINS=https://app.yourdomain.com
FIREBASE_CREDENTIALS_PATH=/etc/secrets/serviceAccountKey.json
LOG_LEVEL=INFO
```

### Docker (Optional)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### CORS for Production

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Organization-Id"],
)
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header X-Organization-Id $http_x_organization_id;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## File Structure

```
backend/
├── __init__.py              # Package init
├── main.py                  # FastAPI app
├── firebase_service.py      # Firebase Admin SDK wrapper
├── dependencies.py          # Auth dependency injectors
├── models.py                # Pydantic models
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (don't commit)
├── serviceAccountKey.json   # Firebase credentials (don't commit)
├── README.md                # This file
└── routes/                  # Future: Route modules
    ├── __init__.py
    ├── auth.py
    ├── users.py
    └── organizations.py
```

## Next Steps

1. **Database Integration**: Add SQLAlchemy + PostgreSQL
2. **Request Validation**: Add more Pydantic models
3. **Rate Limiting**: Add slowapi or ratelimit
4. **Monitoring**: Add Sentry integration
5. **Testing**: Add pytest test suite
6. **API Documentation**: Enhance OpenAPI specs

## Troubleshooting

### Firebase Credentials Not Found

```
FileNotFoundError: Firebase credentials file not found at ./serviceAccountKey.json
```

**Solution**: Download service account key from Firebase Console and set `FIREBASE_CREDENTIALS_PATH`

### CORS Error in Frontend

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Add frontend URL to `API_ALLOWED_ORIGINS` in `.env`

### Token Verification Fails

```
ValueError: Invalid token: 'aud' claim mismatch
```

**Solution**: Ensure Frontend Firebase config matches backend's FIREBASE_PROJECT_ID

## Support

For issues or questions:

1. Check logs: `LOG_LEVEL=DEBUG` for verbose logging
2. Test token: `POST /api/auth/verify-token` with valid token
3. Check Firebase Console for user/custom claims issues

## License

MIT
