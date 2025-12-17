import React, { useEffect } from 'react';
import { GridConfig, ShotDefinition, Language, FontSize } from '../types';
import { GRID_OPTIONS, SHOT_OPTS, TRANSLATIONS } from '../constants';
import { Play, Loader2 } from 'lucide-react';

interface ShotConfiguratorProps {
  gridConfig: GridConfig;
  setGridConfig: (config: GridConfig) => void;
  shots: ShotDefinition[];
  setShots: (shots: ShotDefinition[]) => void;
  onGenerateSingle: (id: number) => void;
  onContentChange?: (id: number, text: string) => void;
  t: typeof TRANSLATIONS['en'];
  contentLang: Language;
  fontSize: FontSize;
}

const ShotConfigurator: React.FC<ShotConfiguratorProps> = ({ 
  gridConfig, 
  setGridConfig, 
  shots, 
  setShots,
  onGenerateSingle,
  onContentChange,
  t,
  contentLang,
  fontSize
}) => {

  // Initialize shots
  useEffect(() => {
    const totalSlots = gridConfig.rows * gridConfig.cols;
    if (shots.length !== totalSlots) {
      // Preserve existing shots if resizing
      const newShots = Array.from({ length: totalSlots }, (_, i) => {
        if (shots[i]) return shots[i];
        return {
          id: i + 1,
          type: SHOT_OPTS[i % SHOT_OPTS.length].value,
          content: undefined
        };
      });
      setShots(newShots);
    }
  }, [gridConfig, setShots, shots]); // Keep deps safe

  const handleShotTypeChange = (id: number, typeValue: string) => {
    setShots(shots.map(s => s.id === id ? { ...s, type: typeValue } : s));
  };

  const getTextClass = () => {
    switch(fontSize) {
      case 'medium': return 'text-sm leading-relaxed';
      case 'large': return 'text-base leading-relaxed';
      default: return 'text-xs leading-relaxed';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">3</div>
          <h2 className="text-md font-bold text-slate-200">{t.section2} ({gridConfig.label})</h2>
        </div>
        
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          {GRID_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => setGridConfig(opt)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                gridConfig.label === opt.label 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div 
        className="grid gap-4 flex-1 overflow-y-auto custom-scrollbar p-1"
        style={{ gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))` }}
      >
        {shots.map((shot) => {
          const contentText = shot.content ? (contentLang === 'zh' ? shot.content.zh : shot.content.en) : "";
          
          return (
            <div key={shot.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-3 group hover:border-slate-700 transition-colors min-h-[200px]">
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center border border-slate-700">
                    {shot.id}
                  </span>
                  <div className="flex-1 min-w-0">
                     <select 
                      value={shot.type}
                      onChange={(e) => handleShotTypeChange(shot.id, e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-slate-200 focus:outline-none cursor-pointer hover:text-indigo-400 transition-colors truncate appearance-none"
                     >
                       {SHOT_OPTS.map(opt => (
                         <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                       ))}
                     </select>
                  </div>
                </div>
                
                <button 
                  onClick={() => onGenerateSingle(shot.id)}
                  disabled={shot.isLoading}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 transition-all disabled:opacity-50"
                  title="Generate this shot"
                >
                  {shot.isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                </button>
              </div>

              <div className="flex-1 bg-slate-900/50 rounded-lg border border-slate-800/50 relative overflow-hidden focus-within:border-indigo-500/50 transition-colors">
                 {shot.content || (!shot.isLoading) ? (
                   <textarea
                     value={contentText}
                     onChange={(e) => onContentChange && onContentChange(shot.id, e.target.value)}
                     className={`w-full h-full bg-transparent p-2 text-slate-300 focus:outline-none resize-none custom-scrollbar ${getTextClass()}`}
                     placeholder={shot.isLoading ? t.generating : t.waiting}
                   />
                 ) : (
                   <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 italic select-none">
                     {t.generating}
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShotConfigurator;