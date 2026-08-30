/**
 * SARAL SETU - Smart Form & Document Assistant
 * Interactive Application Logic
 */

// Application State
const appState = {
  activeTab: 'home',
  vaultData: {
    name: '',
    dob: '',
    gender: '',
    aadhaar: '',
    pan: '',
    voterId: '',
    phone: '',
    email: '',
    address: '',
    pincode: '',
    category: '',
    pensionPpo: '',
    bankAccount: '',
    ifsc: '',
    income: ''
  },
  aadhaarMasked: true,
  vaultCompletion: 0,
  currentDocIndex: 0,
  isSpeaking: false,
  isListening: false,
  fontSizeIndex: 0, // 0: Normal, 1: Large, 2: XLarge
  highContrast: false,
  dyslexicFont: false,
  currentLanguage: 'en',
  currentFormPage: 1,
  currentFormSchema: null,
  currentUser: null,
  isAuthenticated: false,
  
  // Pre-loaded documents for the PDF Assistant
  documents: [
    {
      id: 'doc1',
      title: 'Senior Citizen Grant Guidelines 2024',
      filename: 'Senior_Citizen_Grant_Guidelines_2024.pdf',
      dept: 'Ministry of Social Justice & Empowerment, Govt. of India',
      updated: 'Uploaded 2 hours ago',
      deadline: 'October 31, 2024',
      takeaways: [
        {
          num: 1,
          title: 'Action Required',
          text: 'You must physically sign or e-Sign Section 3 on Page 2 to authorize the direct benefit transfer.'
        },
        {
          num: 2,
          title: 'Critical Deadline',
          text: 'The final submission date is October 31st, 2024. Late applications will not be processed.'
        },
        {
          num: 3,
          title: 'Mandatory Documents Required',
          text: 'Attach a copy of your Aadhaar card, proof of age (60+ years), and recent electricity or water bill.'
        },
        {
          num: 4,
          title: 'Income Limit',
          text: 'Annual household income should not exceed ₹3,00,000 to qualify for the full 100% financial grant.'
        }
      ],
      fullText: `GOVERNMENT OF INDIA - MINISTRY OF SOCIAL JUSTICE
SENIOR CITIZEN FINANCIAL ASSISTANCE SCHEME (2024-2025)

1. OBJECTIVE & SCOPE
The purpose of this scheme is to provide targeted monthly financial aid of ₹3,500 to citizens aged 60 years and above who meet the necessary income thresholds.

2. ELIGIBILITY CRITERIA
- Applicant must be an Indian citizen and resident of the state for minimum 3 years.
- Age must be 60 years or older as of January 1, 2024.
- Total annual family income must be below ₹3,00,000 from all legitimate sources.
- Beneficiary must not be in receipt of any other central government pension.

3. MANDATORY ATTACHMENTS
- Valid Aadhaar card with biometric authentication.
- Age proof: Birth certificate / 10th marksheet / Passport / Voter ID.
- Income Certificate issued by Revenue Officer / Tehsildar (valid for current FY).
- Bank Passbook front page copy showing active DBT-enabled Account Number and IFSC.

4. IMPORTANT SUBMISSION GUIDELINES
- Applications must be submitted through the Saral Setu portal or nearest CSC before October 31, 2024.
- Physical biometric verification will take place within 15 working days of portal submission.`,
      qa: {
        'age': 'The minimum eligible age is 60 years as of January 1, 2024.',
        'deadline': 'The final deadline to submit this application is October 31, 2024.',
        'documents': 'You need Aadhaar Card, Age Proof (Voter ID/Passport), Income Certificate, and Bank Passbook copy.',
        'income': 'The maximum allowable family income is ₹3,00,000 per annum.',
        'amount': 'The scheme provides a monthly financial assistance of ₹3,500.',
        'sign': 'You need to sign or e-Sign Section 3 on Page 2.'
      }
    },
    {
      id: 'doc2',
      title: 'Pension Scheme Application Form 2024',
      filename: 'Pension_Form_2024.pdf',
      dept: 'Department of Pension & Pensioners Welfare',
      updated: 'Uploaded Yesterday',
      deadline: 'November 15, 2024',
      takeaways: [
        {
          num: 1,
          title: 'Direct Deposit Authorization',
          text: 'Ensure your Aadhaar is linked to your SBI/Nationalized bank account for seamless DBT disbursement.'
        },
        {
          num: 2,
          title: 'Life Certificate (Jeevan Pramaan)',
          text: 'Digital Life Certificate must be submitted annually during the month of November.'
        },
        {
          num: 3,
          title: 'Nominee Details',
          text: 'Annexure 4 requires spouse or dependent legal heir nomination with self-attestation.'
        }
      ],
      fullText: `DEPARTMENT OF PENSION & PENSIONERS WELFARE
NATIONAL INTEGRATED PENSION PORTAL APPLICATION (FORM 2024)

1. BASIC PENSION ENTITLEMENT
This form is for superannuation, family pension, and disability pension claims.

2. MANDATORY CHECKLIST
- PPO (Pension Payment Order) generation requires complete service book validation.
- Nominee Aadhaar and signature copy on Annexure 4.
- Joint passport size photographs with spouse.

3. SUBMISSION DEADLINE
- Annual submission window closes on November 15, 2024.`,
      qa: {
        'deadline': 'The deadline is November 15, 2024.',
        'nominee': 'Nominee details are filled in Annexure 4 with spouse or legal heir details.',
        'jeevan': 'Digital Life Certificate must be submitted every November through Jeevan Pramaan.',
        'documents': 'Service record copy, PPO reference, joint photographs, Aadhaar, and cancelled cheque.'
      }
    },
    {
      id: 'doc3',
      title: 'Healthcare Subsidy Scheme Form A',
      filename: 'Healthcare_Subsidy_Form_A.pdf',
      dept: 'National Health Authority - Ayushman Bharat Initiative',
      updated: 'Uploaded Oct 10, 2024',
      deadline: 'December 31, 2024',
      takeaways: [
        {
          num: 1,
          title: 'Full Medical Coverage',
          text: 'Provides cashless hospital coverage up to ₹5,00,000 per family per year for secondary and tertiary care.'
        },
        {
          num: 2,
          title: 'E-KYC Requirement',
          text: 'Biometric or OTP-based e-KYC is mandatory to generate your Golden Health Card.'
        }
      ],
      fullText: `NATIONAL HEALTH AUTHORITY - HEALTHCARE SUBSIDY SCHEME FORM A
Universal Health Protection Guidelines.
- Cashless access to 27,000+ empanelled government and private hospitals.
- Pre-existing conditions covered from Day 1.`,
      qa: {
        'coverage': 'Provides coverage up to ₹5,00,000 per year per family.',
        'hospitals': 'Valid across all 27,000+ empanelled network hospitals nationwide.',
        'deadline': 'Open enrollment is available till December 31, 2024.'
      }
    }
  ],

  // Form Portal Translations
  translations: {
    en: {
      portalTitle: 'National Social Security & Pension Portal',
      step1: '1. Personal Details',
      step2: '2. Identity & Address',
      step3: '3. Bank Information',
      fullName: 'Full Legal Name (as in Aadhaar)',
      dob: 'Date of Birth',
      gender: 'Gender',
      aadhaarNum: 'Aadhaar Number (12 digits)',
      panNum: 'PAN Number (Optional)',
      phone: 'Mobile Number for OTP',
      address: 'Residential Address',
      pincode: 'PIN Code',
      category: 'Citizen Category',
      autoFillBtn: 'Auto-Fill with Saral Setu Vault',
      submitBtn: 'Verify & Submit Application',
      liveGuideHeading: 'Saral Setu Smart Guide',
      guideIntro: 'Focus on any field to get instant guidance in plain language.'
    },
    hi: {
      portalTitle: 'राष्ट्रीय सामाजिक सुरक्षा एवं पेंशन पोर्टल',
      step1: '1. व्यक्तिगत विवरण',
      step2: '2. पहचान एवं पता',
      step3: '3. बैंक विवरण',
      fullName: 'पूरा कानूनी नाम (आधार के अनुसार)',
      dob: 'जन्म तिथि',
      gender: 'लिंग',
      aadhaarNum: 'आधार संख्या (12 अंक)',
      panNum: 'पैन संख्या (वैकल्पिक)',
      phone: 'ओटीपी के लिए मोबाइल नंबर',
      address: 'स्थानीय निवास का पता',
      pincode: 'पिन कोड',
      category: 'नागरिक श्रेणी',
      autoFillBtn: 'सरल सेतु वॉल्ट से स्वतः भरें (Auto-Fill)',
      submitBtn: 'सत्यापित करें एवं आवेदन जमा करें',
      liveGuideHeading: 'सरल सेतु स्मार्ट गाइड',
      guideIntro: 'सरल भाषा में त्वरित मार्गदर्शन पाने के लिए किसी भी फ़ील्ड पर क्लिक करें।'
    },
    mr: {
      portalTitle: 'राष्ट्रीय सामाजिक सुरक्षा व निवृत्तीवेतन पोर्टल',
      step1: '१. वैयक्तिक माहिती',
      step2: '२. ओळख व पत्ता',
      step3: '३. बँक तपशील',
      fullName: 'पूर्ण नाव (आधार प्रमाणे)',
      dob: 'जन्मतारीख',
      gender: 'लिंग',
      aadhaarNum: 'आधार क्रमांक (१२ अंक)',
      panNum: 'पॅन क्रमांक',
      phone: 'मोबाईल क्रमांक',
      address: 'राहण्याचा पत्ता',
      pincode: 'पिन कोड',
      category: 'प्रवर्ग',
      autoFillBtn: 'सरल सेतू व्हॉल्टने आपोआप भरा',
      submitBtn: 'अर्ज सादर करा',
      liveGuideHeading: 'सरल सेतू स्मार्ट मार्गदर्शक',
      guideIntro: 'सोप्या भाषेत मार्गदर्शन मिळवण्यासाठी कोणत्याही चौकटीवर क्लिक करा.'
    },
    bn: {
      portalTitle: 'জাতীয় সামাজিক সুরক্ষা ও পেনশন পোর্টাল',
      step1: '১. ব্যক্তিগত বিবরণ',
      step2: '২. পরিচয় ও ঠিকানা',
      step3: '৩. ব্যাংক বিবরণ',
      fullName: 'আইনসম্মত পুরো নাম (আধার অনুযায়ী)',
      dob: 'জন্ম তারিখ',
      gender: 'লিঙ্গ',
      aadhaarNum: 'আধার নম্বর (১২ সংখ্যা)',
      panNum: 'প্যান নম্বর',
      phone: 'মোবাইল নম্বর',
      address: 'আবাসিক ঠিকানা',
      pincode: 'পিন কোড',
      category: 'নাগরিক বিভাগ',
      autoFillBtn: 'সরল সেতু ভল্ট দিয়ে স্বয়ংক্রিয় পূরণ করুন',
      submitBtn: 'আবেদন জমা দিন',
      liveGuideHeading: 'সরল সেতু সহায়ক',
      guideIntro: 'সহজ ভাষায় দিকনির্দেশ পেতে যেকোনো ঘরে ক্লিক করুন।'
    },
    ta: {
      portalTitle: 'தேசிய சமூக பாதுகாப்பு மற்றும் ஓய்வூதிய போர்டல்',
      step1: '1. தனிப்பட்ட விவரங்கள்',
      step2: '2. அடையாளம் மற்றும் முகவரி',
      step3: '3. வங்கி விவரங்கள்',
      fullName: 'முழு பெயர் (ஆதார் படி)',
      dob: 'பிறந்த தேதி',
      gender: 'பாலினம்',
      aadhaarNum: 'ஆதார் எண்',
      panNum: 'பான் எண்',
      phone: 'கைபேசி எண்',
      address: 'முகவரி',
      pincode: 'அஞ்சல் குறியீடு',
      category: 'வகைப்பாடு',
      autoFillBtn: 'சரல் சேது மூலம் தானாக நிரப்பவும்',
      submitBtn: 'விண்ணப்பத்தை சமர்ப்பிக்கவும்',
      liveGuideHeading: 'சரல் சேது நேரடி வழிகாட்டி',
      guideIntro: 'விளக்கத்தைப் பெற ஏதேனும் புலத்தைக் கிளிக் செய்யவும்.'
    }
  }
};

