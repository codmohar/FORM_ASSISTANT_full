"""
Saral Setu - Backend API Server
FastAPI with MongoDB (Docker), JWT Auth, Profile Vault, Form Storage, History Logging,
Multilingual Translation, and Gemini AI Voice Agent.
"""

import os
import sys
import json
import time
import uuid
import random
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

import io
import re
import requests
from fastapi import FastAPI, HTTPException, Request, Depends, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

# MongoDB Motor Async Driver
from motor.motor_asyncio import AsyncIOMotorClient

# Auth libraries
from passlib.context import CryptContext
from jose import jwt, JWTError

# PDF and Image Processing
try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# ─── Load environment ───────────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "").strip()
HF_IMAGE_TO_TEXT_MODEL = os.getenv("HF_IMAGE_TO_TEXT_MODEL", "microsoft/trocr-base-printed").strip()

JWT_SECRET = os.getenv("JWT_SECRET", "saralsetu_jwt_secret_key_2024_formeasya1_mvp").strip()
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017").strip()
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "saralsetu_db").strip()

# Global MongoDB Client and Database Reference
mongo_client: AsyncIOMotorClient = None
db = None

# ─── Hugging Face & Gemini AI Configuration ──────────────────────────
HAS_GEMINI = False
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        HAS_GEMINI = True
        print(f"[OK] Google Gemini AI initialized: {GEMINI_MODEL}")
    except Exception as e:
        print(f"[Warning] Failed to configure google.generativeai: {e}")

HAS_HUGGINGFACE = bool(HUGGINGFACE_API_KEY)
if HAS_HUGGINGFACE:
    print(f"[OK] Hugging Face Image-to-Text initialized: {HF_IMAGE_TO_TEXT_MODEL}")
else:
    print("[Info] HUGGINGFACE_API_KEY not provided. Gemini Vision & PDF extractors active.")

try:
    from deep_translator import GoogleTranslator
    HAS_DEEP_TRANSLATOR = True
except ImportError:
    HAS_DEEP_TRANSLATOR = False

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from translations import SUPPORTED_LANGUAGES, TRANSLATIONS
except ImportError:
    from backend.translations import SUPPORTED_LANGUAGES, TRANSLATIONS

import bcrypt

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password with bcrypt."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# ─── Database Initialization ────────────────────────────────────────
async def init_db():
    """Connect to MongoDB and ensure indexes exist."""
    global mongo_client, db
    try:
        mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = mongo_client[MONGO_DB_NAME]
        
        # Verify connection
        await mongo_client.admin.command('ping')
        print(f"[OK] Connected to MongoDB ({MONGO_DB_NAME}) at {MONGO_URI}")

        # Ensure indexes for users, profiles, submitted_forms, and history
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.profiles.create_index("user_id", unique=True)
        await db.submitted_forms.create_index("user_id")
        await db.submitted_forms.create_index("submitted_at")
        await db.history.create_index("user_id")
        await db.history.create_index("timestamp")
        print("[OK] MongoDB indexes verified successfully.")
    except Exception as e:
        print(f"[Warning] MongoDB connection failed: {e}. Running with lazy reconnection.")

# ─── App Lifecycle ───────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("[Info] MongoDB connection closed.")

app = FastAPI(
    title="Saral Setu Backend API",
    description="MongoDB Auth, Profile Vault, Form Storage, Translation & Gemini AI Server",
    version="3.1.0",
    lifespan=lifespan
)

# ─── CORS ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# ─── Translation Cache ──────────────────────────────────────────────
TRANSLATION_CACHE: Dict[str, str] = {}

# ═══════════════════════════════════════════════════════════════════════
#  PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════

class SignupRequest(BaseModel):
    name: Optional[str] = "Citizen User"
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    guardian_name: Optional[str] = None
    aadhaar: Optional[str] = None
    pan: Optional[str] = None
    voter_id: Optional[str] = None
    phone: Optional[str] = None
    email_contact: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    category: Optional[str] = None
    institution: Optional[str] = None
    degree: Optional[str] = None
    major: Optional[str] = None
    roll_number: Optional[str] = None
    gpa: Optional[str] = None
    graduation_year: Optional[str] = None
    pension_ppo: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc: Optional[str] = None
    income: Optional[str] = None
    preferred_language: Optional[str] = None
    preferred_voice_gender: Optional[str] = None
    reading_rate: Optional[str] = None

class FormSubmitRequest(BaseModel):
    form_title: Optional[str] = "Official Application Form"
    ref_number: Optional[str] = None
    status: Optional[str] = "Submitted"
    fields_count: Optional[int] = 0
    fields_snapshot: Optional[Dict[str, Any]] = {}
    form_url: Optional[str] = ""

class HistoryCreate(BaseModel):
    form_url: Optional[str] = ""
    form_title: Optional[str] = ""
    status: Optional[str] = "Filled"
    fields_count: Optional[int] = 0
    fields_snapshot: Optional[Dict[str, Any]] = {}

class TranslationRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: Optional[str] = "auto"

class DocTranslationRequest(BaseModel):
    doc_id: str
    title: str
    summary_points: List[str]
    target_lang: str

class FormTranslateRequest(BaseModel):
    form_schema: Dict[str, Any]
    target_lang: str

class VoicePlanRequest(BaseModel):
    instruction: str
    domContext: Optional[Dict[str, Any]] = None
    availableActions: Optional[List[Dict[str, Any]]] = None

class DocumentChatRequest(BaseModel):
    question: str
    docTitle: Optional[str] = None
    docSummary: Optional[List[str]] = None
    fullText: Optional[str] = None

# ═══════════════════════════════════════════════════════════════════════
#  JWT HELPERS
# ═══════════════════════════════════════════════════════════════════════

def create_jwt_token(user_id: str, email: str) -> str:
    """Create a signed JWT token with 24h expiry."""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, str]:
    """Extract and validate JWT from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization format. Use: Bearer <token>")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"id": user_id, "email": email}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")

# ═══════════════════════════════════════════════════════════════════════
#  MONGODB HEALTH CHECK ENDPOINT
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/health/mongo")
async def get_mongo_health():
    """Checks MongoDB container connection and returns collection counts."""
    global mongo_client, db
    if db is None:
        return {"success": False, "status": "disconnected", "error": "Database client not initialized"}
    try:
        await mongo_client.admin.command("ping")
        users_count = await db.users.count_documents({})
        forms_count = await db.submitted_forms.count_documents({})
        history_count = await db.history.count_documents({})
        return {
            "success": True,
            "status": "connected",
            "database": MONGO_DB_NAME,
            "mongo_uri": MONGO_URI,
            "counts": {
                "users": users_count,
                "submitted_forms": forms_count,
                "history": history_count
            }
        }
    except Exception as e:
        return {"success": False, "status": "disconnected", "error": str(e)}

# ═══════════════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS (MONGODB)
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/auth/signup")
async def signup(req: SignupRequest):
    """Register a new user with name + email + bcrypt hashed password in MongoDB."""
    global db
    email = req.email.strip().lower()
    name = (req.name or "").strip() or "Citizen User"
    password = req.password.strip()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Check if email already exists in MongoDB
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="This email is already registered. Please log in.")

    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    now_iso = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    await db.users.insert_one(user_doc)

    # Create initial clean dynamic profile vault document in MongoDB
    profile_doc = {
        "user_id": user_id,
        "full_name": name,
        "dob": "",
        "gender": "",
        "guardian_name": "",
        "aadhaar": "",
        "pan": "",
        "voter_id": "",
        "phone": "",
        "email_contact": email,
        "address": "",
        "pincode": "",
        "category": "",
        "institution": "",
        "degree": "",
        "major": "",
        "roll_number": "",
        "gpa": "",
        "graduation_year": "",
        "pension_ppo": "",
        "bank_account": "",
        "ifsc": "",
        "income": "",
        "preferred_language": "en",
        "preferred_voice_gender": "female",
        "reading_rate": "normal",
        "created_at": now_iso,
        "updated_at": now_iso
    }
    await db.profiles.insert_one(profile_doc)

    token = create_jwt_token(user_id, email)
    return {
        "success": True,
        "token": token,
        "user": {"id": user_id, "name": name, "email": email}
    }

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    """Authenticate user with email + password against MongoDB and return JWT."""
    global db
    email = req.email.strip().lower()
    password = req.password.strip()

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_jwt_token(user["id"], user["email"])
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "name": user.get("name", "Citizen"),
            "email": user["email"]
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: Dict = Depends(get_current_user)):
    """Returns current authenticated user info + profile vault from MongoDB."""
    global db
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    profile = await db.profiles.find_one({"user_id": current_user["id"]})
    profile_data = dict(profile) if profile else {}
    profile_data.pop("_id", None)
    profile_data.pop("user_id", None)

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user.get("name", ""),
            "email": user["email"]
        },
        "profile": profile_data
    }

# ═══════════════════════════════════════════════════════════════════════
#  PROFILE CRUD ENDPOINTS (MONGODB)
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/profile")
async def get_profile(current_user: Dict = Depends(get_current_user)):
    """Get full profile vault for authenticated user from MongoDB."""
    global db
    profile = await db.profiles.find_one({"user_id": current_user["id"]})
    if not profile:
        return {"success": True, "profile": {}}

    profile_data = dict(profile)
    profile_data.pop("_id", None)
    profile_data.pop("user_id", None)
    return {"success": True, "profile": profile_data}

@app.put("/api/profile")
async def update_profile(req: ProfileUpdate, current_user: Dict = Depends(get_current_user)):
    """Upsert profile fields for authenticated user in MongoDB."""
    global db
    update_fields = {k: v for k, v in req.model_dump().items() if v is not None}
    if not update_fields:
        return {"success": True, "message": "No fields to update"}

    now_iso = datetime.now(timezone.utc).isoformat()
    update_fields["updated_at"] = now_iso

    await db.profiles.update_one(
        {"user_id": current_user["id"]},
        {"$set": update_fields},
        upsert=True
    )

    # Sync full name to users collection if provided
    if "full_name" in update_fields and update_fields["full_name"]:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"name": update_fields["full_name"], "updated_at": now_iso}}
        )

    return {"success": True, "message": "Profile updated in MongoDB", "updated_fields": list(update_fields.keys())}

# ═══════════════════════════════════════════════════════════════════════
#  FORM SUBMISSIONS & STORAGE (MONGODB)
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/forms/submit")
async def submit_form(req: FormSubmitRequest, current_user: Dict = Depends(get_current_user)):
    """Store submitted form and its full field snapshot in MongoDB."""
    global db
    form_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    ref_no = req.ref_number or f"GOV-SS-{random.randint(100000, 999999)}"

    form_doc = {
        "id": form_id,
        "user_id": current_user["id"],
        "form_title": req.form_title or "Official Application Form",
        "ref_number": ref_no,
        "status": req.status or "Submitted",
        "fields_count": req.fields_count or len(req.fields_snapshot or {}),
        "fields_snapshot": req.fields_snapshot or {},
        "form_url": req.form_url,
        "submitted_at": now_iso
    }
    await db.submitted_forms.insert_one(form_doc)

    # Also log to history collection
    history_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "form_url": req.form_url,
        "form_title": req.form_title or "Official Application Form",
        "ref_number": ref_no,
        "status": req.status or "Submitted",
        "fields_count": req.fields_count or len(req.fields_snapshot or {}),
        "fields_snapshot": req.fields_snapshot or {},
        "timestamp": now_iso
    }
    await db.history.insert_one(history_doc)

    return {
        "success": True,
        "message": "Form stored securely in MongoDB",
        "form_id": form_id,
        "ref_number": ref_no,
        "submitted_at": now_iso
    }

@app.get("/api/forms/my-submissions")
async def get_my_submissions(current_user: Dict = Depends(get_current_user), limit: int = 50, offset: int = 0):
    """Retrieve all submitted forms for the authenticated user from MongoDB."""
    global db
    cursor = db.submitted_forms.find({"user_id": current_user["id"]}).sort("submitted_at", -1).skip(offset).limit(limit)
    items = []
    async for doc in cursor:
        doc.pop("_id", None)
        items.append(doc)
    total = await db.submitted_forms.count_documents({"user_id": current_user["id"]})
    return {
        "success": True,
        "forms": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }

# ═══════════════════════════════════════════════════════════════════════
#  HISTORY & ACTIVITY TRACKING (MONGODB)
# ═══════════════════════════════════════════════════════════════════════

@app.post("/api/history")
async def log_history(req: HistoryCreate, current_user: Dict = Depends(get_current_user)):
    """Log a form fill/submission event in MongoDB."""
    global db
    history_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": history_id,
        "user_id": current_user["id"],
        "form_url": req.form_url,
        "form_title": req.form_title,
        "status": req.status,
        "fields_count": req.fields_count,
        "fields_snapshot": req.fields_snapshot or {},
        "timestamp": timestamp
    }
    await db.history.insert_one(doc)

    return {
        "success": True,
        "history_id": history_id,
        "timestamp": timestamp
    }

@app.get("/api/history")
async def get_history(current_user: Dict = Depends(get_current_user), limit: int = 20, offset: int = 0):
    """Get paginated history for authenticated user from MongoDB."""
    global db
    cursor = db.history.find({"user_id": current_user["id"]}).sort("timestamp", -1).skip(offset).limit(limit)
    items = []
    async for doc in cursor:
        doc.pop("_id", None)
        items.append(doc)
    total = await db.history.count_documents({"user_id": current_user["id"]})

    return {
        "success": True,
        "history": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }


# ═══════════════════════════════════════════════════════════════════════
#  GEMINI AI ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/ai/config")
async def get_ai_config():
    """Returns AI Server status and configuration."""
    return {
        "success": True,
        "has_gemini": HAS_GEMINI,
        "model": GEMINI_MODEL,
        "status": "active" if HAS_GEMINI else "offline_fallback"
    }

@app.post("/api/ai/voice-plan")
async def generate_voice_plan(req: VoicePlanRequest):
    """
    Uses Google Gemini LLM to convert user natural language voice instructions
    into a structured multi-step UI action execution plan.
    """
    instruction = req.instruction.strip()
    if not instruction:
        return {"success": False, "error": "Empty instruction"}

    if not HAS_GEMINI:
        return {
            "success": False,
            "fallback": True,
            "message": "Gemini API key not configured on server. Using client neural planner."
        }

    try:
        import google.generativeai as genai

        actions_guide = """
STANDARD UI ACTIONS & PARAMETERS:
1. NAVIGATE_TAB: { "tab": "home" | "vault" | "pdf" | "extension" | "voice" }
   - Example (EN): "Go to Profile Vault", "Open my credentials", "Go to PDF Assistant", "Open Form Assistant", "Go to Home dashboard", "Open Voice and Accessibility"
   - Example (HI/Hinglish): "प्रोफ़ाइल वॉल्ट पर जाओ", "वॉल्ट खोलो", "मेरे दस्तावेज़ दिखाओ", "पीडीएफ असिस्टेंट खोलो", "फॉर्म खोलो", "पोर्टल दिखाओ", "होम पेज पर चलो", "वॉइस सेटिंग्स खोलो", "vault par jao", "form kholo", "home par chalo", "pdf dikhao"
   - Example (Regional): "প্রোফাইল ভল্টে যান" (BN), "प्रोफाइल व्हॉल्ट उघडा" (MR), "சுயவிவர பெட்டகத்திற்கு செல்" (TA), "ప్రొఫైల్ వాల్ట్‌కి వెళ్లండి" (TE), "પ્રોફાઇલ વૉલ્ટ પર જાઓ" (GU), "ಪ್ರೊಫೈಲ್ ವಾಲ್ಟ್‌ಗೆ ಹೋಗಿ" (KN), "پروفائل والٹ پر جائیں" (UR)

2. NAVIGATE_FORM_PAGE: { "page": 1 | 2 | 3 | 4 | 5 | "next" | "prev" }
   - Example (EN): "Go to page 2", "Travel to next page", "Show page 3", "Go to previous step"
   - Example (HI/Hinglish): "पेज 2 पर जाओ", "अगला पेज दिखाओ", "पिछला पेज खोलो", "अगले कदम पर चलो", "dusra page", "agla page", "pichhla page"
   - Example (Regional): "পরের পৃষ্ঠায় যান" (BN), "पुढील पानावर जा" (MR), "அடுத்த பக்கத்திற்கு செல்" (TA)

3. FILL_FORM_FIELD: { "fieldName": "string", "value": "string" }
   - Example (EN): "Fill mobile number with 9876543210" -> fieldName: "mobile", value: "9876543210"
   - Example (HI/Hinglish): "मोबाइल नंबर 9876543210 भरो", "पूरा नाम सीता राम वर्मा डालो", "name me Ramesh likho"

4. TRANSLATE_DOCUMENT_FORM: { "lang": "hi|bn|mr|ta|te|gu|kn|pa|ur|or|as|ml|mai|sat|ks|ne|sd|kok|doi|mni|brx|sa|en", "langName": "Language Name" }
   - Example: "Translate form to Hindi", "हिंदी में अनुवाद करो", "বাংলায় অনুবাদ করুন", "मराठीत भाषांतर करा"

5. UPDATE_VAULT_DETAIL: { "field": "name|dob|phone|email|address|pincode|aadhaar|pan|voterId|bankAccount|ifsc|category|gender|income|pensionPpo", "value": "string" }
   - Example (EN): "Update my phone number to 9876543210 in vault", "Change my date of birth to 15/08/1960"
   - Example (HI/Hinglish): "मेरा नाम बदलकर रमेश कुमार करो", "फोन नंबर 9876543210 कर दो", "mera pata Delhi kar do"

6. UPDATE_MULTIPLE_DETAILS: { "updates": { "name": "...", "phone": "...", ... } }
   - Example: "Update my name to Ramesh and phone to 9123456780", "नाम रमेश और फोन 9876543210 करो"

7. AUTOFILL_FORM: {}
   - Example (EN): "Auto fill the form", "Populate all details from my vault"
   - Example (HI/Hinglish): "फॉर्म भर दो", "वॉल्ट से पूरी जानकारी भरो", "ऑटो फिल करो", "form bhar do"

8. SUBMIT_FORM: {}
   - Example (EN): "Submit form", "Submit application"
   - Example (HI/Hinglish): "फॉर्म सबमिट करो", "आवेदन जमा करो", "form submit kar do"

9. CLEAR_FORM: {}
   - Example: "Clear all inputs", "Reset form", "फॉर्म साफ करो", "खाली करो"

10. READ_DOCUMENT_ALOUD: {}
    - Example: "Read document summary aloud", "डॉक्यूमेंट पढ़कर सुनाओ", "समरी बताओ", "takeaways padho"

11. SEARCH_PAGE: { "query": "string" }
    - Example: "Search for pension schemes", "पेंशन योजना खोजो"

12. SCROLL_PAGE: { "top": 500 | -500 }
    - Example: "Scroll down", "Scroll up", "नीचे स्क्रॉल करो", "ऊपर करो"

13. TOGGLE_AADHAAR_MASK: {}
    - Example: "Show Aadhaar number", "आधार नंबर दिखाओ", "आधार छिपाओ"

14. COPY_FIELD: { "field": "aadhaar|pan|phone|email|address" }
    - Example: "Copy my Aadhaar number", "आधार कॉपी करो"

15. SET_THEME: { "highContrast": true | false }
    - Example: "Enable high contrast mode", "हाई कंट्रास्ट चालू करो"

16. SET_FONT_SIZE: { "size": "large" | "normal" }
    - Example: "Increase font size", "अक्षर बड़े करो", "फॉन्ट बड़ा करो"

17. TOGGLE_DYSLEXIA_FONT: {}
    - Example: "Toggle dyslexia friendly font"

18. OPEN_MODAL: { "modalId": "humanHelpModal" | "editVaultModal" | "addDocumentModal" }
    - Example: "Request human help", "मदद चाहिए", "सहायक से बात कराओ"

19. CLOSE_MODAL: {}
    - Example: "Close modal", "बंद करो", "हटाओ"

20. CLICK_ELEMENT: { "text": "string", "selector": "string" }
    - Example: "Click download summary", "डाउनलोड पर क्लिक करो"

21. ASK_DOCUMENT_QA: { "question": "string" }
    - Example: "What is the eligibility for this scheme?", "अंतिम तारीख क्या है?", "पात्रता क्या है?"
"""

        system_instruction = f"""You are the multilingual AI Voice Copilot for 'Saral Setu' (an institutional Indian government form & document assistant).
The user is speaking to you in ANY language (English, Hindi, Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu, Assamese, Hinglish, etc.).
You must understand the user's natural language intent in their language and output a structured JSON action plan to operate the UI on their behalf.

{actions_guide}

ACTIVE DOM & PAGE CONTEXT:
{json.dumps(req.domContext or {}, indent=2)}

IMPORTANT MULTILINGUAL INSTRUCTIONS:
- The user instruction can be in ANY Indian language or mixed Hinglish. Always map it to the correct action.
- "verbalIntro" and "verbalOutro" should be spoken in the SAME language or conversational style the user used (or simple friendly English/Hindi).
- For tab travel ("home", "vault", "pdf", "extension", "voice"), always use NAVIGATE_TAB.

OUTPUT FORMAT (RAW JSON ONLY, NO MARKDOWN, NO CODE FENCES):
{{
  "verbalIntro": "Short friendly 1-sentence confirmation of what you're doing in the user's language (or null)",
  "actions": [
    {{
      "action": "ACTION_NAME",
      "params": {{ "paramKey": "paramValue" }}
    }}
  ],
  "verbalOutro": "Short 1-sentence completion confirmation in the user's language (or null)",
  "answer": "If user is asking a question or greeting, provide a clear answer here"
}}"""

        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config={"response_mime_type": "application/json", "temperature": 0.1}
        )

        prompt = f"{system_instruction}\n\nUSER VOICE INSTRUCTION: \"{instruction}\""
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        plan_data = json.loads(raw_text)

        return {
            "success": True,
            "plan": plan_data,
            "source": "gemini"
        }

    except Exception as e:
        print(f"[Gemini Voice Plan Error]: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback": True
        }

# ═══════════════════════════════════════════════════════════════════════
#  HUGGING FACE OCR, PDF EXTRACTION & REAL-TIME DOCUMENT ANALYSIS
# ═══════════════════════════════════════════════════════════════════════

def query_huggingface_ocr(image_bytes: bytes) -> str:
    """
    Calls Hugging Face Inference API for Image-to-Text OCR.
    Uses HF_IMAGE_TO_TEXT_MODEL with HUGGINGFACE_API_KEY with fast timeout & fallbacks.
    """
    if not HUGGINGFACE_API_KEY:
        print("[Warning] HUGGINGFACE_API_KEY not set.")
        return ""

    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/octet-stream"
    }
    
    endpoints = [
        f"https://api-inference.huggingface.co/models/{HF_IMAGE_TO_TEXT_MODEL}",
        f"https://router.huggingface.co/hf-inference/models/{HF_IMAGE_TO_TEXT_MODEL}"
    ]

    for api_url in endpoints:
        try:
            response = requests.post(api_url, headers=headers, data=image_bytes, timeout=8)
            if response.status_code == 200:
                res_json = response.json()
                if isinstance(res_json, list) and len(res_json) > 0 and "generated_text" in res_json[0]:
                    return res_json[0]["generated_text"].strip()
                elif isinstance(res_json, dict) and "generated_text" in res_json:
                    return res_json["generated_text"].strip()
            elif response.status_code == 503:
                print(f"[HF Info]: Model {HF_IMAGE_TO_TEXT_MODEL} is cold-starting on Hugging Face.")
            else:
                print(f"[HF API HTTP {response.status_code}]: {response.text[:120]}")
        except Exception as e:
            print(f"[HF Inference Exception on {api_url}]: {e}")
            
    return ""

def extract_text_from_image_gemini_fallback(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Fallback to Google Gemini Vision for complete OCR when Hugging Face is loading or for dense forms."""
    if not HAS_GEMINI:
        return ""
    try:
        import google.generativeai as genai
        model = genai.GenerativeModel(model_name=GEMINI_MODEL)
        image_part = {
            "mime_type": mime_type,
            "data": image_bytes
        }
        prompt = "Extract all text, clauses, headings, table rows, deadlines, and form fields from this document image accurately."
        response = model.generate_content([image_part, prompt])
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini Vision OCR Error]: {e}")
        return ""

def extract_text_from_pdf(pdf_bytes: bytes) -> tuple:
    """Extracts text from all pages in a PDF and returns (combined_text, per_page_texts)."""
    if not HAS_PYPDF:
        print("[Warning] pypdf not available.")
        return "", []
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages_text = []
        per_page_texts = []
        for i, page in enumerate(reader.pages):
            txt = page.extract_text() or ""
            per_page_texts.append(txt.strip())
            if txt.strip():
                pages_text.append(f"--- Page {i+1} ---\n{txt.strip()}")
        return "\n\n".join(pages_text), per_page_texts
    except Exception as e:
        print(f"[PDF Extraction Error]: {e}")
        return "", []

def generate_document_summary_and_speech(extracted_text: str, filename: str) -> dict:
    """
    Generates structured plain-language takeaways, deadlines, and a friendly spoken narration script.
    """
    clean_title = re.sub(r'[\-_]', ' ', filename).rsplit('.', 1)[0].title()

    if HAS_GEMINI and extracted_text and len(extracted_text.strip()) > 10:
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(
                model_name=GEMINI_MODEL,
                generation_config={"response_mime_type": "application/json", "temperature": 0.2}
            )

            prompt = f"""You are 'Saral Setu AI', an institutional government form and document assistant for senior citizens and everyday citizens.
Analyze the following extracted document/form text and generate an institutional, simplified structured summary in plain language, AND extract all form fields (with any pre-filled values found in the document).

DOCUMENT FILENAME: {filename}
EXTRACTED DOCUMENT CONTENT:
{extracted_text[:6000]}

OUTPUT JSON FORMAT (ONLY RAW JSON, NO MARKDOWN):
{{
  "title": "Clear Document or Scheme Title",
  "dept": "Issuing Ministry, Department, or Organization",
  "step_title": "1. Extracted Application & Identity Form",
  "deadline": "Key deadline date (e.g., 'October 31st, 2024') or 'No specific deadline specified'",
  "takeaways": [
    {{
      "num": 1,
      "title": "Action Required",
      "text": "Specific plain-language action the citizen must take (e.g. sign section 3, submit online, visit local CSC)."
    }},
    {{
      "num": 2,
      "title": "Critical Deadline",
      "text": "Exact submission timeline or validity period."
    }},
    {{
      "num": 3,
      "title": "Mandatory Documents Required",
      "text": "List of required proofs (e.g. Aadhaar, PAN, Bank Passbook, Residence Proof)."
    }},
    {{
      "num": 4,
      "title": "Eligibility & Income Criteria",
      "text": "Age limits, income ceilings, or targeted citizen category."
    }}
  ],
  "summary_speech": "A reassuring 2-3 sentence spoken narrative in conversational English (or simple plain terms) explaining what this document is and what the user needs to do.",
  "form_fields": [
    {{
      "id": "portalFullName",
      "label": "Full Legal Name (as in Aadhaar)",
      "value": "Extracted pre-filled value if present in document, else empty string",
      "vault_key": "name",
      "placeholder": "Enter full name",
      "required": true,
      "hint": "Full Legal Name: Matches official identity records."
    }},
    {{
      "id": "portalDob",
      "label": "Date of Birth (DD/MM/YYYY)",
      "value": "Extracted DOB if present in document, else empty string",
      "vault_key": "dob",
      "placeholder": "DD / MM / YYYY",
      "required": true,
      "hint": "Date of Birth: Minimum age required for scheme."
    }},
    {{
      "id": "portalAadhaar",
      "label": "Aadhaar Number (12 digits)",
      "value": "Extracted Aadhaar if present, else empty string",
      "vault_key": "aadhaar",
      "placeholder": "12 digit Aadhaar number",
      "required": true,
      "hint": "Aadhaar Number: 12-digit unique ID verified with UIDAI."
    }},
    {{
      "id": "portalPhone",
      "label": "Mobile Number for OTP",
      "value": "Extracted Mobile if present, else empty string",
      "vault_key": "phone",
      "placeholder": "10 digit mobile number",
      "required": true,
      "hint": "Mobile Number: Linked with Aadhaar for OTP authentication."
    }},
    {{
      "id": "portalAddress",
      "label": "Residential Address",
      "value": "Extracted Address if present, else empty string",
      "vault_key": "address",
      "placeholder": "House, Street, Sector, City",
      "required": true,
      "hint": "Address: Permanent residential address."
    }},
    {{
      "id": "portalPincode",
      "label": "PIN Code",
      "value": "Extracted PIN if present, else empty string",
      "vault_key": "pincode",
      "placeholder": "6 digit PIN code",
      "required": true,
      "hint": "PIN Code: 6-digit postal code."
    }},
    {{
      "id": "portalBankAccount",
      "label": "DBT Bank Account Number",
      "value": "Extracted Account No if present, else empty string",
      "vault_key": "bankAccount",
      "placeholder": "Bank account number",
      "required": true,
      "hint": "Bank Account: Direct Benefit Transfer (DBT) credit account."
    }},
    {{
      "id": "portalIfsc",
      "label": "Bank IFSC Code",
      "value": "Extracted IFSC if present, else empty string",
      "vault_key": "ifsc",
      "placeholder": "e.g. SBIN0001234",
      "required": true,
      "hint": "IFSC Code: 11-character bank branch code."
    }}
  ]
}}"""

            response = model.generate_content(prompt)
            data = json.loads(response.text.strip())
            return data
        except Exception as e:
            print(f"[Gemini Document Summary Error]: {e}")

    # Fallback heuristic summary & field extraction
    fallback_fields = [
        {"id": "portalFullName", "label": "Full Legal Name", "value": "", "vault_key": "name", "placeholder": "Enter full name", "required": True, "hint": "Full Legal Name: Matches Aadhaar card."},
        {"id": "portalDob", "label": "Date of Birth", "value": "", "vault_key": "dob", "placeholder": "DD / MM / YYYY", "required": True, "hint": "Date of Birth: DD/MM/YYYY."},
        {"id": "portalAadhaar", "label": "Aadhaar Number", "value": "", "vault_key": "aadhaar", "placeholder": "12 digit Aadhaar", "required": True, "hint": "Aadhaar Number: 12-digit unique ID."},
        {"id": "portalPhone", "label": "Mobile Number", "value": "", "vault_key": "phone", "placeholder": "10 digit mobile", "required": True, "hint": "Mobile Number for OTP."},
        {"id": "portalAddress", "label": "Residential Address", "value": "", "vault_key": "address", "placeholder": "House, Street, City", "required": True, "hint": "Residential Address."},
        {"id": "portalPincode", "label": "PIN Code", "value": "", "vault_key": "pincode", "placeholder": "6 digit PIN", "required": True, "hint": "6 digit PIN code."},
        {"id": "portalBankAccount", "label": "DBT Bank Account", "value": "", "vault_key": "bankAccount", "placeholder": "Account number", "required": True, "hint": "Bank Account Number for DBT."},
        {"id": "portalIfsc", "label": "Bank IFSC Code", "value": "", "vault_key": "ifsc", "placeholder": "SBIN0001234", "required": True, "hint": "Bank IFSC Code."}
    ]

    # Heuristically extract values from extracted_text if available
    lines = extracted_text.split('\n')
    for line in lines:
        l = line.strip().lower()
        if 'name' in l and ':' in line:
            val = line.split(':', 1)[1].strip()
            if val and len(val) > 2: fallback_fields[0]['value'] = val
        elif ('dob' in l or 'birth' in l) and ':' in line:
            val = line.split(':', 1)[1].strip()
            if val: fallback_fields[1]['value'] = val
        elif 'aadhaar' in l and ':' in line:
            val = line.split(':', 1)[1].strip()
            if val: fallback_fields[2]['value'] = val
        elif ('phone' in l or 'mobile' in l) and ':' in line:
            val = line.split(':', 1)[1].strip()
            if val: fallback_fields[3]['value'] = val
        elif 'address' in l and ':' in line:
            val = line.split(':', 1)[1].strip()
            if val: fallback_fields[4]['value'] = val
        elif 'pin' in l and ':' in line:
            val = line.split(':', 1)[1].strip()
            if val: fallback_fields[5]['value'] = val
        elif ('bank' in l or 'account' in l) and ':' in line:
            val = line.split(':', 1)[1].strip()
            if val: fallback_fields[6]['value'] = val
        elif 'ifsc' in l and ':' in line:
            val = line.split(':', 1)[1].strip()
            if val: fallback_fields[7]['value'] = val

    return {
        "title": clean_title,
        "dept": "Government Welfare Department",
        "step_title": f"1. Extracted Form Fields for {clean_title}",
        "deadline": "October 31st (Standard Filing Cycle)",
        "takeaways": [
            {
                "num": 1,
                "title": "Action Required",
                "text": "Verify your identity credentials and submit the verified application form."
            },
            {
                "num": 2,
                "title": "Critical Deadline",
                "text": "Submit application before the designated quarterly closing date."
            },
            {
                "num": 3,
                "title": "Mandatory Documents Required",
                "text": "Valid Aadhaar Card, PAN card, Proof of Residence, and active DBT bank account."
            },
            {
                "num": 4,
                "title": "Eligibility Criteria",
                "text": "Eligible for registered senior citizens and citizens meeting annual income thresholds."
            }
        ],
        "summary_speech": f"I have processed {clean_title}. The form fields extracted from your uploaded document have been loaded directly into the Form Assistant.",
        "form_fields": fallback_fields,
        "extracted_fields": {}
    }

