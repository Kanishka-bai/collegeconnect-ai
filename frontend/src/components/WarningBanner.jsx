import React from 'react';
import { ShieldAlert, AlertTriangle, HelpCircle } from 'lucide-react';

export default function WarningBanner({ message, onTryPrompt }) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-navy-900 to-amber-950/30 p-4 shadow-lg shadow-amber-950/20 my-1">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Scope Restriction Warning
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Filter Enforced
            </span>
          </div>

          <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-medium">
            {message || "⚠️ This question is outside the scope of CollegeConnect AI. I can only assist with college-related queries, including academics, examinations, admissions, placements, campus facilities, and student services. Please ask a college-related question."}
          </p>

          {/* Educational suggestion chips */}
          <div className="mt-3 pt-3 border-t border-amber-500/20">
            <p className="text-[11px] text-amber-300/80 mb-2 flex items-center gap-1 font-medium">
              <HelpCircle className="w-3.5 h-3.5" /> Try asking a college question instead:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "What is the attendance requirement?",
                "When are semester exams scheduled?",
                "How do I apply for a bonafide certificate?",
                "What scholarships are available?"
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onTryPrompt && onTryPrompt(suggestion)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-200 border border-slate-700/60 hover:border-amber-400/40 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
