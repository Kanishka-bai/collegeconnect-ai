import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  X, 
  ShieldAlert, 
  Info,
  Clock
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-navy-900 border-r border-navy-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Action Bar */}
        <div className="p-4 border-b border-navy-800 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-brand-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
            <span>Conversations</span>
            <span className="text-[10px] bg-navy-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              {sessions.length}
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-slate-400 text-xs">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
              <p>No chat history yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Start by asking a question about college life or academics.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-navy-800 text-white border border-brand-primary/30 shadow-sm'
                      : 'text-slate-300 hover:bg-navy-850 hover:text-white'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-accent' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="truncate">{session.title || 'Conversation'}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{new Date(session.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      {session.message_count ? <span>• {session.message_count} msgs</span> : null}
                    </p>
                  </div>

                  {/* Delete session button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    title="Delete conversation"
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Relevance Filter Rule Notice Card */}
        <div className="p-3 border-t border-navy-800 bg-navy-950/60 m-2 rounded-xl border">
          <div className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">Relevance Filter Enforced</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Only questions concerning academics, exams, admissions, placements, and college services are permitted.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Clear All History */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-navy-800">
            <button
              onClick={onClearAll}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
