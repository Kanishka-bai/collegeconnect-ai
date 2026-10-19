import React from 'react';
import { 
  GraduationCap, 
  Calendar, 
  Briefcase, 
  HeartHandshake, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  {
    icon: CheckCircle2,
    category: "Attendance",
    query: "What is the attendance requirement for my course?",
    color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400"
  },
  {
    icon: FileText,
    category: "Student Services",
    query: "How do I apply for a bonafide certificate?",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400"
  },
  {
    icon: Calendar,
    category: "Examinations",
    query: "When are semester examinations scheduled?",
    color: "from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-400"
  },
  {
    icon: Briefcase,
    category: "Placements",
    query: "What documents are required for placement registration?",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400"
  },
  {
    icon: HeartHandshake,
    category: "Student Welfare",
    query: "I'm stressed about my upcoming exams.",
    color: "from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400"
  },
  {
    icon: HelpCircle,
    category: "Curriculum (Ambiguous)",
    query: "Can you explain Python?",
    color: "from-cyan-500/20 to-sky-500/10 border-cyan-500/30 text-cyan-400"
  }
];

export default function WelcomeScreen({ onSelectQuery }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center text-center">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold mb-6 animate-pulse">
        <GraduationCap className="w-4 h-4" />
        <span>Apex Institute Official AI Assistant</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
        Welcome to <span className="bg-gradient-to-r from-brand-primary via-indigo-400 to-brand-accent bg-clip-text text-transparent">CollegeConnect AI</span>
      </h1>
      
      <p className="text-slate-300 text-sm sm:text-base max-w-xl mb-8 leading-relaxed">
        Your dedicated college assistant for instant, verified answers regarding academics, semester examinations, bonafide requests, campus rules, placements, and student services.
      </p>

      {/* Scope & Relevance Filter Card */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mb-10 text-left">
        <div className="p-4 rounded-xl bg-navy-900/80 border border-emerald-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Permitted College Inquiries</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Attendance thresholds, exam timetables, fee procedures, bonafide certificates, placement rules, faculty departments, campus facilities, and student welfare support.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-navy-900/80 border border-rose-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Out-of-Scope (Automatically Filtered)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Jokes, cooking recipes, romantic poems, entertainment, video games, general trivia, and prompt injection attempts are blocked by our server-side classifier.
          </p>
        </div>
      </div>

      {/* Suggested Questions Section */}
      <div className="w-full text-left">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Popular Student Queries (Click to ask)</span>
          <span className="text-[11px] text-brand-accent">6 quick starters</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUGGESTED_QUERIES.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => onSelectQuery(item.query)}
                className={`p-3.5 rounded-xl text-left bg-gradient-to-br ${item.color} hover:bg-navy-800/80 border transition-all duration-200 group flex items-start justify-between gap-3 shadow-sm hover:shadow-md cursor-pointer`}
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block mb-1 opacity-80">
                    {item.category}
                  </span>
                  <p className="text-xs font-medium text-slate-100 group-hover:text-white transition-colors">
                    {item.query}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
