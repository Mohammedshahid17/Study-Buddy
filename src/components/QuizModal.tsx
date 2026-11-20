import React, { useState } from 'react';
import { QuizData, QuizQuestion } from '../types';
import { X, Award, CheckCircle2, XCircle, Lightbulb, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: string;
  onAskStudyBuddyAboutQuestion: (questionContext: string) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  defaultTopic = 'Python Basics',
  onAskStudyBuddyAboutQuestion,
}) => {
  const [topic, setTopic] = useState(defaultTopic);
  const [difficulty, setDifficulty] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setError(null);
    setQuizData(null);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setShowHint({});
    setSubmitted({});

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate quiz from server.');
      }

      const data: QuizData = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('Quiz questions could not be generated.');
      }
      setQuizData(data);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while generating the quiz.');
    } finally {
      setLoading(false);
    }
  };

  const currentQ: QuizQuestion | undefined = quizData?.questions?.[currentIdx];
  const isCurrentSubmitted = submitted[currentIdx];
  const selectedOption = selectedAnswers[currentIdx];
  const isCorrect = selectedOption !== undefined && currentQ && selectedOption === currentQ.correctIndex;

  const totalQuestions = quizData?.questions?.length || 0;
  const score = Object.entries(submitted).reduce((acc, [idxStr, isSub]) => {
    const idx = parseInt(idxStr, 10);
    if (isSub && quizData?.questions[idx] && selectedAnswers[idx] === quizData.questions[idx].correctIndex) {
      return acc + 1;
    }
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-[#141414] border border-[#262626] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222222] bg-[#171717]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Diagnostic Knowledge Check</h2>
              <p className="text-xs text-[#94A3B8]">Test your understanding with instant pedagogical feedback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#262626] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 scrollbar-thin">
          {/* Topic Selector / Form */}
          {!quizData && !loading && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] uppercase tracking-wider mb-2">
                  Select Study Topic
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Python Basics & Slicing',
                    'JavaScript == vs ===',
                    'Loops & Range Off-by-One',
                    'Recursion & Base Cases',
                    'Big-O Notation & Complexity',
                    'Arrays & Memory Models',
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all ${
                        topic === t
                          ? 'bg-[#F97316]/10 border-[#F97316] text-[#F97316]'
                          : 'bg-[#181818] border-[#262626] text-[#A3A3A3] hover:text-white hover:border-[#383838]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] uppercase tracking-wider mb-1.5">
                  Difficulty Level
                </label>
                <div className="flex gap-2">
                  {['Beginner', 'Freshman Midterm', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        difficulty === lvl
                          ? 'bg-white text-black font-semibold border-white'
                          : 'bg-[#181818] border-[#262626] text-[#A3A3A3] hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerateQuiz}
                className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-black font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-2"
              >
                <Sparkles className="w-4 h-4" /> Generate 3 Practice Questions
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#F97316] animate-spin" />
              <div className="text-white font-medium text-sm">Generating diagnostic questions for {topic}...</div>
              <p className="text-xs text-[#737373]">Crafting hints, edge cases, and real-world analogies</p>
            </div>
          )}

          {/* Quiz Active View */}
          {quizData && currentQ && (
            <div className="space-y-4">
              {/* Progress & Score */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#222222]">
                <div className="text-[#94A3B8]">
                  Question <span className="text-white font-bold">{currentIdx + 1}</span> of {totalQuestions}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[#94A3B8]">Score:</span>
                  <span className="font-bold text-[#F97316]">{score}</span> / {totalQuestions}
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-base font-semibold text-white leading-snug">
                {currentQ.question}
              </h3>

              {/* Optional Code Snippet */}
              {currentQ.codeSnippet && (
                <pre className="p-3 rounded-xl bg-[#0d0d0d] border border-[#262626] text-xs font-mono text-[#38BDF8] overflow-x-auto">
                  {currentQ.codeSnippet}
                </pre>
              )}

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options.map((option, optIdx) => {
                  const isChosen = selectedAnswers[currentIdx] === optIdx;
                  let optionStyles = 'bg-[#181818] border-[#262626] text-[#E5E5E5] hover:border-[#3d3d3d]';

                  if (isCurrentSubmitted) {
                    if (optIdx === currentQ.correctIndex) {
                      optionStyles = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold';
                    } else if (isChosen && optIdx !== currentQ.correctIndex) {
                      optionStyles = 'bg-red-950/40 border-red-500 text-red-200';
                    } else {
                      optionStyles = 'bg-[#181818] border-[#222222] text-[#666666] opacity-60';
                    }
                  } else if (isChosen) {
                    optionStyles = 'bg-[#F97316]/10 border-[#F97316] text-[#F97316] font-semibold';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isCurrentSubmitted}
                      onClick={() => setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }))}
                      className={`w-full p-3 rounded-xl text-xs sm:text-sm text-left border transition-all flex items-start gap-3 ${optionStyles}`}
                    >
                      <span className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-mono mt-0.5 border-current">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Hint button */}
              {!isCurrentSubmitted && currentQ.hint && (
                <div className="pt-1">
                  {!showHint[currentIdx] ? (
                    <button
                      onClick={() => setShowHint((prev) => ({ ...prev, [currentIdx]: true }))}
                      className="text-xs text-[#94A3B8] hover:text-[#F97316] flex items-center gap-1.5 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5" /> Need a hint before answering?
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Hint:</strong> {currentQ.hint}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation section after submission */}
              {isCurrentSubmitted && (
                <div className="p-3.5 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold">
                    {isCorrect ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Correct! Excellent job.
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Not quite right.
                      </span>
                    )}
                  </div>
                  <p className="text-[#D4D4D4] leading-relaxed">
                    <strong>Explanation:</strong> {currentQ.explanation}
                  </p>
                  {currentQ.analogy && (
                    <p className="text-[#94A3B8] italic border-t border-[#2a2a2a] pt-2">
                      💡 <strong>Analogy:</strong> {currentQ.analogy}
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onAskStudyBuddyAboutQuestion(
                          `I took the quiz question: "${currentQ.question}". Can you explain why the answer is "${currentQ.options[currentQ.correctIndex]}" with more step-by-step examples?`
                        );
                      }}
                      className="text-xs text-[#F97316] hover:underline flex items-center gap-1 font-medium"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Ask StudyBuddy to walk through this question in chat
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {quizData && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#222222] bg-[#171717]">
            <button
              onClick={() => {
                setQuizData(null);
                handleGenerateQuiz();
              }}
              className="px-3 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-white hover:bg-[#262626] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> New Quiz
            </button>

            <div className="flex items-center gap-2">
              {!isCurrentSubmitted ? (
                <button
                  disabled={selectedAnswers[currentIdx] === undefined}
                  onClick={() => setSubmitted((prev) => ({ ...prev, [currentIdx]: true }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedAnswers[currentIdx] === undefined
                      ? 'bg-[#262626] text-[#555] cursor-not-allowed'
                      : 'bg-[#F97316] hover:bg-[#EA580C] text-black shadow-sm'
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (currentIdx < totalQuestions - 1) {
                      setCurrentIdx((c) => c + 1);
                    } else {
                      // Finished
                      onClose();
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-neutral-200 text-black transition-all shadow-sm"
                >
                  {currentIdx < totalQuestions - 1 ? 'Next Question →' : 'Finish Quiz'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