@app.post("/api/ai/image-to-text")
async def image_to_text(file: UploadFile = File(...)):
    """
    Direct endpoint for Hugging Face Image-to-Text (OCR).
    Accepts image file, runs HF model (with Gemini Vision fallback), returns extracted text.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image file provided")

    text = ""
    source = "huggingface"

    if HAS_HUGGINGFACE:
        text = query_huggingface_ocr(contents)

    if not text and HAS_GEMINI:
        mime = file.content_type or "image/jpeg"
        text = extract_text_from_image_gemini_fallback(contents, mime)
        source = "gemini_vision"

    if not text:
        text = f"Document scan recognized from {file.filename}."
        source = "heuristic_fallback"

    return {
        "success": True,
        "filename": file.filename,
        "model": HF_IMAGE_TO_TEXT_MODEL if source == "huggingface" else GEMINI_MODEL,
        "source": source,
        "text": text
    }

@app.post("/api/ai/analyze-doc")
async def analyze_document(file: UploadFile = File(...)):
    """
    Unified Real-Time Document Analyzer:
    - Parses PDF (via pypdf) or Images (via Hugging Face OCR / Gemini Vision).
    - Generates plain-language takeaways, deadlines, and natural spoken summary.
    """
    filename = file.filename or "Uploaded_Document.pdf"
    ext = filename.lower().split('.')[-1] if '.' in filename else ""
    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Empty document file provided")

    extracted_text = ""
    ocr_source = "pypdf"

    # 1. PDF Document Handling
    if ext == "pdf":
        extracted_text, _ = extract_text_from_pdf(contents)
        ocr_source = "pypdf"
        # If PDF is scanned image with no text layer, try vision
        if len(extracted_text.strip()) < 40 and HAS_GEMINI:
            try:
                extracted_text = extract_text_from_image_gemini_fallback(contents, "application/pdf")
                ocr_source = "gemini_pdf_vision"
            except Exception:
                pass

    # 2. Image Document / Scanned Form Handling (PNG, JPG, JPEG, WEBP)
    elif ext in ["png", "jpg", "jpeg", "webp", "bmp", "tiff"]:
        if HAS_HUGGINGFACE:
            extracted_text = query_huggingface_ocr(contents)
            ocr_source = f"huggingface ({HF_IMAGE_TO_TEXT_MODEL})"

        if not extracted_text and HAS_GEMINI:
            mime = file.content_type or f"image/{ext if ext != 'jpg' else 'jpeg'}"
            extracted_text = extract_text_from_image_gemini_fallback(contents, mime)
            ocr_source = "gemini_vision"

    # 3. Plain text / docx files
    elif ext in ["txt", "md", "csv", "json"]:
        try:
            extracted_text = contents.decode("utf-8", errors="ignore")
            ocr_source = "text_parser"
        except Exception:
            extracted_text = ""

    # Fallback if text is still minimal
    if not extracted_text.strip():
        clean_name = re.sub(r'[\-_]', ' ', filename).rsplit('.', 1)[0]
        extracted_text = f"OFFICIAL SCHEME GUIDELINES: {clean_name.upper()}\n\n1. SCOPE & OBJECTIVE\nThis document outlines the welfare assistance and eligibility criteria for senior citizens and beneficiaries.\n\n2. MANDATORY REQUIREMENTS\n- Valid Aadhaar Identity Proof\n- PAN Card\n- Active Bank Account for DBT credit"

    # 4. Generate AI Takeaways, Summary & Spoken Script
    analysis = generate_document_summary_and_speech(extracted_text, filename)

    doc_obj = {
        "id": f"doc_{int(time.time()*1000)}",
        "title": analysis.get("title") or re.sub(r'[\-_]', ' ', filename.rsplit('.', 1)[0]).title(),
        "filename": filename,
        "dept": analysis.get("dept") or "Ministry of Social Justice & Empowerment",
        "updated": "Analyzed Just now",
        "deadline": analysis.get("deadline") or "October 31st, 2024",
        "takeaways": analysis.get("takeaways") or [],
        "summary_speech": analysis.get("summary_speech") or f"I have analyzed {filename}. It requires your Aadhaar and bank details to complete the application.",
        "extracted_fields": analysis.get("extracted_fields") or {},
        "fullText": extracted_text,
        "ocr_source": ocr_source
    }

    return {
        "success": True,
        "doc": doc_obj
    }

def partition_into_pages(fields: list, clean_title: str, target_pages: Optional[int] = None) -> list:
    """Partitions form fields into structured pages matching target_pages or preserving full 1-page form."""
    if not fields:
        return []
    
    # If 1-page document or target_pages is 1, keep the ENTIRE form page intact on Page 1
    if target_pages == 1 or (target_pages is None and len(fields) <= 18):
        return [{
            "page_number": 1,
            "step_title": f"1. Application Form — {clean_title}",
            "description": "Complete application particulars extracted from document",
            "fields": fields
        }]

    if target_pages and target_pages > 1:
        pages = []
        total_f = len(fields)
        chunk_size = max(1, (total_f + target_pages - 1) // target_pages)
        for i in range(target_pages):
            chunk = fields[i * chunk_size : (i + 1) * chunk_size]
            if not chunk and i > 0:
                continue
            pages.append({
                "page_number": i + 1,
                "step_title": f"{i+1}. Document Page {i+1} Details",
                "description": f"All fields extracted from Document Page {i+1}",
                "fields": chunk if chunk else [fields[0]]
            })
        return pages

    # Default multi-step partitioning if no target page specified and large field list
    p1_keys = {"name", "dob", "gender", "guardian_name", "aadhaar", "pan", "voterId"}
    p2_keys = {"phone", "email", "address", "pincode"}
    p3_keys = {"category", "bankAccount", "ifsc", "pensionPpo", "income", "institution", "roll_number"}

    p1, p2, p3 = [], [], []
    for f in fields:
        vk = f.get("vaultKey", "")
        if vk in p1_keys:
            p1.append(f)
        elif vk in p2_keys:
            p2.append(f)
        elif vk in p3_keys:
            p3.append(f)
        else:
            if len(p1) < 6:
                p1.append(f)
            elif len(p2) < 6:
                p2.append(f)
            else:
                p3.append(f)

    pages = []
    if p1:
        pages.append({
            "page_number": 1,
            "step_title": "1. Personal & Identity Verification",
            "description": "Applicant legal name, date of birth, and identity credentials",
            "fields": p1
        })
    if p2:
        pages.append({
            "page_number": 2,
            "step_title": "2. Contact & Residential Particulars",
            "description": "Verified residential address, phone, email, and area pin code",
            "fields": p2
        })
    if p3:
        pages.append({
            "page_number": 3,
            "step_title": "3. Bank DBT & Scheme Particulars",
            "description": "Direct Benefit Transfer bank account, IFSC, and declarations",
            "fields": p3
        })
    
    if not pages:
        pages.append({
            "page_number": 1,
            "step_title": f"1. Application Form for {clean_title}",
            "description": "Application particulars extracted from document",
            "fields": fields
        })
    return pages

def extract_form_schema_gemini(extracted_text: str, filename: str, per_page_texts: Optional[List[str]] = None) -> dict:
    """
    Extracts complete, structured form fields, labels, organization, and portal title
    from a form PDF or form image using Gemini AI with rich contextual guidance.
    Returns all form fields in full for display on the interactive form page.
    """
    clean_title = re.sub(r'[\-_]', ' ', filename).rsplit('.', 1)[0].title()
    num_doc_pages = len(per_page_texts) if per_page_texts and len(per_page_texts) > 0 else 1

    if HAS_GEMINI and extracted_text and len(extracted_text.strip()) > 10:
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(
                model_name=GEMINI_MODEL,
                generation_config={"response_mime_type": "application/json", "temperature": 0.1}
            )

            # Build per-page content for the prompt
            page_content_str = ""
            if per_page_texts and len(per_page_texts) > 1:
                for i, pt in enumerate(per_page_texts):
                    page_content_str += f"\n=== PAGE {i+1} ===\n{pt[:3000]}\n"
            else:
                page_content_str = extracted_text[:9000]

            prompt = f"""You are 'Saral Setu Form Engine', an AI that transforms uploaded government form PDFs and scanned documents into full interactive multi-page digital forms.

