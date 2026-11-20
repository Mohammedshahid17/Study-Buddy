import React from 'react';
import { CodeBlock } from './CodeBlock';
import { Sparkles, Lightbulb } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onExplainCode?: (code: string, language: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onExplainCode,
}) => {
  if (!content) return null;

  // Split content by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let blockIdx = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      elements.push(
        <RenderFormattedText
          key={`text-${blockIdx}-${lastIndex}`}
          text={textBefore}
        />
      );
    }

    const language = match[1] || 'python';
    const code = match[2];
    elements.push(
      <CodeBlock
        key={`code-${blockIdx}-${match.index}`}
        language={language}
        code={code.trimEnd()}
        onExplainLineByLine={onExplainCode}
      />
    );

    lastIndex = match.index + match[0].length;
    blockIdx++;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    elements.push(
      <RenderFormattedText
        key={`text-end-${lastIndex}`}
        text={remainingText}
      />
    );
  }

  return <div className="space-y-2 text-[#E5E5E5] leading-relaxed text-[15px]">{elements}</div>;
};

// Component for rendering paragraphs, lists, bold text, inline code, and callouts
const RenderFormattedText: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split(/\n{2,}/);

  return (
    <>
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Check for Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={pIdx} className="text-base font-semibold text-white mt-3 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#F97316] rounded-full inline-block" />
              {parseInlineFormatting(trimmed.substring(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={pIdx} className="text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
              <span className="w-2 h-4 bg-[#F97316] rounded-full inline-block" />
              {parseInlineFormatting(trimmed.substring(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={pIdx} className="text-xl font-bold text-white mt-4 mb-2">
              {parseInlineFormatting(trimmed.substring(2))}
            </h1>
          );
        }

        // Check for Blockquotes (e.g. > Note or Summary)
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n');
          const isTip = quoteLines.toLowerCase().includes('tip') || quoteLines.toLowerCase().includes('hint');
          return (
            <div
              key={pIdx}
              className="my-3 px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#161616] flex items-start gap-2.5 text-[14.5px]"
            >
              {isTip ? (
                <Lightbulb className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
              )}
              <div className="text-[#D4D4D4] leading-relaxed">
                {parseInlineFormatting(quoteLines)}
              </div>
            </div>
          );
        }

        // Check for Bullet Lists
        const lines = trimmed.split('\n');
        const isBulletList = lines.every(l => /^\s*[-*•]\s+/.test(l));
        const isNumberedList = lines.every(l => /^\s*\d+\.\s+/.test(l));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-2 pl-2">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^\s*[-*•]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] shrink-0 mt-2" />
                    <span className="text-[#E5E5E5] text-[15px]">{parseInlineFormatting(itemText)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={pIdx} className="space-y-1.5 my-2 pl-2">
              {lines.map((line, lIdx) => {
                const matchNum = line.match(/^\s*(\d+)\.\s+(.*)/);
                const num = matchNum ? matchNum[1] : `${lIdx + 1}`;
                const itemText = matchNum ? matchNum[2] : line;
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#262626] text-[#F97316] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {num}
                    </span>
                    <span className="text-[#E5E5E5] text-[15px]">{parseInlineFormatting(itemText)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Regular paragraph with potential soft linebreaks
        return (
          <p key={pIdx} className="my-1.5 text-[#E5E5E5] leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {parseInlineFormatting(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
};

// Helper for inline `code`, **bold**, *italic*, and [links]
function parseInlineFormatting(str: string): React.ReactNode[] {
  // Regex splitting by inline code `...`, bold **...**, and italic *...*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = part.slice(1, -1);
      return (
        <code
          key={index}
          className="mx-0.5 px-1.5 py-0.5 rounded-md bg-[#222222] border border-[#2f2f2f] text-[#F97316] font-mono text-[13.5px] font-medium"
        >
          {code}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="text-[#D4D4D4] italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
