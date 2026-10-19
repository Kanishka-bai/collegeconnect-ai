import React from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  Menu, 
  Plus, 
  Sparkles,
  Server
} from 'lucide-react';

export default function Header({ 
  onToggleSidebar, 
  onNewChat, 
  onOpenKnowledge, 
  backendStatus,
  collegeName = "Apex Institute of Technology & Sciences"
}) {
  return (
    <header className="h-16 border-b border-navy-800 bg-navy-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-md shadow-brand-primary/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                CollegeConnect <span className="text-brand-accent font-semibold text-xs px-1.5 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <ShieldCheck className="w-3 h-3" /> Filter Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
              {collegeName}
            </p>
          </div>
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-2">
        {/* Knowledge Base Modal Trigger */}
        <button
          onClick={onOpenKnowledge}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-200 border border-slate-700/60 hover:border-slate-600 transition-all shadow-sm"
          title="Browse official college knowledge base"
        >
          <BookOpen className="w-3.5 h-3.5 text-brand-accent" />
          <span className="hidden sm:inline">Knowledge Base</span>
        </button>

        {/* Mobile New Chat Button */}
        <button
          onClick={onNewChat}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-brand-primary text-white hover:bg-brand-primaryHover transition-colors shadow-sm"
          title="Start new conversation"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* System Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 px-2.5 py-1 rounded-lg bg-navy-950/60 border border-navy-800">
          <span className={`w-2 h-2 rounded-full ${backendStatus ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{backendStatus ? `Model: ${backendStatus.ai_provider}` : 'Connecting...'}</span>
        </div>
      </div>
    </header>
  );
}
