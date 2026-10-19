import React, { useState } from 'react';
import { 
  User, 
  GraduationCap, 
  Copy, 
  Check, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import WarningBanner from './WarningBanner';
import SourceCard from './SourceCard';

// Helper to format basic markdown-style text safely
function FormattedText({ content }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-100">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet point
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.replace(/^([•\-\*]\s*)/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-brand-accent mt-1 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: renderInlineFormatting(bulletContent) }} />
            </div>
          );
        }

        // Section header (e.g. **Title:**)
        return (
          <p key={idx} dangerouslySetInnerHTML={{ __html: renderInlineFormatting(trimmed) }} />
        );
      })}
    </div>
  );
}

// Simple bold and inline code formatter
function renderInlineFormatting(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-navy-950 font-mono text-[11px] text-brand-accent border border-brand-accent/20">$1</code>');
}

export default function ChatMessage({ message, onTryPrompt }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isRejected = message.status === 'REJECTED';
  const isClarify = message.status === 'CLARIFY';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 sm:gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm ${
          isRejected 
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
            : 'bg-gradient-to-tr from-brand-primary to-brand-secondary text-white shadow-brand-primary/20'
        }`}>
          {isRejected ? <AlertCircle className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
        </div>
      )}

      {/* Bubble Container */}
      <div className={`max-w-[88%] sm:max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Name / Role label */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[11px] font-semibold text-slate-400">
            {isUser ? 'Student' : 'CollegeConnect AI'}
          </span>
          {isClarify && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
              Clarification Needed
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">
            {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>

        {/* Message Bubble Body */}
        {isRejected && !isUser ? (
          <div className="w-full">
            <WarningBanner message={message.content} onTryPrompt={onTryPrompt} />
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 shadow-md relative group ${
              isUser
                ? 'bg-brand-primary text-white rounded-tr-sm'
                : 'bg-navy-850 border border-navy-750 text-slate-100 rounded-tl-sm'
            }`}
          >
            {/* Copy button */}
            {!isUser && (
              <button
                onClick={handleCopy}
                title="Copy response"
                className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-white bg-navy-900/60 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Formatted Text Content */}
            <FormattedText content={message.content} />

            {/* Citations if available */}
            {message.citations && message.citations.length > 0 && (
              <SourceCard citations={message.citations} />
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-slate-200 shrink-0 mt-1 shadow-sm border border-slate-600">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
