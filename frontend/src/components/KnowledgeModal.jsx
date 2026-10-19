import React, { useState, useEffect } from 'react';
import { X, BookOpen, Search, ShieldCheck, ExternalLink, Calendar, Building, Info } from 'lucide-react';
import { fetchCollegeOverview } from '../services/api';

export default function KnowledgeModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !data) {
      setLoading(true);
      fetchCollegeOverview()
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const sections = data?.sections || [];
  const meta = data?.meta || {};

  const filteredSections = sections.filter((sec) => {
    const matchesTab = activeTab === 'all' || sec.category === activeTab;
    const matchesSearch = !search || 
      sec.title.toLowerCase().includes(search.toLowerCase()) ||
      sec.department.toLowerCase().includes(search.toLowerCase()) ||
      sec.document_code.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-navy-900 border border-navy-750 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-navy-800 flex items-center justify-between bg-navy-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                College Knowledge Base & Regulations
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Demo Data
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {meta.name || "Apex Institute of Technology & Sciences (AITS)"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 border-b border-navy-800 bg-navy-850/40 space-y-3">
          {/* Disclaimer banner */}
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-400" />
            <span>{meta.disclaimer || "Sample demonstration data configured for CollegeConnect AI. All rules reflect representative university standards."}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search policy, document code, or department..."
                className="w-full bg-navy-950 border border-navy-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              {['all', 'attendance', 'examinations', 'placements', 'student_services', 'student_welfare'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap text-xs font-medium transition-colors ${
                    activeTab === cat
                      ? 'bg-brand-primary text-white'
                      : 'bg-navy-800 text-slate-300 hover:bg-navy-750'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading knowledge base...</div>
          ) : filteredSections.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No matching policies found for this category or search term.</div>
          ) : (
            filteredSections.map((sec) => (
              <div
                key={sec.id}
                className="p-4 rounded-xl bg-navy-850/80 border border-slate-700/60 hover:border-slate-600 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-navy-800 pb-2">
                  <h3 className="font-semibold text-sm text-white">{sec.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                      {sec.document_code}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize bg-navy-800 px-2 py-0.5 rounded">
                      {sec.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    {sec.department}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Updated: {sec.last_updated}
                  </span>
                </div>

                {sec.key_points && sec.key_points.length > 0 && (
                  <div className="bg-navy-950/70 p-3 rounded-lg border border-slate-800/80">
                    <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1.5">Key Highlights:</p>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {sec.key_points.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-brand-accent mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-navy-800 bg-navy-950 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredSections.length} college policy documents configured</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