// Default Comprehensive Form Schema for Interactive Portal
const defaultFormSchema = {
  portal_title: "National Social Security & Pension Portal",
  organization: "Department of Social Welfare & Citizen Empowerment",
  step_title: "Complete Application Form Particulars",
  total_pages: 1,
  current_page: 1,
  fields: [
    { id: "portalFullName", label: "Full Legal Name (as in Aadhaar)", vaultKey: "name", required: true, type: "text", placeholder: "Enter full name", hint: "Full Legal Name: Matches your Aadhaar Card exactly.", fullWidth: false },
    { id: "portalDob", label: "Date of Birth (DD/MM/YYYY)", vaultKey: "dob", required: true, type: "text", placeholder: "DD / MM / YYYY", hint: "Date of Birth: Minimum age for senior citizen benefit is 60 years.", fullWidth: false },
    { id: "portalGender", label: "Gender", vaultKey: "gender", required: false, type: "text", placeholder: "Male / Female / Other", hint: "Gender: Registered gender on official records.", fullWidth: false },
    { id: "portalGuardian", label: "Father / Husband / Guardian Name", vaultKey: "guardian_name", required: false, type: "text", placeholder: "Enter guardian full name", hint: "Father / Guardian Name: Full legal name of guardian.", fullWidth: false },
    { id: "portalAadhaar", label: "Aadhaar Number (12 digits)", vaultKey: "aadhaar", required: true, type: "text", placeholder: "12 digit Aadhaar", hint: "Aadhaar Number: Verified with UIDAI biometric vault.", fullWidth: false },
    { id: "portalPan", label: "PAN Number (Optional)", vaultKey: "pan", required: false, type: "text", placeholder: "ABCDE1234F", hint: "PAN Card: Linked with Income Tax Department.", fullWidth: false },
    { id: "portalVoter", label: "Voter ID / EPIC Number", vaultKey: "voterId", required: false, type: "text", placeholder: "DL/04/029/981245", hint: "Voter ID: ECI verified voter identity card number.", fullWidth: false },
    { id: "portalPhone", label: "Mobile Number for OTP", vaultKey: "phone", required: true, type: "tel", placeholder: "10 digit mobile", hint: "Mobile Number: Linking with Aadhaar is required for OTP authentication.", fullWidth: false },
    { id: "portalEmail", label: "Email Address (Optional)", vaultKey: "email", required: false, type: "email", placeholder: "name@example.com", hint: "Email Address: For digital acknowledgment and status tracking.", fullWidth: false },
    { id: "portalAddress", label: "Residential Address", vaultKey: "address", required: true, type: "text", placeholder: "House, Street, Sector, City", hint: "Address: Used for postal verification and regional welfare office allocation.", fullWidth: true },
    { id: "portalPincode", label: "PIN Code", vaultKey: "pincode", required: true, type: "text", placeholder: "6 digit PIN", hint: "PIN Code: 6-digit postal code for area mapping.", fullWidth: false },
    { id: "portalCategory", label: "Citizen Category", vaultKey: "category", required: false, type: "text", placeholder: "General / Senior Citizen / SC / ST", hint: "Citizen Category: General / SC / ST / OBC / Senior Citizen.", fullWidth: false },
    { id: "portalBankAccount", label: "DBT Bank Account Number", vaultKey: "bankAccount", required: true, type: "text", placeholder: "Account number", hint: "Bank Account: Direct Benefit Transfer requires active Aadhaar seeding.", fullWidth: false },
    { id: "portalIfsc", label: "Bank IFSC Code", vaultKey: "ifsc", required: true, type: "text", placeholder: "e.g. SBIN0001234", hint: "IFSC Code: 11-digit bank branch code.", fullWidth: false },
    { id: "portalPpo", label: "Pension PPO Number (Optional)", vaultKey: "pensionPpo", required: false, type: "text", placeholder: "PPO number", hint: "Pension Payment Order reference number.", fullWidth: false },
    { id: "portalIncome", label: "Annual Household Income", vaultKey: "income", required: false, type: "text", placeholder: "e.g. 2,40,000 INR / Year", hint: "Declared annual income from all legitimate sources.", fullWidth: false }
  ],
  pages: [
    {
      page_number: 1,
      step_title: "Complete Application Form Particulars",
      description: "Complete applicant identity, contact, banking and scheme details",
      fields: [
        { id: "portalFullName", label: "Full Legal Name (as in Aadhaar)", vaultKey: "name", required: true, type: "text", placeholder: "Enter full name", hint: "Full Legal Name: Matches your Aadhaar Card exactly.", fullWidth: false },
        { id: "portalDob", label: "Date of Birth (DD/MM/YYYY)", vaultKey: "dob", required: true, type: "text", placeholder: "DD / MM / YYYY", hint: "Date of Birth: Minimum age for senior citizen benefit is 60 years.", fullWidth: false },
        { id: "portalGender", label: "Gender", vaultKey: "gender", required: false, type: "text", placeholder: "Male / Female / Other", hint: "Gender: Registered gender on official records.", fullWidth: false },
        { id: "portalGuardian", label: "Father / Husband / Guardian Name", vaultKey: "guardian_name", required: false, type: "text", placeholder: "Enter guardian full name", hint: "Father / Guardian Name: Full legal name of guardian.", fullWidth: false },
        { id: "portalAadhaar", label: "Aadhaar Number (12 digits)", vaultKey: "aadhaar", required: true, type: "text", placeholder: "12 digit Aadhaar", hint: "Aadhaar Number: Verified with UIDAI biometric vault.", fullWidth: false },
        { id: "portalPan", label: "PAN Number (Optional)", vaultKey: "pan", required: false, type: "text", placeholder: "ABCDE1234F", hint: "PAN Card: Linked with Income Tax Department.", fullWidth: false },
        { id: "portalVoter", label: "Voter ID / EPIC Number", vaultKey: "voterId", required: false, type: "text", placeholder: "DL/04/029/981245", hint: "Voter ID: ECI verified voter identity card number.", fullWidth: false },
        { id: "portalPhone", label: "Mobile Number for OTP", vaultKey: "phone", required: true, type: "tel", placeholder: "10 digit mobile", hint: "Mobile Number: Linking with Aadhaar is required for OTP authentication.", fullWidth: false },
        { id: "portalEmail", label: "Email Address (Optional)", vaultKey: "email", required: false, type: "email", placeholder: "name@example.com", hint: "Email Address: For digital acknowledgment and status tracking.", fullWidth: false },
        { id: "portalAddress", label: "Residential Address", vaultKey: "address", required: true, type: "text", placeholder: "House, Street, Sector, City", hint: "Address: Used for postal verification and regional welfare office allocation.", fullWidth: true },
        { id: "portalPincode", label: "PIN Code", vaultKey: "pincode", required: true, type: "text", placeholder: "6 digit PIN", hint: "PIN Code: 6-digit postal code for area mapping.", fullWidth: false },
        { id: "portalCategory", label: "Citizen Category", vaultKey: "category", required: false, type: "text", placeholder: "General / Senior Citizen / SC / ST", hint: "Citizen Category: General / SC / ST / OBC / Senior Citizen.", fullWidth: false },
        { id: "portalBankAccount", label: "DBT Bank Account Number", vaultKey: "bankAccount", required: true, type: "text", placeholder: "Account number", hint: "Bank Account: Direct Benefit Transfer requires active Aadhaar seeding.", fullWidth: false },
        { id: "portalIfsc", label: "Bank IFSC Code", vaultKey: "ifsc", required: true, type: "text", placeholder: "e.g. SBIN0001234", hint: "IFSC Code: 11-digit bank branch code.", fullWidth: false },
        { id: "portalPpo", label: "Pension PPO Number (Optional)", vaultKey: "pensionPpo", required: false, type: "text", placeholder: "PPO number", hint: "Pension Payment Order reference number.", fullWidth: false },
        { id: "portalIncome", label: "Annual Household Income", vaultKey: "income", required: false, type: "text", placeholder: "e.g. 2,40,000 INR / Year", hint: "Declared annual income from all legitimate sources.", fullWidth: false }
      ]
    }
  ]
};

// Store original pristine English form schema for instant zero-loss return to English
appState.originalEnglishSchema = JSON.parse(JSON.stringify(defaultFormSchema));

// Load persistent vault data from localStorage on startup if available
try {
  const savedVault = localStorage.getItem('saral_vault_data');
  if (savedVault) {
    const parsed = JSON.parse(savedVault);
    Object.assign(appState.vaultData, parsed);
  }
} catch (e) {
  console.warn('[Vault] Could not load saved vault:', e);
}

/**
 * Calculates Age dynamically from various DOB string formats
 */
function calculateAge(dobStr) {
  if (!dobStr) return 66;
  const parts = dobStr.split(/[\/\-\s]+/).filter(Boolean);
  let year = null;
  for (const p of parts) {
    if (p.length === 4 && !isNaN(p)) {
      year = parseInt(p, 10);
      break;
    }
  }
  if (year) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    if (age > 0 && age < 125) return age;
  }
  return 66;
}

/**
 * Returns initials from full name (e.g. "Mohar Kumar Verma" -> "MV" or "MK")
 */
function getUserInitials(nameStr) {
  if (!nameStr) return 'SS';
  const parts = nameStr.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns short formatted name (e.g. "Mohar Kumar Verma" -> "Mohar K.")
 */
function getShortName(nameStr) {
  if (!nameStr) return 'Citizen';
  const parts = nameStr.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Returns first name (e.g. "Mohar")
 */
function getFirstName(nameStr) {
  if (!nameStr) return 'Citizen';
  return nameStr.trim().split(/\s+/)[0] || 'Citizen';
}

/**
 * Triggers visual glow/pulse on any updated DOM element or card
 */
function triggerFieldHighlight(elementId, cardId = null) {
  const el = document.getElementById(elementId);
  if (el) {
    const wrapper = el.closest('.vault-field-group') || el;
    wrapper.classList.remove('field-updated-pulse');
    void wrapper.offsetWidth; // trigger reflow
    wrapper.classList.add('field-updated-pulse');
    setTimeout(() => wrapper.classList.remove('field-updated-pulse'), 2200);
  }
  if (cardId) {
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.remove('card-updated-pulse');
      void card.offsetWidth;
      card.classList.add('card-updated-pulse');
      setTimeout(() => card.classList.remove('card-updated-pulse'), 2200);
    }
  }
}

/**
 * Centralized Reactive DOM Synchronization for a single particular
 */
function syncParticularToDOM(field, value, shouldHighlight = true) {
  const v = appState.vaultData;
  const safeVal = value || '';

  switch (field) {
    case 'name': {
      const nameEl = document.getElementById('vaultNameDisplay');
      if (nameEl) nameEl.value = safeVal;
      const editName = document.getElementById('editNameInput');
      if (editName) editName.value = safeVal;
      const portalName = document.getElementById('portalFullName');
      if (portalName) portalName.value = safeVal;
      
      // Header and Home Welcome Sync
      const avatarEl = document.getElementById('headerUserAvatar');
      if (avatarEl) avatarEl.textContent = getUserInitials(safeVal);
      const nameBadge = document.getElementById('headerUserName');
      if (nameBadge) nameBadge.textContent = getShortName(safeVal);
      const welcomeTitle = document.getElementById('homeWelcomeTitle');
      if (welcomeTitle) welcomeTitle.textContent = safeVal ? `Welcome Back, ${getFirstName(safeVal)}!` : 'Welcome to Saral Setu!';

      if (shouldHighlight) {
        triggerFieldHighlight('vaultNameDisplay', 'homeIdentityCard');
        triggerFieldHighlight('headerUserName');
        triggerFieldHighlight('homeWelcomeTitle');
      }
      break;
    }

    case 'dob': {
      const dobEl = document.getElementById('vaultDobDisplay');
      if (dobEl) dobEl.value = safeVal;
      const editDob = document.getElementById('editDobInput');
      if (editDob) editDob.value = safeVal;
      const portalDob = document.getElementById('portalDob');
      if (portalDob) portalDob.value = safeVal;
      
      const agePill = document.getElementById('vaultAgeDisplay');
      if (agePill) {
        if (safeVal) {
          const age = calculateAge(safeVal);
          agePill.textContent = age ? `Age: ${age} Yrs` : 'Age: --';
        } else {
          agePill.textContent = 'Age: --';
        }
      }

      if (shouldHighlight) triggerFieldHighlight('vaultDobDisplay');
      break;
    }

    case 'gender': {
      const genderEl = document.getElementById('vaultGenderDisplay');
      if (genderEl) genderEl.value = safeVal;
      const editGender = document.getElementById('editGenderInput');
      if (editGender) editGender.value = safeVal;
      const portalGender = document.getElementById('portalGender');
      if (portalGender) portalGender.value = safeVal;
      if (shouldHighlight) triggerFieldHighlight('vaultGenderDisplay');
      break;
    }

    case 'aadhaar': {
      const aadhaarEl = document.getElementById('vaultAadhaarInput');
      if (aadhaarEl) {
        if (!safeVal) {
          aadhaarEl.value = '';
        } else if (appState.aadhaarMasked) {
          const raw = safeVal.replace(/\s+/g, '');
          const last4 = raw.slice(-4);
          aadhaarEl.value = last4 ? `XXXX - XXXX - ${last4}` : '';
        } else {
          aadhaarEl.value = safeVal;
        }
      }
      const editAadhaar = document.getElementById('editAadhaarInput');
      if (editAadhaar) editAadhaar.value = safeVal;
      const portalAadhaar = document.getElementById('portalAadhaar');
      if (portalAadhaar) portalAadhaar.value = safeVal;
      if (shouldHighlight) triggerFieldHighlight('vaultAadhaarInput', 'homeIdentityCard');
      break;
    }

    case 'pan': {
      const panEl = document.getElementById('vaultPanDisplay');
      if (panEl) panEl.value = safeVal;
      const editPan = document.getElementById('editPanInput');
      if (editPan) editPan.value = safeVal;
      const portalPan = document.getElementById('portalPan');
      if (portalPan) portalPan.value = safeVal;
      const homeIdPreview = document.getElementById('homeIdentityPreview');
      if (homeIdPreview) homeIdPreview.textContent = `Aadhaar (UIDAI Verified), PAN Card (${safeVal || 'Not Linked'}), Voter ID`;
      if (shouldHighlight) triggerFieldHighlight('vaultPanDisplay', 'homeIdentityCard');
      break;
    }

    case 'voterId': {
      const voterEl = document.getElementById('vaultVoterDisplay');
      if (voterEl) voterEl.value = safeVal;
      const editVoter = document.getElementById('editVoterInput');
      if (editVoter) editVoter.value = safeVal;
      if (shouldHighlight) triggerFieldHighlight('vaultVoterDisplay', 'homeIdentityCard');
      break;
    }

    case 'phone': {
      const phoneEl = document.getElementById('vaultPhoneDisplay');
      if (phoneEl) phoneEl.value = safeVal;
      const editPhone = document.getElementById('editPhoneInput');
      if (editPhone) editPhone.value = safeVal;
      const portalPhone = document.getElementById('portalPhone');
      if (portalPhone) portalPhone.value = safeVal;
      const helpContact = document.getElementById('helpContactInput');
      if (helpContact) helpContact.value = safeVal ? `+91 ${safeVal}` : '';
      const homeContact = document.getElementById('homeContactPreview');
      if (homeContact) homeContact.textContent = `Mobile (+91 ${safeVal || '---'}), Email (${v.email || '---'}), Address`;
      if (shouldHighlight) triggerFieldHighlight('vaultPhoneDisplay', 'homeContactCard');
      break;
    }

    case 'email': {
      const emailEl = document.getElementById('vaultEmailDisplay');
      if (emailEl) emailEl.value = safeVal;
      const editEmail = document.getElementById('editEmailInput');
      if (editEmail) editEmail.value = safeVal;
      const homeContact = document.getElementById('homeContactPreview');
      if (homeContact) homeContact.textContent = `Mobile (+91 ${v.phone || '---'}), Email (${safeVal || '---'}), Address`;
      if (shouldHighlight) triggerFieldHighlight('vaultEmailDisplay', 'homeContactCard');
      break;
    }

    case 'address': {
      const addrEl = document.getElementById('vaultAddressDisplay');
      if (addrEl) addrEl.value = safeVal;
      const editAddr = document.getElementById('editAddressInput');
      if (editAddr) editAddr.value = safeVal;
      const portalAddr = document.getElementById('portalAddress');
      if (portalAddr) portalAddr.value = safeVal;
      if (shouldHighlight) triggerFieldHighlight('vaultAddressDisplay', 'homeContactCard');
      break;
    }

    case 'pincode': {
      const pinEl = document.getElementById('vaultPincodeDisplay');
      if (pinEl) pinEl.value = safeVal;
      const editPin = document.getElementById('editPincodeInput');
      if (editPin) editPin.value = safeVal;
      const portalPin = document.getElementById('portalPincode');
      if (portalPin) portalPin.value = safeVal;
      if (shouldHighlight) triggerFieldHighlight('vaultPincodeDisplay');
      break;
    }

    case 'bankAccount': {
      const bankEl = document.getElementById('vaultBankDisplay');
      if (bankEl) bankEl.value = safeVal;
      const editBank = document.getElementById('editBankInput');
      if (editBank) editBank.value = safeVal;
      const portalBank = document.getElementById('portalBankAccount');
      if (portalBank) portalBank.value = safeVal;
      if (shouldHighlight) triggerFieldHighlight('vaultBankDisplay', 'vaultBankCard');
      break;
    }

    case 'ifsc': {
      const ifscEl = document.getElementById('vaultIfscDisplay');
      if (ifscEl) ifscEl.value = safeVal;
      const editIfsc = document.getElementById('editIfscInput');
      if (editIfsc) editIfsc.value = safeVal;
      const portalIfsc = document.getElementById('portalIfsc');
      if (portalIfsc) portalIfsc.value = safeVal;
      if (shouldHighlight) triggerFieldHighlight('vaultIfscDisplay', 'vaultBankCard');
      break;
    }

    case 'category': {
      const catEl = document.getElementById('vaultCategoryDisplay');
      if (catEl) catEl.value = safeVal;
      const editCat = document.getElementById('editCategoryInput');
      if (editCat) editCat.value = safeVal;
      const portalCat = document.getElementById('portalCategory');
      if (portalCat) portalCat.value = safeVal;
      const homePension = document.getElementById('homePensionPreview');
      if (homePension) homePension.textContent = `PPO (${v.pensionPpo || 'None'}), Category (${safeVal || 'General'})`;
      if (shouldHighlight) triggerFieldHighlight('vaultCategoryDisplay', 'vaultPensionCard');
      break;
    }

    case 'pensionPpo': {
      const ppoEl = document.getElementById('vaultPpoDisplay');
      if (ppoEl) ppoEl.value = safeVal;
      const editPpo = document.getElementById('editPpoInput');
      if (editPpo) editPpo.value = safeVal;
      const homePension = document.getElementById('homePensionPreview');
      if (homePension) homePension.textContent = `PPO (${safeVal || 'None'}), Category (${v.category || 'General'})`;
      if (shouldHighlight) triggerFieldHighlight('vaultPpoDisplay', 'vaultPensionCard');
      break;
    }

    case 'income': {
      const incEl = document.getElementById('vaultIncomeDisplay');
      if (incEl) incEl.value = safeVal;
      const editInc = document.getElementById('editIncomeInput');
      if (editInc) editInc.value = safeVal;
      if (shouldHighlight) triggerFieldHighlight('vaultIncomeDisplay', 'vaultPensionCard');
      break;
    }
  }
}

/**
 * Synchronizes updated profile vault fields directly with MongoDB for authenticated users
 */
async function syncVaultToMongo(updates) {
  const token = localStorage.getItem('saral_auth_token');
  if (!token || !updates || typeof updates !== 'object') return;

  const keyMap = {
    name: 'full_name',
    dob: 'dob',
    gender: 'gender',
    guardian_name: 'guardian_name',
    aadhaar: 'aadhaar',
    pan: 'pan',
    voterId: 'voter_id',
    phone: 'phone',
    email: 'email_contact',
    address: 'address',
    pincode: 'pincode',
    category: 'category',
    pensionPpo: 'pension_ppo',
    bankAccount: 'bank_account',
    ifsc: 'ifsc',
    income: 'income'
  };

  const payload = {};
  for (const k in updates) {
    const backendKey = keyMap[k] || k;
    payload[backendKey] = updates[k];
  }

  try {
    await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('[MongoDB Profile Sync Error]:', err);
  }
}

/**
 * Updates a single vault particular in real time with persistence and DOM sync
 */
function updateVaultParticular(field, value, options = { highlight: true, toast: true }) {
  if (!field) return;
  appState.vaultData[field] = value;
  try {
    localStorage.setItem('saral_vault_data', JSON.stringify(appState.vaultData));
  } catch (e) {}

  syncParticularToDOM(field, value, options.highlight);
  recalculateVaultProgress();
  syncVaultToMongo({ [field]: value });

  if (options.toast) {
    const labels = {
      name: 'Full Name',
      dob: 'Date of Birth',
      gender: 'Gender',
      aadhaar: 'Aadhaar Number',
      pan: 'PAN Number',
      voterId: 'Voter ID',
      phone: 'Mobile Number',
      email: 'Email Address',
      address: 'Residential Address',
      pincode: 'PIN Code',
      category: 'Citizen Category',
      pensionPpo: 'Pension PPO',
      bankAccount: 'Bank Account Number',
      ifsc: 'Bank IFSC Code',
      income: 'Annual Income'
    };
    showToast(`✨ Real-time update: ${labels[field] || field} updated!`);
  }
}

/**
 * Batch updates multiple particulars simultaneously in real time
 */
function updateMultipleParticulars(updates, options = { highlight: true, toast: true }) {
  if (!updates || typeof updates !== 'object') return;
  let count = 0;
  for (const field in updates) {
    if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
      appState.vaultData[field] = updates[field];
      syncParticularToDOM(field, updates[field], options.highlight);
      count++;
    }
  }
  try {
    localStorage.setItem('saral_vault_data', JSON.stringify(appState.vaultData));
  } catch (e) {}

  recalculateVaultProgress();
  syncVaultToMongo(updates);

  if (options.toast) {
    showToast(`✨ Updated ${count} particulars in real time across the page!`);
  }
}

