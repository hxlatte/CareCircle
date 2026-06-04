import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export function useVoice() {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState(null);
  const recognitionRef = useRef(null);

  const getLangCode = (lang) => {
    switch (lang) {
      case 'hi': return 'hi-IN';
      case 'te': return 'te-IN';
      case 'mr': return 'mr-IN';
      default: return 'en-US';
    }
  };

  const getAlternativeLangCodes = (lang) => {
    switch (lang) {
      case 'hi': return ['hi-in', 'hi_in', 'hin-in', 'hin_in', 'hi', 'hin'];
      case 'te': return ['te-in', 'te_in', 'tel-in', 'tel_in', 'te', 'tel'];
      case 'mr': return ['mr-in', 'mr_in', 'mar-in', 'mar_in', 'mr', 'mar'];
      default: return ['en-us', 'en_us', 'en'];
    }
  };

  const handleSpeak = (text) => {
    if (!text) return;
    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }
    // Cancel any ongoing speech to avoid overlap
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLangCode = getLangCode(language);
    utterance.lang = targetLangCode;
    
    // Dynamically match and set the correct localized voice
    if (synth.getVoices) {
      const voices = synth.getVoices();
      const alts = getAlternativeLangCodes(language);
      
      let voice = voices.find(v => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        return alts.includes(vLang) || alts.some(alt => vLang.startsWith(alt));
      });
      
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang; // Align lang strictly with the selected voice BCP 47
      } else {
        // No native voice found for this language!
        // To prevent silent failures in browsers with no Telugu/Marathi engines:
        // Try finding a Hindi voice as an Indic fallback (often sounds reasonable for other Indian languages)
        let fallbackVoice = voices.find(v => {
          const vLang = v.lang.toLowerCase().replace('_', '-');
          return vLang.startsWith('hi') || vLang.startsWith('hin');
        });
        if (!fallbackVoice) {
          // Otherwise, fall back to the browser's default voice
          fallbackVoice = voices.find(v => v.default) || voices[0];
        }
        
        if (fallbackVoice) {
          console.log(`No native voice for ${targetLangCode}. Falling back to voice: ${fallbackVoice.name} (${fallbackVoice.lang})`);
          utterance.voice = fallbackVoice;
          utterance.lang = fallbackVoice.lang; // Realignment to prevent BCP 47 silent failure
        }
      }
    }
    
    synth.speak(utterance);
  };

  const handleSpell = (text) => {
    if (!text) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    
    synth.cancel();
    
    let segments = [];
    if (Intl.Segmenter) {
      const segmenter = new Intl.Segmenter(getLangCode(language), { granularity: 'grapheme' });
      segments = Array.from(segmenter.segment(text)).map(s => s.segment);
    } else {
      segments = text.split('');
    }

    const spell = segments.join(' ');
    const utterance = new SpeechSynthesisUtterance(spell);
    const targetLangCode = getLangCode(language);
    utterance.lang = targetLangCode;
    
    if (synth.getVoices) {
      const voices = synth.getVoices();
      const alts = getAlternativeLangCodes(language);
      
      let voice = voices.find(v => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        return alts.includes(vLang) || alts.some(alt => vLang.startsWith(alt));
      });
      
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        let fallbackVoice = voices.find(v => {
          const vLang = v.lang.toLowerCase().replace('_', '-');
          return vLang.startsWith('hi') || vLang.startsWith('hin');
        });
        if (!fallbackVoice) {
          fallbackVoice = voices.find(v => v.default) || voices[0];
        }
        if (fallbackVoice) {
          utterance.voice = fallbackVoice;
          utterance.lang = fallbackVoice.lang;
        }
      }
    }

    synth.speak(utterance);
  };

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Failed to stop recognition:", e);
      }
      setIsListening(false);
    }
  }, []);

  const startVoiceInput = useCallback((setter) => {
    setListeningError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition;
    if (!SpeechRecognition) {
      const errMsg = "Speech recognition is not supported in this browser. Please try using Google Chrome or Microsoft Edge.";
      setListeningError(errMsg);
      alert(errMsg);
      return;
    }
    
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore already-stopped errors
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = getLangCode(language);
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          if (typeof setter === 'function') {
            setter(transcript);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        let errorMsg = "An error occurred during speech recognition.";
        if (event.error === 'no-speech') {
          errorMsg = "No speech was detected. Please try again.";
        } else if (event.error === 'audio-capture') {
          errorMsg = "No microphone was found or audio capture failed.";
        } else if (event.error === 'not-allowed') {
          errorMsg = "Permission to use the microphone was denied. Please allow microphone access in your browser settings.";
        }
        setListeningError(errorMsg);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setListeningError(err.message || "Failed to start speech recognition.");
      setIsListening(false);
    }
  }, [language]);

  return { handleSpeak, handleSpell, startVoiceInput, stopVoiceInput, isListening, listeningError };
}
