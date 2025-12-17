import React from 'react';
import { TRANSLATIONS } from '../constants';
import { FontSize, Language } from '../types';

interface SceneAnalysisProps {
  value: { en: string; zh: string };
  onChange: (val: { en: string; zh: string }) => void;
  t: typeof TRANSLATIONS['en'];
  fontSize: FontSize;
  activeLang: Language;
}

const SceneAnalysis: React.FC<SceneAnalysisProps> = ({ value, onChange, t, fontSize, activeLang }) => {
  
  const getTextClass = () => {
    switch(fontSize) {
      case 'medium': return 'text-sm leading-relaxed';
      case 'large': return 'text-base leading-relaxed';
      default: return 'text-xs leading-relaxed';
    }
  };

  const handleTextChange = (text: string) => {
    onChange({
      ...value,
      [activeLang]: text
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg h-full flex flex-col w-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">2</div>
          <h2 className="text-md font-bold text-slate-200">{t.section_scene}</h2>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative group">
        <div className="absolute inset-0 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500/50 transition-colors">
          <textarea 
            value={value[activeLang]}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t.scenePlaceholder}
            className={`w-full h-full bg-transparent p-4 text-slate-300 focus:outline-none resize-none custom-scrollbar placeholder:text-slate-600 ${getTextClass()}`}
          />
        </div>
      </div>
    </div>
  );
};

export default SceneAnalysis;