# Backend Setup Instructions

## Installation

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Create Python virtual environment:**

   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - **Windows:** `venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Project Settings
3. Go to "Service Accounts" tab
4. Click "Generate New Private Key"
5. Save the JSON file as `serviceAccountKey.json` in `backend/` directory

### 2. Configure Environment Variables

Create or update `backend/.env`:

```env
# Firebase
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id-from-firebase

# API Configuration
API_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Claims (for custom role/permission storage)
ORG_CLAIM_KEY=org_id
ROLE_CLAIM_KEY=role

# Logging
LOG_LEVEL=INFO
```

## Running the Backend

### Development Mode

```bash
python main.py
```

Or with Uvicorn directly:

```bash
uvicorn main:app --reload
```

### Access the API

- **API Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

## Testing the API

### 1. Get a Firebase Token

From your Angular app, get a token after login:

```typescript
// In your Angular app
import { getAuth } from "firebase/auth";

const auth = getAuth();
const token = await auth.currentUser?.getIdToken(true);
console.log(token); // Copy this token
```

### 2. Test Protected Route

**Using curl:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8000/api/user/profile
```

**Using REST Client (VS Code):**

```
GET http://localhost:8000/api/user/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

### 3. Test Organization Route

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Organization-Id: org-123" \
  http://localhost:8000/api/org/org-123/dashboard
```

## File Structure

```
backend/
├── __init__.py              # Package initialization
├── main.py                  # FastAPI application entry point
├── firebase_service.py      # Firebase Admin SDK wrapper
├── dependencies.py          # Dependency injection for auth
├── models.py                # Pydantic models for requests/responses
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (don't commit!)
├── serviceAccountKey.json   # Firebase credentials (don't commit!)
├── README.md                # Full documentation
├── SETUP.md                 # This file
└── routes/                  # Route modules (modular approach)
    ├── __init__.py
    ├── auth.py              # Auth endpoints
    ├── users.py             # User endpoints
    ├── organizations.py     # Organization endpoints
    └── admin.py             # Admin endpoints
```

## Next Steps

1. **Start the backend server** (see "Running the Backend" above)
2. **Test with curl or Postman** (see "Testing the API" above)
3. **Set Firebase custom claims** for roles/permissions:
   ```python
   # Via Firebase Console or backend script
   firebase_service.set_custom_claims("user-uid", {
       "role": "admin",
       "org_id": "org-123",
       "permissions": ["user.create", "billing.manage"]
   })
   ```
4. **Connect Angular frontend** with auth interceptor (see main README.md)
5. **Add database** when ready (SQLAlchemy + PostgreSQL recommended)

## Troubleshooting

### "Firebase credentials file not found"

- Download service account key from Firebase Console
- Set `FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json` in `.env`
- Or place the key file in `backend/` directory

### CORS errors in Angular

- Add Angular dev server to `API_ALLOWED_ORIGINS` in `.env`
- Default: `http://localhost:4200,http://localhost:3000`

### Token verification fails

- Ensure Firebase project ID in `.env` matches web app config
- Check token is valid (not expired)
- Test with `GET /api/auth/verify-token` endpoint

### Port already in use

- Change `PORT` in `.env` (default: 8000)
- Or kill process: `lsof -ti:8000 | xargs kill -9`

## API Endpoints Summary

| Method | Endpoint                    | Auth     | Description              |
| ------ | --------------------------- | -------- | ------------------------ |
| GET    | /health                     | ❌       | Health check             |
| GET    | /docs                       | ❌       | Swagger UI documentation |
| POST   | /api/auth/verify-token      | ✅       | Verify Firebase token    |
| POST   | /api/auth/logout            | ✅       | Logout user              |
| GET    | /api/user/profile           | ✅       | Get user profile         |
| PUT    | /api/user/profile           | ✅       | Update user profile      |
| GET    | /api/org/{org_id}/info      | ✅       | Get org info             |
| GET    | /api/org/{org_id}/dashboard | ✅       | Get org dashboard        |
| GET    | /api/org/{org_id}/members   | ✅       | List org members         |
| GET    | /api/admin/users            | ✅+admin | List all users           |
| GET    | /api/admin/organizations    | ✅+admin | List all orgs            |
| GET    | /api/admin/analytics        | ✅+admin | Get analytics            |

## Production Deployment

1. **Set DEBUG=False** in `.env`
2. **Update API_ALLOWED_ORIGINS** to production domain
3. **Use environment variables** for sensitive data (Firebase credentials path)
4. **Enable HTTPS** via reverse proxy (Nginx/CloudFlare)
5. **Set up monitoring** (Sentry, DataDog, etc.)
6. **Add database** and proper data persistence

See `README.md` for full production deployment guide.
