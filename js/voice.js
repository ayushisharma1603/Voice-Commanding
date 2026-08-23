/**
 * Voice Manager - Handles Web Speech API (SpeechRecognition & SpeechSynthesis)
 * - Real-time continuous speech recognition
 * - Audio visualizer waveform state triggers
 * - Text-to-Speech audio feedback responses
 * - Multilingual locale switching
 */

import { StorageManager } from './storage.js';

export class VoiceManager {
    constructor(onResultCallback, onStateChangeCallback) {
        this.onResult = onResultCallback;
        this.onStateChange = onStateChangeCallback;
        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.lastError = null;
        this.synth = window.speechSynthesis || null;

        this.initRecognition();
    }

    /**
     * Initialize browser Web Speech Recognition
     */
    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('SpeechRecognition API is not supported in this browser environment.');
            this.notifyState('error', 'Voice input needs Chrome or Edge');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false; // Capture discrete voice commands
        this.recognition.interimResults = true; // Real-time feedback as user speaks
        this.recognition.maxAlternatives = 1;

        const settings = StorageManager.getSettings();
        this.recognition.lang = settings.language || 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.lastError = null;
            this.notifyState('listening', 'Listening for command...');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (this.onResult) {
                this.onResult({
                    final: finalTranscript,
                    interim: interimTranscript
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.lastError = event.error;
            const messages = {
                'network': 'Speech service unavailable. Check internet and try Chrome or Edge.',
                'not-allowed': 'Microphone blocked. Allow microphone access in browser settings.',
                'service-not-allowed': 'Speech service blocked. Allow microphone and speech access.',
                'no-speech': 'No speech detected. Tap the mic and speak clearly.'
            };
            this.notifyState('error', messages[event.error] || `Voice error: ${event.error}`);

            if (event.error === 'network' || event.error === 'service-not-allowed') {
                const typedCommand = window.prompt('Voice service is unavailable. Type your shopping command instead:');
                if (typedCommand && this.onResult) {
                    this.onResult({ final: typedCommand.trim(), interim: '' });
                }
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (!this.lastError) {
                this.notifyState('idle', 'Tap mic or say command');
            }
        };
    }

    /**
     * Set active voice recognition language
     */
    setLanguage(langCode) {
        if (this.recognition) {
            this.recognition.lang = langCode;
        }
    }

    /**
     * Start speech listening session
     */
    startListening() {
        if (!this.recognition) {
            const message = 'Voice input is unavailable here. Open this app in Google Chrome or Microsoft Edge and allow microphone access.';
            this.notifyState('error', message);
            alert(message);
            return;
        }
        if (this.isListening) {
            this.stopListening();
            return;
        }
        try {
            // Stop any ongoing speech synthesis before listening
            if (this.synth && this.synth.speaking) {
                this.synth.cancel();
            }
            const settings = StorageManager.getSettings();
            this.recognition.lang = settings.language || 'en-US';
            this.recognition.start();
        } catch (e) {
            console.error('Error starting speech recognition:', e);
            this.isListening = false;
            this.notifyState('error', 'Microphone is busy. Try again.');
        }
    }

    /**
     * Stop speech listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.notifyState('idle', 'Stopped listening');
        }
    }

    /**
     * Speak audio confirmation back to the user (Text-to-Speech)
     */
    speak(text) {
        const settings = StorageManager.getSettings();
        if (!settings.voiceFeedback || !this.synth) return;

        // Cancel previous utterances
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = settings.language || 'en-US';
        utterance.rate = settings.voiceSpeed || 1.0;

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.notifyState('speaking', text);
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.notifyState('idle', 'Ready');
        };

        utterance.onerror = (err) => {
            console.error('Speech synthesis error:', err);
            this.isSpeaking = false;
            this.notifyState('idle', 'Ready');
        };

        this.synth.speak(utterance);
    }

    /**
     * Notify UI controller of state changes (listening, speaking, processing, idle, error)
     */
    notifyState(state, message) {
        if (this.onStateChange) {
            this.onStateChange({ state, message });
        }
    }
}