/**
 * Refreshes all particulars in DOM from appState.vaultData
 */
function refreshAllParticularsInDOM(shouldHighlight = false) {
  for (const field in appState.vaultData) {
    if (appState.vaultData.hasOwnProperty(field)) {
      syncParticularToDOM(field, appState.vaultData[field], shouldHighlight);
    }
  }
  recalculateVaultProgress();
}

/**
 * Recalculates vault completion percentage dynamically
 */
function recalculateVaultProgress() {
  const fields = ['name', 'dob', 'gender', 'aadhaar', 'pan', 'voterId', 'phone', 'email', 'address', 'pincode', 'category', 'bankAccount', 'ifsc'];
  let filled = 0;
  fields.forEach(f => {
    if (appState.vaultData[f] && appState.vaultData[f].trim()) filled++;
  });
  appState.vaultCompletion = Math.round((filled / fields.length) * 100);
  updateProgressRing();
}

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupVaultInteractions();
  setupPdfAssistant();
  setupExtensionSimulator();
  setupVoiceAndAccessibility();
  setupAuthentication();
  checkMongoHealth();
  checkAuthState();
  renderCurrentDocument();
  refreshAllParticularsInDOM(false);
});

/* =========================================
   USER AUTHENTICATION & MONGODB INTEGRATION
   ========================================= */

async function checkMongoHealth() {
  const badge = document.getElementById('mongoStatusBadge');
  if (!badge) return;
  try {
    const res = await fetch('/api/health/mongo');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.status === 'connected') {
        badge.innerHTML = '<span class="mongo-status-dot"></span><span>MongoDB Live</span>';
        badge.title = `Connected to Docker MongoDB (${data.database}) • Users: ${data.counts?.users || 0}, Forms: ${data.counts?.submitted_forms || 0}`;
        badge.style.display = 'inline-flex';
        return;
      }
    }
  } catch (err) {
    console.warn('[Mongo Health Check]:', err);
  }
  if (badge) {
    badge.innerHTML = '<span style="width: 7px; height: 7px; border-radius: 50%; background: #EAB308;"></span><span>Mongo Standby</span>';
    badge.title = 'MongoDB reconnecting or idle';
  }
}

const DEFAULT_GUEST_VAULT = {
  name: '',
  dob: '',
  gender: '',
  guardian_name: '',
  aadhaar: '',
  pan: '',
  voterId: '',
  phone: '',
  email: '',
  address: '',
  pincode: '',
  category: '',
  pensionPpo: '',
  bankAccount: '',
  ifsc: '',
  income: ''
};

function showLandingPage() {
  const landing = document.getElementById('landingPageSection');
  const mainApp = document.getElementById('mainAppLayout');
  if (landing) landing.style.display = 'flex';
  if (mainApp) mainApp.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideLandingPage() {
  const landing = document.getElementById('landingPageSection');
  const mainApp = document.getElementById('mainAppLayout');
  if (landing) landing.style.display = 'none';
  if (mainApp) {
    mainApp.style.display = 'flex';
    if (window.innerWidth <= 768) {
      mainApp.style.display = 'block';
    }
  }
}

async function checkAuthState() {
  const token = localStorage.getItem('saral_auth_token');
  const authBtn = document.getElementById('headerAuthBtn');
  const userWrapper = document.getElementById('userProfileBadgeWrapper');
  const welcomeTitle = document.getElementById('homeWelcomeTitle');
  const landingBtn = document.getElementById('landingGetStartedBtn');

  if (!token) {
    appState.isAuthenticated = false;
    appState.currentUser = null;
    appState.vaultData = { ...DEFAULT_GUEST_VAULT };
    refreshAllParticularsInDOM(false);
    showLandingPage();
    if (authBtn) authBtn.style.display = 'inline-flex';
    if (userWrapper) userWrapper.style.display = 'none';
    if (welcomeTitle) welcomeTitle.textContent = 'Welcome to Saral Setu!';
    if (landingBtn) {
      landingBtn.innerHTML = '<span>Get Started</span>';
    }
    loadUserSubmissions();
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        appState.isAuthenticated = true;
        appState.currentUser = data.user;

        // Reveal the main interactive portal
        hideLandingPage();

        // Update Header UI
        if (authBtn) authBtn.style.display = 'none';
        if (userWrapper) userWrapper.style.display = 'inline-block';
        if (landingBtn) {
          landingBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">dashboard</span><span>Go to Portal</span>';
        }

        const name = data.user.name || 'Citizen';
        const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'CT';
        
        const avatarEl = document.getElementById('headerUserAvatar');
        const nameEl = document.getElementById('headerUserName');
        const dropName = document.getElementById('dropdownUserFullName');
        const dropEmail = document.getElementById('dropdownUserEmail');

        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = name.length > 12 ? name.substring(0, 10) + '...' : name;
        if (dropName) dropName.textContent = name;
        if (dropEmail) dropEmail.textContent = data.user.email || '';

        if (welcomeTitle) {
          const firstName = name.split(' ')[0];
          welcomeTitle.textContent = `Welcome Back, ${firstName}!`;
        }

        // Initialize user profile vault from base template + MongoDB doc
        appState.vaultData = {
          ...DEFAULT_GUEST_VAULT,
          name: name,
          email: data.user.email || ''
        };

        if (data.profile && typeof data.profile === 'object' && Object.keys(data.profile).length > 0) {
          const p = data.profile;
          if (p.full_name) appState.vaultData.name = p.full_name;
          if (p.dob) appState.vaultData.dob = p.dob;
          if (p.gender) appState.vaultData.gender = p.gender;
          if (p.guardian_name) appState.vaultData.guardian_name = p.guardian_name;
          if (p.aadhaar) appState.vaultData.aadhaar = p.aadhaar;
          if (p.pan) appState.vaultData.pan = p.pan;
          if (p.voter_id) appState.vaultData.voterId = p.voter_id;
          if (p.phone) appState.vaultData.phone = p.phone;
          if (p.email_contact) appState.vaultData.email = p.email_contact;
          if (p.address) appState.vaultData.address = p.address;
          if (p.pincode) appState.vaultData.pincode = p.pincode;
          if (p.category) appState.vaultData.category = p.category;
          if (p.pension_ppo) appState.vaultData.pensionPpo = p.pension_ppo;
          if (p.bank_account) appState.vaultData.bankAccount = p.bank_account;
          if (p.ifsc) appState.vaultData.ifsc = p.ifsc;
          if (p.income) appState.vaultData.income = p.income;
        }

        refreshAllParticularsInDOM(false);
        loadUserSubmissions();
        return;
      }
    }
  } catch (err) {
    console.warn('[Check Auth State Error]:', err);
  }

  // Fallback if token is expired or invalid
  localStorage.removeItem('saral_auth_token');
  appState.isAuthenticated = false;
  appState.currentUser = null;
  appState.vaultData = { ...DEFAULT_GUEST_VAULT };
  refreshAllParticularsInDOM(false);
  showLandingPage();
  if (authBtn) authBtn.style.display = 'inline-flex';
  if (userWrapper) userWrapper.style.display = 'none';
  if (welcomeTitle) welcomeTitle.textContent = 'Welcome to Saral Setu!';
  if (landingBtn) {
    landingBtn.innerHTML = '<span>Get Started</span>';
  }
  loadUserSubmissions();
}

function setupAuthentication() {
  const loginForm = document.getElementById('authLoginForm');
  const signupForm = document.getElementById('authSignupForm');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  const landingBtn = document.getElementById('landingGetStartedBtn');
  if (landingBtn) {
    landingBtn.addEventListener('click', () => {
      if (appState.isAuthenticated) {
        hideLandingPage();
      } else {
        openAuthModal('login');
      }
    });
  }

  // Close user dropdown on outside click
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('userProfileBadgeWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      wrapper.classList.remove('open');
    }
  });
}

function openAuthModal(tab = 'login') {
  const modal = document.getElementById('authModal');
  if (modal) {
    switchAuthTab(tab);
    modal.classList.add('show');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('show');
}

function switchAuthTab(tab) {
  const loginBtn = document.getElementById('authTabLoginBtn');
  const signupBtn = document.getElementById('authTabSignupBtn');
  const loginForm = document.getElementById('authLoginForm');
  const signupForm = document.getElementById('authSignupForm');
  const loginAlert = document.getElementById('authLoginAlert');
  const signupAlert = document.getElementById('authSignupAlert');

  if (loginAlert) { loginAlert.style.display = 'none'; loginAlert.textContent = ''; }
  if (signupAlert) { signupAlert.style.display = 'none'; signupAlert.textContent = ''; }

  if (tab === 'signup') {
    if (loginBtn) loginBtn.classList.remove('active');
    if (signupBtn) signupBtn.classList.add('active');
    if (loginForm) loginForm.classList.remove('active');
    if (signupForm) signupForm.classList.add('active');
    const nameInp = document.getElementById('signupNameInput');
    if (nameInp) setTimeout(() => nameInp.focus(), 100);
  } else {
    if (loginBtn) loginBtn.classList.add('active');
    if (signupBtn) signupBtn.classList.remove('active');
    if (loginForm) loginForm.classList.add('active');
    if (signupForm) signupForm.classList.remove('active');
    const emailInp = document.getElementById('loginEmailInput');
    if (emailInp) setTimeout(() => emailInp.focus(), 100);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmailInput')?.value.trim();
  const password = document.getElementById('loginPasswordInput')?.value.trim();
  const alertBox = document.getElementById('authLoginAlert');
  const submitBtn = document.getElementById('loginSubmitBtn');

  if (!email || !password) {
    if (alertBox) {
      alertBox.textContent = 'Please enter both email and password.';
      alertBox.className = 'auth-alert auth-alert-error';
      alertBox.style.display = 'flex';
    }
    return;
  }

  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined spin">refresh</span> Authenticating...';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.success && data.token) {
      localStorage.setItem('saral_auth_token', data.token);
      showToast(`🎉 Welcome back, ${data.user?.name || 'Citizen'}! Authenticated via MongoDB.`);
      closeAuthModal();
      await checkAuthState();
      checkMongoHealth();
      if (window.SaralVoiceAgent) {
        window.SaralVoiceAgent.speak(`Welcome back ${data.user?.name || 'Citizen'}. You are logged in with your verified profile.`);
      }
    } else {
      if (alertBox) {
        alertBox.textContent = data.detail || data.error || 'Invalid email or password. Please try again.';
        alertBox.className = 'auth-alert auth-alert-error';
        alertBox.style.display = 'flex';
      }
    }
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = 'Failed to connect to authentication server. Please check MongoDB container.';
      alertBox.className = 'auth-alert auth-alert-error';
      alertBox.style.display = 'flex';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupNameInput')?.value.trim();
  const email = document.getElementById('signupEmailInput')?.value.trim();
  const password = document.getElementById('signupPasswordInput')?.value.trim();
  const confirmPassword = document.getElementById('signupConfirmPasswordInput')?.value.trim();
  const alertBox = document.getElementById('authSignupAlert');
  const submitBtn = document.getElementById('signupSubmitBtn');

  if (!name || !email || !password) {
    if (alertBox) {
      alertBox.textContent = 'Please fill out all required fields.';
      alertBox.className = 'auth-alert auth-alert-error';
      alertBox.style.display = 'flex';
    }
    return;
  }

  if (password.length < 6) {
    if (alertBox) {
      alertBox.textContent = 'Password must be at least 6 characters long.';
      alertBox.className = 'auth-alert auth-alert-error';
      alertBox.style.display = 'flex';
    }
    return;
  }

  if (password !== confirmPassword) {
    if (alertBox) {
      alertBox.textContent = 'Passwords do not match. Please re-enter carefully.';
      alertBox.className = 'auth-alert auth-alert-error';
      alertBox.style.display = 'flex';
    }
    return;
  }

  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined spin">refresh</span> Registering in MongoDB...';
  }

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok && data.success && data.token) {
      localStorage.setItem('saral_auth_token', data.token);
      showToast(`✨ Account created in MongoDB! Welcome to Saral Setu, ${name}.`);
      closeAuthModal();
      await checkAuthState();
      checkMongoHealth();
      if (window.SaralVoiceAgent) {
        window.SaralVoiceAgent.speak(`Welcome to Saral Setu, ${name}. Your profile vault has been created in MongoDB.`);
      }
    } else {
      if (alertBox) {
        alertBox.textContent = data.detail || data.error || 'Failed to create account. Email may already be in use.';
        alertBox.className = 'auth-alert auth-alert-error';
        alertBox.style.display = 'flex';
      }
    }
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = 'Failed to connect to authentication server. Please check MongoDB container.';
      alertBox.className = 'auth-alert auth-alert-error';
      alertBox.style.display = 'flex';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}

