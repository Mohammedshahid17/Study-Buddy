import React, { useState, useEffect } from 'react';
import { CodeExplanation } from '../types';
import { X, BookOpen, ChevronRight, ChevronLeft, AlertTriangle, Sparkles, Clock, HardDrive, RefreshCw } from 'lucide-react';

interface CodeExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

export const CodeExplainerModal: React.FC<CodeExplainerModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
}) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<CodeExplanation | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && code) {
      fetchExplanation();
    }
  }, [isOpen, code, language]);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    setExplanation(null);
    setActiveStep(0);

    try {
      const res = await fetch('/api/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze code steps.');
      }

      const data: CodeExplanation = await res.json();
      setExplanation(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to explain code snippet.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentStep = explanation?.steps?.[activeStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-[#141414] border border-[#262626] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222222] bg-[#171717]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Line-by-Line Code Visualizer</h2>
              <p className="text-xs text-[#94A3B8]">Mental model breakdown & variable execution tracing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#262626] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 scrollbar-thin">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#F97316] animate-spin" />
              <div className="text-white font-medium text-sm">Tracing code execution paths...</div>
              <p className="text-xs text-[#737373]">Mapping memory model and creating real-world analogies</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          {explanation && (
            <div className="space-y-4">
              {/* Overview & Analogy */}
              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-white">{explanation.title}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-[#A3A3A3]">
                    {explanation.timeComplexity && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#F97316]" /> {explanation.timeComplexity}
                      </span>
                    )}
                    {explanation.spaceComplexity && (
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-[#38BDF8]" /> {explanation.spaceComplexity}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#D4D4D4] leading-relaxed">{explanation.overview}</p>
                {explanation.analogy && (
                  <div className="p-2.5 rounded-lg bg-[#202020] border border-[#2c2c2c] text-xs text-[#F97316] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-[#E5E5E5]">
                      <strong className="text-[#F97316]">Analogy:</strong> {explanation.analogy}
                    </span>
                  </div>
                )}
              </div>

              {/* Step Navigator */}
              {explanation.steps && explanation.steps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>
                      Step <strong className="text-white">{activeStep + 1}</strong> of {explanation.steps.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={activeStep === 0}
                        onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                        className="px-2.5 py-1 rounded-lg bg-[#222222] hover:bg-[#2d2d2d] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3 h-3" /> Prev
                      </button>
                      <button
                        disabled={activeStep === explanation.steps.length - 1}
                        onClick={() => setActiveStep((s) => Math.min(explanation.steps.length - 1, s + 1))}
                        className="px-2.5 py-1 rounded-lg bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-30 disabled:cursor-not-allowed text-black font-semibold flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Active Step Highlight Card */}
                  {currentStep && (
                    <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#F97316]/50 shadow-lg space-y-3 ring-1 ring-[#F97316]/20">
                      <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-[#222222]">
                        <span className="text-[#F97316] font-semibold">
                          Line {currentStep.lineNumber}
                        </span>
                        <code className="text-[#38BDF8] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#2b2b2b]">
                          {currentStep.codeLine}
                        </code>
                      </div>

                      <div className="text-xs text-[#E5E5E5] leading-relaxed">
                        <strong className="text-white block mb-0.5">What the computer does here:</strong>
                        {currentStep.action}
                      </div>

                      {currentStep.variableState && (
                        <div className="p-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] font-mono text-[#34D399]">
                          <strong>Variable / Memory State:</strong> {currentStep.variableState}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Common Beginner Pitfalls */}
              {explanation.commonPitfalls && explanation.commonPitfalls.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Watch Out For These Beginner Pitfalls:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-100/90 pl-1">
                    {explanation.commonPitfalls.map((pitfall, i) => (
                      <li key={i}>{pitfall}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
