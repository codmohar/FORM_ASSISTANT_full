/**
 * =========================================================================
 * SARAL SETU - COMPREHENSIVE CLIENT-SIDE MULTILINGUAL & I18N CONTROLLER
 * =========================================================================
 * Features:
 * - Instant zero-latency UI translation for all 22 Official Indian Languages + English
 * - Synchronizes all language dropdowns (Header, Voice Deck, Floating Mic, Sidebar, Portal)
 * - Deep translation across data-i18n, placeholders, titles, and form schemas
 * - Voice Assistant Speech Recognition (ASR) & Speech Synthesis (TTS) synchronization
 * - Resilient offline-first dictionaries with fallback to backend API
 * =========================================================================
 */

class MultilingualController {
  constructor() {
    this.currentLang = localStorage.getItem('saral_app_lang') || 'en';
    this.backendApiUrl = window.location.origin;
    this.catalogs = {};
    
    this.supportedLanguages = [
      { code: "en", name: "English", nativeName: "English", speechCode: "en-IN", flag: "🌐" },
      { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN", flag: "🇮🇳" },
      { code: "bn", name: "Bengali", nativeName: "বাংলা", speechCode: "bn-IN", flag: "🇮🇳" },
      { code: "mr", name: "Marathi", nativeName: "मराठी", speechCode: "mr-IN", flag: "🇮🇳" },
      { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechCode: "ta-IN", flag: "🇮🇳" },
      { code: "te", name: "Telugu", nativeName: "తెలుగు", speechCode: "te-IN", flag: "🇮🇳" },
      { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speechCode: "gu-IN", flag: "🇮🇳" },
      { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechCode: "kn-IN", flag: "🇮🇳" },
      { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechCode: "ml-IN", flag: "🇮🇳" },
      { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speechCode: "pa-IN", flag: "🇮🇳" },
      { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", speechCode: "or-IN", flag: "🇮🇳" },
      { code: "as", name: "Assamese", nativeName: "অসমীয়া", speechCode: "as-IN", flag: "🇮🇳" },
      { code: "ur", name: "Urdu", nativeName: "اردو", speechCode: "ur-IN", flag: "🇮🇳" },
      { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", speechCode: "hi-IN", flag: "🇮🇳" },
      { code: "ne", name: "Nepali", nativeName: "नेपाली", speechCode: "ne-NP", flag: "🇮🇳" },
      { code: "sd", name: "Sindhi", nativeName: "سنڌي", speechCode: "ur-IN", flag: "🇮🇳" },
      { code: "kok", name: "Konkani", nativeName: "कोंकणी", speechCode: "mr-IN", flag: "🇮🇳" },
      { code: "doi", name: "Dogri", nativeName: "डोगरी", speechCode: "hi-IN", flag: "🇮🇳" },
      { code: "mni", name: "Manipuri", nativeName: "মণিপুরী", speechCode: "bn-IN", flag: "🇮🇳" },
      { code: "brx", name: "Bodo", nativeName: "बड़ो", speechCode: "hi-IN", flag: "🇮🇳" },
      { code: "mai", name: "Maithili", nativeName: "मैथिली", speechCode: "hi-IN", flag: "🇮🇳" },
      { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", speechCode: "hi-IN", flag: "🇮🇳" },
      { code: "ks", name: "Kashmiri", nativeName: "کٲشُر", speechCode: "ur-IN", flag: "🇮🇳" }
    ];

    this.initBuiltInCatalogs();
    
    // Auto-init on DOM load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      setTimeout(() => this.init(), 0);
    }
  }

  async init() {
    this.renderLanguageSelectors();
    await this.setLanguage(this.currentLang, false, false);
  }

  renderLanguageSelectors() {
    const selectorIds = [
      'globalWebsiteLangSelector',
      'voiceDeckLangSelector',
      'floatingVoiceLangSelector',
      'sidebarWebsiteLangSelector',
      'portalLangSelector'
    ];

    selectorIds.forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;

      // Populate options if empty
      if (sel.options.length <= 1) {
        sel.innerHTML = '';
        this.supportedLanguages.forEach(lang => {
          const opt = document.createElement('option');
          opt.value = lang.code;
          opt.textContent = `${lang.flag} ${lang.nativeName} (${lang.name})`;
          if (lang.code === this.currentLang) opt.selected = true;
          sel.appendChild(opt);
        });
      } else {
        sel.value = this.currentLang;
      }

      if (!sel.dataset.hasI18nListener) {
        sel.dataset.hasI18nListener = 'true';
        sel.addEventListener('change', (e) => {
          this.setLanguage(e.target.value, true, true);
        });
      }
    });
  }

  async fetchCatalog(langCode) {
    if (this.catalogs[langCode]) return this.catalogs[langCode];

    try {
      const res = await fetch(`${this.backendApiUrl}/api/translations/${langCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.catalog && Object.keys(data.catalog).length > 0) {
          this.catalogs[langCode] = { ...this.catalogs['en'], ...data.catalog };
          return this.catalogs[langCode];
        }
      }
    } catch (err) {
      // Backend not running or timeout; fallback smoothly
    }

    return this.catalogs[langCode] || this.catalogs['en'];
  }

  async setLanguage(langCode, announce = true, syncForm = true) {
    const validLang = this.supportedLanguages.some(l => l.code === langCode) ? langCode : 'en';
    this.currentLang = validLang;
    localStorage.setItem('saral_app_lang', validLang);

    // Sync all dropdowns across the site
    const selectorIds = [
      'globalWebsiteLangSelector',
      'voiceDeckLangSelector',
      'floatingVoiceLangSelector',
      'sidebarWebsiteLangSelector',
      'portalLangSelector'
    ];
    selectorIds.forEach(id => {
      const sel = document.getElementById(id);
      if (sel && sel.value !== validLang) {
        sel.value = validLang;
      }
    });

    const catalog = await this.fetchCatalog(validLang);
    this.applyTranslations(catalog, validLang, syncForm);
    this.syncVoiceAssistantLanguage(validLang);

    const langObj = this.supportedLanguages.find(l => l.code === validLang) || this.supportedLanguages[0];

    if (announce && typeof showToast === 'function') {
      showToast(`${langObj.flag} Website language set to ${langObj.nativeName} (${langObj.name})`);
      if (window.SaralVoiceAgent && typeof window.SaralVoiceAgent.speak === 'function') {
        window.SaralVoiceAgent.speak(`Language set to ${langObj.name}`);
      }
    }
  }

  applyTranslations(catalog, langCode, syncForm = true) {
    if (!catalog) catalog = this.catalogs['en'] || {};

    // 1. Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (catalog[key]) {
        el.textContent = catalog[key];
      }
    });

    // 2. Translate placeholders with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (catalog[key]) {
        el.setAttribute('placeholder', catalog[key]);
      }
    });

    // 3. Translate titles with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (catalog[key]) {
        el.setAttribute('title', catalog[key]);
      }
    });

    // 4. Translate Smart Form interactive schema
    if (syncForm) {
      if (typeof translateFormSchema === 'function') {
        const langObj = this.supportedLanguages.find(l => l.code === langCode);
        const name = langObj ? langObj.name : langCode.toUpperCase();
        translateFormSchema(langCode, name);
      } else if (typeof translatePortal === 'function') {
        translatePortal(langCode);
      }
    }

    // 5. Translate Active Document Takeaways
    this.translateActiveDocSummary(langCode);
  }

  async translateActiveDocSummary(langCode) {
    if (langCode === 'en') {
      if (typeof renderDocumentTakeaways === 'function' && typeof appState !== 'undefined' && appState.currentDocument) {
        renderDocumentTakeaways(appState.currentDocument);
      } else if (typeof renderCurrentDocument === 'function') {
        renderCurrentDocument();
      }
      return;
    }

    if (typeof appState === 'undefined' || !appState.currentDocument) return;

    try {
      const res = await fetch(`${this.backendApiUrl}/api/translate-doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id: appState.currentDocument.id,
          title: appState.currentDocument.title,
          summary_points: appState.currentDocument.summaryPoints,
          target_lang: langCode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary_points && data.summary_points.length > 0) {
          const list = document.getElementById('docTakeawayList');
          if (list) {
            list.innerHTML = '';
            data.summary_points.forEach(point => {
              const li = document.createElement('li');
              li.className = 'takeaway-item';
              li.innerHTML = `
                <span class="material-symbols-outlined check-icon">check_circle</span>
                <span>${point}</span>
              `;
              list.appendChild(li);
            });
          }
        }
      }
    } catch (e) {
      // Graceful fallback
    }
  }