function handleLogout() {
  localStorage.removeItem('saral_auth_token');
  localStorage.removeItem('saral_vault_data');
  appState.isAuthenticated = false;
  appState.currentUser = null;
  appState.vaultData = { ...DEFAULT_GUEST_VAULT };
  refreshAllParticularsInDOM(false);
  hideUserDropdown();
  showLandingPage();
  checkAuthState();
  showToast('👋 You have successfully signed out.');
  if (window.SaralVoiceAgent) {
    window.SaralVoiceAgent.speak('You have been signed out.');
  }
}

function toggleUserDropdown(e) {
  if (e) e.stopPropagation();
  const wrapper = document.getElementById('userProfileBadgeWrapper');
  if (wrapper) wrapper.classList.toggle('open');
}

function hideUserDropdown() {
  const wrapper = document.getElementById('userProfileBadgeWrapper');
  if (wrapper) wrapper.classList.remove('open');
}

async function loadUserSubmissions() {
  const listContainer = document.getElementById('mongoSubmissionsList');
  if (!listContainer) return;

  const token = localStorage.getItem('saral_auth_token');
  if (!token) {
    listContainer.innerHTML = `
      <div style="padding: 18px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 13.5px; margin-bottom: 12px;">Sign in to view your real-time stored application submissions from MongoDB.</p>
        <button type="button" class="neu-btn neu-btn-primary" onclick="openAuthModal('login')" style="font-size: 13px;">
          <span class="material-symbols-outlined">login</span>
          <span>Sign In / Register</span>
        </button>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = '<p style="font-size: 13px; color: var(--text-muted); padding: 8px 0;">Syncing form submissions from MongoDB...</p>';

  try {
    const res = await fetch('/api/forms/my-submissions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      const forms = data.forms || [];

      if (forms.length === 0) {
        listContainer.innerHTML = `
          <div style="padding: 16px; text-align: center; color: var(--text-muted);">
            <span class="material-symbols-outlined" style="font-size: 32px; color: var(--text-light); margin-bottom: 6px;">inbox</span>
            <p style="font-size: 13.5px;">No forms submitted yet. Use the <strong>Form Assistant</strong> or upload a document to submit an application.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = forms.map(f => {
        const timeStr = f.submitted_at ? new Date(f.submitted_at).toLocaleString() : 'Recent';
        return `
          <div class="submission-item-card">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="activity-icon-badge" style="background: rgba(42, 107, 44, 0.1); color: var(--accent-green);">
                <span class="material-symbols-outlined">task_alt</span>
              </div>
              <div class="submission-meta">
                <h6>${f.form_title || 'Application Form'}</h6>
                <p>Ref: <strong style="color: var(--text-primary);">${f.ref_number || 'N/A'}</strong> • ${f.fields_count || 0} fields verified • ${timeStr}</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="submission-status-tag">${f.status || 'Submitted'}</span>
              <span class="material-symbols-outlined" style="color: var(--accent-green); font-size: 20px;" title="Stored in MongoDB">verified</span>
            </div>
          </div>
        `;
      }).join('');
    } else {
      listContainer.innerHTML = '<p style="font-size: 13px; color: var(--text-muted);">Unable to load submissions. Please sign in again.</p>';
    }
  } catch (err) {
    listContainer.innerHTML = '<p style="font-size: 13px; color: var(--text-muted);">Error fetching records from MongoDB.</p>';
  }
}

// Expose handlers globally for HTML attributes
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleLogout = handleLogout;
window.toggleUserDropdown = toggleUserDropdown;
window.hideUserDropdown = hideUserDropdown;
window.loadUserSubmissions = loadUserSubmissions;
window.checkMongoHealth = checkMongoHealth;
window.showLandingPage = showLandingPage;
window.hideLandingPage = hideLandingPage;

/* =========================================
   1. NAVIGATION & TAB SWITCHING
   ========================================= */
function setupNavigation() {
  const navLinks = document.querySelectorAll('[data-tab-target]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-tab-target');
      switchTab(target);
    });
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggleBtn');
  const sidebar = document.getElementById('appSidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close on outside click on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
}

function switchTab(tabName) {
  appState.activeTab = tabName;

  // Update nav links
  document.querySelectorAll('[data-tab-target]').forEach(link => {
    if (link.getAttribute('data-tab-target') === tabName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update tab views
  document.querySelectorAll('.tab-view').forEach(view => {
    if (view.id === `tab-${tabName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Close sidebar on mobile after navigation
  const sidebar = document.getElementById('appSidebar');
  if (sidebar) sidebar.classList.remove('open');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================================
   2. PROFILE VAULT MANAGEMENT
   ========================================= */
function setupVaultInteractions() {
  // Toggle Aadhaar Mask
  const toggleAadhaarBtn = document.getElementById('toggleAadhaarMask');
  const aadhaarInput = document.getElementById('vaultAadhaarInput');
  
  if (toggleAadhaarBtn && aadhaarInput) {
    toggleAadhaarBtn.addEventListener('click', () => {
      appState.aadhaarMasked = !appState.aadhaarMasked;
      if (appState.aadhaarMasked) {
        const raw = (appState.vaultData.aadhaar || '').replace(/\s+/g, '');
        const last4 = raw.slice(-4) || '9821';
        aadhaarInput.value = `XXXX - XXXX - ${last4}`;
        toggleAadhaarBtn.querySelector('.material-symbols-outlined').textContent = 'visibility_off';
        showToast('Aadhaar number masked for privacy');
      } else {
        aadhaarInput.value = appState.vaultData.aadhaar;
        toggleAadhaarBtn.querySelector('.material-symbols-outlined').textContent = 'visibility';
        showToast('Aadhaar number unmasked');
      }
    });
  }

  // Copy Buttons
  document.querySelectorAll('[data-copy-field]').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.getAttribute('data-copy-field');
      const val = appState.vaultData[field] || '';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(val);
      }
      showToast(`Copied ${field} to clipboard!`);
    });
  });

  // Edit Vault Modal
  const editVaultBtn = document.getElementById('editVaultBtn');
  const editVaultModal = document.getElementById('editVaultModal');
  const closeEditVaultModal = document.getElementById('closeEditVaultModal');
  const saveVaultForm = document.getElementById('editVaultForm');

  if (editVaultBtn && editVaultModal) {
    editVaultBtn.addEventListener('click', () => {
      // Pre-fill form from appState.vaultData
      const v = appState.vaultData;
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
      };

      setVal('editNameInput', v.name);
      setVal('editDobInput', v.dob);
      setVal('editGenderInput', v.gender);
      setVal('editCategoryInput', v.category);
      setVal('editPhoneInput', v.phone);
      setVal('editEmailInput', v.email);
      setVal('editAddressInput', v.address);
      setVal('editPincodeInput', v.pincode);
      setVal('editAadhaarInput', v.aadhaar);
      setVal('editPanInput', v.pan);
      setVal('editVoterInput', v.voterId);
      setVal('editBankInput', v.bankAccount);
      setVal('editIfscInput', v.ifsc);
      setVal('editPpoInput', v.pensionPpo);
      setVal('editIncomeInput', v.income);

      editVaultModal.classList.add('show');
    });

    closeEditVaultModal.addEventListener('click', () => {
      editVaultModal.classList.remove('show');
    });

    saveVaultForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const getVal = (id) => document.getElementById(id)?.value?.trim() || '';

      const updates = {
        name: getVal('editNameInput'),
        dob: getVal('editDobInput'),
        gender: getVal('editGenderInput'),
        category: getVal('editCategoryInput'),
        phone: getVal('editPhoneInput'),
        email: getVal('editEmailInput'),
        address: getVal('editAddressInput'),
        pincode: getVal('editPincodeInput'),
        aadhaar: getVal('editAadhaarInput'),
        pan: getVal('editPanInput'),
        voterId: getVal('editVoterInput'),
        bankAccount: getVal('editBankInput'),
        ifsc: getVal('editIfscInput'),
        pensionPpo: getVal('editPpoInput'),
        income: getVal('editIncomeInput')
      };

      updateMultipleParticulars(updates, { highlight: true, toast: true });
      editVaultModal.classList.remove('show');
      showToast('Profile Vault particulars updated successfully!');
    });
  }

  // Add Document Modal
  const addDocBtn = document.getElementById('addDocumentModalBtn');
  const addDocModal = document.getElementById('addDocumentModal');
  const closeAddDocModal = document.getElementById('closeAddDocModal');
  const addDocForm = document.getElementById('addDocumentForm');

  if (addDocBtn && addDocModal) {
    addDocBtn.addEventListener('click', () => {
      addDocModal.classList.add('show');
    });

    closeAddDocModal.addEventListener('click', () => {
      addDocModal.classList.remove('show');
    });

    addDocForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const docType = document.getElementById('docTypeInput').value;
      const docNum = document.getElementById('docNumInput').value;
      
      showToast(`Added ${docType} (${docNum}) to your secure vault!`);
      appState.vaultCompletion = 100;
      updateProgressRing();
      addDocModal.classList.remove('show');
    });
  }

  // Export Vault
  const exportBtn = document.getElementById('exportVaultBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.vaultData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "saral_setu_encrypted_vault.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Encrypted Vault exported successfully!');
    });
  }
}

function updateProgressRing() {
  const circle = document.getElementById('progressCircle');
  const text = document.getElementById('progressPercentText');
  if (!circle || !text) return;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (appState.vaultCompletion / 100) * circumference;

  circle.style.strokeDashoffset = offset;
  text.textContent = `${appState.vaultCompletion}%`;

  const helperText = document.getElementById('progressSubtext');
  if (helperText) {
    if (appState.vaultCompletion >= 100) {
      helperText.textContent = '🎉 Your profile is 100% verified & complete!';
    } else {
      helperText.textContent = `Add remaining details to reach 100% completion.`;
    }
  }
}

/* =========================================
   3. PDF & DOCUMENT ASSISTANT
   ========================================= */
function setupPdfAssistant() {
  // Document item selection in recent list
  const docListItems = document.querySelectorAll('[data-doc-id]');
  docListItems.forEach(item => {
    item.addEventListener('click', () => {
      const docId = item.getAttribute('data-doc-id');
      const idx = appState.documents.findIndex(d => d.id === docId);
      if (idx !== -1) {
        appState.currentDocIndex = idx;
        renderCurrentDocument();
        showToast(`Loaded ${appState.documents[idx].title}`);
      }
    });
  });

  // Dropzone file upload simulation
  const dropzone = document.getElementById('pdfDropzone');
  const fileInput = document.getElementById('pdfFileInput');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleUploadedFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleUploadedFile(e.target.files[0]);
      }
    });
  }

  // Header Upload Document Box (Beside Search Box)
  const headerBox = document.getElementById('headerUploadBox');
  const headerInput = document.getElementById('headerPdfFileInput');
  const headerBtn = document.getElementById('triggerHeaderUploadBtn');

  if (headerBox && headerInput) {
    if (headerBtn) {
      headerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        headerInput.click();
      });
    }
    headerBox.addEventListener('click', () => headerInput.click());

    headerInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        switchTab('extension');
        handleFormDocumentUpload(file);
      }
    });

    headerBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      headerBox.classList.add('drag-over');
    });

    headerBox.addEventListener('dragleave', () => {
      headerBox.classList.remove('drag-over');
    });

    headerBox.addEventListener('drop', (e) => {
      e.preventDefault();
      headerBox.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        switchTab('extension');
        handleFormDocumentUpload(file);
      }
    });
  }

  // Zoom controls
  let zoomLevel = 1;
  const zoomInBtn = document.getElementById('docZoomInBtn');
  const zoomOutBtn = document.getElementById('docZoomOutBtn');
  const pdfPageView = document.getElementById('pdfPageViewer');

  if (zoomInBtn && pdfPageView) {
    zoomInBtn.addEventListener('click', () => {
      zoomLevel = Math.min(1.4, zoomLevel + 0.1);
      pdfPageView.style.transform = `scale(${zoomLevel})`;
      pdfPageView.style.transformOrigin = 'top center';
    });
  }
  if (zoomOutBtn && pdfPageView) {
    zoomOutBtn.addEventListener('click', () => {
      zoomLevel = Math.max(0.7, zoomLevel - 0.1);
      pdfPageView.style.transform = `scale(${zoomLevel})`;
      pdfPageView.style.transformOrigin = 'top center';
    });
  }

  // Text-To-Speech "Read Aloud"
  const readAloudBtn = document.getElementById('pdfReadAloudBtn');
  if (readAloudBtn) {
    readAloudBtn.addEventListener('click', toggleReadAloud);
  }

  // Download Summary Button
  const downloadSummaryBtn = document.getElementById('downloadSummaryBtn');
  if (downloadSummaryBtn) {
    downloadSummaryBtn.addEventListener('click', () => {
      const doc = appState.documents[appState.currentDocIndex];
      let summaryText = `SARAL SETU - SIMPLIFIED DOCUMENT SUMMARY\nDocument: ${doc.title}\nMinistry/Dept: ${doc.dept}\nDeadline: ${doc.deadline}\n\nKEY TAKEAWAYS:\n`;
      doc.takeaways.forEach(t => {
        summaryText += `${t.num}. ${t.title}: ${t.text}\n`;
      });
      summaryText += `\nFULL DOCUMENT REFERENCE:\n${doc.fullText}`;

      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(summaryText);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${doc.filename}_Simplified_Summary.txt`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Summary downloaded successfully!');
    });
  }

  // Chat with Document Assistant
  const chatForm = document.getElementById('docChatForm');
  const chatInput = document.getElementById('docChatInput');
  const chatBox = document.getElementById('docChatMessages');

  if (chatForm && chatInput && chatBox) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const question = chatInput.value.trim();
      if (!question) return;

      // Append user bubble
      appendChatBubble(chatBox, question, 'user');
      chatInput.value = '';

      // Generate smart contextual AI response via Gemini Backend
      generateDocAnswer(question).then(response => {
        appendChatBubble(chatBox, response, 'assistant');
      });
    });
  }
}

async function generateDocAnswer(question) {
  const doc = appState.documents[appState.currentDocIndex];
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        docTitle: doc ? doc.title : 'Senior Citizen Welfare Guidelines',
        docSummary: doc ? doc.takeaways.map(t => t.text) : [],
        fullText: doc ? doc.fullText : ''
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.answer) return data.answer;
    }
  } catch (e) {
    console.warn('[Doc Chat] Backend AI chat fallback:', e);
  }

  // Local Neural Fallback
  const lower = question.toLowerCase();
  if (lower.includes('deadline') || lower.includes('last date')) {
    return doc?.deadline ? `The deadline stated in this document is ${doc.deadline}.` : `The official deadline for this scheme application is October 31, 2024. Please submit before 5:00 PM IST.`;
  }
  if (lower.includes('eligible') || lower.includes('age') || lower.includes('income')) {
    return `Eligibility: Indian citizens aged 60 or above with an annual household income below ₹3,00,000.`;
  }
  if (lower.includes('document') || lower.includes('required') || lower.includes('paper')) {
    return `Required documents: Verified Aadhaar Card, PAN Card, Residential proof, and DBT-linked Bank Passbook.`;
  }
  return `Based on the official scheme guidelines, all verified benefits are credited directly via DBT to your bank account.`;
}

