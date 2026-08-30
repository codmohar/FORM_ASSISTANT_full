/**
 * =========================================================================
 * SARAL SETU - STANDALONE VOICE ASSISTANT ENGINE (DECOUPLED CORE)
 * =========================================================================
 * Architecture:
 * - Continuous Speech Recognition Loop (persists until explicitly stopped)
 * - Self-Voice Acoustic Cancellation (ignores TTS feedback)
 * - Auto-restart / Auto-reconnection on network silence/browser timeouts
 * - Modular Command Dispatcher (Voice -> Action Pipeline)
 * - SpeechSynthesis Engine with dynamic queue management
 * =========================================================================
 */

class VoiceAssistantEngine {
  constructor() {
    this.recognition = null;
    this.isSessionActive = false;     // True when user has turned voice assistant ON
    this.isListening = false;         // Current low-level recognition socket state
    this.isSpeakingTTS = false;       // Flag to prevent self-triggering loop during TTS
    this.restartDebounceTimer = null;
    this.hudDismissTimer = null;
    this.language = 'en-US';
    this.commandHandlers = [];
    this.stateChangeListeners = [];

    this.initEngine();
  }

  /**
   * Initializes the native SpeechRecognition instance
   */
  initEngine() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[VoiceEngine] Web Speech API not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.language;
      this.recognition.continuous = true;       // <-- CONTINUOUS MODE: Stays ON
      this.recognition.interimResults = true;    // Real-time interim feedback
      this.recognition.maxAlternatives = 1;