Analyze the extracted document content. The document has {num_doc_pages} page(s). 
CRITICAL: Create one form page per document page. Every blank/question the user must fill must be an individual field.

DOCUMENT FILENAME: {filename}
EXTRACTED CONTENT (organized by page):
{page_content_str}

FIELD MAPPING RULES:
- Full Name / Applicant Name -> 'name'
- Date of Birth / Age -> 'dob'
- Gender / Sex -> 'gender'
- Guardian / Father / Husband Name -> 'guardian_name'
- Aadhaar Number / UID -> 'aadhaar'
- PAN Number -> 'pan'
- Voter ID / EPIC -> 'voterId'
- Mobile / Phone -> 'phone'
- Email -> 'email'
- Address / Residence -> 'address' (set fullWidth: true)
- PIN Code / Postal Code -> 'pincode'
- Citizen Category / Caste -> 'category'
- Bank Account Number -> 'bankAccount'
- IFSC Code -> 'ifsc'
- Pension PPO Number -> 'pensionPpo'
- Annual/Monthly Income -> 'income'
- Institution / College / School -> 'institution'
- Roll Number / Registration No -> 'roll_number'

OUTPUT JSON (ONLY RAW JSON, NO MARKDOWN):
{{
  "portal_title": "Official Portal / Form Name from document",
  "organization": "Official Issuing Department or Ministry",
  "total_pages": {num_doc_pages},
  "current_page": 1,
  "pages": [
    {{
      "page_number": 1,
      "step_title": "1. Page 1 Section Title",
      "description": "What this page covers",
      "fields": [
        {{
          "id": "uniqueFieldId1",
          "label": "Full Field Label",
          "type": "text",
          "value": "Extracted value if pre-filled in doc, else empty string",
          "vaultKey": "name",
          "required": true,
          "placeholder": "Placeholder text",
          "hint": "Helpful context for this field",
          "fullWidth": false
        }}
      ]
    }}
  ],
  "summary_speech": "I have converted your uploaded document into a full interactive digital form with {num_doc_pages} pages ready for auto-fill and voice navigation."
}}"""

            response = model.generate_content(prompt)
            data = json.loads(response.text.strip())

            # Ensure pages exist and are properly structured
            pages = data.get("pages", [])
            if pages:
                all_fields = []
                for p_idx, p in enumerate(pages):
                    fields = p.get("fields", [])
                    formatted = []
                    for f_idx, f in enumerate(fields):
                        if not f.get("id"):
                            f["id"] = f"portalField_p{p_idx+1}_{f_idx+1}"
                        if not f.get("hint"):
                            f["hint"] = f"{f.get('label', 'Field')}: Provide accurate details matching official records."
                        formatted.append(f)
                    p["fields"] = formatted
                    p["page_number"] = p_idx + 1
                    all_fields.extend(formatted)

                data["pages"] = pages
                data["total_pages"] = len(pages)
                data["current_page"] = 1
                data["fields"] = all_fields  # flat list for backward compat
                return data

            # If AI returned flat fields list, fall through to partition below
            raw_fields = data.get("fields", [])
            if raw_fields:
                formatted_fields = []
                for f_idx, f in enumerate(raw_fields):
                    if not f.get("id"):
                        f["id"] = f"portalField_{f_idx+1}"
                    if not f.get("hint"):
                        f["hint"] = f"{f.get('label', 'Field')}: Provide accurate details matching official records."
                    formatted_fields.append(f)
                data["fields"] = formatted_fields
                # Partition into pages based on num_doc_pages
                if num_doc_pages > 1:
                    page_size = max(1, len(formatted_fields) // num_doc_pages)
                    step_labels = [
                        "1. Personal Details & Identity Verification",
                        "2. Residential Address & Contact Particulars",
                        "3. Bank Account & Scheme Benefit Declarations",
                        "4. Institutional Particulars & Supporting Records",
                        "5. Final Review & Application Authorization"
                    ]
                    built_pages = []
                    for pIdx in range(num_doc_pages):
                        start = pIdx * page_size
                        end = start + page_size if pIdx < num_doc_pages - 1 else len(formatted_fields)
                        built_pages.append({
                            "page_number": pIdx + 1,
                            "step_title": step_labels[pIdx] if pIdx < len(step_labels) else f"Page {pIdx+1} Particulars",
                            "description": f"Fields extracted from document page {pIdx+1}",
                            "fields": formatted_fields[start:end]
                        })
                    data["pages"] = built_pages
                    data["total_pages"] = num_doc_pages
                else:
                    data["total_pages"] = 1
                    data["pages"] = [{
                        "page_number": 1,
                        "step_title": data.get("step_title", f"Complete Application Form — {clean_title}"),
                        "description": "All fields extracted from document",
                        "fields": formatted_fields
                    }]
                data["current_page"] = 1
                return data
        except Exception as e:
            print(f"[Gemini Form Structure Extraction Error]: {e}")

    # Complete fallback list of standard government application fields
    field_candidates = [
        ("Full Legal Name (as in Aadhaar)", "name", "portalFullName", "text", True, "Full Legal Name: Matches your official identity records.", "Enter full name", False),
        ("Date of Birth (DD/MM/YYYY)", "dob", "portalDob", "text", True, "Date of Birth: Enter date in DD/MM/YYYY format.", "DD / MM / YYYY", False),
        ("Gender", "gender", "portalGender", "text", False, "Gender: Select or specify your gender.", "Male / Female / Other", False),
        ("Guardian / Father's Full Name", "guardian_name", "portalGuardian", "text", False, "Father / Husband / Guardian's full legal name.", "Enter guardian name", False),
        ("Aadhaar Number (12 digits)", "aadhaar", "portalAadhaar", "text", True, "Aadhaar Number: 12-digit UID verified with UIDAI.", "12 digit Aadhaar number", False),
        ("PAN Card Number", "pan", "portalPan", "text", False, "PAN: 10-digit Permanent Account Number.", "ABCDE1234F", False),
        ("Voter ID / EPIC Number", "voterId", "portalVoterId", "text", False, "Voter ID: ECI verified voter identity card number.", "DL/04/029/981245", False),
        ("Mobile Number for OTP", "phone", "portalPhone", "tel", True, "Mobile Number: Linked with Aadhaar for OTP verification.", "10 digit mobile number", False),
        ("Email Address", "email", "portalEmail", "email", False, "Email Address: For digital acknowledgment and alerts.", "name@example.com", False),
        ("Residential Address", "address", "portalAddress", "text", True, "Residential Address: Complete permanent address.", "House, Street, Sector, City", True),
        ("PIN Code", "pincode", "portalPincode", "text", True, "PIN Code: 6-digit postal code for area mapping.", "6 digit PIN code", False),
        ("Citizen Category", "category", "portalCategory", "text", False, "Citizen Category: General / SC / ST / OBC / Senior Citizen.", "General / Senior Citizen / SC / ST", False),
        ("DBT Bank Account Number", "bankAccount", "portalBankAccount", "text", True, "DBT Bank Account: Direct Benefit Transfer active account.", "Bank account number", False),
        ("Bank IFSC Code", "ifsc", "portalIfsc", "text", True, "IFSC Code: 11-character bank branch identifier.", "e.g. SBIN0001234", False),
        ("Pension PPO Number (Optional)", "pensionPpo", "portalPpo", "text", False, "Pension Payment Order (PPO) number if applicable.", "PPO number", False),
        ("Annual Household Income", "income", "portalIncome", "text", False, "Declared annual income from all legitimate sources.", "e.g. 2,40,000 INR / Year", False)
    ]

    fields = []
    for label, vkey, fid, ftype, req, hint, placeholder, fullw in field_candidates:
        fields.append({
            "id": fid,
            "label": label,
            "type": ftype,
            "vaultKey": vkey,
            "required": req,
            "placeholder": placeholder,
            "hint": hint,
            "fullWidth": fullw,
            "value": ""
        })

    # Heuristic dynamic value extraction from extracted text
    if extracted_text:
        lines = extracted_text.split('\n')
        for line in lines:
            l = line.strip().lower()
            if 'name' in l and ':' in line:
                val = line.split(':', 1)[1].strip()
                if val and len(val) > 2: fields[0]['value'] = val
            elif ('dob' in l or 'birth' in l) and ':' in line:
                val = line.split(':', 1)[1].strip()
                if val: fields[1]['value'] = val
            elif 'aadhaar' in l and ':' in line:
                val = line.split(':', 1)[1].strip()
                if val: fields[4]['value'] = val
            elif ('phone' in l or 'mobile' in l) and ':' in line:
                val = line.split(':', 1)[1].strip()
                if val: fields[7]['value'] = val
            elif 'address' in l and ':' in line:
                val = line.split(':', 1)[1].strip()
                if val: fields[9]['value'] = val
            elif 'pin' in l and ':' in line:
                val = line.split(':', 1)[1].strip()
                if val: fields[10]['value'] = val
            elif ('bank' in l or 'account' in l) and ':' in line:
                val = line.split(':', 1)[1].strip()
                if val: fields[12]['value'] = val
            elif 'ifsc' in l and ':' in line:
                val = line.split(':', 1)[1].strip()
                if val: fields[13]['value'] = val

    return {
        "portal_title": clean_title if ("Form" in clean_title or "Portal" in clean_title or "Scheme" in clean_title) else f"{clean_title} Application Form",
        "organization": "Department of Social Welfare & Citizen Empowerment",
        "step_title": f"Complete Application Particulars for {clean_title}",
        "total_pages": 1,
        "current_page": 1,
        "fields": fields,
        "pages": [{
            "page_number": 1,
            "step_title": f"Complete Application Particulars for {clean_title}",
            "description": "All fields extracted from document",
            "fields": fields
        }],
        "summary_speech": f"I have transformed {clean_title} into an interactive digital form with all {len(fields)} fields ready for auto-fill and voice navigation."
    }

GOOGLE_LANG_MAP = {
    'en': 'en', 'hi': 'hi', 'bn': 'bn', 'mr': 'mr', 'ta': 'ta', 'te': 'te',
    'gu': 'gu', 'kn': 'kn', 'ml': 'ml', 'pa': 'pa', 'or': 'or', 'as': 'as',
    'ur': 'ur', 'sa': 'sa', 'ne': 'ne', 'sd': 'sd', 'kok': 'mr', 'doi': 'hi',
    'mni': 'bn', 'brx': 'as', 'mai': 'hi', 'sat': 'hi', 'ks': 'ur'
}

def batch_translate_texts(texts: List[str], target_lang: str) -> List[str]:
    """Translates a list of strings efficiently using batching and caching in ~1-2 seconds."""
    if not texts:
        return []
    
    results = [None] * len(texts)
    to_translate_indices = []
    to_translate_texts = []

    for i, t in enumerate(texts):
        if not t or not str(t).strip():
            results[i] = t
            continue
        cleaned = str(t).strip()
        cache_key = f"{cleaned}_{target_lang}"
        if cache_key in TRANSLATION_CACHE:
            results[i] = TRANSLATION_CACHE[cache_key]
        else:
            to_translate_indices.append(i)
            to_translate_texts.append(cleaned)

    if to_translate_texts and HAS_DEEP_TRANSLATOR:
        try:
            g_lang = GOOGLE_LANG_MAP.get(target_lang, target_lang)
            translator = GoogleTranslator(source='auto', target=g_lang)
            chunk_size = 25
            for chunk_start in range(0, len(to_translate_texts), chunk_size):
                chunk = to_translate_texts[chunk_start:chunk_start + chunk_size]
                combined = "\n ||| \n".join(chunk)
                trans_res = translator.translate(combined)
                parts = [p.strip() for p in trans_res.split("|||")]
                
                if len(parts) == len(chunk):
                    for idx_in_chunk, p in enumerate(parts):
                        global_idx = to_translate_indices[chunk_start + idx_in_chunk]
                        orig_text = chunk[idx_in_chunk]
                        results[global_idx] = p
                        TRANSLATION_CACHE[f"{orig_text}_{target_lang}"] = p
                else:
                    for idx_in_chunk, orig_text in enumerate(chunk):
                        global_idx = to_translate_indices[chunk_start + idx_in_chunk]
                        try:
                            p = translator.translate(orig_text)
                            results[global_idx] = p
                            TRANSLATION_CACHE[f"{orig_text}_{target_lang}"] = p
                        except Exception:
                            results[global_idx] = orig_text
        except Exception as e:
            print(f"[Batch Translation Error]: {e}")
            for idx in to_translate_indices:
                if results[idx] is None:
                    results[idx] = texts[idx]

    # Fill any remaining None values with original text
    for i in range(len(results)):
        if results[i] is None:
            results[i] = texts[i]

    return results

@app.post("/api/ai/translate-form-schema")
async def translate_form_schema_endpoint(req: FormTranslateRequest):
    """
    Translates every field label, placeholder, hint, section header, and portal title
    in the interactive document into ANY of the 22 Indian regional languages + English in real-time.
    """
    schema = req.form_schema
    target_lang = req.target_lang.lower().strip()

    if not schema:
        return {"success": False, "error": "No schema provided"}

    lang_name_map = {l["code"]: l["name"] for l in SUPPORTED_LANGUAGES}
    target_name = lang_name_map.get(target_lang, "English" if target_lang == "en" else target_lang.upper())

    # Fast, high-accuracy batch translation
    try:
        trans_schema = json.loads(json.dumps(schema))
        strings_to_translate = []
        string_setters = []

        # 1. Top-level portal title & organization
        if "portal_title" in trans_schema and trans_schema["portal_title"]:
            strings_to_translate.append(trans_schema["portal_title"])
            def set_title(v): trans_schema["portal_title"] = v
            string_setters.append(set_title)

        if "organization" in trans_schema and trans_schema["organization"]:
            strings_to_translate.append(trans_schema["organization"])
            def set_org(v): trans_schema["organization"] = v
            string_setters.append(set_org)

        if "step_title" in trans_schema and trans_schema["step_title"]:
            strings_to_translate.append(trans_schema["step_title"])
            def set_step(v): trans_schema["step_title"] = v
            string_setters.append(set_step)

        # 2. Pages & page fields
        if "pages" in trans_schema and isinstance(trans_schema["pages"], list):
            for p in trans_schema["pages"]:
                if "step_title" in p and p["step_title"]:
                    strings_to_translate.append(p["step_title"])
                    def set_page_title(v, page=p): page["step_title"] = v
                    string_setters.append(set_page_title)

                if "description" in p and p["description"]:
                    strings_to_translate.append(p["description"])
                    def set_page_desc(v, page=p): page["description"] = v
                    string_setters.append(set_page_desc)

                for f in p.get("fields", []):
                    if "label" in f and f["label"]:
                        strings_to_translate.append(f["label"])
                        def set_f_label(v, field=f): field["label"] = v
                        string_setters.append(set_f_label)

                    if "placeholder" in f and f["placeholder"]:
                        strings_to_translate.append(f["placeholder"])
                        def set_f_ph(v, field=f): field["placeholder"] = v
                        string_setters.append(set_f_ph)

                    if "hint" in f and f["hint"]:
                        strings_to_translate.append(f["hint"])
                        def set_f_hint(v, field=f): field["hint"] = v
                        string_setters.append(set_f_hint)

        # 3. Root fields
        if "fields" in trans_schema and isinstance(trans_schema["fields"], list):
            for f in trans_schema["fields"]:
                if "label" in f and f["label"]:
                    strings_to_translate.append(f["label"])
                    def set_rf_label(v, field=f): field["label"] = v
                    string_setters.append(set_rf_label)

                if "placeholder" in f and f["placeholder"]:
                    strings_to_translate.append(f["placeholder"])
                    def set_rf_ph(v, field=f): field["placeholder"] = v
                    string_setters.append(set_rf_ph)

                if "hint" in f and f["hint"]:
                    strings_to_translate.append(f["hint"])
                    def set_rf_hint(v, field=f): field["hint"] = v
                    string_setters.append(set_rf_hint)

        translated_strings = batch_translate_texts(strings_to_translate, target_lang)

        for setter, trans_val in zip(string_setters, translated_strings):
            setter(trans_val)

        return {
            "success": True,
            "form": trans_schema,
            "target_lang": target_lang,
            "translated_count": len(translated_strings)
        }
    except Exception as e:
        print(f"[Form Translation Engine Error]: {e}")
        return {"success": True, "form": schema, "target_lang": target_lang}

@app.post("/api/ai/analyze-form")
async def analyze_form_upload(file: UploadFile = File(...)):
    """
    Analyzes an uploaded Form PDF or Scanned Form Image,
    extracts form fields, labels, portal metadata, and returns dynamic schema
    for the live website simulation.
    """
    filename = file.filename or "Uploaded_Form.pdf"
    ext = filename.lower().split('.')[-1] if '.' in filename else ""
    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Empty document file provided")

    extracted_text = ""
    per_page_texts = []
    ocr_source = "pypdf"

    if ext == "pdf":
        extracted_text, per_page_texts = extract_text_from_pdf(contents)
        ocr_source = "pypdf"
        if len(extracted_text.strip()) < 40 and HAS_GEMINI:
            try:
                extracted_text = extract_text_from_image_gemini_fallback(contents, "application/pdf")
                ocr_source = "gemini_pdf_vision"
            except Exception:
                pass
    elif ext in ["png", "jpg", "jpeg", "webp", "bmp", "tiff"]:
        if HAS_HUGGINGFACE:
            extracted_text = query_huggingface_ocr(contents)
            ocr_source = f"huggingface ({HF_IMAGE_TO_TEXT_MODEL})"
        if not extracted_text and HAS_GEMINI:
            mime = file.content_type or f"image/{ext if ext != 'jpg' else 'jpeg'}"
            extracted_text = extract_text_from_image_gemini_fallback(contents, mime)
            ocr_source = "gemini_vision"
    elif ext in ["txt", "md", "csv", "json"]:
        try:
            extracted_text = contents.decode("utf-8", errors="ignore")
            ocr_source = "text_parser"
        except Exception:
            extracted_text = ""

    form_schema = extract_form_schema_gemini(extracted_text, filename, per_page_texts=per_page_texts)
    form_schema["filename"] = filename
    form_schema["ocr_source"] = ocr_source
    form_schema["extracted_text_preview"] = extracted_text[:500]

    return {
        "success": True,
        "form": form_schema
    }

@app.post("/api/ai/chat")
async def document_chat(req: DocumentChatRequest):
    """Uses Gemini to answer user questions about documents with full extracted context."""
    if not HAS_GEMINI:
        return {
            "success": True,
            "answer": "According to the official guidelines, you must be 60+ years with annual income under Rs.3,00,000. Required documents: Aadhaar, PAN, and Bank Passbook.",
            "source": "static_fallback"
        }

    try:
        import google.generativeai as genai
        model = genai.GenerativeModel(model_name=GEMINI_MODEL)

        context_str = f"Document Title: {req.docTitle or 'Senior Citizen Assistance Guidelines'}\n"
        if req.docSummary:
            context_str += "Summary Takeaways:\n" + "\n".join(f"- {pt}" for pt in req.docSummary) + "\n"
        if req.fullText:
            context_str += f"\nFull Document Extracted Text:\n{req.fullText[:4000]}\n"

        prompt = f"""You are a helpful government welfare assistant for senior citizens called 'Saral Setu'.
