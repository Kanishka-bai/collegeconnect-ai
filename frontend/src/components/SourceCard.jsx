import React from 'react';
import { BookOpen, Calendar, Building, FileCheck } from 'lucide-react';

export default function SourceCard({ citations = [] }) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-700/50">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
        <FileCheck className="w-3.5 h-3.5 text-brand-accent" />
        <span>Official College Reference Sources ({citations.length})</span>
      </div>

      <div className="space-y-2">
        {citations.map((cite, index) => (
          <div 
            key={index}
            className="p-2.5 rounded-lg bg-navy-950/70 border border-slate-700/60 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5"
          >
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">{cite.source_title}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="font-mono text-brand-accent bg-brand-accent/10 px-1.5 py-0.2 rounded border border-brand-accent/20">
                    {cite.document_code}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-500" />
                    {cite.department}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1 self-start sm:self-auto shrink-0 font-mono">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Rev: {cite.last_updated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
