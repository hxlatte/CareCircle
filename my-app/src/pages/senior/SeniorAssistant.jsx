import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../hooks/useVoice';
import api from '../../api';

export default function SeniorAssistant() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { startVoiceInput, handleSpeak } = useVoice();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: t('ai_greeting') || `Hello there! 😊 I'm your CareCircle health assistant. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/assistant/chat', {
        message: userMsg.text,
        history: messages.slice(-6) // Send last 6 messages for context
      });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.data.response
      }]);
      handleSpeak(res.data.response);
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: t('ai_error') || "I'm sorry, I'm having trouble right now. Please try again in a moment."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-[var(--color-surface-container-lowest)] rounded-3xl shadow-[0_10px_30px_rgba(28,28,25,0.05)] overflow-hidden animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="bg-[var(--color-primary)] p-6 text-white flex items-center gap-4 shrink-0">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">smart_toy</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t('ai_assistant')}</h2>
          <p className="text-primary-container opacity-80">{t('always_here')}</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[var(--color-surface)]">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] md:max-w-[60%] p-6 rounded-2xl text-xl leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-[var(--color-secondary)] text-[var(--color-on-secondary)] rounded-tr-none' 
                : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] rounded-tl-none shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-surface-container-high)] p-6 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-3 h-3 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-3 h-3 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-3 h-3 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-stone-400 text-sm font-medium ml-2">{t('thinking')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-[var(--color-surface-container-low)] border-t border-stone-200 shrink-0">
        <div className="flex gap-4 items-center max-w-4xl mx-auto">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('ask_question')}
              disabled={isTyping}
              className="w-full bg-white border-none rounded-full px-8 pr-16 py-5 text-xl shadow-inner focus:ring-4 focus:ring-[var(--color-primary)]/20 outline-none transition-all disabled:opacity-50 font-bold"
            />
            <button 
                type="button"
                onClick={() => startVoiceInput(setInput)}
                disabled={isTyping}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
            >
                <span className="material-symbols-outlined text-3xl">mic</span>
            </button>
          </div>
          <button 
            type="button"
            onClick={handleSend} 
            disabled={isTyping || !input.trim()}
            className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform shrink-0 disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

