import React, { useState } from 'react';
import { Sparkles, Terminal, BookOpen, Bug, Award, Code2, Compass, Lightbulb } from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenQuiz: (topic: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt,
  onOpenQuiz,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'python' | 'javascript' | 'cs' | 'exams'>('all');

  const starterPrompts = [
    {
      id: 'recursion',
      title: 'Python Recursion Analogy',
      category: 'python',
      icon: '🪆',
      prompt: 'Can you explain how recursion works in Python using a real-world analogy (like Russian nesting dolls) and show a simple base case vs recursive step?',
      tag: 'Core CS Concept',
    },
    {
      id: 'js-equality',
      title: 'JavaScript == vs ===',
      category: 'javascript',
      icon: '⚡',
      prompt: "What is the actual difference between == (loose) and === (strict) equality in JavaScript, and what is type coercion behind the scenes?",
      tag: 'Common Exam Trap',
    },
    {
      id: 'index-error',
      title: 'Debugging Off-by-One & IndexErrors',
      category: 'cs',
      icon: '🔍',
      prompt: 'Why do first-year students frequently get IndexError: list index out of range in Python loops, and how do 0-indexed lists look in memory?',
      tag: 'Debugging',
    },
    {
      id: 'big-o',
      title: 'Big-O Notation in Simple Words',
      category: 'cs',
      icon: '⏱️',
      prompt: 'Explain Big-O time complexity (O(1), O(n), O(n²)) like I am 12 years old, using an analogy like finding a friend in a phonebook or room.',
      tag: 'Freshman Coursework',
    },
    {
      id: 'js-closures',
      title: 'JavaScript Closures & Scope',
      category: 'javascript',
      icon: '🎒',
      prompt: 'Explain what a Closure is in JavaScript using the backpack analogy, and show a clear 5-line example of why they are useful.',
      tag: 'JavaScript Basics',
    },
    {
      id: 'exam-prep',
      title: 'Midterm Exam Study Strategy',
      category: 'exams',
      icon: '📝',
      prompt: 'What is the most effective active recall strategy for studying computer science syntax and tracing code before a freshman midterm exam?',
      tag: 'Exam Techniques',
    },
  ];

  const filteredPrompts = starterPrompts.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center text-center">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#2a2a2a] text-xs text-[#94A3B8] mb-5 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
        <span className="font-medium text-[#E5E5E5]">University Freshman CS Study Companion</span>
      </div>

      {/* Hero Avatar & Title */}
      <div className="relative mb-3">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#1F1F1F] to-[#121212] border border-[#2f2f2f] flex items-center justify-center text-3xl sm:text-4xl shadow-xl ring-1 ring-[#F97316]/30">
          🎓
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#F97316] text-black font-bold p-1 rounded-full text-[10px] ring-2 ring-[#0A0A0A]">
          <Sparkles className="w-3 h-3" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
        Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E5E5E5] to-[#F97316]">StudyBuddy</span>
      </h1>

      <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mx-auto mb-6 leading-relaxed">
        Understand programming concepts, Python & JavaScript basics, and computer science coursework in simple language with interactive examples and mental models.
      </p>

      {/* Interactive Topic Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-2 mb-6 scrollbar-none">
        {[
          { id: 'all', label: 'All Topics' },
          { id: 'python', label: '🐍 Python' },
          { id: 'javascript', label: '⚡ JavaScript' },
          { id: 'cs', label: '💡 CS Fundamentals' },
          { id: 'exams', label: '🎯 Exam Prep' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-[#F97316] text-black font-semibold shadow-sm'
                : 'bg-[#171717] text-[#A3A3A3] hover:text-white border border-[#262626] hover:border-[#383838]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3 High-Impact Starter Prompt Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8 text-left">
        {filteredPrompts.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group relative p-4 rounded-2xl bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#F97316]/50 transition-all flex flex-col justify-between text-left shadow-sm hover:shadow-md cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#222222] text-[#94A3B8] font-medium border border-[#2e2e2e]">
                  {item.tag}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-[#F97316] transition-colors mb-1.5 line-clamp-1">
                {item.title}
              </h3>
              <p className="text-xs text-[#737373] group-hover:text-[#A3A3A3] transition-colors line-clamp-2 leading-relaxed">
                {item.prompt}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-[#1f1f1f] flex items-center justify-between text-[11px] text-[#F97316] font-medium opacity-80 group-hover:opacity-100">
              <span>Ask StudyBuddy</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Action Badges */}
      <div className="w-full max-w-xl p-3.5 rounded-2xl bg-[#121212] border border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A3A3A3]">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#F97316] shrink-0" />
          <span>Need exam testing? Practice with an instant diagnostic challenge.</span>
        </div>
        <button
          onClick={() => onOpenQuiz('Python & JavaScript Fundamentals')}
          className="px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white font-medium transition-colors shrink-0 flex items-center gap-1.5"
        >
          <Award className="w-3.5 h-3.5 text-[#F97316]" />
          Take 3-Min Quiz
        </button>
      </div>
    </div>
  );
};