Document Context:
{context_str}

User Question: "{req.question}"

Answer concisely, accurately, and reassuringly in 2 to 3 sentences in plain language directly based on the document context."""

        response = model.generate_content(prompt)
        return {
            "success": True,
            "answer": response.text.strip(),
            "source": "gemini"
        }
    except Exception as e:
        print(f"[Gemini Chat Error]: {e}")
        return {
            "success": False,
            "error": str(e),
            "answer": "I could not fetch an AI answer at the moment. Please refer to the document takeaways."
        }


# ═══════════════════════════════════════════════════════════════════════
#  TRANSLATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/api/languages")
async def get_supported_languages():
    """Returns list of supported Indian regional languages + English."""
    return {
        "success": True,
        "languages": SUPPORTED_LANGUAGES,
        "total": len(SUPPORTED_LANGUAGES)
    }

@app.get("/api/translations/{lang_code}")
async def get_language_dictionary(lang_code: str):
    """Returns dictionary catalog for a specific language code (with dynamic fallback for all 22 Indian languages)."""
    code = lang_code.lower().strip()
    if code in TRANSLATIONS:
        return {"success": True, "lang": code, "catalog": TRANSLATIONS[code]}
    
    # Generate on the fly for any of the 22 Indian languages
    try:
        en_catalog = TRANSLATIONS["en"]
        keys = list(en_catalog.keys())
        values = [en_catalog[k] for k in keys]
        translated_values = batch_translate_texts(values, code)
        new_catalog = {k: v for k, v in zip(keys, translated_values)}
        TRANSLATIONS[code] = new_catalog
        return {"success": True, "lang": code, "catalog": new_catalog}
    except Exception as e:
        print(f"[Dynamic Catalog Translation Error]: {e}")
        return {"success": True, "lang": "en", "catalog": TRANSLATIONS["en"]}

@app.post("/api/translate")
async def translate_text(req: TranslationRequest):
    """Dynamically translates arbitrary text to any regional language."""
    text = req.text.strip()
    target = req.target_lang.lower()
    if not text or target == "en":
        return {"success": True, "translated_text": text, "target_lang": target}

    cache_key = f"{text}_{target}"
    if cache_key in TRANSLATION_CACHE:
        return {"success": True, "translated_text": TRANSLATION_CACHE[cache_key], "cached": True, "target_lang": target}

    if HAS_DEEP_TRANSLATOR:
        try:
            g_lang = GOOGLE_LANG_MAP.get(target, target)
            translator = GoogleTranslator(source=req.source_lang or 'auto', target=g_lang)
            translated = translator.translate(text)
            TRANSLATION_CACHE[cache_key] = translated
            return {"success": True, "translated_text": translated, "cached": False, "target_lang": target}
        except Exception as e:
            return {"success": False, "error": str(e), "translated_text": text, "target_lang": target}

    return {"success": True, "translated_text": text, "target_lang": target}

@app.post("/api/translate-doc")
async def translate_document(req: DocTranslationRequest):
    """Translate a document's title and summary points."""
    target = req.target_lang.lower()
    if target == "en":
        return {"success": True, "title": req.title, "points": req.summary_points, "target_lang": target}

    if not HAS_DEEP_TRANSLATOR:
        return {"success": True, "title": req.title, "points": req.summary_points, "target_lang": target}

    try:
        g_lang = GOOGLE_LANG_MAP.get(target, target)
        translator = GoogleTranslator(source='auto', target=g_lang)
        translated_title = translator.translate(req.title)
        translated_points = [translator.translate(p) for p in req.summary_points]
        return {
            "success": True,
            "title": translated_title,
            "points": translated_points,
            "target_lang": target
        }
    except Exception as e:
        return {"success": False, "error": str(e), "title": req.title, "points": req.summary_points}

# ─── Mount Frontend ──────────────────────────────────────────────────
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting Saral Setu Server on http://{host}:{port} ...")
    uvicorn.run("server:app", host=host, port=port, reload=True)