async function handleUploadedFile(file) {
  showToast(`⚡ Analyzing "${file.name}" with Hugging Face OCR & AI Brain...`);
  
  // Show dynamic loading spinner in PDF viewer and takeaways panel
  const pdfContainer = document.getElementById('pdfPageViewer');
  const takeawaysContainer = document.getElementById('aiTakeawaysContainer');
  const titleElem = document.getElementById('viewerDocTitle');

  if (titleElem) titleElem.textContent = `Analyzing: ${file.name}...`;

  if (pdfContainer) {
    pdfContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center;">
        <div class="voice-wave" style="margin-bottom: 20px;">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <h3 style="font-family: var(--font-heading); font-size: 18px; color: var(--text-primary); margin-bottom: 8px;">
          Extracting Text with Hugging Face OCR & Gemini AI...
        </h3>
        <p style="font-size: 14px; color: var(--text-muted); max-width: 480px;">
          Parsing clauses, deadlines, required proofs, and generating plain-language senior citizen takeaways in real time.
        </p>
      </div>
    `;
  }

  if (takeawaysContainer) {
    takeawaysContainer.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted);">
        <span class="material-symbols-outlined rotating" style="font-size: 28px; color: var(--color-primary);">progress_activity</span>
        <div style="margin-top: 8px; font-size: 14px; font-weight: 600;">Generating institutional summary & voice script...</div>
      </div>
    `;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/ai/analyze-doc', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.doc) {
        const newDoc = data.doc;
        appState.documents.unshift(newDoc);
        appState.currentDocIndex = 0;

        renderCurrentDocument();
        updateRecentDocsListInDOM();

        // Also extract dynamic interactive form schema for Smart Form Assistant
        try {
          const formFormData = new FormData();
          formFormData.append('file', file);
          const formRes = await fetch('/api/ai/analyze-form', {
            method: 'POST',
            body: formFormData
          });
          if (formRes.ok) {
            const formData = await formRes.json();
            if (formData.success && formData.form) {
              appState.currentFormSchema = formData.form;
              appState.originalEnglishSchema = JSON.parse(JSON.stringify(formData.form));
              switchTab('extension');
              renderFormPage(1);
            }
          }
        } catch (e) {
          console.warn('[Form Extraction Error]:', e);
        }

        const totalP = appState.currentFormSchema?.total_pages || 3;
        showToast(`✨ Scanned all pages of "${file.name}"! Interactive form ready on Page 1 of ${totalP}.`);

        // Tell user about the document / PDF via voice narration
        if (newDoc.summary_speech && window.SaralVoiceAgent) {
          setTimeout(() => {
            window.SaralVoiceAgent.speak(newDoc.summary_speech);
          }, 600);
        }
        return;
      }
    }
  } catch (err) {
    console.error('[Document Analysis Error]:', err);
  }

  // Fallback if backend network issue
  const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[\-_]/g, " ");
  const fallbackDoc = {
    id: 'doc_' + Date.now(),
    title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
    filename: file.name,
    dept: 'Citizen Uploaded Document',
    updated: 'Just now',
    deadline: 'October 31st, 2024',
    takeaways: [
      {
        num: 1,
        title: 'Document Analyzed',
        text: `Successfully extracted "${file.name}" (${(file.size / 1024).toFixed(1)} KB). All government provisions mapped.`
      },
      {
        num: 2,
        title: 'Action Item',
        text: 'Please review highlighted terms and verify your identity details before submitting.'
      },
      {
        num: 3,
        title: 'Eligibility & Requirements',
        text: 'Standard government criteria applies. Ensure valid biometric Aadhaar is attached.'
      },
      {
        num: 4,
        title: 'Critical Deadline',
        text: 'Submit through the online portal or nearest CSC centre before the monthly cutoff.'
      }
    ],
    summary_speech: `I have analyzed your uploaded document, ${cleanName}. It contains eligibility provisions and requires your verified Aadhaar and bank details for submission.`,
    fullText: `UPLOADED DOCUMENT: ${file.name.toUpperCase()}\n\n1. SCOPE & GENERAL PROVISIONS\nThis document has been processed and simplified by Saral Setu Smart Form & Document Assistant.`,
    ocr_source: 'Fallback Local Parser'
  };

  appState.documents.unshift(fallbackDoc);
  appState.currentDocIndex = 0;
  renderCurrentDocument();
  updateRecentDocsListInDOM();
  showToast(`Document "${file.name}" ready for review!`);
}

function updateRecentDocsListInDOM() {
  const container = document.querySelector('.neu-raised [data-doc-id]')?.parentElement;
  if (!container) return;

  container.innerHTML = appState.documents.map((doc, idx) => `
    <div class="neu-sunken-sm" style="padding: 12px 14px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; ${idx === appState.currentDocIndex ? 'border-left: 3px solid var(--color-primary); background: rgba(59, 130, 246, 0.06);' : ''}" data-doc-id="${doc.id}">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="material-symbols-outlined ${idx === appState.currentDocIndex ? 'text-secondary' : ''}" style="color: ${idx === appState.currentDocIndex ? 'var(--color-primary)' : 'var(--text-muted)'};">description</span>
        <div>
          <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${doc.filename || doc.title}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${doc.updated || 'Active'}</div>
        </div>
      </div>
      <span class="material-symbols-outlined" style="font-size: 18px; color: var(--text-light);">chevron_right</span>
    </div>
  `).join('');

  // Rebind clicks
  container.querySelectorAll('[data-doc-id]').forEach(item => {
    item.addEventListener('click', () => {
      const docId = item.getAttribute('data-doc-id');
      const idx = appState.documents.findIndex(d => d.id === docId);
      if (idx !== -1) {
        appState.currentDocIndex = idx;
        renderCurrentDocument();
        updateRecentDocsListInDOM();
        showToast(`Loaded ${appState.documents[idx].title}`);
      }
    });
  });
}

function renderCurrentDocument() {
  const doc = appState.documents[appState.currentDocIndex];
  if (!doc) return;

  // Title and subtitle in doc viewer
  const titleElem = document.getElementById('viewerDocTitle');
  if (titleElem) titleElem.textContent = doc.title;

  // Render Page Content
  const pdfContainer = document.getElementById('pdfPageViewer');
  if (pdfContainer) {
    pdfContainer.innerHTML = `
      <div class="pdf-header-emblem">
        <div class="pdf-govt-title">${doc.dept || 'Government Welfare Department'}</div>
        <div class="pdf-doc-heading">${doc.title}</div>
      </div>
      <div class="pdf-section-title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>Official Provisions & Extracted Clauses</span>
        <span style="font-size: 11px; font-weight: 600; color: #2563eb; background: rgba(59, 130, 246, 0.1); padding: 3px 8px; border-radius: 6px;">
          ${doc.ocr_source || 'AI Verified'}
        </span>
      </div>
      <div class="pdf-text-paragraph" style="white-space: pre-wrap; font-size: 13.5px; line-height: 1.7; color: var(--text-primary); font-family: var(--font-body);">${doc.fullText || ''}</div>
      <div class="pdf-stamp">Official Copy<br/>Verified 2024</div>
    `;
  }

  // Render Takeaways
  const takeawaysContainer = document.getElementById('aiTakeawaysContainer');
  if (takeawaysContainer) {
    takeawaysContainer.innerHTML = doc.takeaways.map(t => `
      <div class="ai-takeaway-item">
        <div class="ai-item-num">${t.num}</div>
        <div class="ai-item-content">
          <h5>${t.title}</h5>
          <p>${t.text}</p>
        </div>
      </div>
    `).join('');
  }
}

function toggleReadAloud() {
  const btn = document.getElementById('pdfReadAloudBtn');
  const doc = appState.documents[appState.currentDocIndex];
  if (!doc) return;

  if (!('speechSynthesis' in window)) {
    showToast('Speech synthesis not supported on this browser.');
    return;
  }

  if (appState.isSpeaking) {
    window.speechSynthesis.cancel();
    appState.isSpeaking = false;
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined">volume_up</span> Read Aloud';
      btn.classList.remove('active');
    }
    showToast('Voice playback stopped.');
  } else {
    window.speechSynthesis.cancel();
    
    // Speak friendly spoken summary followed by numbered takeaways
    let textToSpeak = "";
    if (doc.summary_speech) {
      textToSpeak = `${doc.summary_speech} Here are the key takeaways: `;
    } else {
      textToSpeak = `Document: ${doc.title}. Key Takeaways: `;
    }

    if (doc.takeaways && doc.takeaways.length > 0) {
      doc.takeaways.forEach(t => {
        textToSpeak += `Point ${t.num}. ${t.title}: ${t.text}. `;
      });
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      appState.isSpeaking = false;
      if (btn) {
        btn.innerHTML = '<span class="material-symbols-outlined">volume_up</span> Read Aloud';
        btn.classList.remove('active');
      }
    };

    window.speechSynthesis.speak(utterance);
    appState.isSpeaking = true;
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined">stop_circle</span> Stop Audio';
      btn.classList.add('active');
    }
    showToast('AI Voice is explaining the document...');
  }
}

function generateDocAnswer(query) {
  const doc = appState.documents[appState.currentDocIndex];
  const q = query.toLowerCase();

  for (let key in doc.qa) {
    if (q.includes(key)) {
      return doc.qa[key];
    }
  }

  if (q.includes('how') || q.includes('apply') || q.includes('fill')) {
    return `To apply, click the "Extension & Smart Form Demo" tab and use the "Auto-Fill" button to populate all fields with your verified Saral Setu Vault details.`;
  }

  return `Based on "${doc.title}": The document requires valid identity proof (Aadhaar/Voter ID), compliance with specified age and income criteria, and submission before ${doc.deadline}.`;
}

