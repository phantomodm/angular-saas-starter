# Backend Quick Start Guide

## 🚀 Get Backend Running in 5 Minutes

### Step 1: Download Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save as `backend/serviceAccountKey.json`

### Step 2: Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3: Configure Environment

Edit or create `backend/.env`:

```env
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-firebase-project-id
API_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000
PORT=8000
DEBUG=True
```

### Step 4: Run Backend

```bash
python main.py
```

✅ Backend is running at `http://localhost:8000`

Visit: http://localhost:8000/docs for interactive API documentation

---

## 📋 What's Included

### Core Files

- **main.py** - FastAPI application with all routes
- **firebase_service.py** - Firebase Admin SDK wrapper
- **dependencies.py** - Authentication dependency injectors
- **models.py** - Pydantic validation models
- **requirements.txt** - Python dependencies

### Routes (Modular)

- **routes/auth.py** - Authentication endpoints
- **routes/users.py** - User profile endpoints
- **routes/organizations.py** - Organization endpoints
- **routes/admin.py** - Admin endpoints

### Utilities

- **setup_check.py** - Diagnose setup issues
- **test_api.py** - Test endpoints without curl/Postman
- **SETUP.md** - Detailed setup instructions
- **README.md** - Complete documentation

---

## 🧪 Test the API

### Run Setup Diagnostics

```bash
python setup_check.py
```

### Test API Endpoints

```bash
python test_api.py
```

Paste a Firebase token when prompted to test authenticated endpoints.

### Manual Testing with Curl

```bash
# Health check (no auth)
curl http://localhost:8000/health

# With Firebase token (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/user/profile

# With organization header
curl -H "Authorization: Bearer TOKEN" \
  -H "X-Organization-Id: org-123" \
  http://localhost:8000/api/org/org-123/dashboard
```

---

## 📚 Available Endpoints

### No Authentication Required

- `GET /health` - Health check
- `GET /docs` - API documentation
- `GET /redoc` - ReDoc documentation

### Authentication Required

- `POST /api/auth/verify-token` - Verify token
- `POST /api/auth/logout` - Logout
- `GET /api/user/profile` - Get user profile
- `GET /api/org/{org_id}/info` - Org info
- `GET /api/org/{org_id}/dashboard` - Org dashboard

### Admin Only

- `GET /api/admin/users` - List users
- `GET /api/admin/organizations` - List orgs
- `GET /api/admin/analytics` - System analytics

---

## 🔧 Common Issues

### "Firebase credentials not found"

```bash
# Download service account key then:
export FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
# or edit .env file with correct path
```

### "Connection refused"

- Make sure backend is running: `python main.py`
- Check port 8000 is not in use (change `PORT` in `.env`)

### "CORS error in Angular"

- Add Angular dev server to `API_ALLOWED_ORIGINS` in `.env`
- Must restart backend after changing `.env`

### "Token verification failed"

- Get fresh token from Firebase
- Ensure `FIREBASE_PROJECT_ID` matches your Firebase project
- Check token hasn't expired (Firebase tokens valid for 1 hour)

---

## 🔐 Security Notes

### Don't Commit These Files

```
.env
serviceAccountKey.json
venv/
__pycache__/
```

(Already in `.gitignore`)

### Token Storage

- Frontend: Firebase SDK handles token storage securely
- Backend: Tokens verified on each request
- No token stored on backend

### Production

- Set `DEBUG=False` in `.env`
- Use environment variables for sensitive data
- Enable HTTPS via reverse proxy (Nginx)
- Set proper CORS origins to production domain

---

## 📝 Next Steps

1. ✅ Backend running?
   - Visit http://localhost:8000/docs

2. ✅ API working?
   - Run `python setup_check.py` and `python test_api.py`

3. ✅ Ready to connect Angular?
   - See Angular auth implementation in frontend code
   - Use `/api/` endpoints in Angular services

4. ✅ Want to add functionality?
   - Edit routes in `backend/routes/`
   - Add new Pydantic models in `models.py`
   - Register new dependencies in `dependencies.py`

---

## 📞 Support

### Documentation

- **Full Setup**: See `SETUP.md`
- **API Reference**: See `README.md`
- **Interactive Docs**: Visit `/docs` endpoint

### Debugging

```bash
# Verbose logging
export LOG_LEVEL=DEBUG
python main.py

# Check endpoints
curl http://localhost:8000/docs
```

### Common Routes Pattern

```
GET  /api/resource              - List all
GET  /api/resource/{id}         - Get one
POST /api/resource              - Create
PUT  /api/resource/{id}         - Update
DELETE /api/resource/{id}       - Delete

GET  /api/org/{org_id}/resource - Org-scoped list
```

---

## ✨ Architecture

```
Browser (Angular)
    ↓ (HTTP + Authorization header)
    ↓
Nginx / Reverse Proxy (Production)
    ↓ (Port 8000)
    ↓
FastAPI Application (main.py)
    ↓
Dependency Injection
    ├── verify_token → Firebase Admin SDK
    ├── get_current_user → Firebase
    └── verify_organization_access → Custom claims
    ↓
Route Handlers
    ├── auth.py
    ├── users.py
    ├── organizations.py
    └── admin.py
    ↓
Response (JSON)
```

---

## 🎯 Success Checklist

- [ ] Firebase credentials downloaded and saved
- [ ] `.env` configured with Firebase project ID
- [ ] `pip install -r requirements.txt` completed
- [ ] `python main.py` runs without errors
- [ ] Health check works: `curl http://localhost:8000/health`
- [ ] API docs visible: http://localhost:8000/docs
- [ ] Setup diagnostics pass: `python setup_check.py`

🎉 **You're ready to connect your Angular frontend!**
