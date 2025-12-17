import React, { useState } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface ImageUploaderProps {
  onImageAnalyzed: (description: string, mimeType: string) => void;
  isAnalyzing: boolean;
  t: typeof TRANSLATIONS['en'];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageAnalyzed, isAnalyzing, t }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const startAnalysis = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      // Extract mime type from data URL or file object, default to jpeg if missing
      const mimeType = file.type || 'image/jpeg';
      onImageAnalyzed(base64String, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview(null);
    setFile(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg h-full flex flex-col w-full">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">1</div>
        <h2 className="text-md font-bold text-slate-200">{t.section1}</h2>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {!preview ? (
          <div className="flex-1 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 transition-colors relative group w-full">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isAnalyzing}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Upload className="w-8 h-8 text-slate-500 mb-2 group-hover:text-indigo-400 transition-colors" />
              <p className="text-slate-500 text-sm font-medium">{t.step1_desc}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group w-full">
            <img 
              src={preview} 
              alt="Reference" 
              className="absolute inset-0 w-full h-full object-contain" 
            />
            <button 
               onClick={clearImage}
               className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-20"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
        )}

        <button
          onClick={startAnalysis}
          disabled={!file || isAnalyzing}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shrink-0"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.analyzing}</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4" />
              <span>{t.step1_btn}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;