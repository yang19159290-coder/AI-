import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutGrid, Sparkles, Loader2, Type, Key } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import SceneAnalysis from './components/SceneAnalysis';
import ShotConfigurator from './components/ShotConfigurator';
import ResultDisplay from './components/ResultDisplay';
import ApiKeyModal from './components/ApiKeyModal';
import { analyzeImageForScene, generateStoryboardContent, generateSingleShotContent } from './services/geminiService';
import { GridConfig, ShotDefinition, PromptTemplateData, Language, FontSize } from './types';
import { DEFAULT_SCENE, GRID_OPTIONS, TRANSLATIONS } from './constants';

const STORAGE_KEYS = {
  UI_LANG: 'sb_ui_lang',
  CONTENT_LANG: 'sb_content_lang',
  FONT_SIZE: 'sb_font_size',
  GRID_CONFIG: 'sb_grid_config',
  TOP_PROMPT: 'sb_top_prompt',
  SCENE_DESC: 'sb_scene_desc',
  SHOTS: 'sb_shots',
  API_KEY: 'sb_api_key'
};

const App: React.FC = () => {
  // Helper to generate default prompt text
  const generateDefaultPrompt = (config: GridConfig) => {
    const total = config.rows * config.cols;
    return `根据参考图，生成一张具有凝聚力的${config.label}网格图像，包含在同一环境中的 ${total}个不同摄像机镜头，严格保持人物/物体、服装和光线的一致性，8K分辨率， 16:9画幅。`;
  };

  // --- State Initialization with LocalStorage ---

  const [uiLang, setUiLang] = useState<Language>(() => 
    (localStorage.getItem(STORAGE_KEYS.UI_LANG) as Language) || 'zh'
  );
  
  const [contentLang, setContentLang] = useState<Language>(() => 
    (localStorage.getItem(STORAGE_KEYS.CONTENT_LANG) as Language) || 'zh'
  );
  
  const [fontSize, setFontSize] = useState<FontSize>(() => 
    (localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as FontSize) || 'small'
  );

  const [gridConfig, setGridConfig] = useState<GridConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GRID_CONFIG);
    return saved ? JSON.parse(saved) : GRID_OPTIONS[2];
  });

  const [topPrompt, setTopPrompt] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TOP_PROMPT);
    if (saved) return saved;
    const savedGrid = localStorage.getItem(STORAGE_KEYS.GRID_CONFIG);
    const config = savedGrid ? JSON.parse(savedGrid) : GRID_OPTIONS[2];
    return generateDefaultPrompt(config);
  });

  const [sceneDescription, setSceneDescription] = useState<{en: string, zh: string}>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCENE_DESC);
    return saved ? JSON.parse(saved) : { en: "", zh: "" };
  });

  const [shots, setShots] = useState<ShotDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOTS);
    return saved ? JSON.parse(saved) : [];
  });

  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || process.env.API_KEY || '';
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  
  const t = TRANSLATIONS[uiLang];
  
  // Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  
  const isFirstMount = useRef(true);

  // --- Persistence Effects ---

  useEffect(() => localStorage.setItem(STORAGE_KEYS.UI_LANG, uiLang), [uiLang]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CONTENT_LANG, contentLang), [contentLang]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize), [fontSize]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.GRID_CONFIG, JSON.stringify(gridConfig)), [gridConfig]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.TOP_PROMPT, topPrompt), [topPrompt]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SCENE_DESC, JSON.stringify(sceneDescription)), [sceneDescription]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SHOTS, JSON.stringify(shots)), [shots]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey), [apiKey]);

  // --- Logic Effects ---

  // Update topPrompt when gridConfig changes, BUT respect user edits/persistence on first load
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setTopPrompt(generateDefaultPrompt(gridConfig));
  }, [gridConfig]);

  // --- Check API Key helper ---
  const checkApiKey = (): boolean => {
    if (!apiKey) {
      setIsKeyModalOpen(true);
      alert(t.apiKey_missing_alert);
      return false;
    }
    return true;
  };

  // --- Handlers ---

  const handleImageAnalyzed = async (base64Data: string, mimeType: string) => {
    if (!checkApiKey()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeImageForScene(apiKey, base64Data, mimeType);
      setSceneDescription(result);
    } catch (err: any) {
      console.error(err);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      alert(`Analysis failed: ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!checkApiKey()) return;
    // Prefer English description for generation context if available, otherwise fall back
    const finalScene = sceneDescription.en.trim() || sceneDescription.zh.trim() || DEFAULT_SCENE;
    setIsGeneratingAll(true);
    
    // Set all shots to loading
    setShots(prev => prev.map(s => ({ ...s, isLoading: true })));

    try {
      const shotTypes = shots.map(s => s.type);
      const content = await generateStoryboardContent(apiKey, finalScene, gridConfig.label, shotTypes);

      // Update refined scene description if available
      if (content.en.sceneDescription) {
         setSceneDescription({
           en: content.en.sceneDescription,
           zh: content.zh.sceneDescription
         });
      }

      // Update all shots
      setShots(prev => prev.map((s, index) => ({
        ...s,
        content: {
          en: content.en.shots[index],
          zh: content.zh.shots[index]
        },
        isLoading: false
      })));

    } catch (err: any) {
      console.error(err);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      alert(`Generation failed: ${msg}`);
      setShots(prev => prev.map(s => ({ ...s, isLoading: false })));
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleGenerateSingle = async (id: number) => {
    if (!checkApiKey()) return;
    const finalScene = sceneDescription.en.trim() || sceneDescription.zh.trim() || DEFAULT_SCENE;
    const shotToUpdate = shots.find(s => s.id === id);
    if (!shotToUpdate) return;

    setShots(prev => prev.map(s => s.id === id ? { ...s, isLoading: true } : s));

    try {
      const result = await generateSingleShotContent(apiKey, finalScene, shotToUpdate.type);
      
      setShots(prev => prev.map(s => s.id === id ? { 
        ...s, 
        content: result,
        isLoading: false 
      } : s));

    } catch (err: any) {
      console.error(err);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      alert(`Single shot generation failed: ${msg}`);
      setShots(prev => prev.map(s => s.id === id ? { ...s, isLoading: false } : s));
    }
  };

  const handleShotContentChange = (id: number, newText: string) => {
    setShots(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updatedContent = s.content ? { ...s.content } : { en: "", zh: "" };
      if (contentLang === 'zh') {
        updatedContent.zh = newText;
      } else {
        updatedContent.en = newText;
      }
      return { ...s, content: updatedContent };
    }));
  };

  // --- Derived State for Preview ---
  
  const previewData: PromptTemplateData | null = useMemo(() => {
    const validShots = shots.map(s => {
       if (s.content) return contentLang === 'zh' ? s.content.zh : s.content.en;
       return contentLang === 'zh' ? "(等待生成...)" : "(Waiting for generation...)";
    });

    const currentScene = contentLang === 'zh' ? sceneDescription.zh : sceneDescription.en;

    return {
      scene: currentScene || (contentLang === 'zh' ? "未定义场景" : "Undefined Scene"),
      gridLabel: gridConfig.label,
      totalShots: gridConfig.rows * gridConfig.cols,
      shots: validShots,
      lang: contentLang
    };
  }, [shots, sceneDescription, gridConfig, contentLang]);

  return (
    <div className="h-screen bg-slate-950 text-slate-200 font-inter overflow-hidden flex flex-col">
      
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        t={t}
      />

      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-md font-bold text-white tracking-tight leading-none">{t.title}</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
             
             {/* API Key Button */}
             <button
               onClick={() => setIsKeyModalOpen(true)}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                 apiKey ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/50'
               }`}
             >
               <Key className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">{apiKey ? 'API Key' : t.apiKey_btn}</span>
             </button>

             {/* Font Size Toggle */}
             <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                <Type className="w-3 h-3 text-slate-400 ml-1" />
                {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-all ${
                      fontSize === size 
                      ? 'bg-slate-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                  </button>
                ))}
             </div>

             <button 
               onClick={handleGenerateAll}
               disabled={isGeneratingAll}
               className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-xs font-bold text-white transition-all disabled:opacity-50"
             >
               {isGeneratingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-white/20" />}
               <span>{t.generate_all}</span>
             </button>

             <button 
              onClick={() => {
                const next = uiLang === 'zh' ? 'en' : 'zh';
                setUiLang(next);
                setContentLang(next); 
              }}
              className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
             >
               {t.uiSwitch}
             </button>
        </div>
      </header>

      {/* Main Grid Dashboard */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* Left Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full min-h-0">
            {/* 1. Reference Image */}
            <div className="h-[22%] min-h-[160px] shrink-0">
              <ImageUploader 
                 onImageAnalyzed={handleImageAnalyzed} 
                 isAnalyzing={isAnalyzing}
                 t={t}
               />
            </div>
            
            {/* 2. Scene Description (Analysis) */}
            <div className="h-[28%] min-h-[200px] shrink-0">
               <SceneAnalysis 
                 value={sceneDescription}
                 onChange={setSceneDescription}
                 t={t}
                 fontSize={fontSize}
                 activeLang={contentLang}
               />
            </div>

            {/* 3. Final Export Preview */}
            <div className="flex-1 min-h-0">
               <ResultDisplay 
                 data={previewData} 
                 uiLang={uiLang} 
                 t={t} 
                 contentLang={contentLang}
                 setContentLang={setContentLang}
                 fontSize={fontSize}
                 topPrompt={topPrompt}
                 setTopPrompt={setTopPrompt}
               />
            </div>
          </div>

          {/* Right Column (8 cols): Grid Editor */}
          <div className="lg:col-span-8 h-full min-h-0">
             <ShotConfigurator 
               gridConfig={gridConfig} 
               setGridConfig={setGridConfig}
               shots={shots}
               setShots={setShots}
               onGenerateSingle={handleGenerateSingle}
               onContentChange={handleShotContentChange}
               t={t}
               contentLang={contentLang}
               fontSize={fontSize}
             />
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;