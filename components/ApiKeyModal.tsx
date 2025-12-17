import React from 'react';
import { X, Key, ExternalLink, Check } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  t: typeof TRANSLATIONS['en'];
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, apiKey, setApiKey, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-indigo-400">
            <Key className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">{t.apiKey_modal_title}</h2>
          </div>
          
          <div className="space-y-4">
             <div>
               <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t.apiKey_placeholder}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
               />
             </div>

             <div className="flex items-center justify-between text-xs">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t.apiKey_help}
                </a>
             </div>

             <button
               onClick={onClose}
               className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
             >
               <Check className="w-4 h-4" />
               {t.apiKey_save}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;