      this.bindRecognitionEvents();
      console.log('[VoiceEngine] Continuous speech recognition engine initialized.');
    } catch (err) {
      console.error('[VoiceEngine] Error initializing speech recognition:', err);
    }
  }

  /**
   * Binds lifecycle events for the continuous recognition loop
   */
  bindRecognitionEvents() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.notifyStateChange(true);
      this.updateHud('Listening (Continuous)', 'Say any command (say "stop listening" to turn off)...', true);
    };

    this.recognition.onresult = (event) => {
      // If the engine itself is currently speaking, discard incoming audio to prevent self-triggering
      if (this.isSpeakingTTS) {
        return;
      }

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0].transcript;
        if (item.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      const heardText = (finalTranscript || interimTranscript).trim();
      if (heardText) {
        this.updateHud('Heard', `"${heardText}"`, true);
      }

      if (finalTranscript) {
        const cleanedCmd = finalTranscript.trim();
        console.log(`[VoiceEngine] Recognized command: "${cleanedCmd}"`);
        this.executeCommand(cleanedCmd);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[VoiceEngine] Recognition event error:', event.error);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.isSessionActive = false;
        this.isListening = false;
        this.notifyStateChange(false);
        this.updateHud('Permission Denied', 'Please allow microphone access in browser settings.', false);
        this.speak('Microphone access was denied. Please allow microphone permission.');
        return;
      }

      if (event.error === 'no-speech') {
        // Normal in continuous mode when user pauses speaking - loop continues
        return;
      }

      if (event.error === 'network') {
        this.updateHud('Network Warning', 'Speech recognition network hiccup. Reconnecting...', false);
      }
    };

    // Auto-restart loop when browser abruptly closes session while active
    this.recognition.onend = () => {
      this.isListening = false;

      // If user still wants voice assistant active, auto-restart seamlessly
      if (this.isSessionActive) {
        clearTimeout(this.restartDebounceTimer);
        this.restartDebounceTimer = setTimeout(() => {
          if (this.isSessionActive && !this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              console.warn('[VoiceEngine] Auto-restart recovery:', e.message);
            }
          }
        }, 200);
      } else {
        this.notifyStateChange(false);
        this.updateHud('Voice Off', 'Assistant is in standby.', false);
      }
    };
  }

  /**
   * Starts Continuous Listening Session
   */
  start() {
    if (!this.recognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    this.isSessionActive = true;
    this.speak('Voice assistant activated. I am listening continuously.', () => {
      if (this.isSessionActive && !this.isListening) {
        try {
          this.recognition.start();
        } catch (err) {
          console.warn('[VoiceEngine] Start session warning:', err.message);
        }
      }
    });
  }

  /**
   * Stops Continuous Listening Session
   */
  stop(shouldSpeak = true) {
    this.isSessionActive = false;
    clearTimeout(this.restartDebounceTimer);

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {}
    }

    this.isListening = false;
    this.notifyStateChange(false);
    this.updateHud('Assistant Offline', 'Voice assistant paused. Tap mic to resume.', false);

    if (shouldSpeak) {
      this.speak('Voice assistant deactivated. Tap the microphone anytime to resume.');
    }
  }

  /**
   * Toggles Voice Assistant ON/OFF
   */
  toggle() {
    if (this.isSessionActive) {
      this.stop(true);
    } else {
      this.start();
    }
  }

  /**
   * Register high-level application command handler
   */
  onCommand(handler) {
    if (typeof handler === 'function') {
      this.commandHandlers.push(handler);
    }
  }

  /**
   * Register state change listener (listening ON/OFF)
   */
  onStateChange(listener) {
    if (typeof listener === 'function') {
      this.stateChangeListeners.push(listener);
    }
  }

  notifyStateChange(isActive) {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(isActive);
      } catch (e) {
        console.error('[VoiceEngine] State listener error:', e);
      }
    });
  }

  /**
   * Internal Command Dispatcher
   */
  executeCommand(transcript) {
    const raw = transcript.trim();
    const cmd = raw.toLowerCase();

    // 1. Built-in Termination Commands (to turn continuous mode OFF by voice)
    if (
      cmd.includes('stop listening') ||
      cmd.includes('turn off voice') ||
      cmd.includes('turn off assistant') ||
      cmd.includes('stop voice') ||
      cmd.includes('disable voice') ||
      cmd.includes('deactivate assistant') ||
      cmd.includes('go to sleep') ||
      cmd === 'sleep' ||
      cmd === 'mute'
    ) {
      this.stop(true);
      return;
    }

    // 2. Delegate to registered application command handlers
    let handled = false;
    for (const handler of this.commandHandlers) {
      try {
        const result = handler(raw, cmd);
        if (result) {
          handled = true;
          break;
        }
      } catch (err) {
        console.error('[VoiceEngine] Command execution error:', err);
      }
    }

    if (!handled) {
      const fallbackMsg = `Command not recognized. Say "help" for a list of available actions.`;
      this.updateHud('Unrecognized', `"${raw}"`, false);
      this.speak(fallbackMsg);
    }
  }

  /**
   * SpeechSynthesis wrapper with Echo Suppression
   */
  speak(text, onEndCallback = null) {
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Cancel prior speech
    window.speechSynthesis.cancel();

    // Mark TTS active so incoming mic audio is suppressed during readout
    this.isSpeakingTTS = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const finishSpeaking = () => {
      // Small buffer after speaking to allow acoustic room reverberation to settle
      setTimeout(() => {
        this.isSpeakingTTS = false;
      }, 350);

      if (onEndCallback) {
        onEndCallback();
      }
    };

    utterance.onend = finishSpeaking;
    utterance.onerror = finishSpeaking;

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Updates Floating HUD UI Component
   */
  updateHud(title, message, isRecording = false) {
    const hud = document.getElementById('voiceLiveHud');
    const titleElem = document.getElementById('hudStatusTitle');
    const textElem = document.getElementById('hudTranscriptText');

    if (!hud || !titleElem || !textElem) return;

    titleElem.textContent = title;
    textElem.textContent = message;
    hud.classList.add('show');
    hud.classList.toggle('listening-hud', isRecording);

    clearTimeout(this.hudDismissTimer);
    if (!isRecording) {
      this.hudDismissTimer = setTimeout(() => {
        hud.classList.remove('show', 'listening-hud');
      }, 4000);
    }
  }
}

// Instantiate and expose the standalone voice assistant singleton
window.SaralVoiceAssistant = new VoiceAssistantEngine();
