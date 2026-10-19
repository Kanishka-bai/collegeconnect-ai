import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle } from 'lucide-react';

const QUICK_TOPICS = [
  { label: "📋 Attendance Policy", text: "What is the attendance requirement for my course?" },
  { label: "📅 Exam Schedule", text: "When are semester examinations scheduled?" },
  { label: "📑 Bonafide Certificate", text: "How do I apply for a bonafide certificate?" },
  { label: "💼 Placement Rules", text: "What documents are required for placement registration?" },
  { label: "💙 Exam Stress Help", text: "I'm stressed about my upcoming exams." },
  { label: "💰 Fee Inquiries", text: "What is the fee deadline for this semester?" }
];

export default function ChatInput({ onSendMessage, isLoading, disabled }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const maxLength = 2000;

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSendMessage(trimmed);
    setInput('');
  };

  return (
    <div className="border-t border-navy-800 bg-navy-900/95 backdrop-blur-md p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Quick Topic Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-accent" /> Quick:
          </span>
          {QUICK_TOPICS.map((topic, i) => (
            <button
              key={i}
              type="button"
              disabled={isLoading}
              onClick={() => onSendMessage(topic.text)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-navy-800/80 hover:bg-navy-750 text-slate-300 hover:text-white border border-slate-700/60 hover:border-brand-primary/40 text-[11px] font-medium transition-all"
            >
              {topic.label}
            </button>
          ))}
        </div>

        {/* Input Box Container */}
        <div className="relative flex items-end gap-2 bg-navy-950/80 rounded-2xl border border-navy-750 focus-within:border-brand-primary/60 focus-within:ring-1 focus-within:ring-brand-primary/40 transition-all p-2 shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about college academics, exams, attendance, procedures..."
            disabled={isLoading || disabled}
            maxLength={maxLength}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-xs sm:text-sm resize-none focus:outline-none px-2 py-1 max-h-32 min-h-[38px] leading-relaxed"
          />

          <div className="flex items-center gap-2 pb-0.5">
            {/* Character counter */}
            {input.length > 100 && (
              <span className={`text-[10px] font-mono ${
                input.length > 1800 ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {input.length}/{maxLength}
              </span>
            )}

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || disabled}
              className={`p-2.5 rounded-xl font-medium transition-all shadow-md flex items-center justify-center ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:opacity-95 shadow-brand-primary/20 cursor-pointer'
                  : 'bg-navy-800 text-slate-500 cursor-not-allowed border border-navy-750'
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle helper note */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-navy-800 border border-slate-700 text-[10px] text-slate-300 font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-navy-800 border border-slate-700 text-[10px] text-slate-300 font-mono">Shift+Enter</kbd> for new line</span>
          <span className="hidden sm:inline">Strict relevance filter active</span>
        </div>
      </div>
    </div>
  );
}
