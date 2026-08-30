import urllib.request
import json
import time

schema = {
    "portal_title": "Senior Citizen Grant Application Portal",
    "organization": "Department of Social Welfare",
    "total_pages": 2,
    "current_page": 1,
    "pages": [
        {
            "page_number": 1,
            "step_title": "1. Personal Details",
            "description": "Applicant identity",
            "fields": [
                {
                    "id": "portalFullName",
                    "label": "Full Legal Name",
                    "placeholder": "Enter full name",
                    "hint": "Full Name: Must match Aadhaar records.",
                    "vaultKey": "name"
                }
            ]
        }
    ]
}

data = json.dumps({"form_schema": schema, "target_lang": "hi"}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/api/ai/translate-form-schema", data=data, headers={"Content-Type": "application/json"})

start = time.time()
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        print("Status:", resp.status)
        result = json.loads(resp.read().decode("utf-8"))
        print("Success:", result.get("success"))
        print("Source:", result.get("source"))
        print("Time taken:", round(time.time() - start, 2), "s")
        print("Translated Schema:", json.dumps(result.get("form"), ensure_ascii=False, indent=2))
except Exception as e:
    print("Error:", e)
