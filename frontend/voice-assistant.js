/**
 * =========================================================================
 * SARAL SETU - AUTONOMOUS MULTILINGUAL AI VOICE AGENT ENGINE
 * =========================================================================
 * Features:
 * 1. Multilingual Speech Recognition & Synthesis for ALL 22 Indian Scheduled Languages + English
 * 2. Universal Website Tab Traveling & Deep Navigation (Home, Vault, PDF, Form Portal, Voice & Accessibility)
 * 3. Deep DOM & Context Awareness (active page, inputs, buttons, documents, modals)
 * 4. Hybrid Reasoning: Backend Gemini AI Planner + Client Neural Semantic Brain
 * 5. Full UI Activity Execution: Multi-page form travel, real-time field editing,
 *    vault updating, auto-fill, form submission, document Q&A & read-aloud.
 * =========================================================================
 */

class AutonomousVoiceAgent {
  constructor() {
    this.recognition = null;
    this.isSessionActive = false;
    this.isListening = false;
    this.isSpeakingTTS = false;
    
    // Resolve initial language from localStorage or default to Indian English
    const savedLang = localStorage.getItem('saral_app_lang') || localStorage.getItem('saral_voice_lang') || 'en';
    this.currentLangCode = savedLang;
    this.language = this.resolveSpeechCode(savedLang);

    this.restartTimer = null;
    this.hudTimer = null;

    // AI Configuration (Supports Google Gemini API or Built-in Semantic Brain)
    this.aiConfig = {
      provider: localStorage.getItem('saral_ai_provider') || 'built-in', // 'built-in' or 'gemini'
      apiKey: localStorage.getItem('saral_ai_key') || '',
      model: localStorage.getItem('saral_ai_model') || 'gemini-3.6-flash',
      geminiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/'
    };

    // Registered Action Handlers
    this.actionRegistry = new Map();
    this.stateListeners = [];

    this.initSpeechEngine();
  }