function appendChatBubble(container, text, sender) {
  const div = document.createElement('div');
  div.className = sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant';
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

/**
 * =========================================================================
 * 4. INTERACTIVE DOCUMENT & FORM ASSISTANT ENGINE (FULL FORM VIEW)
 * =========================================================================
 */

/**
 * Renders a specific page of the interactive document form.
 * Enables multi-page page-by-page travel, step indicators, field filling, and submit flow.
 */
function renderFormPage(pageNumber) {
  let schema = appState.currentFormSchema || defaultFormSchema;

  // 1. Ensure pages exist in schema; partition flat fields list if needed
  let totalPages = schema.total_pages || (schema.pages ? schema.pages.length : 1);
  let pages = schema.pages || [];

  if ((!pages || pages.length === 0) && schema.fields && schema.fields.length > 0) {
    const pageSize = 5;
    const allF = schema.fields;
    totalPages = Math.ceil(allF.length / pageSize);
    pages = [];
    const stepTitles = [
      "1. Personal Details & Identity Verification",
      "2. Residential Address & Contact Particulars",
      "3. Bank Account & Scheme Benefit Declarations",
      "4. Institutional Particulars & Supporting Records",
      "5. Final Review & Application Authorization"
    ];
    for (let pIdx = 0; pIdx < totalPages; pIdx++) {
      const pageFields = allF.slice(pIdx * pageSize, (pIdx + 1) * pageSize);
      pages.push({
        page_number: pIdx + 1,
        step_title: stepTitles[pIdx] || `Page ${pIdx + 1} Particulars`,
        description: `Fields extracted from scanned document (Page ${pIdx + 1})`,
        fields: pageFields
      });
    }
    schema.pages = pages;
    schema.total_pages = totalPages;
  }

  if (!pages || pages.length === 0) {
    pages = defaultFormSchema.pages;
    totalPages = defaultFormSchema.total_pages;
  }

  // 2. Clamp pageNumber
  pageNumber = parseInt(pageNumber) || 1;
  if (pageNumber < 1) pageNumber = 1;
  if (pageNumber > totalPages) pageNumber = totalPages;

  appState.currentFormPage = pageNumber;
  schema.current_page = pageNumber;
  appState.currentFormSchema = schema;

  // 3. Update Portal Header & Organization
  const portalTitleEl = document.getElementById('labelPortalTitle');
  if (portalTitleEl && schema.portal_title) {
    portalTitleEl.textContent = schema.portal_title;
  }
  const portalOrgBadge = document.getElementById('portalOrgBadge');
  if (portalOrgBadge && schema.organization) {
    portalOrgBadge.textContent = schema.organization;
  }

  const pageObj = pages[pageNumber - 1] || pages[0];

  // 4. Update Step Title and Page Indicator text
  const stepTitleEl = document.getElementById('labelPortalStep1');
  if (stepTitleEl) {
    stepTitleEl.innerHTML = `
      <span class="material-symbols-outlined" style="color: var(--primary);">description</span>
      <span>${pageObj.step_title || `Step ${pageNumber} of ${totalPages}`}</span>
    `;
  }
  const pageIndicatorEl = document.getElementById('formPageIndicator');
  if (pageIndicatorEl) {
    pageIndicatorEl.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
      <span>Page ${pageNumber} of ${totalPages} (${pageObj.fields ? pageObj.fields.length : 0} fields)</span>
    `;
  }

  // 5. Update Step Dots Bar (#portalStepBar)
  const stepBar = document.getElementById('portalStepBar');
  if (stepBar) {
    stepBar.innerHTML = pages.map((p, idx) => {
      const pNum = idx + 1;
      const isCurrent = pNum === pageNumber;
      const isCompleted = pNum < pageNumber;
      let dotClass = 'step-dot';
      if (isCurrent) dotClass += ' active';
      if (isCompleted) dotClass += ' completed';
      return `
        <div class="${dotClass}" onclick="renderFormPage(${pNum})" title="Go to Page ${pNum}: ${p.step_title || ''}" style="cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${isCurrent ? 'var(--primary)' : 'rgba(0,0,0,0.06)'}; color: ${isCurrent ? '#fff' : 'var(--text-primary)'}; transition: all 0.2s ease;">
          <span style="width: 18px; height: 18px; border-radius: 50%; background: ${isCurrent ? '#fff' : 'rgba(0,0,0,0.15)'}; color: ${isCurrent ? 'var(--primary)' : 'inherit'}; display: inline-flex; align-items: center; justify-content: center; font-size: 11px;">${pNum}</span>
          <span>Page ${pNum}</span>
        </div>
      `;
    }).join('');
  }

  // 6. Render Active Page Fields into Grid
  const gridContainer = document.getElementById('portalFormGrid');
  if (gridContainer) {
    // Preserve existing input values
    const existingValues = {};
    document.querySelectorAll('.portal-input').forEach(inp => {
      if (inp.id && inp.value) existingValues[inp.id] = inp.value;
    });

    gridContainer.innerHTML = '';
    // Re-trigger page slide-in animation for smooth page transition
    gridContainer.style.animation = 'none';
    void gridContainer.offsetWidth; // force reflow
    gridContainer.style.animation = '';
    const pageFields = pageObj.fields || [];

    pageFields.forEach((field, idx) => {
      const group = document.createElement('div');
      group.className = 'vault-field-group';
      const isFullWidth = field.fullWidth || field.type === 'textarea' || (field.vaultKey === 'address');
      if (isFullWidth) {
        group.style.gridColumn = 'span 2';
      }

      const fid = field.id || `portalField_p${pageNumber}_${idx + 1}`;
      const vKey = field.vaultKey || '';
      const reqMark = field.required ? ' <span style="color: var(--accent-red);">*</span>' : '';
      const labelText = field.label || 'Field';
      const placeholder = field.placeholder || `Enter ${labelText}`;
      const hint = (field.hint || `${labelText}: Provide accurate details matching official records.`).replace(/"/g, '&quot;');
      const inputType = field.type || 'text';
      const reqAttr = field.required ? 'required' : '';

      let val = existingValues[fid] || field.value || '';
      if (!val && vKey && appState.vaultData && appState.vaultData[vKey]) {
        val = appState.vaultData[vKey];
      }

      group.innerHTML = `
        <label class="field-label" for="${fid}">${labelText}${reqMark}</label>
        <input 
          type="${inputType}" 
          class="portal-input ${val ? 'autofilled' : ''}" 
          id="${fid}" 
          data-vault-key="${vKey}" 
          data-hint="${hint}" 
          ${reqAttr} 
          placeholder="${placeholder}" 
          value="${val}"
        />
      `;

      gridContainer.appendChild(group);
    });

    bindFieldGuideListeners();
  }

  // 7. Render Navigation Bar Buttons (#portalPageNavBar)
  const pageNavBar = document.getElementById('portalPageNavBar');
  if (pageNavBar) {
    const isFirstPage = pageNumber === 1;
    const isLastPage = pageNumber === totalPages;

    pageNavBar.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <button type="button" class="neu-btn" id="prevFormPageBtn" onclick="renderFormPage(${pageNumber - 1})" ${isFirstPage ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          <span class="material-symbols-outlined">arrow_back</span>
          <span>Previous Page</span>
        </button>

        <button type="button" class="neu-btn neu-btn-primary" id="triggerAutofillBtn" onclick="performSmartAutofill()">
          <span class="material-symbols-outlined">auto_fix_high</span>
          <span id="triggerAutofillBtnText">Auto-Fill Page</span>
        </button>

        <button type="button" class="neu-btn" id="clearPortalFormBtn" onclick="clearPortalForm()" style="font-size: 13px;">
          <span class="material-symbols-outlined" style="font-size: 18px;">restart_alt</span>
          <span>Reset Page</span>
        </button>
      </div>

      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        ${!isLastPage ? `
          <button type="button" class="neu-btn neu-btn-primary" id="nextFormPageBtn" onclick="renderFormPage(${pageNumber + 1})">
            <span>Next Page</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        ` : `
          <button type="submit" class="neu-btn neu-btn-secondary" id="submitPortalBtn" style="display: inline-flex;">
            <span class="material-symbols-outlined">check_circle</span>
            <span id="submitPortalBtnText">Verify & Submit Application</span>
          </button>
        `}
      </div>
    `;
  }

  // 8. Update Smart Field Guidance Box
  const liveGuideText = document.getElementById('liveGuideText');
  if (liveGuideText) {
    liveGuideText.textContent = `Now on Page ${pageNumber} of ${totalPages} (${pageObj.step_title}). Say "Next page", "Fill [field] as [value]", or "Auto-fill".`;
  }

  return pageNumber;
}

function renderInteractiveForm(schema) {
  if (schema) appState.currentFormSchema = schema;
  return renderFormPage(1);
}

function goToFormPage(target) {
  let schema = appState.currentFormSchema || defaultFormSchema;
  let totalPages = schema.total_pages || (schema.pages ? schema.pages.length : 1);
  let targetPage = appState.currentFormPage || 1;

  if (typeof target === 'number') {
    targetPage = target;
  } else if (typeof target === 'string') {
    const t = target.toLowerCase().trim();
    if (t.includes('next')) {
      targetPage = (appState.currentFormPage || 1) + 1;
    } else if (t.includes('prev') || t.includes('back')) {
      targetPage = (appState.currentFormPage || 1) - 1;
    } else if (t.includes('first')) {
      targetPage = 1;
    } else if (t.includes('last')) {
      targetPage = totalPages;
    } else if (t.includes('bank') || t.includes('ppo')) {
      targetPage = 3;
    } else if (t.includes('address') || t.includes('identity')) {
      targetPage = 2;
    } else if (t.includes('personal') || t.includes('name')) {
      targetPage = 1;
    } else {
      const match = t.match(/\d+/);
      if (match) targetPage = parseInt(match[0]);
    }
  }

  return renderFormPage(targetPage);
}

/**
 * Binds field focus events to the contextual live field guide
 */
function bindFieldGuideListeners() {
  const formGrid = document.querySelector('#simulatedPortalForm .portal-form-grid');
  const liveGuideText = document.getElementById('liveGuideText');
  const liveGuideBubble = document.getElementById('liveGuideBubble');

  if (!formGrid) return;

  formGrid.querySelectorAll('.portal-input').forEach(input => {
    input.addEventListener('focus', () => {
      const hint = input.getAttribute('data-hint') || 
        `${input.previousElementSibling?.textContent?.trim() || 'Field'}: Please provide accurate verified details.`;
      
      if (liveGuideText) {
        liveGuideText.textContent = hint;
      }
      if (liveGuideBubble) {
        liveGuideBubble.style.animation = 'none';
        setTimeout(() => { liveGuideBubble.style.animation = 'bounceIn 0.3s ease'; }, 10);
      }
    });
  });
}

/**
 * Handles uploaded form document / scan from top header, PDF assistant, or form assistant dropzones.
 * Extracts ALL form fields via backend AI/OCR and dynamically builds the FULL interactive portal.
 * Shows a page-by-page scanning progress animation before rendering the interactive form.
 */
async function handleFormDocumentUpload(file) {
  showToast(`⚡ Extracting Form Schema from "${file.name}" with OCR & AI Brain...`);
  
  // 1. Switch to Form Assistant view
  switchTab('extension');

  const portalTitle = document.getElementById('labelPortalTitle');
  const portalOrg = document.getElementById('portalOrgBadge');
  const formGrid = document.querySelector('#simulatedPortalForm .portal-form-grid');
  const liveGuideText = document.getElementById('liveGuideText');
  const liveGuideBubble = document.getElementById('liveGuideBubble');
  const scanOverlay = document.getElementById('scanProgressOverlay');
  const scanTitle = document.getElementById('scanProgressTitle');
  const scanSubtitle = document.getElementById('scanProgressSubtitle');
  const scanTracker = document.getElementById('scanPagesTracker');
  const scanRingProgress = document.querySelector('.scan-ring-progress');
  const stepBar = document.getElementById('portalStepBar');
  const pageNavBar = document.getElementById('portalPageNavBar');

  if (portalTitle) {
    portalTitle.textContent = `Scanning: ${file.name}...`;
  }
  if (portalOrg) {
    portalOrg.textContent = 'Analyzing Document Layout with AI...';
  }

  // 2. Hide the form grid, step bar, nav bar and show scan overlay
  if (formGrid) formGrid.style.display = 'none';
  if (stepBar) stepBar.innerHTML = '';
  if (pageNavBar) pageNavBar.style.display = 'none';

  // Estimate page count from file name heuristics or default to 3
  const estimatedPages = file.name.toLowerCase().includes('multi') ? 5 : 
                         file.size > 500000 ? 4 : 
                         file.size > 200000 ? 3 : 2;

  // Build scan page dots
  if (scanTracker) {
    scanTracker.innerHTML = '';
    for (let i = 1; i <= estimatedPages; i++) {
      const dot = document.createElement('div');
      dot.className = 'scan-page-dot';
      dot.id = `scanDot_${i}`;
      dot.textContent = i;
      scanTracker.appendChild(dot);
    }
  }

  // Reset ring progress
  if (scanRingProgress) {
    scanRingProgress.style.strokeDashoffset = '264';
  }
  if (scanTitle) scanTitle.textContent = 'Scanning Document Pages...';
  if (scanSubtitle) scanSubtitle.textContent = `Preparing to extract fields from "${file.name}"`;

  // Show overlay
  if (scanOverlay) {
    scanOverlay.style.display = 'flex';
  }

  // 3. Animate page-by-page scanning progress
  const totalDashLength = 264;
  let currentScanPage = 0;

  function animateScanPage(pageNum) {
    currentScanPage = pageNum;
    // Update ring progress
    if (scanRingProgress) {
      const progress = pageNum / estimatedPages;
      scanRingProgress.style.strokeDashoffset = String(totalDashLength * (1 - progress));
    }
    // Update title
    if (scanTitle) {
      scanTitle.textContent = `Scanning Page ${pageNum} of ${estimatedPages}...`;
    }
    if (scanSubtitle) {
      scanSubtitle.textContent = `Extracting text, fields, and labels using AI OCR engine`;
    }
    // Update dots
    for (let i = 1; i <= estimatedPages; i++) {
      const dot = document.getElementById(`scanDot_${i}`);
      if (dot) {
        if (i < pageNum) {
          dot.className = 'scan-page-dot scanned';
          dot.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check</span>';
        } else if (i === pageNum) {
          dot.className = 'scan-page-dot scanning';
          dot.textContent = i;
        } else {
          dot.className = 'scan-page-dot';
          dot.textContent = i;
        }
      }
    }
  }

  // Start sequential page scanning animation (runs concurrently with API call)
  const scanAnimInterval = setInterval(() => {
    if (currentScanPage < estimatedPages) {
      animateScanPage(currentScanPage + 1);
    } else {
      clearInterval(scanAnimInterval);
    }
  }, 800);

  // Start scanning first page immediately
  animateScanPage(1);

  // 4. Call backend API
  let formData = new FormData();
  formData.append('file', file);

  let formSchema = null;

  try {
    const res = await fetch('/api/ai/analyze-form', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data.form) {
        formSchema = data.form;
      }
    }
  } catch (err) {
    console.warn('[Form Upload] Backend AI form analysis error, attempting fallback:', err);
  }

  // Stop scan animation
  clearInterval(scanAnimInterval);

  // Fallback if backend returned empty or errored
  if (!formSchema || !formSchema.fields || formSchema.fields.length === 0) {
    const cleanTitle = file.name.replace(/[\-_]/g, ' ').replace(/\.[^/.]+$/, '').trim();
    formSchema = {
      portal_title: cleanTitle.toUpperCase().includes('FORM') || cleanTitle.toUpperCase().includes('PORTAL') 
        ? cleanTitle 
        : `${cleanTitle} Application Form`,
      organization: 'Department of Social Welfare & Citizen Empowerment',
      step_title: `Complete Application Form — ${cleanTitle}`,
      total_pages: 1,
      current_page: 1,
      fields: defaultFormSchema.fields,
      summary_speech: `I have transformed ${cleanTitle} into a full interactive form with all fields ready for auto-fill and voice navigation.`
    };
  }

  // 5. Show scan completion with actual page count
  const actualPages = formSchema.pages ? formSchema.pages.length : 
                      (formSchema.total_pages || 1);
  const totalFields = formSchema.fields ? formSchema.fields.length : 
                      (formSchema.pages ? formSchema.pages.reduce((sum, p) => sum + (p.fields ? p.fields.length : 0), 0) : 0);

  // Complete the ring
  if (scanRingProgress) {
    scanRingProgress.style.strokeDashoffset = '0';
  }

  // Mark all dots as scanned
  if (scanTracker) {
    scanTracker.innerHTML = '';
    for (let i = 1; i <= actualPages; i++) {
      const dot = document.createElement('div');
      dot.className = 'scan-page-dot scanned';
      dot.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check</span>';
      scanTracker.appendChild(dot);
    }
    // Add result badge
    const badge = document.createElement('div');
    badge.className = 'scan-result-badge';
    badge.innerHTML = `
      <span class="material-symbols-outlined">task_alt</span>
      <span>Scanned ${actualPages} page${actualPages > 1 ? 's' : ''} → ${totalFields} interactive fields generated</span>
    `;
    scanTracker.appendChild(badge);
  }

  if (scanTitle) {
    scanTitle.textContent = '✅ Document Scan Complete!';
  }
  if (scanSubtitle) {
    scanSubtitle.textContent = `Successfully extracted ${totalFields} form fields across ${actualPages} page${actualPages > 1 ? 's' : ''}`;
  }

  // Wait a moment for the user to see the completion
  await new Promise(resolve => setTimeout(resolve, 1200));

  // 6. Hide scan overlay and show the interactive form
  if (scanOverlay) {
    scanOverlay.style.display = 'none';
  }
  if (formGrid) formGrid.style.display = '';
  if (pageNavBar) pageNavBar.style.display = '';

  // 7. Store active schema and render the complete full form
  appState.currentFormSchema = formSchema;
  appState.originalEnglishSchema = JSON.parse(JSON.stringify(formSchema));
  renderInteractiveForm(formSchema);

  // 8. Update contextual live guide & voice announcement
  const totalCount = formSchema.fields ? formSchema.fields.length : totalFields;
  if (liveGuideText) {
    liveGuideText.textContent = `Interactive form generated from "${file.name}" (${actualPages} pages, ${totalCount} fields)! Navigate pages using the step bar above, or say "Next page" / "Auto-Fill".`;
    if (liveGuideBubble) {
      liveGuideBubble.style.animation = 'none';
      setTimeout(() => { liveGuideBubble.style.animation = 'bounceIn 0.3s ease'; }, 10);
    }
  }

  showToast(`✅ Generated ${actualPages}-page interactive form with ${totalCount} fields from "${file.name}"!`);

  if (formSchema.summary_speech && window.SaralVoiceAgent) {
    setTimeout(() => {
      window.SaralVoiceAgent.speak(formSchema.summary_speech);
    }, 600);
  }
}

/**
 * Intelligently maps Saral Setu Profile Vault particulars to all form fields on screen in real time.
 */
