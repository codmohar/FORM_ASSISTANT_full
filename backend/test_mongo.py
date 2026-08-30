import os
import sys
import asyncio
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from server import app, init_db
from fastapi.testclient import TestClient


async def run_tests():
    print("[1/8] Initializing database connection...", flush=True)
    await init_db()

    with TestClient(app) as client:
        print("[2/8] Testing MongoDB Health endpoint...", flush=True)
        h_res = client.get("/api/health/mongo")
        print("  -> Health status:", h_res.status_code, h_res.json(), flush=True)
        assert h_res.status_code == 200, "Health check failed"

        test_email = f"citizen_{int(time.time())}@gov.in"
        print(f"[3/8] Testing User Registration for {test_email}...", flush=True)
        signup_res = client.post("/api/auth/signup", json={
            "name": "Ramesh Kumar Verma",
            "email": test_email,
            "password": "secretPassword123"
        })
        print("  -> Signup result:", signup_res.status_code, signup_res.json()["user"], flush=True)
        assert signup_res.status_code == 200, "Signup failed"
        token = signup_res.json()["token"]

        print("[4/8] Testing User Login with password...", flush=True)
        login_res = client.post("/api/auth/login", json={
            "email": test_email,
            "password": "secretPassword123"
        })
        print("  -> Login success:", login_res.status_code, login_res.json()["user"], flush=True)
        assert login_res.status_code == 200, "Login failed"

        print("[5/8] Testing GET /api/auth/me Profile Vault from MongoDB...", flush=True)
        me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        print("  -> Auth Me:", me_res.status_code, me_res.json()["user"], flush=True)
        assert me_res.status_code == 200

        print("[6/8] Testing PUT /api/profile Profile Update in MongoDB...", flush=True)
        up_res = client.put("/api/profile", headers={"Authorization": f"Bearer {token}"}, json={
            "full_name": "Ramesh K. Verma",
            "phone": "98765 43210",
            "address": "42, Tech Park Avenue, Sector 5, New Delhi - 110001, India",
            "pension_ppo": "PPO/2023/DEL/88921",
            "category": "General (Senior Citizen)"
        })
        print("  -> Update profile:", up_res.status_code, up_res.json(), flush=True)
        assert up_res.status_code == 200

        print("[7/8] Testing POST /api/forms/submit Application Storage in MongoDB...", flush=True)
        form_res = client.post("/api/forms/submit", headers={"Authorization": f"Bearer {token}"}, json={
            "form_title": "Senior Citizen Financial Assistance Scheme 2024",
            "ref_number": "GOV-SS-889922",
            "status": "Submitted",
            "fields_count": 12,
            "fields_snapshot": {
                "portalFullName": {"label": "Full Legal Name", "value": "Ramesh K. Verma"},
                "portalAadhaar": {"label": "Aadhaar Number", "value": "5482 9104 9821"},
                "portalPhone": {"label": "Mobile Number", "value": "98765 43210"}
            }
        })
        print("  -> Form submitted:", form_res.status_code, form_res.json(), flush=True)
        assert form_res.status_code == 200

        print("[8/8] Testing GET /api/forms/my-submissions Retrieval from MongoDB...", flush=True)
        sub_res = client.get("/api/forms/my-submissions", headers={"Authorization": f"Bearer {token}"})
        print("  -> Submissions fetched:", sub_res.status_code, "Total:", sub_res.json()["total"], flush=True)
        assert sub_res.status_code == 200 and sub_res.json()["total"] >= 1

        print("\n=======================================================", flush=True)
        print("  SUCCESS: ALL MONGODB & AUTHENTICATION TESTS PASSED!  ", flush=True)
        print("=======================================================", flush=True)

if __name__ == "__main__":
    asyncio.run(run_tests())