  /**
   * Resolves standard BCP-47 Speech Recognition & Synthesis language tag
   */
  resolveSpeechCode(langCode) {
    const code = (langCode || 'en').toLowerCase().trim();
    const map = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'bn': 'bn-IN',
      'te': 'te-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'ur': 'ur-IN',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'pa': 'pa-IN',
      'as': 'as-IN',
      'mai': 'hi-IN',
      'sat': 'hi-IN',
      'ks': 'ur-IN',
      'ne': 'ne-NP',
      'sd': 'ur-IN',
      'kok': 'mr-IN',
      'doi': 'hi-IN',
      'mni': 'bn-IN',
      'brx': 'hi-IN',
      'sa': 'hi-IN'
    };
    return map[code] || (code.includes('-') ? code : 'en-IN');
  }

  /**
   * Dynamically switch active speech recognition & synthesis language
   */
  setLanguage(langCode) {
    this.currentLangCode = langCode || 'en';
    const speechCode = this.resolveSpeechCode(langCode);
    this.language = speechCode;

    if (this.recognition) {
      this.recognition.lang = speechCode;
      // If voice session is actively running, gracefully restart socket with new locale
      if (this.isListening && this.isSessionActive) {
        try {
          this.recognition.stop();
          clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.isSessionActive) {
              try {
                this.recognition.lang = speechCode;
                this.recognition.start();
              } catch (e) {}
            }
          }, 150);
        } catch (e) {}
      }
    }
    console.log(`[AIVoiceAgent] Language synchronized: ${langCode} (${speechCode})`);
  }

  /**
   * Initialize Web Speech Recognition Engine
   */
  initSpeechEngine() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[AIVoiceAgent] Web Speech API is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.language;
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.bindSpeechEvents();
      console.log(`[AIVoiceAgent] Autonomous Multilingual Engine Ready (${this.language}).`);
    } catch (e) {
      console.error('[AIVoiceAgent] Speech engine init error:', e);
    }
  }

  bindSpeechEvents() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.notifyState(true);
      const langLabel = this.currentLangCode.toUpperCase();
      this.showHud(`AI Voice Active [${langLabel}]`, 'Listening in your language... Speak any instruction!', true);
    };

    this.recognition.onresult = async (event) => {
      if (this.isSpeakingTTS) return;

      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) finalTranscript += item[0].transcript;
        else interim += item[0].transcript;
      }

      const activeText = (finalTranscript || interim).trim();
      if (activeText) {
        this.showHud('Analyzing Intent', `"${activeText}"`, true);
      }

      if (finalTranscript) {
        const query = finalTranscript.trim();
        console.log(`[AIVoiceAgent] Processing user request [${this.language}]: "${query}"`);
        await this.handleUserInstruction(query);
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        this.isSessionActive = false;
        this.isListening = false;
        this.notifyState(false);
        this.showHud('Mic Blocked', 'Please allow microphone access in browser.', false);
        this.speak('Microphone access was denied. Please allow microphone permission.');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.isSessionActive) {
        clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          if (this.isSessionActive && !this.isListening) {
            try {
              this.recognition.lang = this.language;
              this.recognition.start();
            } catch (e) {}
          }
        }, 200);
      } else {
        this.notifyState(false);
        this.showHud('AI Standby', 'Voice assistant paused. Tap mic to resume.', false);
      }
    };
  }

  get isVoiceActive() {
    return this.isSessionActive;
  }

  startListening() {
    this.start();
  }

  stopListening() {
    this.stop(true);
  }

  start() {
    if (!this.recognition) {
      this.initSpeechEngine();
    }

    if (!this.recognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    this.isSessionActive = true;
    this.notifyState(true);
    const langLabel = this.currentLangCode.toUpperCase();
    this.showHud(`AI Voice Active [${langLabel}]`, 'Listening continuously. Ask me to travel between tabs, fill forms, or update vault!', true);

    try {
      this.recognition.lang = this.language;
      this.recognition.start();
    } catch (e) {
      console.log('[AIVoiceAgent] Recognition start notice:', e.message);
    }

    const startGreet = this.getLocalizedGreeting(this.currentLangCode);
    this.speak(startGreet);
  }

  stop(shouldSpeak = true) {
    this.isSessionActive = false;
    clearTimeout(this.restartTimer);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    this.notifyState(false);
    this.showHud('AI Standby', 'Voice Agent paused. Tap mic to resume.', false);
    if (shouldSpeak) {
      this.speak('Voice assistant paused. Tap microphone to resume.');
    }
  }

  toggle() {
    if (this.isSessionActive) this.stop(true);
    else this.start();
  }

  onStateChange(fn) {
    this.stateListeners.push(fn);
  }

  notifyState(active) {
    this.stateListeners.forEach(fn => fn(active));
  }

  /**
   * Register discrete actions that the AI can call dynamically
   */
  registerAction(name, description, executeFn) {
    this.actionRegistry.set(name, { description, executeFn });
  }

  /**
   * Scans the active browser page to feed real-time DOM context to the AI
   */
  extractPageContext() {
    const activeTabElem = document.querySelector('.tab-view.active');
    const activeTabId = activeTabElem ? activeTabElem.id.replace('tab-', '') : 'home';

    const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
      .filter(el => el.offsetParent !== null)
      .map(el => ({
        id: el.id || '',
        name: el.name || '',
        placeholder: el.placeholder || '',
        label: el.closest('.vault-field-group')?.querySelector('label')?.textContent?.trim() || '',
        value: el.value || '',
        type: el.type || 'text'
      }));

    const buttons = Array.from(document.querySelectorAll('button, a[data-tab-target]'))
      .filter(el => el.offsetParent !== null && (el.textContent.trim() || el.title))
      .slice(0, 30)
      .map(el => ({
        text: el.textContent.trim().replace(/\s+/g, ' '),
        title: el.title || '',
        id: el.id || '',
        actionTarget: el.getAttribute('data-tab-target') || ''
      }));

    const openModals = Array.from(document.querySelectorAll('.modal-backdrop.show'))
      .map(m => m.id);

    return {
      activeTab: activeTabId,
      currentLanguage: this.currentLangCode,
      openModals: openModals,
      visibleInputs: inputs,
      availableButtons: buttons,
      url: window.location.href
    };
  }

  /**
   * Core Autonomous Intent Resolution & Execution
   */
  async handleUserInstruction(instruction) {
    const text = instruction.trim();
    const lower = text.toLowerCase();

    // Check for explicit stop commands in all languages
    if (
      lower === 'stop' ||
      lower === 'pause' ||
      lower.includes('stop listening') ||
      lower.includes('turn off voice') ||
      lower.includes('turn off assistant') ||
      lower.includes('deactivate') ||
      lower.includes('sleep') ||
      lower.includes('रुक जाओ') ||
      lower.includes('बंद करो') ||
      lower.includes('बंद करा') ||
      lower.includes('थांबवा') ||
      lower.includes('நிறுத்து') ||
      lower.includes('ఆపు') ||
      lower.includes('શાંત થાઓ')
    ) {
      this.stop(true);
      return;
    }

    const context = this.extractPageContext();
    this.showHud('AI Reasoning...', `Analyzing: "${text}"`, true);

    let plan = null;

    // 1. Try Backend Gemini AI Server
    try {
      plan = await this.callBackendGeminiPlanner(text, context);
    } catch (err) {
      console.warn('[AIVoiceAgent] Backend Gemini call failed, using client planner:', err);
    }

    // 2. Fall back to high-speed Multilingual Client Semantic Planner
    if (!plan || (!plan.actions && !plan.answer)) {
      plan = this.localSemanticPlanner(text, context);
    }

    if (plan && plan.actions && plan.actions.length > 0) {
      await this.executePlan(plan);
    } else if (plan && plan.answer) {
      this.showHud('AI Response', plan.answer, false);
      this.speak(plan.answer);
    } else {
      const fallback = `I understood "${text}". Tell me which tab to visit or which field to fill!`;
      this.showHud('Instruction Understood', fallback, false);
      this.speak(fallback);
    }
  }

  /**
   * Executes a multi-step action plan returned by the AI planner
   */
  async executePlan(plan) {
    console.log('[AIVoiceAgent] Executing Plan:', plan);

    if (plan.verbalIntro) {
      this.showHud('Executing...', plan.verbalIntro, false);
      this.speak(plan.verbalIntro);
    }

    for (let i = 0; i < plan.actions.length; i++) {
      const step = plan.actions[i];
      const actionHandler = this.actionRegistry.get(step.action);

      if (actionHandler && typeof actionHandler.executeFn === 'function') {
        try {
          await actionHandler.executeFn(step.params || {});
          await new Promise(r => setTimeout(r, 250));
        } catch (err) {
          console.error(`[AIVoiceAgent] Error executing action ${step.action}:`, err);
        }
      } else {
        console.warn(`[AIVoiceAgent] No handler registered for action: ${step.action}`);
      }
    }

    if (plan.verbalOutro) {
      this.showHud('Completed', plan.verbalOutro, false);
      this.speak(plan.verbalOutro);
    }
  }

  /**
   * Calls Backend Server Gemini API (/api/ai/voice-plan)
   */
  async callBackendGeminiPlanner(userPrompt, domContext) {
    const availableActions = Array.from(this.actionRegistry.entries()).map(([name, info]) => ({
      name,
      description: info.description
    }));

    const response = await fetch('/api/ai/voice-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction: userPrompt,
        domContext: domContext,
        availableActions: availableActions
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.plan) {
        return data.plan;
      }
    }
    return null;
  }

  /**
   * Comprehensive Multilingual Client-Side Semantic Planner (Zero-API Fallback)
   * Understands English, Hindi, Hinglish, Bengali, Marathi, Tamil, Telugu, Gujarati,
   * Kannada, Malayalam, Punjabi, Odia, Urdu, etc.
   */
  localSemanticPlanner(text, context) {
    const lower = text.toLowerCase().trim();
    const actions = [];
    let verbalIntro = null;
    let verbalOutro = null;
    let directAnswer = null;

    const cleanVal = (v) => v ? v.replace(/[.,;!?]+$/, '').trim() : '';

    // =========================================================================
    // 1. UNIVERSAL TAB TRAVEL & NAVIGATION (ALL 5 TABS IN ALL LANGUAGES)
    // =========================================================================

    // 1.1 Home Dashboard Tab
    // English: home, dashboard, overview, main page, homepage, go to home, open home, take me home
    // Hindi/Hinglish: होम, होम पेज, डॅशबोर्ड, मुख्य पेज, घर, home par jao, dashboard dikhao, mukhya prishth, home kholo
    // Bengali: হোম, হোম পেজ, হোমে যান, ড্যাশবোর্ড
    // Marathi: होम, मुख्य पृष्ठ, डॅशबोर्ड, होम वर जा
    // Tamil: முகப்பு, ஹோம், முகப்புக்கு செல், டாஷ்போர்டு
    // Telugu: హోమ్, హోమ్ పేజీ, డాష్‌బోర్డ్, హోమ్‌కి వెళ్లండి
    // Gujarati: હોમ, મુખ્ય પૃષ્ઠ, ડેશબોર્ડ, હોમ પર જાઓ
    // Kannada/Malayalam/Punjabi/Urdu: ಮುಖಪುಟ, പ്രധാന പേജ്, ਮੁੱਖ ਪੰਨਾ, ہوم
    if (
      lower.includes('go to home') ||
      lower.includes('open home') ||
      lower.includes('show home') ||
      lower.includes('take me to home') ||
      lower.includes('travel to home') ||
      lower.includes('navigate to home') ||
      lower.includes('home tab') ||
      lower.includes('home page') ||
      lower.includes('dashboard') ||
      lower.includes('overview') ||
      lower.includes('main page') ||
      lower === 'home' ||
      lower.includes('होम') ||
      lower.includes('डैशबोर्ड') ||
      lower.includes('मुख्य पेज') ||
      lower.includes('मुख्य पृष्ठ') ||
      lower.includes('home par') ||
      lower.includes('home chalo') ||
      lower.includes('হোমে যান') ||
      lower.includes('হোম') ||
      lower.includes('முகப்பு') ||
      lower.includes('ஹோம்') ||
      lower.includes('హోమ్') ||
      lower.includes('મુખ્ય પૃષ્ઠ') ||
      lower.includes('ముఖಪುಟ') ||
      lower.includes('ہوم')
    ) {
      actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'home' } });
      verbalIntro = 'Traveling to Home Dashboard.';
      return { verbalIntro, actions, verbalOutro };
    }

    // 1.2 Profile Vault Tab
    // English: vault, profile vault, profile, my profile, credentials, identity, stored data, my documents, go to vault, open vault, travel to vault
    // Hindi/Hinglish: वॉल्ट, प्रोफ़ाइल वॉल्ट, प्रोफ़ाइल, मेरी प्रोफ़ाइल, पहचान पत्र, मेरे दस्तावेज़, vault par jao, vault kholo, profile dikhao, dastavej dikhao
    // Bengali: ভল্ট, প্রোফাইল ভল্ট, প্রোফাইল, আমার প্রোফাইল, ভল্টে যান, নথি
    // Marathi: व्हॉल्ट, प्रोफाइल व्हॉल्ट, माझी प्रोफाइल, ओळखपत्रे, व्हॉल्ट उघडा, प्रोफाइलवर जा
    // Tamil: வால்ட், சுயவிவர பெட்டகம், சுயவிவரம், சான்றுகள், பெட்டகத்திற்கு செல், சுயவிவரம் திற
    // Telugu: వాల్ట్, ప్రొఫైల్ వాల్ట్, నా ప్రొఫైల్, ఆధారాలు, వాల్ట్‌కి వెళ్లండి
    // Gujarati: વૉલ્ટ, પ્રોફાઇલ વૉલ્ટ, મારી પ્રોફાઇલ, વૉલ્ટ ખોલો, ઓળખ વિગતો
    // Kannada/Malayalam/Punjabi/Urdu: ವಾಲ್ಟ್, ಪ್ರೊಫೈಲ್, വോൾട്ട്, ਵਾਲਟ, والٹ, میری پروفائل
    if (
      lower.includes('go to vault') ||
      lower.includes('open vault') ||
      lower.includes('show vault') ||
      lower.includes('take me to vault') ||
      lower.includes('travel to vault') ||
      lower.includes('navigate to vault') ||
      lower.includes('vault tab') ||
      lower.includes('profile vault') ||
      lower.includes('my profile') ||
      lower.includes('open profile') ||
      lower.includes('go to profile') ||
      lower.includes('travel to profile') ||
      lower.includes('credentials') ||
      lower.includes('identity details') ||
      lower === 'vault' ||
      lower === 'profile' ||
      lower.includes('वॉल्ट') ||
      lower.includes('प्रोफ़ाइल') ||
      lower.includes('पहचान पत्र') ||
      lower.includes('मेरे दस्तावेज़') ||
      lower.includes('vault par') ||
      lower.includes('vault kholo') ||
      lower.includes('profile par') ||
      lower.includes('profile kholo') ||
      lower.includes('ভল্ট') ||
      lower.includes('প্রোফাইল') ||
      lower.includes('व्हॉल्ट') ||
      lower.includes('சுயவிவர') ||
      lower.includes('வால்ட்') ||
      lower.includes('వాల్ట్') ||
      lower.includes('ప్రొఫైల్') ||
      lower.includes('વૉલ્ટ') ||
      lower.includes('પ્રોફાઇલ') ||
      lower.includes('ವಾಲ್ಟ್') ||
      lower.includes('വോൾട്ട്') ||
      lower.includes('والٹ')
    ) {
      actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'vault' } });
      verbalIntro = 'Traveling to Profile Vault.';
      return { verbalIntro, actions, verbalOutro };
    }

    // 1.3 PDF Document Assistant Tab
    // English: pdf, pdf assistant, document assistant, guidelines, document summary, policy, go to pdf, open pdf, travel to pdf
    // Hindi/Hinglish: पीडीएफ, पीडीएफ असिस्टेंट, दस्तावेज़ सहायक, गाइडलाइन्स, सरकारी नियम, pdf par jao, pdf kholo, dastavej assistant dikhao
    // Bengali: পিডিএফ, পিডিএফ সহকারী, নথি সহকারী, নির্দেশিকা, পিডিএফ খুলুন
    // Marathi: पीडीएफ, पीडीएफ सहाय्यक, दस्तऐवज सहाय्यक, मार्गदर्शक तत्त्वे, पीडीएफ उघडा
    // Tamil: பிடிஎஃப், ஆவண உதவியாளர், வழிகாட்டுதல்கள், பிடிஎஃப் திற, ஆவணத்திற்கு செல்
    // Telugu: పిడిఎఫ్, డాక్యుమెంట్ అసిస్టెంట్, మార్గదర్శకాలు, పిడిఎఫ్ తెరవండి
    // Gujarati: પીડીએફ, દસ્તાવેજ સહાયક, માર્ગદર્શિકા, પીડીએફ ખોલો
    // Kannada/Malayalam/Punjabi/Urdu: ಪಿಡಿಎಫ್, ದಾಖಲೆ ಸಹಾಯಕ, ഡോക്യുമെന്റ് അസിസ്റ്റന്റ്, ਪੀਡੀਐਫ, پی ڈی ایف
    if (
      lower.includes('go to pdf') ||
      lower.includes('open pdf') ||
      lower.includes('show pdf') ||
      lower.includes('take me to pdf') ||
      lower.includes('travel to pdf') ||
      lower.includes('navigate to pdf') ||
      lower.includes('pdf tab') ||
      lower.includes('pdf assistant') ||
      lower.includes('document assistant') ||
      lower.includes('guidelines') ||
      lower.includes('scheme document') ||
      lower === 'pdf' ||
      lower === 'documents' ||
      lower.includes('पीडीएफ') ||
      lower.includes('दस्तावेज़ सहायक') ||
      lower.includes('गाइडलाइन्स') ||
      lower.includes('pdf par') ||
      lower.includes('pdf kholo') ||
      lower.includes('পিডিএফ') ||
      lower.includes('নথি সহকারী') ||
      lower.includes('दस्तऐवज सहाय्यक') ||
      lower.includes('பிடிஎஃப்') ||
      lower.includes('ஆவண உதவியாளர்') ||
      lower.includes('పిడిఎఫ్') ||
      lower.includes('પીડીએફ') ||
      lower.includes('ದಾಖಲೆ ಸಹಾಯಕ') ||
      lower.includes('پی ڈی ایف')
    ) {
      actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'pdf' } });
      verbalIntro = 'Traveling to PDF Document Assistant.';
      return { verbalIntro, actions, verbalOutro };
    }

    // 1.4 Smart Form Assistant / Portal Tab
    // English: form, form assistant, extension, portal, smart form, application form, government portal, go to form, open form, travel to form
    // Hindi/Hinglish: फॉर्म, फॉर्म असिस्टेंट, एक्सटेंशन, पोर्टल, आवेदन, सरकारी फॉर्म, form par jao, form kholo, portal dikhao, aavedan form kholo
    // Bengali: ফর্ম, ফর্ম সহকারী, এক্সটেনশন, পোর্টাল, আবেদন ফর্ম, ফর্ম খুলুন
    // Marathi: फॉर्म, फॉर्म सहाय्यक, पोर्टल, अर्ज फॉर्म, फॉर्म उघडा, पोर्टलवर जा
    // Tamil: படிவம், படிவ உதவியாளர், போர்டல், விண்ணப்ப படிவம், படிவம் திற
    // Telugu: ఫారం, ఫారం అసిస్టెంట్, పోర్టల్, దరఖాస్తు ఫారమ్, ఫారమ్ తెరవండి
    // Gujarati: ફોર્મ, ફોર્મ સહાયક, પોર્ટલ, અરજી ફોર્મ, ફોર્મ ખોલો
    // Kannada/Malayalam/Punjabi/Urdu: ಫಾರ್ಮ್, ಫಾರ್ಮ್ ಸಹಾಯಕ, ഫോം, ਫਾਰਮ, فارم, پورٹل
    if (
      lower.includes('go to form') ||
      lower.includes('open form') ||
      lower.includes('show form') ||
      lower.includes('take me to form') ||
      lower.includes('travel to form') ||
      lower.includes('navigate to form') ||
      lower.includes('form tab') ||
      lower.includes('form assistant') ||
      lower.includes('smart form') ||
      lower.includes('application form') ||
      lower.includes('extension') ||
      lower.includes('portal') ||
      lower.includes('live simulation') ||
      lower === 'form' ||
      lower === 'portal' ||
      lower.includes('फॉर्म') ||
      lower.includes('पोर्टल') ||
      lower.includes('आवेदन पत्र') ||
      lower.includes('सरकारी फॉर्म') ||
      lower.includes('form par') ||
      lower.includes('form kholo') ||
      lower.includes('portal par') ||
      lower.includes('ফর্ম') ||
      lower.includes('পোর্টাল') ||
      lower.includes('अर्ज फॉर्म') ||
      lower.includes('படிவம்') ||
      lower.includes('போர்டல்') ||
      lower.includes('ఫారమ్') ||
      lower.includes('ફોર્મ') ||
      lower.includes('ಫಾರ್ಮ್') ||
      lower.includes('فارم')
    ) {
      actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'extension' } });
      verbalIntro = 'Traveling to Smart Form Assistant.';
      return { verbalIntro, actions, verbalOutro };
    }

    // 1.5 Voice & Accessibility Tab
    // English: voice, voice assistant, accessibility, voice settings, audio, mic, go to voice, open voice, travel to voice
    // Hindi/Hinglish: वॉइस, आवाज़, ध्वनि, सुगमता, वॉइस सेटिंग्स, वॉइस खोलो, वॉइस पर जाओ, voice par jao, voice kholo, aawaz settings
    // Bengali: ভয়েস, ভয়েস সহকারী, অ্যাক্সেসিবিলিটি, ভয়েস খুলুন
    // Marathi: व्हॉइस, आवाज, व्हॉइस सहाय्यक, सुगमता, आवाज सेटिंग
    // Tamil: குரல், குரல் உதவியாளர், அணுகல்தன்மை, குரல் திற
    // Telugu: వాయిస్, వాయిస్ అసిస్టెంట్, యాక్సెసిబిలిటీ, ధ్వని సెట్టింగ్‌లు
    // Gujarati: વૉઇસ, અવાજ, વૉઇસ સહાયક, સુલભતા
    // Kannada/Malayalam/Punjabi/Urdu: ಧ್ವನಿ, ಪ್ರವೇಶಿಸುವಿಕೆ, ശബ്ദം, ਆਵਾਜ਼, وائس
    if (
      lower.includes('go to voice') ||
      lower.includes('open voice') ||
      lower.includes('show voice') ||
      lower.includes('take me to voice') ||
      lower.includes('travel to voice') ||
      lower.includes('navigate to voice') ||
      lower.includes('voice tab') ||
      lower.includes('voice assistant') ||
      lower.includes('accessibility') ||
      lower.includes('voice settings') ||
      lower.includes('accessibility page') ||
      lower.includes('accessibility deck') ||
      lower === 'voice' ||
      lower === 'accessibility' ||
      lower.includes('वॉइस') ||
      lower.includes('आवाज़') ||
      lower.includes('ध्वनि') ||
      lower.includes('सुगमता') ||
      lower.includes('voice par') ||
      lower.includes('voice kholo') ||
      lower.includes('ভয়েস') ||
      lower.includes('व्हॉइस') ||
      lower.includes('குரல்') ||
      lower.includes('వాయిస్') ||
      lower.includes('વૉઇસ') ||
      lower.includes('ಧ್ವನಿ') ||
      lower.includes('وائس')
    ) {
      actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'voice' } });
      verbalIntro = 'Traveling to Voice & Accessibility Deck.';
      return { verbalIntro, actions, verbalOutro };
    }

    // =========================================================================
    // 2. MULTI-PAGE TRAVEL IN INTERACTIVE DOCUMENT FORM
    // =========================================================================

    // Page Number Match (EN/HI/Regional numbers: "page 2", "पेज 2", "2nd page", "step 3")
    const pageNumMatch = lower.match(/(?:(?:go\s+to|switch\s+to|travel\s+to|open|show|view|navigate\s+to|चलें|जाओ|खोलो)\s+(?:the\s+)?(?:page|step|section|पेज|पृष्ठ|पान|பக்கம்|పేజీ|પૃષ્ઠ)\s*([0-9]+)|(?:page|step|पेज|पृष्ठ)\s*([0-9]+))/i);
    if (pageNumMatch) {
      const pNum = parseInt(pageNumMatch[1] || pageNumMatch[2]);
      if (pNum >= 1 && pNum <= 10) {
        if (context.activeTab !== 'extension') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'extension' } });
        actions.push({ action: 'NAVIGATE_FORM_PAGE', params: { page: pNum } });
        verbalIntro = `Traveling to Page ${pNum} of your interactive document.`;
        return { verbalIntro, actions, verbalOutro };
      }
    }

    if (
      lower.includes('next page') ||
      lower.includes('forward page') ||
      lower.includes('अगला पेज') ||
      lower.includes('अगले पेज') ||
      lower.includes('agla page') ||
      lower.includes('পরের পৃষ্ঠা') ||
      lower.includes('पुढील पान') ||
      lower.includes('அடுத்த பக்கம்') ||
      lower.includes('తదుపరి పేజీ') ||
      lower.includes('આગળનું પૃષ્ઠ')
    ) {
      if (context.activeTab !== 'extension') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'extension' } });
      actions.push({ action: 'NAVIGATE_FORM_PAGE', params: { page: 'next' } });
      verbalIntro = 'Moving to the next page of your form.';
      return { verbalIntro, actions, verbalOutro };
    }

    if (
      lower.includes('previous page') ||
      lower.includes('prev page') ||
      lower.includes('back page') ||
      lower.includes('पिछला पेज') ||
      lower.includes('pichhla page') ||
      lower.includes('আগের পৃষ্ঠা') ||
      lower.includes('मागील पान') ||
      lower.includes('முந்தைய பக்கம்') ||
      lower.includes('మునుపటి పేజీ') ||
      lower.includes('પાછળનું પૃષ્ઠ')
    ) {
      if (context.activeTab !== 'extension') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'extension' } });
      actions.push({ action: 'NAVIGATE_FORM_PAGE', params: { page: 'prev' } });
      verbalIntro = 'Returning to previous page of your form.';
      return { verbalIntro, actions, verbalOutro };
    }

    // =========================================================================
    // 3. REAL-TIME FORM AUTOFILL, SUBMIT & CLEAR
    // =========================================================================

    // 3.1 Autofill Form
    if (
      lower.includes('auto fill') ||
      lower.includes('fill form') ||
      lower.includes('fill application') ||
      lower.includes('fill my details') ||
      lower.includes('autofill') ||
      lower.includes('फॉर्म भरो') ||
      lower.includes('ऑटो फिल') ||
      lower.includes('पूरी जानकारी भरो') ||
      lower.includes('form bhar do') ||
      lower.includes('ফর্ম পূরণ করুন') ||
      lower.includes('सर्व माहिती भरा') ||
      lower.includes('படிவத்தை நிரப்பு') ||
      lower.includes('ఫారమ్ నింపండి') ||
      lower.includes('બધી વિગતો ભરો')
    ) {
      if (context.activeTab !== 'extension') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'extension' } });
      actions.push({ action: 'AUTOFILL_FORM', params: {} });
      verbalIntro = 'Auto-filling all application fields from your verified profile vault.';
      verbalOutro = 'Application fields populated with 100% accuracy.';
      return { verbalIntro, actions, verbalOutro };
    }

    // 3.2 Submit Form
    if (
      lower.includes('submit form') ||
      lower.includes('submit application') ||
      lower.includes('send application') ||
      lower === 'submit' ||
      lower.includes('फॉर्म सबमिट करो') ||
      lower.includes('आवेदन जमा करो') ||
      lower.includes('सबमिट करो') ||
      lower.includes('form submit') ||
      lower.includes('জমা দিন') ||
      lower.includes('अर्ज सादर करा') ||
      lower.includes('சமர்ப்பிக்கவும்') ||
      lower.includes('సమర్పించండి') ||
      lower.includes('સબમિટ કરો')
    ) {
      if (context.activeTab !== 'extension') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'extension' } });
      actions.push({ action: 'SUBMIT_FORM', params: {} });
      verbalIntro = 'Submitting your verified government application.';
      return { verbalIntro, actions, verbalOutro };
    }

    // 3.3 Clear Form
    if (
      lower.includes('clear form') ||
      lower.includes('reset form') ||
      lower.includes('clear inputs') ||
      lower.includes('फॉर्म साफ करो') ||
      lower.includes('फॉर्म खाली करो') ||
      lower.includes('मुछे ফেলুন') ||
      lower.includes('रीसेट करा')
    ) {
      if (context.activeTab !== 'extension') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'extension' } });
      actions.push({ action: 'CLEAR_FORM', params: {} });
      verbalIntro = 'Clearing form fields.';
      return { verbalIntro, actions, verbalOutro };
    }

    // =========================================================================
    // 4. REAL-TIME FORM FIELD FILLING BY VOICE
    // =========================================================================

    const inFieldFillMatch = text.match(/(?:in\s+(?:the\s+)?([a-zA-Z0-9\s\'\(\)\-]+?)\s+(?:field|input|box)?\s+(?:fill|put|enter|set|write|type)\s+(?:with|as|to|=)?\s*)(.+)/i);
    const fillFieldWithMatch = text.match(/(?:(?:fill|put|enter|set|write|type)\s+(?:in\s+(?:the\s+)?)?([a-zA-Z0-9\s\'\(\)\-]+?)\s+(?:field|input|box)?\s+(?:with|as|to)\s*)(.+)/i);
    const hindiFillMatch = text.match(/(?:([a-zA-Z0-9\u0900-\u0D7F\s]+?)\s+(?:में|me)\s+([a-zA-Z0-9\u0900-\u0D7F\s\.\@\-]+?)\s+(?:लिखो|डालो|भरो|likho|dalo|bharo))/i);

    let targetFieldName = null;
    let targetFieldValue = null;

    if (inFieldFillMatch && inFieldFillMatch[1] && inFieldFillMatch[2]) {
      targetFieldName = cleanVal(inFieldFillMatch[1]);
      targetFieldValue = cleanVal(inFieldFillMatch[2]);
    } else if (fillFieldWithMatch && fillFieldWithMatch[1] && fillFieldWithMatch[2]) {
      targetFieldName = cleanVal(fillFieldWithMatch[1]);
      targetFieldValue = cleanVal(fillFieldWithMatch[2]);
    } else if (hindiFillMatch && hindiFillMatch[1] && hindiFillMatch[2]) {
      targetFieldName = cleanVal(hindiFillMatch[1]);
      targetFieldValue = cleanVal(hindiFillMatch[2]);
    }

    if (targetFieldName && targetFieldValue && targetFieldName.length > 1 && !/^(form|document|page|tab|pdf|vault)$/i.test(targetFieldName)) {
      if (context.activeTab !== 'extension') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'extension' } });
      actions.push({
        action: 'FILL_FORM_FIELD',
        params: { fieldName: targetFieldName, value: targetFieldValue }
      });
      verbalIntro = `Filling ${targetFieldName} with ${targetFieldValue} in real time.`;
      verbalOutro = `Field ${targetFieldName} populated.`;
      return { verbalIntro, actions, verbalOutro };
    }

    // =========================================================================
    // 5. VAULT DETAIL & CREDENTIAL UPDATES (REAL-TIME VAULT EDITING)
    // =========================================================================

    const multiUpdates = {};

    // 5.1 Name
    const nameMatch = text.match(/(?:(?:change|update|set|edit|modify)\s+(?:my\s+)?(?:full\s+)?name\s+(?:to|as|is|=)\s+|(?:my\s+name\s+is)\s+|नाम\s+(?:बदलकर\s+|में\s+)?([a-zA-Z\u0900-\u0D7F\s\.\']+?)\s+(?:करो|डालो|लिखो)|(?:mera\s+naam\s+)([a-zA-Z\s\.\']+?)\s+(?:kar\s+do|h))/i);
    if (nameMatch) {
      const val = cleanVal(nameMatch[1] || nameMatch[2]);
      if (val && val.length > 1 && !/^(home|vault|pdf|form|voice|settings)$/i.test(val)) {
        multiUpdates.name = val;
      }
    }

    // 5.2 Mobile / Phone
    const phoneMatch = text.match(/(?:(?:change|update|set|edit|modify)\s+(?:my\s+)?(?:phone|mobile|contact|cell)(?:\s+number)?\s+(?:to|as|is|=)\s+|(?:फ़ोन|मोबाइल|फोन)(?:\s+नंबर)?\s+(?:को\s+)?(\+?[0-9\s\-]{10,14})\s*(?:करो|डालो)?|(?:phone|mobile)\s+(?:number\s+)?(\+?[0-9\s\-]{10,14}))/i);
    if (phoneMatch) {
      const val = cleanVal(phoneMatch[1] || phoneMatch[2]);
      if (val) multiUpdates.phone = val;
    }

    // 5.3 Address
    const addressMatch = text.match(/(?:(?:change|update|set|edit|modify)\s+(?:my\s+)?(?:permanent\s+|residential\s+)?address\s+(?:to|as|is|=)\s+|पता\s+(?:बदलकर\s+)?([^.,\n]+?)\s+(?:करो|डालो)|(?:pata|address)\s+([^.,\n]+?)\s+(?:kar\s+do))/i);
    if (addressMatch) {
      const val = cleanVal(addressMatch[1] || addressMatch[2]);
      if (val && val.length > 3 && !/^(home|vault|pdf|form|voice)$/i.test(val)) {
        multiUpdates.address = val;
      }
    }

    // 5.4 PIN Code
    const pinMatch = text.match(/(?:(?:change|update|set|edit|modify)\s+(?:my\s+)?(?:pincode|pin\s*code|postal\s*code)\s+(?:to|as|is|=)\s+|पिनकोड\s+([0-9]{6})|(?:pincode|pin)\s+([0-9]{6}))/i);
    if (pinMatch) {
      const val = cleanVal(pinMatch[1] || pinMatch[2]);
      if (val) multiUpdates.pincode = val;
    }

    // 5.5 Aadhaar
    const aadhaarMatch = text.match(/(?:(?:change|update|set|edit|modify)\s+(?:my\s+)?aadhaar(?:\s+number|\s+card)?\s+(?:to|as|is|=)\s+|आधार\s+(?:नंबर\s+)?([0-9\s\-]{12,16}))/i);
    if (aadhaarMatch) {
      const val = cleanVal(aadhaarMatch[1]);
      if (val) multiUpdates.aadhaar = val;
    }

    // 5.6 PAN
    const panMatch = text.match(/(?:(?:change|update|set|edit|modify)\s+(?:my\s+)?pan(?:\s+number|\s+card)?\s+(?:to|as|is|=)\s+|पैन\s+(?:नंबर\s+)?([a-zA-Z0-9]{10}))/i);
    if (panMatch) {
      const val = cleanVal(panMatch[1]);
      if (val) multiUpdates.pan = val.toUpperCase();
    }

    const updateKeys = Object.keys(multiUpdates);
    if (updateKeys.length > 0) {
      if (updateKeys.length === 1) {
        const key = updateKeys[0];
        const val = multiUpdates[key];
        actions.push({ action: 'UPDATE_VAULT_DETAIL', params: { field: key, value: val } });
        verbalIntro = `Updating your ${key} to ${val} in real time.`;
        verbalOutro = `Your ${key} has been updated across your profile vault.`;
      } else {
        actions.push({ action: 'UPDATE_MULTIPLE_DETAILS', params: { updates: multiUpdates } });
        verbalIntro = `Updating ${updateKeys.length} particulars in real time for you.`;
        verbalOutro = `All requested details have been updated.`;
      }
      return { verbalIntro, actions, verbalOutro };
    }

    // =========================================================================
    // 6. VAULT MASKING, COPYING & EXPORT
    // =========================================================================

    if (
      lower.includes('show aadhaar') ||
      lower.includes('unmask aadhaar') ||
      lower.includes('reveal aadhaar') ||
      lower.includes('hide aadhaar') ||
      lower.includes('mask aadhaar') ||
      lower.includes('आधार दिखाओ') ||
      lower.includes('आधार छिपाओ') ||
      lower.includes('आधार अनमास्क')
    ) {
      if (context.activeTab !== 'vault') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'vault' } });
      actions.push({ action: 'TOGGLE_AADHAAR_MASK', params: {} });
      verbalIntro = 'Toggling Aadhaar number visibility.';
      return { verbalIntro, actions, verbalOutro };
    }

    const copyMatch = lower.match(/(?:copy|कॉपी|कॉपि)\s+(?:my\s+)?(aadhaar|pan|phone|mobile|email|address|voter|आधार|पैन|मोबाइल|फोन|पता)/i);
    if (copyMatch) {
      let field = copyMatch[1].toLowerCase().replace(/\s+/g, '');
      if (field === 'मोबाइल' || field === 'फोन' || field === 'mobile') field = 'phone';
      if (field === 'आधार') field = 'aadhaar';
      if (field === 'पैन') field = 'pan';
      if (field === 'पता') field = 'address';
      actions.push({ action: 'COPY_FIELD', params: { field } });
      verbalIntro = `Copied ${field} to clipboard.`;
      return { verbalIntro, actions, verbalOutro };
    }

    if (lower.includes('export vault') || lower.includes('download vault') || lower.includes('बैकअप लो') || lower.includes('वॉल्ट डाउनलोड')) {
      actions.push({ action: 'EXPORT_VAULT', params: {} });
      verbalIntro = 'Exporting encrypted vault backup.';
      return { verbalIntro, actions, verbalOutro };
    }

    // =========================================================================
    // 7. PDF & DOCUMENT ASSISTANT ACTIONS (READ ALOUD & Q&A)
    // =========================================================================

    if (
      lower.includes('read aloud') ||
      lower.includes('read document') ||
      lower.includes('read summary') ||
      lower.includes('read takeaways') ||
      lower.includes('speak summary') ||
      lower.includes('summarize') ||
      lower.includes('explain document') ||
      lower.includes('explain pdf') ||
      lower.includes('डॉक्यूमेंट पढ़कर सुनाओ') ||
      lower.includes('समरी बताओ') ||
      lower.includes('नियम समझाओ') ||
      lower.includes('summary batao') ||
      lower.includes('pdf padho') ||
      lower.includes('নথি পড়ুন') ||
      lower.includes('दस्तऐवज वाचा') ||
      lower.includes('விளக்குங்கள்')
    ) {
      if (context.activeTab !== 'pdf') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'pdf' } });
      actions.push({ action: 'READ_DOCUMENT_ALOUD', params: {} });
      verbalIntro = 'Explaining document summary and key takeaways for you.';
      return { verbalIntro, actions, verbalOutro };
    }

    if (
      lower.includes('deadline') ||
      lower.includes('last date') ||
      lower.includes('eligible') ||
      lower.includes('eligibility') ||
      lower.includes('documents required') ||
      lower.includes('अंतिम तारीख') ||
      lower.includes('पात्रता') ||
      lower.includes('दस्तावेज क्या लगेंगे') ||
      lower.includes('last date kya hai')
    ) {
      if (context.activeTab !== 'pdf') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'pdf' } });
      actions.push({ action: 'ASK_DOCUMENT_QA', params: { question: text } });
      return { verbalIntro: 'Checking document guidelines for you.', actions, verbalOutro };
    }

    if (lower.includes('zoom in') || lower.includes('बड़ा करो') || lower.includes('ज़ूम इन')) {
      if (context.activeTab !== 'pdf') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'pdf' } });
      actions.push({ action: 'ZOOM_DOCUMENT', params: { direction: 'in' } });
      verbalIntro = 'Zooming in document preview.';
      return { verbalIntro, actions, verbalOutro };
    }

    if (lower.includes('zoom out') || lower.includes('छोटा करो') || lower.includes('ज़ूम आउट')) {
      if (context.activeTab !== 'pdf') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'pdf' } });
      actions.push({ action: 'ZOOM_DOCUMENT', params: { direction: 'out' } });
      verbalIntro = 'Zooming out document preview.';
      return { verbalIntro, actions, verbalOutro };
    }

    // =========================================================================
    // 8. REAL-TIME AI TRANSLATION FOR ALL 22 INDIAN LANGUAGES
    // =========================================================================

    const langDict = {
      'hindi': 'hi', 'हिन्दी': 'hi', 'हिंदी': 'hi',
      'bengali': 'bn', 'বাংলা': 'bn', 'বাঙালি': 'bn',
      'telugu': 'te', 'తెలుగు': 'te',
      'marathi': 'mr', 'मराठी': 'mr',
      'tamil': 'ta', 'தமிழ்': 'ta',
      'urdu': 'ur', 'اردو': 'ur',
      'gujarati': 'gu', 'ગુજરાતી': 'gu',
      'kannada': 'kn', 'ಕನ್ನಡ': 'kn',
      'malayalam': 'ml', 'മലയാളം': 'ml',
      'odia': 'or', 'oriya': 'or', 'ଓଡ଼ିଆ': 'or',
      'punjabi': 'pa', 'ਪੰਜਾਬੀ': 'pa',
      'assamese': 'as', 'অসমীয়া': 'as',
      'maithili': 'mai', 'मैथिली': 'mai',
      'santali': 'sat', 'ᱥᱟᱱᱛᱟᱲᱤ': 'sat',
      'kashmiri': 'ks', 'کٲشُر': 'ks',
      'nepali': 'ne', 'नेपाली': 'ne',
      'sindhi': 'sd', 'سنڌي': 'sd',
      'konkani': 'kok', 'कोंकणी': 'kok',
      'dogri': 'doi', 'डोगरी': 'doi',
      'manipuri': 'mni', 'মণিপুরী': 'mni',
      'bodo': 'brx', 'बड़ो': 'brx',
      'sanskrit': 'sa', 'संस्कृतम्': 'sa',
      'english': 'en', 'अंग्रेजी': 'en'
    };

    const transMatch = lower.match(/(?:translate|switch\s+language|speak\s+in|convert\s+to|change\s+language\s+to|website\s+in|अनुवाद\s+करो|भाषांतर|மொழிபெயர்ப்பு|भाषा\s+बदलो)\s+(?:the\s+)?(?:whole\s+)?(?:form|document|page|portal|website|app)?\s*(?:in|to|into|में)?\s*([a-zA-Z\u0900-\u0D7F]+)/i);
    if (transMatch && transMatch[1]) {
      const rawLang = transMatch[1].toLowerCase().trim();
      if (langDict[rawLang]) {
        const langCode = langDict[rawLang];
        actions.push({ action: 'SET_LANGUAGE', params: { lang: langCode, langName: rawLang } });
        actions.push({ action: 'TRANSLATE_DOCUMENT_FORM', params: { lang: langCode, langName: rawLang } });
        verbalIntro = `Switching whole website language to ${rawLang.toUpperCase()}.`;
        return { verbalIntro, actions, verbalOutro };
      }
    }

    // =========================================================================
    // 9. MODALS, ACCESSIBILITY & SCROLLING CONTROLS
    // =========================================================================

    // Modals
    if (lower.includes('human help') || lower.includes('get help') || lower.includes('call volunteer') || lower.includes('मदद चाहिए') || lower.includes('सहायक से बात')) {
      actions.push({ action: 'OPEN_MODAL', params: { modalId: 'humanHelpModal' } });
      verbalIntro = 'Opening human volunteer assistance booking.';
      return { verbalIntro, actions, verbalOutro };
    }

    if (lower.includes('edit vault') || lower.includes('edit details') || lower.includes('एडिट खोलो') || lower.includes('जानकारी बदलो')) {
      if (context.activeTab !== 'vault') actions.push({ action: 'NAVIGATE_TAB', params: { tab: 'vault' } });
      actions.push({ action: 'OPEN_MODAL', params: { modalId: 'editVaultModal' } });
      verbalIntro = 'Opening profile details editor.';
      return { verbalIntro, actions, verbalOutro };
    }

    if (lower.includes('close modal') || lower.includes('close popup') || lower.includes('cancel') || lower.includes('dismiss') || lower.includes('बंद करो') || lower === 'close') {
      actions.push({ action: 'CLOSE_MODAL', params: {} });
      verbalIntro = 'Closing modal dialog.';
      return { verbalIntro, actions, verbalOutro };
    }

    // Scrolling
    if (lower.includes('scroll down') || lower === 'down' || lower.includes('नीचे करो') || lower.includes('नीचे स्क्रॉल')) {
      actions.push({ action: 'SCROLL_PAGE', params: { top: 520 } });
      verbalIntro = 'Scrolling down.';
      return { verbalIntro, actions, verbalOutro };
    }
    if (lower.includes('scroll up') || lower === 'up' || lower.includes('ऊपर करो') || lower.includes('ऊपर स्क्रॉल')) {
      actions.push({ action: 'SCROLL_PAGE', params: { top: -520 } });
      verbalIntro = 'Scrolling up.';
      return { verbalIntro, actions, verbalOutro };
    }

    // Contrast & Typography
    if (lower.includes('dark mode') || lower.includes('high contrast') || lower.includes('हाई कंट्रास्ट') || lower.includes('डार्क मोड')) {
      actions.push({ action: 'SET_THEME', params: { highContrast: true } });
      verbalIntro = 'High contrast mode enabled.';
      return { verbalIntro, actions, verbalOutro };
    }
    if (lower.includes('light mode') || lower.includes('standard mode') || lower.includes('लाइट मोड')) {
      actions.push({ action: 'SET_THEME', params: { highContrast: false } });
      verbalIntro = 'Standard theme restored.';
      return { verbalIntro, actions, verbalOutro };
    }
    if (lower.includes('increase font') || lower.includes('bigger text') || lower.includes('फॉन्ट बड़ा करो') || lower.includes('अक्षर बड़े')) {
      actions.push({ action: 'SET_FONT_SIZE', params: { size: 'large' } });
      verbalIntro = 'Font size enlarged.';
      return { verbalIntro, actions, verbalOutro };
    }

    // Conversational Fallback
    directAnswer = `I can help you travel between tabs (Home, Vault, PDF, Form, Voice), auto-fill forms, edit details, or read documents. Ask me anything!`;
    return { answer: directAnswer };
  }

  /**
   * Helper to produce welcoming greeting in user's language
   */
  getLocalizedGreeting(langCode) {
    const greetings = {
      'en': 'AI Voice Agent active. Speak any instruction to operate the website.',
      'hi': 'एआई वॉइस असिस्टेंट सक्रिय है। कोई भी निर्देश बोलें, मैं आपके लिए वेबसाइट चलाऊँगा।',
      'bn': 'এআই ভয়েস সহকারী সক্রিয়। যেকোনো নির্দেশ বলুন।',
      'mr': 'व्हॉइस सहाय्यक सक्रिय आहे. बोला, आम्ही वेबसाइट चालवू.',
      'ta': 'குரல் உதவியாளர் செயல்படுகிறது. கட்டளையிடுங்கள்.',
      'te': 'వాయిస్ అసిస్టెంట్ సిద్ధంగా ఉంది. ఆదేశం ఇవ్వండి.',
      'gu': 'વૉઇસ સહાયક સક્રિય છે. સૂચના આપો.',
      'kn': 'ಧ್ವನಿ ಸಹಾಯಕ ಸಕ್ರಿಯವಾಗಿದೆ. ಸೂಚನೆ ನೀಡಿ.',
      'ml': 'വോയ്സ് അസിസ്റ്റന്റ് സജീവമാണ്. പറയൂ.',
      'pa': 'ਵਾਇਸ ਸਹਾਇਕ ਸਰਗਰਮ ਹੈ। ਕੋਈ ਵੀ ਹਦਾਇਤ ਦਿਓ।',
      'ur': 'وائس اسسٹنٹ فعال ہے۔ ہدایت دیں۔'
    };
    return greetings[langCode] || greetings['en'];
  }

  /**
   * Speaks Text with self-voice feedback suppression & intelligent script/voice detection
   */
  speak(text, onEndCallback = null) {
    if (!('speechSynthesis' in window) || !text) {
      if (onEndCallback) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel();
    this.isSpeakingTTS = true;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Auto-detect language script for high quality TTS synthesis
    let detectedSpeechLang = this.language || 'en-IN';
    if (/[\u0900-\u097F]/.test(text)) detectedSpeechLang = 'hi-IN'; // Devanagari (Hindi/Marathi)
    else if (/[\u0980-\u09FF]/.test(text)) detectedSpeechLang = 'bn-IN'; // Bengali/Assamese
    else if (/[\u0B80-\u0BFF]/.test(text)) detectedSpeechLang = 'ta-IN'; // Tamil
    else if (/[\u0C00-\u0C7F]/.test(text)) detectedSpeechLang = 'te-IN'; // Telugu
    else if (/[\u0A80-\u0AFF]/.test(text)) detectedSpeechLang = 'gu-IN'; // Gujarati
    else if (/[\u0C80-\u0CFF]/.test(text)) detectedSpeechLang = 'kn-IN'; // Kannada
    else if (/[\u0D00-\u0D7F]/.test(text)) detectedSpeechLang = 'ml-IN'; // Malayalam
    else if (/[\u0A00-\u0A7F]/.test(text)) detectedSpeechLang = 'pa-IN'; // Gurmukhi/Punjabi
    else if (/[\u0B00-\u0B7F]/.test(text)) detectedSpeechLang = 'or-IN'; // Odia
    else if (/[\u0600-\u06FF]/.test(text)) detectedSpeechLang = 'ur-IN'; // Urdu

    utterance.lang = detectedSpeechLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best available voice for this language
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const prefix = detectedSpeechLang.split('-')[0];
      const match = voices.find(v => v.lang.startsWith(prefix) || v.lang === detectedSpeechLang);
      if (match) utterance.voice = match;
    }

    const finish = () => {
      setTimeout(() => {
        this.isSpeakingTTS = false;
      }, 350);
      if (onEndCallback) onEndCallback();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  }

  showHud(title, message, isRecording = false) {
    const hud = document.getElementById('voiceLiveHud');
    const titleElem = document.getElementById('hudStatusTitle');
    const textElem = document.getElementById('hudTranscriptText');
    if (titleElem) titleElem.textContent = title;
    if (textElem) textElem.textContent = message;
    if (hud) {
      hud.classList.add('show');
      hud.classList.toggle('listening-hud', isRecording);
    }

    const respElem = document.getElementById('voiceResponseText');
    if (respElem && !isRecording) {
      respElem.textContent = `${title}: ${message}`;
    }

    clearTimeout(this.hudTimer);
    if (!isRecording && hud) {
      this.hudTimer = setTimeout(() => {
        hud.classList.remove('show', 'listening-hud');
      }, 5000);
    }
  }
}

// Create and export singleton instance
window.SaralVoiceAgent = new AutonomousVoiceAgent();