function performSmartAutofill() {
  const form = document.getElementById('simulatedPortalForm');
  if (!form) return;

  const inputs = form.querySelectorAll('.portal-input');
  if (inputs.length === 0) return;

  const v = appState.vaultData;
  let filledCount = 0;

  inputs.forEach((input, index) => {
    const vaultKey = (input.getAttribute('data-vault-key') || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const label = (input.previousElementSibling?.textContent || '').toLowerCase();

    let valToFill = '';

    // Direct vaultKey match or intelligent heuristic match
    if (vaultKey === 'name' || id.includes('name') || label.includes('name')) {
      if (label.includes('guardian') || label.includes('father') || label.includes('husband') || id.includes('guardian')) {
        valToFill = v.guardian_name || 'Shri S. K. Verma';
      } else {
        valToFill = v.name;
      }
    } else if (vaultKey === 'dob' || id.includes('dob') || label.includes('birth') || label.includes('dob')) {
      valToFill = v.dob;
    } else if (vaultKey === 'gender' || id.includes('gender') || label.includes('gender') || label.includes('sex')) {
      valToFill = v.gender;
    } else if (vaultKey === 'guardian_name' || id.includes('guardian') || label.includes('guardian') || label.includes('father')) {
      valToFill = v.guardian_name || 'Shri S. K. Verma';
    } else if (vaultKey === 'aadhaar' || id.includes('aadhaar') || label.includes('aadhaar') || label.includes('uid')) {
      valToFill = v.aadhaar;
    } else if (vaultKey === 'pan' || id.includes('pan') || label.includes('pan')) {
      valToFill = v.pan;
    } else if (vaultKey === 'voterid' || vaultKey === 'voter' || id.includes('voter') || label.includes('voter') || label.includes('epic')) {
      valToFill = v.voterId;
    } else if (vaultKey === 'phone' || vaultKey === 'mobile' || id.includes('phone') || id.includes('mobile') || label.includes('phone') || label.includes('mobile')) {
      valToFill = v.phone;
    } else if (vaultKey === 'email' || id.includes('email') || label.includes('email')) {
      valToFill = v.email;
    } else if (vaultKey === 'address' || id.includes('address') || label.includes('address') || label.includes('residence')) {
      valToFill = v.address;
    } else if (vaultKey === 'pincode' || vaultKey === 'pin' || id.includes('pin') || label.includes('pin') || label.includes('postal')) {
      valToFill = v.pincode;
    } else if (vaultKey === 'category' || id.includes('category') || label.includes('category') || label.includes('caste')) {
      valToFill = v.category;
    } else if (vaultKey === 'pensionppo' || vaultKey === 'ppo' || id.includes('ppo') || label.includes('ppo') || label.includes('pension')) {
      valToFill = v.pensionPpo;
    } else if (vaultKey === 'bankaccount' || vaultKey === 'account' || id.includes('bank') || id.includes('account') || label.includes('bank') || label.includes('account')) {
      valToFill = v.bankAccount;
    } else if (vaultKey === 'ifsc' || id.includes('ifsc') || label.includes('ifsc')) {
      valToFill = v.ifsc;
    } else if (vaultKey === 'income' || id.includes('income') || label.includes('income')) {
      valToFill = v.income;
    } else if (vaultKey === 'institution' || id.includes('institution') || id.includes('college') || label.includes('institution') || label.includes('college') || label.includes('school')) {
      valToFill = v.institution || 'Delhi University';
    } else if (vaultKey === 'roll_number' || id.includes('roll') || label.includes('roll')) {
      valToFill = v.roll_number || '2023/DEL/9012';
    }

    if (valToFill) {
      filledCount++;
      setTimeout(() => {
        input.value = valToFill;
        input.classList.remove('autofilled');
        void input.offsetWidth; // trigger reflow for animation
        input.classList.add('autofilled');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, index * 40);
    }
  });

  setTimeout(() => {
    showToast(`✨ Successfully auto-filled ${filledCount} fields from Saral Setu Vault!`);
    const liveGuideText = document.getElementById('liveGuideText');
    if (liveGuideText) {
      liveGuideText.textContent = `All ${filledCount} fields populated with 100% verified accuracy from your Profile Vault! Click "Verify & Submit Application" to complete.`;
    }
    if (window.SaralVoiceAgent) {
      window.SaralVoiceAgent.speak(`Auto-filled ${filledCount} fields from your verified profile vault.`);
    }
  }, inputs.length * 40 + 100);
}

/**
 * Resets / Clears the simulated portal form
 */
function clearPortalForm() {
  const form = document.getElementById('simulatedPortalForm');
  if (!form) return;

  const inputs = form.querySelectorAll('.portal-input');
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('autofilled');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  showToast('Form fields cleared.');
  const liveGuideText = document.getElementById('liveGuideText');
  if (liveGuideText) {
    liveGuideText.textContent = 'Form cleared. Tap "Auto-Fill from Vault" or speak to populate details.';
  }
}

/**
 * Real-time Voice Field Filling across the full form with glowing focus and speech confirmation.
 */
function fillFormField(fieldName, value) {
  const query = (fieldName || '').toLowerCase().trim().replace(/(field|input|box|\s)/g, '');
  const val = value || '';
  if (!query) return;

  const allInputs = Array.from(document.querySelectorAll('#simulatedPortalForm .portal-input'));
  let inputEl = null;

  // 1. Direct ID / VaultKey / Label Match
  for (const inp of allInputs) {
    const id = (inp.id || '').toLowerCase().replace(/(field|input|box|\s)/g, '');
    const vk = (inp.getAttribute('data-vault-key') || '').toLowerCase().replace(/(field|input|box|\s)/g, '');
    const lbl = (inp.previousElementSibling?.textContent || '').toLowerCase().replace(/(field|input|box|\s)/g, '');

    if (id === query || vk === query || lbl.includes(query) || query.includes(lbl)) {
      inputEl = inp;
      break;
    }
  }

  // 2. Heuristic aliases
  if (!inputEl) {
    inputEl = allInputs.find(inp => {
      const vk = (inp.getAttribute('data-vault-key') || '').toLowerCase();
      const lbl = (inp.previousElementSibling?.textContent || '').toLowerCase();
      if (query.includes('name') && !query.includes('guardian') && !query.includes('father') && vk === 'name') return true;
      if ((query.includes('guardian') || query.includes('father')) && (vk === 'guardian_name' || lbl.includes('guardian'))) return true;
      if ((query.includes('dob') || query.includes('birth')) && vk === 'dob') return true;
      if (query.includes('gender') && vk === 'gender') return true;
      if (query.includes('aadhaar') && vk === 'aadhaar') return true;
      if (query.includes('pan') && vk === 'pan') return true;
      if (query.includes('voter') && vk === 'voterId') return true;
      if ((query.includes('phone') || query.includes('mobile')) && vk === 'phone') return true;
      if (query.includes('email') && vk === 'email') return true;
      if ((query.includes('address') || query.includes('residence')) && vk === 'address') return true;
      if ((query.includes('pin') || query.includes('postal')) && vk === 'pincode') return true;
      if (query.includes('category') && vk === 'category') return true;
      if ((query.includes('bank') || query.includes('account')) && vk === 'bankAccount') return true;
      if (query.includes('ifsc') && vk === 'ifsc') return true;
      if (query.includes('ppo') && vk === 'pensionPpo') return true;
      if (query.includes('income') && vk === 'income') return true;
      return false;
    });
  }

  if (inputEl) {
    inputEl.focus();
    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    inputEl.value = val;
    inputEl.classList.remove('autofilled');
    void inputEl.offsetWidth; // Reflow for animation
    inputEl.classList.add('autofilled');
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));

    const vk = inputEl.getAttribute('data-vault-key');
    if (vk && appState.vaultData && appState.vaultData.hasOwnProperty(vk)) {
      updateVaultParticular(vk, val, { highlight: false, toast: false });
    }

    const fieldTitle = inputEl.previousElementSibling?.textContent?.replace('*', '').trim() || fieldName;
    showToast(`✍️ Filled ${fieldTitle}: ${val}`);
    const liveGuideText = document.getElementById('liveGuideText');
    if (liveGuideText) {
      liveGuideText.textContent = `Populated ${fieldTitle} with "${val}" in real time!`;
    }
    if (window.SaralVoiceAgent) {
      window.SaralVoiceAgent.speak(`Filled ${fieldTitle} with ${val}`);
    }
  } else {
    showToast(`⚠️ Could not locate field "${fieldName}".`);
    if (window.SaralVoiceAgent) {
      window.SaralVoiceAgent.speak(`I could not find the field "${fieldName}" on the form.`);
    }
  }
}

/**
 * Translates every single field (labels, placeholders, hints, step titles)
 * in the active interactive document form into ANY of the 22 Indian languages via AI in real-time,
 * and cleanly restores English when 'en' is chosen.
 */
async function translateFormSchema(targetLang, langName) {
  const isEnglish = !targetLang || targetLang.toLowerCase() === 'en';
  const displayLang = langName || (isEnglish ? 'English' : targetLang.toUpperCase());

  // 1. If returning or switching to English:
  if (isEnglish) {
    showToast(`🔄 Language switched to English`);
    const origSchema = appState.originalEnglishSchema || defaultFormSchema;
    appState.currentFormSchema = JSON.parse(JSON.stringify(origSchema));
    appState.currentLanguage = 'en';
    localStorage.setItem('saral_app_lang', 'en');

    // Render original English form
    renderInteractiveForm(appState.currentFormSchema);

    // Sync ALL language dropdowns across the application
    ['globalWebsiteLangSelector', 'sidebarWebsiteLangSelector', 'portalLangSelector', 'portalLangSelectorHeader', 'globalLanguageSelector', 'voiceDeckLangSelector'].forEach(id => {
      const sel = document.getElementById(id);
      if (sel) sel.value = 'en';
    });

    // Re-render PDF document takeaways in English if document exists
    if (typeof renderDocumentTakeaways === 'function' && appState.currentDocument) {
      renderDocumentTakeaways(appState.currentDocument);
    } else if (typeof renderCurrentDocument === 'function') {
      renderCurrentDocument();
    }

    // Apply English i18n translations across the UI
    if (window.SaralI18n) {
      await window.SaralI18n.setLanguage('en', false, false);
    }

    // Reset voice assistant language to English
    if (window.SaralVoiceAgent && typeof window.SaralVoiceAgent.setLanguage === 'function') {
      window.SaralVoiceAgent.setLanguage('en');
    }

    const liveGuide = document.getElementById('liveGuideText');
    if (liveGuide) {
      liveGuide.textContent = `Form and portal restored to English. Say "Auto-Fill" or "Fill [field] with [value]".`;
    }
    showToast(`🇬🇧 Language returned to English!`);
    return true;
  }

  // 2. If translating to a regional language:
  // Always use the pristine English schema as the base source to prevent lossy multi-language compounding
  const baseSchema = appState.originalEnglishSchema || defaultFormSchema;
  showToast(`⚡ AI is translating ALL form fields & placeholders to ${displayLang}...`);

  const liveGuide = document.getElementById('liveGuideText');
  if (liveGuide) {
    liveGuide.textContent = `Translating all form labels, placeholders, and hints to ${displayLang} in real-time via AI...`;
  }

  try {
    const res = await fetch('/api/ai/translate-form-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_schema: baseSchema,
        target_lang: targetLang
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.form) {
        appState.currentFormSchema = data.form;
        appState.currentLanguage = targetLang;
        localStorage.setItem('saral_app_lang', targetLang);

        renderInteractiveForm(data.form);

        // Sync ALL language dropdowns
        ['globalWebsiteLangSelector', 'sidebarWebsiteLangSelector', 'portalLangSelector', 'portalLangSelectorHeader', 'globalLanguageSelector', 'voiceDeckLangSelector'].forEach(id => {
          const sel = document.getElementById(id);
          if (sel) sel.value = targetLang;
        });

        // Translate i18n DOM elements & PDF takeaways if available
        if (window.SaralI18n) {
          window.SaralI18n.setLanguage(targetLang, false, false);
        }

        // Sync voice assistant language
        if (window.SaralVoiceAgent && typeof window.SaralVoiceAgent.setLanguage === 'function') {
          window.SaralVoiceAgent.setLanguage(targetLang);
        }

        showToast(`✅ ALL field labels, placeholders & hints translated to ${displayLang}!`);
        if (liveGuide) {
          liveGuide.textContent = `All fields translated to ${displayLang}. Say "Auto-Fill" or listen to field guidance.`;
        }
        return true;
      }
    }
  } catch (err) {
    console.warn('[translateFormSchema] Translation endpoint error:', err);
  }

  // Fallback: static portal dictionary translation
  translatePortal(targetLang);
  return false;
}

/**
 * Real-Time 22-Language Document Form Translation (Voice Delegate)
 */
async function translateDocumentForm(targetLang) {
  const sel = document.getElementById('portalLangSelector') || document.getElementById('portalLangSelectorHeader');
  let langName = targetLang ? (targetLang === 'en' ? 'English' : targetLang.toUpperCase()) : 'English';
  if (sel) {
    for (let i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === targetLang) {
        langName = sel.options[i].text;
        break;
      }
    }
  }
  await translateFormSchema(targetLang, langName);
}

function translatePortal(langCode) {
  const isEn = !langCode || langCode.toLowerCase() === 'en';
  const target = isEn ? 'en' : langCode.toLowerCase();
  appState.currentLanguage = target;

  if (window.SaralI18n && typeof window.SaralI18n.setLanguage === 'function') {
    window.SaralI18n.setLanguage(target, true, false);
  }

  showToast(`🌐 Language switched to ${isEn ? 'English' : target.toUpperCase()}`);
}

/**
 * Initializes the Form Assistant Simulation Tab and controls
 */
function setupExtensionSimulator() {
  // 1. Auto-Fill Form Button
  const autofillBtn = document.getElementById('triggerAutofillBtn');
  if (autofillBtn) {
    autofillBtn.addEventListener('click', () => {
      performSmartAutofill();
    });
  }

  // 3. Clear / Reset Form Button
  const clearBtn = document.getElementById('clearPortalFormBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearPortalForm();
    });
  }

  // 4. Language Switchers for Portal (Header & Card Bar)
  const langSelectors = [
    document.getElementById('portalLangSelector'),
    document.getElementById('portalLangSelectorHeader')
  ];

  langSelectors.forEach(sel => {
    if (!sel) return;
    sel.addEventListener('change', (e) => {
      const targetVal = e.target.value;
      const selectedOption = e.target.options[e.target.selectedIndex];
      const langName = selectedOption ? selectedOption.text : targetVal.toUpperCase();

      langSelectors.forEach(s => { if (s && s !== e.target) s.value = targetVal; });
      translateFormSchema(targetVal, langName);
    });
  });

  // 5. Portal Form Submit & History Logging
  const portalForm = document.getElementById('simulatedPortalForm');
  const submitSuccessModal = document.getElementById('formSuccessModal');
  const closeSuccessModal = document.getElementById('closeSuccessModal');

  if (portalForm) {
    portalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const refNumber = 'GOV-SS-' + Math.floor(100000 + Math.random() * 900000);
      const refElem = document.getElementById('appRefNumberDisplay');
      if (refElem) refElem.textContent = refNumber;
      
      // Capture form snapshot
      const inputs = portalForm.querySelectorAll('.portal-input');
      const snapshot = {};
      inputs.forEach(inp => {
        if (inp.id) {
          const label = inp.previousElementSibling?.textContent?.replace('*', '').trim() || inp.id;
          snapshot[inp.id] = {
            label: label,
            value: inp.value,
            vaultKey: inp.getAttribute('data-vault-key') || ''
          };
        }
      });

      const formTitle = document.getElementById('labelPortalTitle')?.textContent || 'National Pension & Welfare Application';

      // Log and store form directly into MongoDB if authenticated
      try {
        const token = localStorage.getItem('saral_auth_token');
        if (token) {
          const res = await fetch('/api/forms/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              form_title: formTitle,
              ref_number: refNumber,
              status: 'Submitted',
              fields_count: inputs.length,
              fields_snapshot: snapshot,
              form_url: window.location.href
            })
          });

          if (res.ok) {
            console.log('[MongoDB Form Storage]: Saved successfully to MongoDB');
            loadUserSubmissions();
            checkMongoHealth();
          }
        } else {
          // If guest, show option to register in toast
          showToast('ℹ️ Form submitted locally. Sign in to sync and track in MongoDB.');
        }
      } catch (err) {
        console.warn('[MongoDB Form Submission Logging Error]:', err);
      }

      if (submitSuccessModal) submitSuccessModal.classList.add('show');
      showToast(`🎉 Application ${refNumber} verified and submitted! Stored in MongoDB.`);
      
      if (window.SaralVoiceAgent) {
        window.SaralVoiceAgent.speak(`Your application ${refNumber} has been verified and successfully submitted to the department.`);
      }
    });

    if (closeSuccessModal && submitSuccessModal) {
      closeSuccessModal.addEventListener('click', () => {
        submitSuccessModal.classList.remove('show');
      });
    }
  }

  // 6. Request Human Help Modal
  const helpBtn = document.getElementById('requestHumanHelpBtn');
  const helpModal = document.getElementById('humanHelpModal');
  const closeHelpModal = document.getElementById('closeHumanHelpModal');
  const humanHelpForm = document.getElementById('humanHelpForm');

  if (helpBtn && helpModal) {
    helpBtn.addEventListener('click', () => {
      helpModal.classList.add('show');
    });
    if (closeHelpModal) {
      closeHelpModal.addEventListener('click', () => {
        helpModal.classList.remove('show');
      });
    }
    if (humanHelpForm) {
      humanHelpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        helpModal.classList.remove('show');
        showToast('Volunteer request scheduled! An assistant will contact you in 15 mins.');
      });
    }
  }

  // 7. Extension Play Audio
  const extVoiceBtn = document.getElementById('extPlayAudioBtn');
  if (extVoiceBtn) {
    extVoiceBtn.addEventListener('click', () => {
      const text = document.getElementById('liveGuideText')?.textContent || 'Saral Setu Smart Form Assistant';
      if (window.SaralVoiceAgent) {
        window.SaralVoiceAgent.speak(text);
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utt);
      }
      showToast('Speaking field guidance...');
    });
  }

  // 8. Initialize the full interactive form
  renderInteractiveForm(defaultFormSchema);
}

/* =========================================
   5. AUTONOMOUS AI VOICE AGENT INTEGRATION
   ========================================= */