  syncVoiceAssistantLanguage(langCode) {
    if (window.SaralVoiceAgent && typeof window.SaralVoiceAgent.setLanguage === 'function') {
      window.SaralVoiceAgent.setLanguage(langCode);
    }
  }

  async translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;

    try {
      const res = await fetch(`${this.backendApiUrl}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang: targetLang })
      });
      if (res.ok) {
        const data = await res.json();
        return data.translated_text || text;
      }
    } catch (e) {
      console.warn('[i18n] Live translate API error:', e);
    }
    return text;
  }

  initBuiltInCatalogs() {
    // English Base Catalog
    this.catalogs['en'] = {
      app_title: "Saral Setu",
      app_tagline: "Smart Form & Document Assistant",
      nav_home: "Home",
      nav_vault: "Profile Vault",
      nav_pdf: "PDF Assistant",
      nav_extension: "Smart Form",
      nav_voice: "Voice & Accessibility",
      search_placeholder: "Search forms, docs, vault...",
      welcome_title: "Welcome Back, Ramesh!",
      welcome_subtitle: "Here is your verified government vault, active form helpers, and document summaries.",
      autofill_btn: "One-Click Auto Fill",
      edit_vault_btn: "Edit Vault",
      add_doc_btn: "Add Document",
      export_vault_btn: "Export Vault",
      human_help_btn: "Get Human Help",
      banner_title: "Saral Setu Smart Form Assistant Extension",
      banner_desc: "Auto-fill all government applications, translate portals to Indian languages, and listen to voice guides with one click.",
      test_extension_btn: "Test Extension Simulator",
      profile_progress_title: "Profile Completion",
      profile_progress_desc: "100% verified with Aadhaar & DigiLocker",
      view_vault_btn: "View Vault",
      recent_docs_title: "Recent Scheme Documents",
      recent_docs_sub: "Government orders and scheme summaries analyzed by Saral Setu",
      open_pdf_btn: "Open in PDF Assistant",
      active_forms_title: "Active Form Helpers",
      active_forms_sub: "Government forms ready for 1-click autofill",
      launch_form_btn: "Launch Form",
      vault_page_title: "Citizen Profile Vault",
      vault_page_subtitle: "Your encrypted, verified citizen particulars. Synced for one-click autofill across government portals.",
      vault_status_verified: "100% Verified with Aadhaar & DigiLocker",
      field_full_name: "Full Legal Name (as per Aadhaar)",
      field_dob: "Date of Birth",
      field_gender: "Gender",
      field_phone: "Mobile Number (Aadhaar Linked)",
      field_email: "Email Address",
      field_aadhaar: "Aadhaar Card Number (12 Digits)",
      field_pan: "Permanent Account Number (PAN)",
      field_address: "Residential Address",
      field_pincode: "PIN Code",
      field_category: "Beneficiary Category",
      field_bank_account: "Bank Account Number (DBT Enabled)",
      field_ifsc: "Bank IFSC Code",
      field_voter_id: "Voter ID Card",
      field_annual_income: "Annual Family Income",
      field_pension_ppo: "Pension PPO Number",
      pdf_page_title: "AI Document Simplifier & Assistant",
      pdf_page_subtitle: "Upload complex government scheme circulars, gazettes, or PDFs to get instant plain-language takeaways.",
      read_aloud_btn: "Read Takeaways Aloud",
      download_summary_btn: "Download Summary",
      portal_page_title: "Smart Form Assistant Simulator",
      portal_page_subtitle: "Experience how Saral Setu integrates with official government portals to auto-fill, translate, and guide you.",
      portal_title: "Senior Citizen Welfare Scheme Application Portal",
      portal_subtitle: "Department of Social Welfare & Empowerment",
      submit_application: "Verify & Submit Application",
      clear_form_btn: "Clear Form",
      voice_page_title: "Voice Assistant & Radical Accessibility",
      voice_page_subtitle: "Hands-free voice navigation, screen reader integration, high-contrast modes, and visual comfort adjustments.",
      voice_lang_card_title: "Website & Voice Language",
      voice_lang_card_sub: "Select your preferred Indian language to translate the entire website and set voice assistant speech.",
      voice_command_title: "Voice Command Control",
      voice_command_desc: "Tap the microphone to speak, or click one of the quick command prompts below.",
      voice_status_ready: "Assistant Status: Ready for commands.",
      voice_input_placeholder: "Or type anything (e.g., 'Change address to Bengaluru' or 'Translate to Hindi')...",
      ask_ai_btn: "Ask AI",
      accessibility_title: "Accessibility Customizations",
      theme_mode_title: "Display Contrast Theme",
      text_size_title: "Text Readability Size",
      font_family_title: "Accessible Typography",
      screen_reader_title: "Screen Reader Live Narration",
      floating_mic_title: "Click to speak (Voice Control)",
      floating_lang_tooltip: "Change Whole Website Language"
    };

    // Hindi Catalog
    this.catalogs['hi'] = {
      ...this.catalogs['en'],
      app_title: "सरल सेतु",
      app_tagline: "स्मार्ट फॉर्म एवं दस्तावेज़ सहायक",
      nav_home: "होम",
      nav_vault: "प्रोफाइल वॉल्ट",
      nav_pdf: "पीडीएफ सहायक",
      nav_extension: "स्मार्ट फॉर्म",
      nav_voice: "ध्वनि एवं सुगमता",
      search_placeholder: "फॉर्म, दस्तावेज़, वॉल्ट खोजें...",
      welcome_title: "नमस्ते, रमेश जी!",
      welcome_subtitle: "यहाँ आपका सत्यापित सरकारी वॉल्ट, सक्रिय फॉर्म सहायक और दस्तावेज़ सारांश उपलब्ध है।",
      autofill_btn: "एक-क्लिक ऑटो फिल",
      edit_vault_btn: "वॉल्ट संपादित करें",
      add_doc_btn: "दस्तावेज़ जोड़ें",
      export_vault_btn: "वॉल्ट निर्यात करें",
      human_help_btn: "मानव सहायता लें",
      banner_title: "सरल सेतु स्मार्ट फॉर्म सहायक एक्सटेंशन",
      banner_desc: "सभी सरकारी आवेदनों को स्वतः भरें, पोर्टलों का भारतीय भाषाओं में अनुवाद करें और वॉइस गाइड सुनें।",
      test_extension_btn: "एक्सटेंशन सिम्युलेटर चलाएँ",
      profile_progress_title: "प्रोफाइल पूर्णता",
      profile_progress_desc: "आधार और डिजीलॉकर से 100% सत्यापित",
      view_vault_btn: "वॉल्ट देखें",
      recent_docs_title: "हाल के योजना दस्तावेज़",
      recent_docs_sub: "सरल सेतु द्वारा विश्लेषित सरकारी आदेश और योजना सारांश",
      open_pdf_btn: "पीडीएफ सहायक में खोलें",
      active_forms_title: "सक्रिय फॉर्म सहायक",
      active_forms_sub: "1-क्लिक ऑटो-फिल के लिए तैयार सरकारी फॉर्म",
      launch_form_btn: "फॉर्म खोलें",
      vault_page_title: "नागरिक प्रोफाइल वॉल्ट",
      vault_page_subtitle: "आपके एन्क्रिप्टेड और सत्यापित नागरिक विवरण। सरकारी पोर्टलों पर एक-क्लिक स्वतः भरने के लिए सिंक्रनाइज़।",
      vault_status_verified: "आधार एवं डिजिलॉकर से 100% सत्यापित",
      field_full_name: "पूरा कानूनी नाम (आधार के अनुसार)",
      field_dob: "जन्म तिथि",
      field_gender: "लिंग",
      field_phone: "मोबाइल नंबर (आधार से लिंक)",
      field_email: "ईमेल पता",
      field_aadhaar: "आधार कार्ड संख्या (12 अंक)",
      field_pan: "स्थायी खाता संख्या (PAN)",
      field_address: "स्थायी आवासीय पता",
      field_pincode: "पिन कोड (PIN Code)",
      field_category: "लाभार्थी श्रेणी",
      field_bank_account: "बैंक खाता संख्या (DBT सक्रिय)",
      field_ifsc: "बैंक IFSC कोड",
      field_voter_id: "मतदाता पहचान पत्र संख्या",
      field_annual_income: "वार्षिक पारिवारिक आय",
      field_pension_ppo: "पेंशन PPO नंबर",
      pdf_page_title: "एआई दस्तावेज़ सरलीकरण एवं सहायक",
      pdf_page_subtitle: "सरकारी योजनाओं, परिपत्रों या पीडीएफ को सरल क्षेत्रीय भाषा में समझने के लिए यहाँ देखें।",
      read_aloud_btn: "सारांश बोलकर सुनाएं",
      download_summary_btn: "सारांश डाउनलोड करें",
      portal_page_title: "स्मार्ट फॉर्म सहायक सिम्युलेटर",
      portal_page_subtitle: "अनुभव करें कि सरल सेतु सरकारी पोर्टलों पर स्वतः फॉर्म भरने और मार्गदर्शन करने में कैसे मदद करता है।",
      portal_title: "वरिष्ठ नागरिक कल्याण योजना आवेदन पोर्टल",
      portal_subtitle: "सामाजिक न्याय एवं अधिकारिता विभाग",
      submit_application: "सत्यापित करें और आवेदन जमा करें",
      clear_form_btn: "फॉर्म खाली करें",
      voice_page_title: "वॉइस असिस्टेंट एवं पूर्ण सुगमता",
      voice_page_subtitle: "हाथ-मुक्त ध्वनि नेविगेशन, स्क्रीन रीडर, उच्च कंट्रास्ट मोड और दृश्य सुविधा।",
      voice_lang_card_title: "वेबसाइट एवं वॉइस भाषा",
      voice_lang_card_sub: "पूरी वेबसाइट का अनुवाद करने और वॉइस असिस्टेंट के लिए अपनी पसंदीदा भारतीय भाषा चुनें।",
      voice_command_title: "ध्वनि निर्देश नियंत्रण",
      voice_command_desc: "बोलने के लिए माइक्रोफ़ोन टैप करें, या नीचे दिए गए त्वरित कमांड पर क्लिक करें।",
      voice_status_ready: "सहायक स्थिति: निर्देशों के लिए तैयार।",
      voice_input_placeholder: "या कुछ भी टाइप करें (उदा. 'पता बदलकर बेंगलुरु करो' या 'हिंदी में अनुवाद करो')...",
      ask_ai_btn: "एआई से पूछें",
      accessibility_title: "सुगमता अनुकूलन",
      theme_mode_title: "प्रदर्शन कंट्रास्ट थीम",
      text_size_title: "टेक्स्ट का आकार",
      font_family_title: "सुगम टाइपोग्राफी",
      screen_reader_title: "स्क्रीन रीडर लाइव वाचन",
      floating_mic_title: "बोलने के लिए क्लिक करें",
      floating_lang_tooltip: "पूरी वेबसाइट की भाषा बदलें"
    };

    // Marathi Catalog
    this.catalogs['mr'] = {
      ...this.catalogs['en'],
      app_title: "सरल सेतू",
      app_tagline: "स्मार्ट फॉर्म आणि दस्तऐवज सहाय्यक",
      nav_home: "मुख्यपृष्ठ",
      nav_vault: "प्रोफाइल व्हॉल्ट",
      nav_pdf: "दस्तऐवज सहाय्यक",
      nav_extension: "स्मार्ट फॉर्म",
      nav_voice: "व्हॉइस सहाय्यक",
      search_placeholder: "फॉर्म, कागदपत्रे शोधा...",
      welcome_title: "स्वागत आहे, रमेश!",
      welcome_subtitle: "येथे आपले सत्यापित शासकीय व्हॉल्ट, सक्रिय फॉर्म आणि दस्तऐवज सारांश उपलब्ध आहे.",
      autofill_btn: "एक-क्लिक ऑटो-फिल",
      edit_vault_btn: "व्हॉल्ट संपादित करा",
      add_doc_btn: "दस्तऐवज जोडा",
      export_vault_btn: "व्हॉल्ट डाउनलोड करा",
      human_help_btn: "मानवी मदत मिळवा",
      banner_title: "सरल सेतू स्मार्ट फॉर्म सहाय्यक एक्स्टेंशन",
      banner_desc: "सर्व सरकारी अर्ज स्वयंचलित भरा, भारतीय भाषांमध्ये भाषांतर करा आणि व्हॉइस मार्गदर्शक ऐका.",
      vault_page_title: "नागरिक प्रोफाइल व्हॉल्ट",
      vault_page_subtitle: "आपली सुरक्षित माहिती सरकारी अर्जांवर एका क्लिकवर भरण्यासाठी तयार आहे.",
      field_full_name: "पूर्ण नाव (आधार कार्डानुसार)",
      field_dob: "जन्मतारीख",
      field_gender: "लिंग",
      field_phone: "मोबाइल क्रमांक (आधार लिंक)",
      field_email: "ईमेल पत्ता",
      field_aadhaar: "आधार क्रमांक (12 अंक)",
      field_pan: "पॅन कार्ड क्रमांक (PAN)",
      field_address: "निवासी पत्ता",
      field_pincode: "पिन कोड",
      field_category: "लाभार्थी प्रवर्ग",
      field_bank_account: "बँक खाते क्रमांक (DBT सक्षम)",
      field_ifsc: "बँक IFSC कोड",
      submit_application: "पडताळणी करा आणि अर्ज सबमिट करा",
      pdf_page_title: "एआय दस्तऐवज विश्लेषक",
      pdf_page_subtitle: "शासकीय योजना आणि परिपत्रके सोप्या भाषेत समजून घ्या.",
      read_aloud_btn: "मोठ्याने वाचून दाखवा",
      download_summary_btn: "सारांश जतन करा",
      voice_page_title: "व्हॉइस सहाय्यक आणि सुलभता",
      voice_lang_card_title: "वेबसाइट आणि व्हॉइस भाषा",
      voice_lang_card_sub: "संपूर्ण वेबसाइटचे भाषांतर करण्यासाठी आणि व्हॉइससाठी भाषा निवडा.",
      voice_status_ready: "सहाय्यक स्थिती: सज्ज आहे.",
      floating_lang_tooltip: "संपूर्ण वेबसाइटची भाषा बदला"
    };

    // Bengali Catalog
    this.catalogs['bn'] = {
      ...this.catalogs['en'],
      app_title: "সরল সেতু",
      app_tagline: "স্মার্ট ফর্ম ও নথি সহায়ক",
      nav_home: "হোম",
      nav_vault: "প্রোফাইল ভল্ট",
      nav_pdf: "পিডিএফ সহায়ক",
      nav_extension: "স্মার্ট ফর্ম",
      nav_voice: "ভয়েস ডেক",
      search_placeholder: "ফর্ম ও নথি অনুসন্ধান করুন...",
      welcome_title: "স্বাগতম, রমেশ!",
      welcome_subtitle: "আপনার যাচাইকৃত সরকারি ভল্ট এবং সক্রিয় ফর্ম সহায়ক এখানে প্রস্তুত।",
      autofill_btn: "ওয়ান-ক্লিক অটো ফিল",
      edit_vault_btn: "ভল্ট সম্পাদনা করুন",
      add_doc_btn: "নথি যোগ করুন",
      export_vault_btn: "ভল্ট রপ্তানি করুন",
      human_help_btn: "সহায়তা অনুরোধ করুন",
      field_full_name: "সম্পূর্ণ আইনি নাম (আধার অনুযায়ী)",
      field_dob: "জন্ম তারিখ",
      field_gender: "লিঙ্গ",
      field_phone: "মোবাইল নম্বর (আধার সংযুক্ত)",
      field_email: "ইমেইল ঠিকানা",
      field_aadhaar: "আধার নম্বর (১২ সংখ্যা)",
      field_pan: "প্যান নম্বর (PAN)",
      field_address: "স্থায়ী ঠিকানা",
      field_pincode: "পিন কোড",
      field_category: "সুবিধাভোগী শ্রেণী",
      field_bank_account: "ব্যাংক অ্যাকাউন্ট নম্বর (DBT সক্রিয়)",
      field_ifsc: "ব্যাংক IFSC কোড",
      submit_application: "যাচাই করুন এবং আবেদন জমা দিন",
      pdf_page_title: "এআই নথি সরলীকরণ সহায়ক",
      pdf_page_subtitle: "সরকারি প্রকল্পের বিজ্ঞপ্তি বাংলায় সহজ ভাষায় বুঝুন।",
      read_aloud_btn: "পড়ে শোনান",
      download_summary_btn: "সারাংশ ডাউনলোড করুন",
      voice_page_title: "ভয়েস সহায়ক ও অ্যাক্সেসিবিলিটি",
      voice_lang_card_title: "ওয়েবসাইট ও ভয়েস ভাষা",
      voice_lang_card_sub: "পুরো ওয়েবসাইটের ভাষা পরিবর্তন করতে নির্বাচন করুন।",
      floating_lang_tooltip: "পুরো ওয়েবসাইটের ভাষা পরিবর্তন করুন"
    };

    // Tamil Catalog
    this.catalogs['ta'] = {
      ...this.catalogs['en'],
      app_title: "சரல் சேது",
      app_tagline: "ஸ்மார்ட் படிவம் மற்றும் ஆவண உதவியாளர்",
      nav_home: "முகப்பு",
      nav_vault: "சுயவிவர பெட்டகம்",
      nav_pdf: "ஆவண உதவியாளர்",
      nav_extension: "ஸ்மார்ட் படிவம்",
      nav_voice: "குரல் கட்டுப்பாடு",
      welcome_title: "வணக்கம், ரமேஷ்!",
      welcome_subtitle: "உங்கள் சரிபார்க்கப்பட்ட அரசு பெட்டகம் மற்றும் படிவ உதவியாளர் இங்கே உள்ளது.",
      autofill_btn: "தானியங்கி நிரப்பல் (Auto Fill)",
      edit_vault_btn: "பெட்டகத்தை திருத்து",
      field_full_name: "முழு சட்டப்பூர்வ பெயர் (ஆதார் படி)",
      field_dob: "பிறந்த தேதி",
      field_gender: "பாலினம்",
      field_phone: "கைபேசி எண் (ஆதார் இணைக்கப்பட்டது)",
      field_email: "மின்னஞ்சல் முகவரி",
      field_aadhaar: "ஆதார் அட்டை எண் (12 இலக்கங்கள்)",
      field_pan: "பான் அட்டை எண் (PAN)",
      field_address: "குடியிருப்பு முகவரி",
      field_pincode: "அஞ்சல் குறியீடு (PIN)",
      field_category: "பயனாளி பிரிவு",
      field_bank_account: "வங்கி கணக்கு எண் (DBT இணைக்கப்பட்டது)",
      field_ifsc: "வங்கி IFSC குறியீடு",
      submit_application: "சரிபார்த்து விண்ணப்பிக்கவும்",
      pdf_page_title: "AI ஆவண சுருக்க உதவியாளர்",
      pdf_page_subtitle: "அரசு சுற்றறிக்கைகள் மற்றும் திட்டங்களை தமிழில் எளிதாக அறியலாம்.",
      read_aloud_btn: "வாசித்துக்காட்டு",
      download_summary_btn: "சுருக்கத்தை சேமி",
      voice_page_title: "குரல் உதவியாளர் & அணுகல்தன்மை",
      voice_lang_card_title: "வலைத்தளம் & குரல் மொழி",
      voice_lang_card_sub: "முழு வலைத்தளத்தையும் குரல் மொழியையும் மாற்ற தேர்ந்தெடுக்கவும்.",
      floating_lang_tooltip: "முழு வலைத்தளத்தின் மொழியை மாற்றவும்"
    };

    // Telugu Catalog
    this.catalogs['te'] = {
      ...this.catalogs['en'],
      app_title: "సరళ్ సేతు",
      app_tagline: "స్మార్ట్ ఫారం & డాక్యుమెంట్ అసిస్టెంట్",
      nav_home: "హోమ్",
      nav_vault: "ప్రొఫైల్ వాల్ట్",
      nav_pdf: "పిడిఎఫ్ అసిస్టెంట్",
      nav_extension: "స్మార్ట్ ఫారం",
      nav_voice: "వాయిస్ కంట్రోల్",
      welcome_title: "స్వాగతం, రమేష్!",
      welcome_subtitle: "మీ ధృవీకరించబడిన ప్రభుత్వ వాల్ట్ మరియు ఫారం సహాయకం సిద్ధంగా ఉంది.",
      autofill_btn: "వన్-క్లిక్ ఆటో ఫిల్",
      edit_vault_btn: "వాల్ట్ సవరించండి",
      field_full_name: "పూర్తి పేరు (ఆధార్ ప్రకారం)",
      field_dob: "పుట్టిన తేది",
      field_gender: "లింగం",
      field_phone: "మొబైల్ నంబర్ (ఆధార్ లింక్)",
      field_email: "ఈమెయిల్ చిరునామా",
      field_aadhaar: "ఆధార్ నంబర్ (12 అంకెలు)",
      field_pan: "పాన్ కార్డ్ నంబర్ (PAN)",
      field_address: "నివాస చిరునామా",
      field_pincode: "పిన్ కోడ్ (PIN)",
      field_category: "లబ్ధిదారుల వర్గం",
      field_bank_account: "బ్యాంక్ ఖాతా సంఖ్య (DBT ప్రారంభించబడింది)",
      field_ifsc: "బ్యాంక్ IFSC కోడ్",
      submit_application: "ధృవీకరించి సమర్పించండి",
      pdf_page_title: "ఏఐ పత్రాల సరళీకరణ సహాయకం",
      pdf_page_subtitle: "ప్రభుత్వ మార్గదర్శకాలను తెలుగులో సులభంగా అర్థం చేసుకోండి.",
      read_aloud_btn: "చదివి వినిపించండి",
      download_summary_btn: "సారాంశం డౌన్లోడ్ చేయండి",
      voice_page_title: "వాయిస్ అసిస్టెంట్ & యాక్సెసిబిలిటీ",
      voice_lang_card_title: "వెబ్‌సైట్ & వాయిస్ భాష",
      voice_lang_card_sub: "మొత్తం వెబ్‌సైట్‌ను అనువదించడానికి మరియు వాయిస్ కోసం ఎంచుకోండి.",
      floating_lang_tooltip: "మొత్తం వెబ్‌సైట్ భాషను మార్చండి"
    };

    // Gujarati Catalog
    this.catalogs['gu'] = {
      ...this.catalogs['en'],
      app_title: "સરળ સેતુ",
      app_tagline: "સ્માર્ટ ફોર્મ અને દસ્તાવેજ સહાયક",
      nav_home: "હોમ",
      nav_vault: "પ્રોફાઇલ વૉલ્ટ",
      nav_pdf: "પીડીએફ સહાયક",
      nav_extension: "સ્માર્ટ ફોર્મ",
      nav_voice: "વૉઇસ આસિસ્ટન્ટ",
      welcome_title: "સ્વાગત છે, રમેશ!",
      welcome_subtitle: "અહીં તમારું ચકાસાયેલ સરકારી વૉલ્ટ અને સક્રિય ફોર્મ સહાયક છે.",
      autofill_btn: "વન-ક્લિક ઑટો ફિલ",
      edit_vault_btn: "વૉલ્ટ સુધારો",
      field_full_name: "પૂરું નામ (આધાર મુજબ)",
      field_dob: "જન્મ તારીખ",
      field_gender: "જાતિ",
      field_phone: "મોબાઇલ નંબર (આધાર લિંક્ડ)",
      field_email: "ઇમેઇલ સરનામું",
      field_aadhaar: "આધાર નંબર (12 અંકો)",
      field_pan: "પાન નંબર (PAN)",
      field_address: "રહેઠાણનું સરનામું",
      field_pincode: "પિન કોડ",
      field_category: "લાભાર્થી શ્રેણી",
      field_bank_account: "બેંક ખાતા નંબર (DBT સક્ષમ)",
      field_ifsc: "બેંક IFSC કોડ",
      submit_application: "ચકાસો અને અરજી સબમિટ કરો",
      pdf_page_title: "AI દસ્તાવેજ સરળીકરણ સહાયક",
      pdf_page_subtitle: "સરકારી યોજનાઓ ગુજરાતીમાં સરળ ભાષામાં સમજો.",
      read_aloud_btn: "મોટેથી વાંચો",
      download_summary_btn: "સારાંશ સાચવો",
      voice_page_title: "વૉઇસ સહાયક અને સુલભતા",
      voice_lang_card_title: "વેબસાઇટ અને વૉઇસ ભાષા",
      voice_lang_card_sub: "આખી વેબસાઇટ ભાષાંતર કરવા માટે ભાષા પસંદ કરો.",
      floating_lang_tooltip: "સમગ્ર વેબસાઇટની ભાષા બદલો"
    };

    // Kannada Catalog
    this.catalogs['kn'] = {
      ...this.catalogs['en'],
      app_title: "ಸರಳ ಸೇತು",
      app_tagline: "ಸ್ಮಾರ್ಟ್ ಫಾರ್ಮ್ ಮತ್ತು ಡಾಕ್ಯುಮೆಂಟ್ ಸಹಾಯಕ",
      nav_home: "ಮುಖಪುಟ",
      nav_vault: "ಪ್ರೊಫೈಲ್ ವಾಲ್ಟ್",
      nav_pdf: "ದಾಖಲೆ ಸಹಾಯಕ",
      nav_extension: "ಸ್ಮಾರ್ಟ್ ಫಾರ್ಮ್",
      nav_voice: "ಧ್ವನಿ ಸಹಾಯಕ",
      welcome_title: "ಸ್ವಾಗತ, ರಮೇಶ್!",
      welcome_subtitle: "ನಿಮ್ಮ ಪರಿಶೀಲಿಸಿದ ಸರ್ಕಾರಿ ವಾಲ್ಟ್ ಮತ್ತು ಫಾರ್ಮ್ ಸಹಾಯಕ ಇಲ್ಲಿದೆ.",
      autofill_btn: "ಒನ್-ಕ್ಲಿಕ್ ಆಟೋ ಫಿಲ್",
      edit_vault_btn: "ವಾಲ್ಟ್ ತಿದ್ದುಪಡಿ ಮಾಡಿ",
      field_full_name: "ಪೂರ್ಣ ಹೆಸರು (ಆಧಾರ್ ಪ್ರಕಾರ)",
      field_dob: "ಹುಟ್ಟಿದ ದಿನಾಂಕ",
      field_gender: "ಲಿಂಗ",
      field_phone: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಆಧಾರ್ ಲಿಂಕ್)",
      field_email: "ಇಮೇಲ್ ವಿಳಾಸ",
      field_aadhaar: "ಆಧಾರ್ ಸಂಖ್ಯೆ (12 ಅಂಕಿಗಳು)",
      field_pan: "ಪ್ಯಾನ್ ಸಂಖ್ಯೆ (PAN)",
      field_address: "ವಾಸದ ವಿಳಾಸ",
      field_pincode: "ಪಿನ್ ಕೋಡ್",
      field_category: "ಫಲಾನುಭವಿ ವರ್ಗ",
      field_bank_account: "ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಂಖ್ಯೆ (DBT ಸಕ್ರಿಯ)",
      field_ifsc: "ಬ್ಯಾಂಕ್ IFSC ಕೋಡ್",
      submit_application: "ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
      pdf_page_title: "ಎಐ ದಾಖಲೆ ಸರಳೀಕರಣ ಸಹಾಯಕ",
      pdf_page_subtitle: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಕನ್ನಡದಲ್ಲಿ ಸುಲಭವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.",
      read_aloud_btn: "ಓದಿ ಕೇಳಿಸಿ",
      download_summary_btn: "ಸಾರಾಂಶ ಉಳಿಸಿ",
      voice_page_title: "ಧ್ವನಿ ಸಹಾಯಕ ಮತ್ತು ಸುಲಭತೆ",
      voice_lang_card_title: "ವೆಬ್‌ಸೈಟ್ ಮತ್ತು ಧ್ವನಿ ಭಾಷೆ",
      voice_lang_card_sub: "ಸಂಪೂರ್ಣ ವೆಬ್‌ಸೈಟ್ ಭಾಷಾಂತರಿಸಲು ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ.",
      floating_lang_tooltip: "ಸಂಪೂರ್ಣ ವೆಬ್‌ಸೈಟ್ ಭಾಷೆ ಬದಲಾಯಿಸಿ"
    };

    // Malayalam Catalog
    this.catalogs['ml'] = {
      ...this.catalogs['en'],
      app_title: "സരൾ സേതു",
      app_tagline: "സ്മാർട്ട് ഫോം & ഡോക്യുമെന്റ് അസിസ്റ്റന്റ്",
      nav_home: "ഹോം",
      nav_vault: "പ്രൊഫൈൽ വോൾട്ട്",
      nav_pdf: "പിഡിഎഫ് അസിസ്റ്റന്റ്",
      nav_extension: "സ്മാർട്ട് ഫോം",
      nav_voice: "വോയ്‌സ് അസിസ്റ്റന്റ്",
      welcome_title: "സ്വാഗതം, രമേഷ്!",
      welcome_subtitle: "നിങ്ങളുടെ സർക്കാർ വോൾട്ടും ഫോം അസിസ്റ്റന്റും ഇവിടെ ലഭ്യമാണ്.",
      autofill_btn: "വൺ-ക്ലിക്ക് ഓട്ടോ ഫിൽ",
      edit_vault_btn: "വോൾട്ട് എഡിറ്റ് ചെയ്യുക",
      field_full_name: "മുഴുവൻ പേര് (ആധാർ പ്രകാരം)",
      field_dob: "ജനന തീയതി",
      field_gender: "ലിംഗഭേദം",
      field_phone: "മൊബൈൽ നമ്പർ (ആധാർ ലിങ്ക് ചെയ്തത്)",
      field_email: "ഇമെയിൽ വിലാസം",
      field_aadhaar: "ആധാർ നമ്പർ (12 അക്കങ്ങൾ)",
      field_pan: "പാൻ നമ്പർ (PAN)",
      field_address: "താമസ വിലാസം",
      field_pincode: "പിൻ കോഡ്",
      field_category: "ഗുണഭോക്തൃ വിഭാഗം",
      field_bank_account: "ബാങ്ക് അക്കൗണ്ട് നമ്പർ (DBT പ്രവർത്തനക്ഷമം)",
      field_ifsc: "ബാങ്ക് IFSC കോഡ്",
      submit_application: "സ്ഥിരീകരിച്ച് അപേക്ഷ സമർപ്പിക്കുക",
      pdf_page_title: "AI ഡോക്യുമെന്റ് അസിസ്റ്റന്റ്",
      pdf_page_subtitle: "സർക്കാർ പദ്ധതികൾ മലയാളത്തിൽ ലളിതമായി മനസ്സിലാക്കുക.",
      read_aloud_btn: "വായിച്ചു കേൾപ്പിക്കുക",
      download_summary_btn: "സംഗ്രഹം ഡൗൺലോഡ് ചെയ്യുക",
      voice_page_title: "വോയ്‌സ് അസിസ്റ്റന്റും പ്രവേശനക്ഷമതയും",
      voice_lang_card_title: "വെബ്‌സൈറ്റ് & വോയ്‌സ് ഭാഷ",
      voice_lang_card_sub: "മുഴുവൻ വെബ്‌സൈറ്റും വിവർത്തനം ചെയ്യാൻ ഭാഷ തിരഞ്ഞെടുക്കുക.",
      floating_lang_tooltip: "മുഴുവൻ വെബ്സൈറ്റിന്റെയും ഭാഷ മാറ്റുക"
    };

    // Punjabi Catalog
    this.catalogs['pa'] = {
      ...this.catalogs['en'],
      app_title: "ਸਰਲ ਸੇਤੂ",
      app_tagline: "ਸਮਾਰਟ ਫਾਰਮ ਅਤੇ ਦਸਤਾਵੇਜ਼ ਸਹਾਇਕ",
      nav_home: "ਮੁੱਖ ਪੰਨਾ",
      nav_vault: "ਪ੍ਰੋਫਾਈਲ ਵਾਲਟ",
      nav_pdf: "ਦਸਤਾਵੇਜ਼ ਸਹਾਇਕ",
      nav_extension: "ਸਮਾਰਟ ਫਾਰਮ",
      nav_voice: "ਆਵਾਜ਼ ਸਹਾਇਕ",
      welcome_title: "ਜੀ ਆਇਆਂ ਨੂੰ, ਰਮੇਸ਼!",
      welcome_subtitle: "ਤੁਹਾਡਾ ਪ੍ਰਮਾਣਿਤ ਸਰਕਾਰੀ ਵਾਲਟ ਅਤੇ ਫਾਰਮ ਸਹਾਇਕ ਇੱਥੇ ਉਪਲਬਧ ਹੈ।",
      autofill_btn: "ਇੱਕ-ਕਲਿੱਕ ਆਟੋ ਫਿਲ",
      edit_vault_btn: "ਵਾਲਟ ਸੋਧੋ",
      field_full_name: "ਪੂਰਾ ਕਾਨੂੰਨੀ ਨਾਮ (ਆਧਾਰ ਅਨੁਸਾਰ)",
      field_dob: "ਜਨਮ ਮਿਤੀ",
      field_gender: "ਲਿੰਗ",
      field_phone: "ਮੋਬਾਈਲ ਨੰਬਰ (ਆਧਾਰ ਲਿੰਕ)",
      field_email: "ਈਮੇਲ ਪਤਾ",
      field_aadhaar: "ਆਧਾਰ ਨੰਬਰ (12 ਅੰਕ)",
      field_pan: "ਪੈਨ ਕਾਰਡ ਨੰਬਰ (PAN)",
      field_address: "ਰਿਹਾਇਸ਼ੀ ਪਤਾ",
      field_pincode: "ਪਿੰਨ ਕੋਡ",
      field_category: "ਲਾਭਪਾਤਰੀ ਸ਼੍ਰੇਣੀ",
      field_bank_account: "ਬੈਂਕ ਖਾਤਾ ਨੰਬਰ (DBT ਸਮਰੱਥ)",
      field_ifsc: "ਬੈਂਕ IFSC ਕੋਡ",
      submit_application: "ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਅਰਜ਼ੀ ਜਮ੍ਹਾਂ ਕਰੋ",
      pdf_page_title: "ਏਆਈ ਦਸਤਾਵੇਜ਼ ਸਹਾਇਕ",
      pdf_page_subtitle: "ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਪੰਜਾਬੀ ਵਿੱਚ ਆਸਾਨੀ ਨਾਲ ਸਮਝੋ।",
      read_aloud_btn: "ਉੱਚੀ ਆਵਾਜ਼ ਵਿੱਚ ਪੜ੍ਹੋ",
      download_summary_btn: "ਸੰਖੇਪ ਡਾਊਨਲੋਡ ਕਰੋ",
      voice_page_title: "ਆਵਾਜ਼ ਸਹਾਇਕ ਅਤੇ ਪਹੁੰਚਯੋਗਤਾ",
      voice_lang_card_title: "ਵੈੱਬਸਾਈਟ ਅਤੇ ਆਵਾਜ਼ ਭਾਸ਼ਾ",
      voice_lang_card_sub: "ਪੂਰੀ ਵੈੱਬਸਾਈਟ ਦਾ ਅਨੁਵਾਦ ਕਰਨ ਲਈ ਭਾਸ਼ਾ ਚੁਣੋ।",
      floating_lang_tooltip: "ਪੂਰੀ ਵੈੱਬਸਾਈਟ ਦੀ ਭਾਸ਼ਾ ਬਦਲੋ"
    };

    // Odia Catalog
    this.catalogs['or'] = {
      ...this.catalogs['en'],
      app_title: "ସରଳ ସେତୁ",
      app_tagline: "ସ୍ମାର୍ଟ ଫର୍ମ ଏବଂ ଦଲିଲ ସହାୟକ",
      nav_home: "ମୁଖ୍ୟପୃଷ୍ଠା",
      nav_vault: "ପ୍ରୋଫାଇଲ୍ ଭଲ୍ଟ",
      nav_pdf: "ଦଲିଲ ସହାୟକ",
      nav_extension: "ସ୍ମାର୍ଟ ଫର୍ମ",
      nav_voice: "ଭଏସ୍ ସହାୟକ",
      welcome_title: "ସ୍ୱାଗତ, ରମେଶ!",
      welcome_subtitle: "ଆପଣଙ୍କର ଯାଞ୍ଚ ହୋଇଥିବା ସରକାରୀ ଭଲ୍ଟ ଏବଂ ଫର୍ମ ସହାୟକ ଏଠାରେ ପ୍ରସ୍ତୁତ।",
      autofill_btn: "ଗୋଟିଏ-କ୍ଲିକ୍ ଅଟୋ ଫିଲ୍",
      edit_vault_btn: "ଭଲ୍ଟ ସଂଶୋଧନ କରନ୍ତୁ",
      field_full_name: "ସମ୍ପୂର୍ଣ୍ଣ ଆଇନଗତ ନାମ (ଆଧାର ଅନୁସାରେ)",
      field_dob: "ଜନ୍ମ ତାରିଖ",
      field_gender: "ଲିଙ୍ଗ",
      field_phone: "ମୋବାଇଲ୍ ନମ୍ବର (ଆଧାର ଲିଙ୍କ)",
      field_email: "ଇମେଲ୍ ଠିକଣା",
      field_aadhaar: "ଆଧାର ନମ୍ବର (୧୨ ଅଙ୍କ)",
      field_pan: "ପାନ୍ କାର୍ଡ ନମ୍ବର (PAN)",
      field_address: "ସ୍ଥାୟୀ ଠିକଣା",
      field_pincode: "ପିନ୍ କୋଡ୍",
      field_category: "ହିତାଧିକାରୀ ବର୍ଗ",
      field_bank_account: "ବ୍ୟାଙ୍କ ଆକାଉଣ୍ଟ୍ ନମ୍ବର (DBT ସକ୍ଷମ)",
      field_ifsc: "ବ୍ୟାଙ୍କ IFSC କୋଡ୍",
      submit_application: "ଯାଞ୍ଚ କରନ୍ତୁ ଏବଂ ଆବେଦନ ଦାଖଲ କରନ୍ତୁ",
      pdf_page_title: "AI ଦଲିଲ ସରଳୀକରଣ ସହାୟକ",
      pdf_page_subtitle: "ସରକାରୀ ଯୋଜନା ଓ ବିଜ୍ଞପ୍ତି ଓଡ଼ିଆରେ ସହଜରେ ବୁଝନ୍ତୁ।",
      read_aloud_btn: "ପଢ଼ି ଶୁଣାନ୍ତୁ",
      download_summary_btn: "ସାରାଂଶ ଡାଉନଲୋଡ୍ କରନ୍ତୁ",
      voice_page_title: "ଭଏସ୍ ସହାୟକ ଓ ସୁଗମତା",
      voice_lang_card_title: "ୱେବସାଇଟ୍ ଓ ଭଏସ୍ ଭାଷା",
      voice_lang_card_sub: "ସମଗ୍ର ୱେବସାଇଟ୍ ଅନୁବାଦ କରିବାକୁ ଭାଷା ଚୟନ କରନ୍ତୁ।",
      floating_lang_tooltip: "ସମଗ୍ର ୱେବସାଇଟ୍ ର ଭାଷା ପରିବର୍ତ୍ତନ କରନ୍ତୁ"
    };

    // Urdu Catalog
    this.catalogs['ur'] = {
      ...this.catalogs['en'],
      app_title: "سرل سیتو",
      app_tagline: "اسمارٹ فارم اور دستاویز معاون",
      nav_home: "ہوم",
      nav_vault: "پروفائل والٹ",
      nav_pdf: "پی ڈی ایف معاون",
      nav_extension: "اسمارٹ فارم",
      nav_voice: "وائس ڈیک",
      welcome_title: "خوش آمدید، رمیش!",
      welcome_subtitle: "آپ کا تصدیق شدہ سرکاری والٹ اور فارم اسسٹنٹ یہاں دستیاب ہے۔",
      autofill_btn: "ایک کلک آٹو فل",
      edit_vault_btn: "والٹ میں ترمیم کریں",
      field_full_name: "مکمل قانونی نام (آدھار کے مطابق)",
      field_dob: "تاریخ پیدائش",
      field_gender: "جنس",
      field_phone: "موبائل نمبر (آدھار سے منسلک)",
      field_email: "ای میل ایڈریس",
      field_aadhaar: "آدھار نمبر (12 ہندسے)",
      field_pan: "پین کارڈ نمبر (PAN)",
      field_address: "رہائشی پتہ",
      field_pincode: "پن کوڈ",
      field_category: "مستفید کی قسم",
      field_bank_account: "بینک اکاؤنٹ نمبر (DBT فعال)",
      field_ifsc: "بینک IFSC کوڈ",
      submit_application: "تصدیق کریں اور درخواست جمع کریں",
      pdf_page_title: "دستاویز کی آسان تفہیم",
      pdf_page_subtitle: "سرکاری اسکیموں اور نوٹیفیکیشنز کو آسان زبان میں سمجھیں۔",
      read_aloud_btn: "بلند آواز میں پڑھیں",
      download_summary_btn: "خلاصہ ڈاؤن لوڈ کریں",
      voice_page_title: "وائس اسسٹنٹ اور رسائی",
      voice_lang_card_title: "ویب سائٹ اور آواز کی زبان",
      voice_lang_card_sub: "پوری ویب سائٹ کا ترجمہ کرنے کے لیے زبان منتخب کریں۔",
      floating_lang_tooltip: "پوری ویب سائٹ کی زبان تبدیل کریں"
    };

    // Assamese Catalog
    this.catalogs['as'] = {
      ...this.catalogs['en'],
      app_title: "সৰল সেতু",
      app_tagline: "স্মাৰ্ট ফৰ্ম আৰু নথি সহায়ক",
      nav_home: "মুখ্য পৃষ্ঠা",
      nav_vault: "প্রফাইল ভল্ট",
      nav_pdf: "নথি সহায়ক",
      nav_extension: "স্মাৰ্ট ফৰ্ম",
      nav_voice: "ভইচ সহায়ক",
      welcome_title: "স্বাগতম, ৰমেশ!",
      welcome_subtitle: "আপোনাৰ প্ৰমাণিত চৰকাৰী ভল্ট আৰু ফৰ্ম সহায়ক ইয়াত উপলব্ধ।",
      autofill_btn: "এক-ক্লিক অটো ফিল",
      edit_vault_btn: "ভল্ট সম্পাদনা কৰক",
      field_full_name: "সম্পূৰ্ণ আইনী নাম (আধাৰ অনুসৰি)",
      field_dob: "জন্ম তাৰিখ",
      field_gender: "লিংগ",
      field_phone: "ম'বাইল নম্বৰ (আধাৰ সংলগ্ন)",
      field_email: "ইমেইল ঠিকনা",
      field_aadhaar: "আধাৰ নম্বৰ (১২ টা সংখ্যা)",
      field_pan: "পেন নম্বৰ (PAN)",
      field_address: "স্থায়ী ঠিকনা",
      field_pincode: "পিন ক'ড",
      field_category: "হিতাধিকাৰী শ্ৰেণী",
      field_bank_account: "বেংক একাউণ্ট নম্বৰ (DBT সক্ৰিয়)",
      field_ifsc: "বেংক IFSC ক'ড",
      submit_application: "প্ৰমাণিত কৰক আৰু আবেদন দাখিল কৰক",
      pdf_page_title: "নথি সৰলীকৰণ সহায়ক",
      pdf_page_subtitle: "চৰকাৰী আঁচনি অসমীয়াত সহজে বুজি লওক।",
      read_aloud_btn: "পঢ়ি শুনক",
      download_summary_btn: "সাৰাংশ ডাউনলোড কৰক",
      voice_page_title: "ভইচ সহায়ক আৰু সুগমতা",
      voice_lang_card_title: "ৱেবছাইট আৰু ভইচ ভাষা",
      voice_lang_card_sub: "সমগ্ৰ ৱেবছাইট অনুবাদ কৰিবলৈ ভাষা বাছক।",
      floating_lang_tooltip: "সমগ্ৰ ৱেবছাইটৰ ভাষা সলনি কৰক"
    };

    // Sanskrit Catalog
    this.catalogs['sa'] = {
      ...this.catalogs['en'],
      app_title: "सरल सेतुः",
      app_tagline: "स्मार्ट प्रपत्रम् एवं प्रलेख सहायकः",
      nav_home: "गृहम्",
      nav_vault: "विवरण कोषः",
      nav_pdf: "प्रलेख सहायकः",
      nav_extension: "स्मार्ट प्रपत्रम्",
      nav_voice: "वाणी नियन्त्रणम्",
      welcome_title: "स्वागतम्, रमेश!",
      welcome_subtitle: "अत्र भवतः प्रमाणीकृतः शासकीय कोषः सक्रिय प्रपत्र सहायकः च उपलभ्यते।",
      autofill_btn: "एक-क्लिक् स्वपूरणम्",
      edit_vault_btn: "कोषं सम्पादयतु",
      field_full_name: "पूर्णं वैधानिकं नाम (आधारानुसारम्)",
      field_dob: "जन्मदिनाङ्कः",
      field_gender: "लिङ्गम्",
      field_phone: "दूरभाष संख्या",
      field_email: "ईमेल सङ्केतः",
      field_aadhaar: "आधार सङ्ख्या (12 अङ्काः)",
      field_pan: "स्थायी लेखा सङ्ख्या (PAN)",
      field_address: "निवास सङ्केतः",
      field_pincode: "पिन् कूटः",
      submit_application: "प्रमाणीकृत्य आवेदनं प्रेषयतु",
      pdf_page_title: "एआई प्रलेख सरलीकरणम्",
      read_aloud_btn: "उच्चैः श्रावयतु",
      voice_page_title: "वाणी सहायकः एवं सुगमता",
      voice_lang_card_title: "जालस्थान एवं वाणी भाषा",
      floating_lang_tooltip: "सम्पूर्ण जालस्थानस्य भाषां परिवर्तयतु"
    };

    // Automatically inherit for remaining languages (Maithili, Santali, Kashmiri, Nepali, Sindhi, Konkani, Dogri, Manipuri, Bodo)
    const baseRegional = ['mai', 'sat', 'ks', 'ne', 'sd', 'kok', 'doi', 'mni', 'brx'];
    baseRegional.forEach(code => {
      if (!this.catalogs[code]) {
        this.catalogs[code] = { ...this.catalogs['hi'] };
      }
    });
  }
}

// Global Singleton
window.SaralI18n = new MultilingualController();
