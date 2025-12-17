import React, { useState } from 'react';
import { PromptTemplateData, Language, FontSize } from '../types';
import { Copy, Check, ArrowDownToLine } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface ResultDisplayProps {
  data: PromptTemplateData | null;
  uiLang: Language;
  t: typeof TRANSLATIONS['en'];
  contentLang: Language;
  setContentLang: (l: Language) => void;
  fontSize: FontSize;
  topPrompt: string;
  setTopPrompt: (s: string) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  data, 
  t, 
  contentLang, 
  setContentLang, 
  fontSize,
  topPrompt,
  setTopPrompt 
}) => {
  const [copied, setCopied] = useState(false);

  // Construct text dynamically from data
  let shotsText = "";
  if (data) {
    shotsText = data.shots.map((shot, idx) => {
      const num = (idx + 1).toString().padStart(2, '0');
      const label = contentLang === 'zh' ? '镜头' : 'Shot ';
      return `${label}${num}: ${shot}`;
    }).join('\n\n');
  }

  // Combine top prompt and shots for the full copy content
  const fullContentToCopy = [topPrompt.trim(), shotsText.trim()].filter(Boolean).join('\n\n');

  const handleCopy = () => {
    if (!fullContentToCopy) return;
    navigator.clipboard.writeText(fullContentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTextClass = () => {
    switch(fontSize) {
      case 'medium': return 'text-sm';
      case 'large': return 'text-base';
      default: return 'text-xs';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg h-full flex flex-col">
       <div className="flex items-center justify-between mb-4">
        <h2 className="text-md font-bold text-slate-200">{t.section3}</h2>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setContentLang(contentLang === 'zh' ? 'en' : 'zh')}
             className="px-3 py-1 rounded-md bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
           >
             {contentLang === 'zh' ? '中' : 'En'}
           </button>
           <button 
            onClick={handleCopy}
            disabled={!fullContentToCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold transition-colors"
           >
             {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
             {copied ? t.copied : t.copy}
           </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden relative flex flex-col">
        {/* Top Prompt Section */}
        <div className="border-b border-slate-800 bg-slate-900/30 shrink-0">
          <input 
            type="text" 
            value={topPrompt}
            onChange={(e) => setTopPrompt(e.target.value)}
            placeholder={t.top_prompt_placeholder}
            className={`w-full bg-transparent px-4 py-3 text-indigo-300 placeholder:text-slate-600 focus:outline-none ${getTextClass()}`}
          />
        </div>

        {/* Shots List Section */}
        <div className="flex-1 relative group min-h-0">
          {shotsText ? (
            <textarea 
              readOnly
              value={shotsText}
              className={`w-full h-full bg-transparent font-mono text-slate-300 focus:outline-none resize-none leading-relaxed custom-scrollbar p-4 ${getTextClass()}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-xs px-8 text-center">
              {t.placeholderDesc}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;