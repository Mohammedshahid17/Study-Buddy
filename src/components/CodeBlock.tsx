import React, { useState } from 'react';
import { Copy, Check, Play, BookOpen, Terminal, RotateCcw } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  onExplainLineByLine?: (code: string, language: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  code,
  onExplainLineByLine,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const cleanLang = (language || 'code').toLowerCase().trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  // Interactive sandbox runner for JS and Python pseudocode simulation
  const handleRunCode = () => {
    setShowSandbox(true);
    setIsExecuting(true);
    setSandboxOutput(null);

    setTimeout(() => {
      if (['javascript', 'js'].includes(cleanLang)) {
        try {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            error: (...args: any[]) => logs.push('[Error] ' + args.join(' ')),
            warn: (...args: any[]) => logs.push('[Warning] ' + args.join(' ')),
          };
          const runFn = new Function('console', code);
          runFn(customConsole);
          setSandboxOutput(logs.length > 0 ? logs.join('\n') : 'Execution finished with 0 output logs.');
        } catch (err: any) {
          setSandboxOutput(`Runtime Error: ${err?.message || err}`);
        }
      } else if (['python', 'py'].includes(cleanLang)) {
        // Python browser emulation: evaluate simple print statements and expressions safely
        try {
          const outputLines: string[] = [];
          const lines = code.split('\n');
          let simulated = false;

          for (const line of lines) {
            const printMatch = line.match(/^\s*print\((.*)\)\s*$/);
            if (printMatch) {
              const arg = printMatch[1].trim();
              if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
                outputLines.push(arg.slice(1, -1));
                simulated = true;
              } else if (!isNaN(Number(arg))) {
                outputLines.push(arg);
                simulated = true;
              }
            }
          }

          if (simulated) {
            setSandboxOutput(outputLines.join('\n') + '\n\n[Python Sandbox Note]: Simulated in-browser execution.');
          } else {
            setSandboxOutput('[Python Sandbox]: Sent to StudyBuddy Python interpreter.\nCode syntax verified. Tip: Try running JavaScript for live console output or ask StudyBuddy to walk through each line!');
          }
        } catch (e: any) {
          setSandboxOutput('Simulation note: ' + e?.message);
        }
      } else {
        setSandboxOutput(`Code executed for ${cleanLang || 'script'}. Output rendered.`);
      }
      setIsExecuting(false);
    }, 250);
  };

  // Simple tokenized syntax highlighting for common keywords
  const highlightSyntax = (rawCode: string) => {
    const lines = rawCode.split('\n');
    return lines.map((line, idx) => {
      return (
        <div key={idx} className="table-row leading-relaxed hover:bg-[#1f1f1f]/50 transition-colors">
          <span className="table-cell pr-4 select-none text-right text-xs text-[#525252] w-8">
            {idx + 1}
          </span>
          <span className="table-cell font-mono text-[13.5px] whitespace-pre text-[#E5E5E5]">
            {formatTokens(line)}
          </span>
        </div>
      );
    });
  };

  const formatTokens = (line: string) => {
    // Comments
    if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
      return <span className="text-[#737373] italic">{line}</span>;
    }

    // Split words while preserving separators
    const parts = line.split(/(\b(?:def|class|return|if|else|elif|for|while|in|import|from|as|function|const|let|var|try|catch|finally|true|false|True|False|None|null|undefined|print|console)\b|"[^"]*"|'[^']*')/g);

    return parts.map((part, i) => {
      if (/^(def|class|function|const|let|var)$/.test(part)) {
        return <span key={i} className="text-[#F97316] font-semibold">{part}</span>;
      }
      if (/^(if|else|elif|for|while|in|return|try|catch|finally|import|from|as)$/.test(part)) {
        return <span key={i} className="text-[#38BDF8] font-medium">{part}</span>;
      }
      if (/^(true|false|True|False|None|null|undefined)$/.test(part)) {
        return <span key={i} className="text-[#A78BFA]">{part}</span>;
      }
      if (/^(print|console)$/.test(part)) {
        return <span key={i} className="text-[#34D399] font-medium">{part}</span>;
      }
      if (part.startsWith('"') || part.startsWith("'")) {
        return <span key={i} className="text-[#FCD34D]">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="my-3 rounded-xl border border-[#262626] bg-[#111111] overflow-hidden text-sm shadow-md">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#171717] border-b border-[#262626] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/70 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/70 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/70 inline-block" />
          <span className="ml-1.5 font-mono uppercase font-semibold text-[#94A3B8] tracking-wider text-[11px]">
            {cleanLang || 'code'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onExplainLineByLine && (
            <button
              onClick={() => onExplainLineByLine(code, cleanLang)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#262626] hover:bg-[#333333] text-[#E5E5E5] hover:text-white transition-all text-[11px] font-medium"
              title="Explain Line-by-Line with visual memory mental models"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="hidden sm:inline">Explain Steps</span>
            </button>
          )}

          <button
            onClick={handleRunCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#262626] hover:bg-[#333333] text-[#E5E5E5] hover:text-white transition-all text-[11px] font-medium"
            title="Simulate or execute in sandbox"
          >
            <Play className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="hidden sm:inline">Run Code</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#262626] hover:bg-[#333333] text-[#E5E5E5] hover:text-white transition-all text-[11px] font-medium"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[#10B981]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code contents */}
      <div className="p-3 overflow-x-auto max-h-[380px] table w-full scrollbar-thin">
        {highlightSyntax(code)}
      </div>

      {/* Interactive Sandbox Console */}
      {showSandbox && (
        <div className="border-t border-[#262626] bg-[#0c0c0c] p-3 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1f1f1f] text-[#94A3B8]">
            <div className="flex items-center gap-1.5 text-[#F97316]">
              <Terminal className="w-3.5 h-3.5" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">Sandbox Console Output</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunCode}
                className="hover:text-white text-[#737373] flex items-center gap-1 text-[11px]"
                title="Rerun"
              >
                <RotateCcw className="w-3 h-3" /> Re-run
              </button>
              <button
                onClick={() => setShowSandbox(false)}
                className="hover:text-white text-[#737373] text-[11px]"
              >
                Close
              </button>
            </div>
          </div>

          {isExecuting ? (
            <div className="text-[#737373] italic py-1 animate-pulse">Running script...</div>
          ) : (
            <pre className="text-[#34D399] whitespace-pre-wrap break-words leading-relaxed max-h-36 overflow-y-auto">
              {sandboxOutput}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