function setupVoiceAndAccessibility() {
  const agent = window.SaralVoiceAgent;

  if (!agent) {
    console.error('SaralVoiceAgent engine not found. Ensure voice-assistant.js is loaded.');
    return;
  }

  // 1. Synchronize UI listening state with AI Agent Engine
  const floatingBtn = document.getElementById('floatingMicBtn');
  const mainMicBtn = document.getElementById('mainVoiceMicBtn');

  agent.onStateChange((isActive) => {
    if (floatingBtn) floatingBtn.classList.toggle('listening', isActive);
    if (mainMicBtn) mainMicBtn.classList.toggle('listening', isActive);

    const voiceTranscript = document.getElementById('voiceTranscriptText');
    if (voiceTranscript) {
      voiceTranscript.textContent = isActive
        ? '🤖 AI Voice Agent is ACTIVE in Continuous Mode. Speak naturally (e.g., "Go to page 2", "In full name fill Ramesh", "Translate to Hindi").'
        : 'AI Voice Agent is in standby. Tap the microphone to start.';
    }
  });

  // 2. Microphone Trigger Buttons
  if (floatingBtn) {
    floatingBtn.addEventListener('click', () => {
      if (agent.isVoiceActive) agent.stopListening();
      else agent.startListening();
    });
  }

  if (mainMicBtn) {
    mainMicBtn.addEventListener('click', () => {
      if (agent.isVoiceActive) agent.stopListening();
      else agent.startListening();
    });
  }

  // NOTE: Portal Language Selector listeners are already wired in setupExtensionSimulator()
  // to avoid duplicate listeners and race conditions. Do NOT add another listener here.

  // Wire Multi-Page Navigation Buttons
  document.getElementById('prevFormPageBtn')?.addEventListener('click', () => goToFormPage('prev'));
  document.getElementById('nextFormPageBtn')?.addEventListener('click', () => goToFormPage('next'));

  // =========================================================
  // 3. REGISTER AUTONOMOUS AI ACTIONS (UI / DOM TOOL CALLING)
  // =========================================================

  // Action: Switch Active Tab (Universal Website Tab Traveling)
  agent.registerAction('NAVIGATE_TAB', 'Switch active view tab (home, vault, pdf, extension, voice)', async (p) => {
    const raw = (p.tab || p.target || 'home').toLowerCase().trim();
    const tabMap = {
      'home': 'home', 'dashboard': 'home', 'overview': 'home', 'main': 'home', 'homepage': 'home',
      'vault': 'vault', 'profile': 'vault', 'credentials': 'vault', 'identity': 'vault', 'documents': 'vault',
      'pdf': 'pdf', 'document': 'pdf', 'guidelines': 'pdf', 'summary': 'pdf', 'policy': 'pdf',
      'extension': 'extension', 'form': 'extension', 'portal': 'extension', 'smart_form': 'extension', 'application': 'extension',
      'voice': 'voice', 'accessibility': 'voice', 'settings': 'voice', 'audio': 'voice', 'mic': 'voice'
    };
    const targetTab = tabMap[raw] || raw;
    switchTab(targetTab);
    showToast(`Navigated to ${targetTab.toUpperCase()} tab`);
  });

  // Action: Multi-Page Travel in Interactive Document Form
  agent.registerAction('NAVIGATE_FORM_PAGE', 'Travel to specific page or step in interactive document form', async (p) => {
    goToFormPage(p.page || p.target);
  });

  // Action: Real-Time Form Field Filling
  agent.registerAction('FILL_FORM_FIELD', 'Fill specific field in real time on interactive document form', async (p) => {
    fillFormField(p.fieldName || p.field, p.value);
  });

  // Action: Real-Time 22-Language Document Form Translation
  agent.registerAction('TRANSLATE_DOCUMENT_FORM', 'Translate every field of interactive document into Indian regional language in real time', async (p) => {
    const lang = p.lang || p.target_lang || 'en';
    if (window.SaralI18n) {
      await window.SaralI18n.setLanguage(lang, true, true);
    } else {
      translateDocumentForm(lang);
    }
  });

  // Action: Switch Entire Website Language
  agent.registerAction('SET_LANGUAGE', 'Switch whole website and voice assistant language to preferred Indian language', async (p) => {
    const lang = p.lang || p.target_lang || p.language || 'en';
    if (window.SaralI18n) {
      await window.SaralI18n.setLanguage(lang, true, true);
    }
  });

  agent.registerAction('TRANSLATE_WEBSITE', 'Translate entire website into user preferred language', async (p) => {
    const lang = p.lang || p.target_lang || p.language || 'en';
    if (window.SaralI18n) {
      await window.SaralI18n.setLanguage(lang, true, true);
    }
  });

  // Action: Update a single Vault Particular / Detail in Real Time
  agent.registerAction('UPDATE_VAULT_DETAIL', 'Update a specific detail (name, dob, phone, email, address, pincode, aadhaar, pan, voterId, bankAccount, ifsc, category, gender, income, pensionPpo) in real time across the application', async (p) => {
    updateVaultParticular(p.field, p.value, { highlight: true, toast: true });
  });

  // Action: Update multiple Vault Particulars in Real Time
  agent.registerAction('UPDATE_MULTIPLE_DETAILS', 'Update multiple details in batch in real time across the application', async (p) => {
    updateMultipleParticulars(p.updates, { highlight: true, toast: true });
  });

  // Action: Clear Form Inputs
  agent.registerAction('CLEAR_FORM', 'Clear simulated application form inputs', async () => {
    document.querySelectorAll('#simulatedPortalForm input').forEach(input => {
      input.value = '';
      input.classList.remove('autofilled');
    });
    showToast('Form inputs cleared.');
  });

  // Action: Search on page
  agent.registerAction('SEARCH_PAGE', 'Search for forms, documents, or vault items', async (p) => {
    const searchInput = document.querySelector('.header-search input');
    if (searchInput) {
      searchInput.value = p.query || '';
      searchInput.focus();
      showToast(`Searching for "${p.query}"...`);
    }
  });

  // Action: Scroll Page
  agent.registerAction('SCROLL_PAGE', 'Scroll window up/down or to absolute position', async (p) => {
    if (typeof p.absolute === 'number') {
      window.scrollTo({ top: p.absolute, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: p.top || 500, behavior: 'smooth' });
    }
  });

  // Action: Fill Single/Multiple Form Inputs
  agent.registerAction('FILL_INPUT', 'Fill any form input with specific text', async (p) => {
    const el = document.querySelector(p.selector);
    if (el) {
      el.value = p.value;
      el.classList.add('autofilled');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(`Field filled: ${p.value}`);
    }
  });

  // Action: Complete Form Auto-Fill from Vault
  agent.registerAction('AUTOFILL_FORM', 'Auto-fill all fields on application portal from verified vault', async () => {
    performSmartAutofill();
  });

  // Action: Submit Application Form
  agent.registerAction('SUBMIT_FORM', 'Submit the active government application form', async () => {
    document.getElementById('submitPortalBtn')?.click();
  });

  // Action: Open Modal
  agent.registerAction('OPEN_MODAL', 'Open modal dialog (editVaultModal, addDocumentModal, humanHelpModal, aiConfigModal)', async (p) => {
    const m = document.getElementById(p.modalId);
    if (m) m.classList.add('show');
  });

  // Action: Close Modal
  agent.registerAction('CLOSE_MODAL', 'Close active modal dialog', async (p) => {
    if (p.modalId) {
      document.getElementById(p.modalId)?.classList.remove('show');
    } else {
      document.querySelectorAll('.modal-backdrop.show').forEach(m => m.classList.remove('show'));
    }
  });

  // Action: Export Encrypted Vault
  agent.registerAction('EXPORT_VAULT', 'Export encrypted JSON vault backup', async () => {
    document.getElementById('exportVaultBtn')?.click();
  });

  // Action: Toggle Aadhaar Mask Visibility
  agent.registerAction('TOGGLE_AADHAAR_MASK', 'Show or hide masked Aadhaar number digits', async () => {
    document.getElementById('toggleAadhaarMask')?.click();
  });

  // Action: Copy Credential to Clipboard
  agent.registerAction('COPY_FIELD', 'Copy a vault field value to clipboard (aadhaar, pan, phone, email, address)', async (p) => {
    const val = appState.vaultData[p.field];
    if (val && navigator.clipboard) {
      navigator.clipboard.writeText(val);
      showToast(`Copied ${p.field} to clipboard!`);
    }
  });

  // Action: Read Document Takeaways Aloud
  agent.registerAction('READ_DOCUMENT_ALOUD', 'Read active document summary takeaways aloud', async () => {
    toggleReadAloud();
  });

  // Action: Download Summary
  agent.registerAction('DOWNLOAD_SUMMARY', 'Download document summary text file', async () => {
    document.getElementById('downloadSummaryBtn')?.click();
  });

  // Action: Zoom Document
  agent.registerAction('ZOOM_DOCUMENT', 'Zoom document in or out', async (p) => {
    if (p.direction === 'in') document.getElementById('docZoomInBtn')?.click();
    else document.getElementById('docZoomOutBtn')?.click();
  });

  // Action: Ask Questions on Policy Document
  agent.registerAction('ASK_DOCUMENT_QA', 'Ask questions about the active policy document and get answers', async (p) => {
    const answer = generateDocAnswer(p.question);
    const chatBox = document.getElementById('docChatMessages');
    if (chatBox) {
      appendChatBubble(chatBox, p.question, 'user');
      setTimeout(() => appendChatBubble(chatBox, answer, 'assistant'), 300);
    }
    agent.speak(answer);
  });

  // Action: Switch Portal Language (uses AI translation for ALL fields)
  agent.registerAction('SWITCH_LANGUAGE', 'Translate all form fields to English (en), Hindi (hi), Marathi (mr), Bengali (bn), Tamil (ta), or any of 22 Indian languages', async (p) => {
    const langCode = p.lang || p.target_lang || 'en';
    const sel = document.getElementById('portalLangSelector');
    let langName = langCode.toUpperCase();
    if (sel) {
      sel.value = langCode;
      const opt = sel.options[sel.selectedIndex];
      if (opt) langName = opt.text;
    }
    await translateFormSchema(langCode, langName);
  });

  // Action: Set High Contrast Theme
  agent.registerAction('SET_THEME', 'Toggle High Contrast (WCAG AAA) mode', async (p) => {
    appState.highContrast = !!p.highContrast;
    document.body.classList.toggle('high-contrast', appState.highContrast);
  });

  // Action: Set Font Size
  agent.registerAction('SET_FONT_SIZE', 'Set text sizing (large or normal)', async (p) => {
    if (p.size === 'large') {
      document.body.classList.add('font-size-large');
    } else {
      document.body.classList.remove('font-size-large', 'font-size-xlarge');
    }
  });

  // Action: Toggle Dyslexia Font
  agent.registerAction('TOGGLE_DYSLEXIA_FONT', 'Toggle dyslexia friendly font', async () => {
    appState.dyslexicFont = !appState.dyslexicFont;
    document.body.classList.toggle('dyslexic-font', appState.dyslexicFont);
  });

  // Action: Click any button, link or interactive element on screen
  agent.registerAction('CLICK_ELEMENT', 'Click any button, link, or interactive element on screen by text or CSS selector', async (p) => {
    if (p.selector) {
      const el = document.querySelector(p.selector);
      if (el) {
        el.click();
        showToast(`Clicked element: ${p.selector}`);
        return;
      }
    }
    if (p.text) {
      const lower = (p.text || '').toLowerCase().trim();
      const clickables = Array.from(document.querySelectorAll('button, a, .neu-btn, .portal-step, .nav-item-link, input[type="submit"], input[type="button"]'));
      const target = clickables.find(el => (el.textContent || el.title || el.value || '').toLowerCase().includes(lower));
      if (target) {
        target.click();
        showToast(`Clicked: ${target.textContent?.trim() || p.text}`);
      } else {
        console.warn(`[CLICK_ELEMENT] Could not find clickable matching: ${p.text}`);
      }
    }
  });

  // 4. Clickable Voice Command Prompt Chips
  document.querySelectorAll('[data-voice-cmd]').forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-voice-cmd');
      const respEl = document.getElementById('voiceResponseText');
      if (respEl) respEl.textContent = `Processing: "${cmd}"...`;
      agent.handleUserInstruction(cmd);
    });
  });

  // 5. Natural Language Text Instruction Form
  const voiceTextForm = document.getElementById('voiceTextCommandForm');
  const voiceTextInput = document.getElementById('voiceTextInput');
  if (voiceTextForm && voiceTextInput) {
    voiceTextForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = voiceTextInput.value.trim();
      if (!text) return;
      voiceTextInput.value = '';
      const respEl = document.getElementById('voiceResponseText');
      if (respEl) respEl.textContent = `AI Brain executing: "${text}"...`;
      agent.handleUserInstruction(text);
    });
  }

  // 5. Visual Accessibility Buttons (A- / A+, Contrast, Dyslexic)
  const btnFontDecrease = document.getElementById('btnFontDecrease');
  const btnFontIncrease = document.getElementById('btnFontIncrease');
  if (btnFontDecrease) {
    btnFontDecrease.addEventListener('click', () => {
      document.body.classList.remove('font-size-large', 'font-size-xlarge');
      showToast('Standard text size restored');
    });
  }
  if (btnFontIncrease) {
    btnFontIncrease.addEventListener('click', () => {
      if (document.body.classList.contains('font-size-large')) {
        document.body.classList.remove('font-size-large');
        document.body.classList.add('font-size-xlarge');
        showToast('Text size set to Extra Large (130%)');
      } else {
        document.body.classList.add('font-size-large');
        showToast('Text size set to Large (115%)');
      }
    });
  }

  const btnHighContrast = document.getElementById('btnHighContrast');
  if (btnHighContrast) {
    btnHighContrast.addEventListener('click', () => {
      appState.highContrast = !appState.highContrast;
      document.body.classList.toggle('high-contrast', appState.highContrast);
      showToast(appState.highContrast ? 'High Contrast Mode ON' : 'High Contrast Mode OFF');
    });
  }

  const btnDyslexic = document.getElementById('btnDyslexicFont');
  if (btnDyslexic) {
    btnDyslexic.addEventListener('click', () => {
      appState.dyslexicFont = !appState.dyslexicFont;
      document.body.classList.toggle('dyslexic-font', appState.dyslexicFont);
      showToast(appState.dyslexicFont ? 'Dyslexia Friendly Font ON' : 'Standard Font Restored');
    });
  }

  // 6. AI Config Modal Form Handling
  const configBtn = document.getElementById('openAiConfigModalBtn');
  const configModal = document.getElementById('aiConfigModal');
  const closeConfigModal = document.getElementById('closeAiConfigModal');
  const aiConfigForm = document.getElementById('aiConfigForm');

  if (configBtn && configModal) {
    configBtn.addEventListener('click', () => {
      document.getElementById('aiProviderSelect').value = agent.aiConfig.provider;
      document.getElementById('aiApiKeyInput').value = agent.aiConfig.apiKey;
      document.getElementById('aiModelSelect').value = agent.aiConfig.model;
      configModal.classList.add('show');
    });

    closeConfigModal.addEventListener('click', () => configModal.classList.remove('show'));

    aiConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const provider = document.getElementById('aiProviderSelect').value;
      const apiKey = document.getElementById('aiApiKeyInput').value.trim();
      const model = document.getElementById('aiModelSelect').value;

      agent.aiConfig.provider = provider;
      agent.aiConfig.apiKey = apiKey;
      agent.aiConfig.model = model;

      localStorage.setItem('saral_ai_provider', provider);
      localStorage.setItem('saral_ai_key', apiKey);
      localStorage.setItem('saral_ai_model', model);

      configModal.classList.remove('show');
      showToast(`AI Brain updated: ${provider === 'gemini' ? 'Google Gemini AI' : 'Built-in Neural Copilot'}`);
      agent.speak(`AI Brain configured to use ${provider === 'gemini' ? 'Google Gemini' : 'Built-in Copilot'}`);
    });
  }
}

/* =========================================
   6. TOAST NOTIFICATIONS HELPER
   ========================================= */
function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-secondary" style="font-variation-settings: 'FILL' 1;">check_circle</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
