export interface GridConfig {
  rows: number;
  cols: number;
  label: string;
}

export interface ShotDefinition {
  id: number;
  type: string; // The selected value from SHOT_TYPES
  content?: {
    en: string;
    zh: string;
  };
  isLoading?: boolean;
}

export interface GeneratedContent {
  sceneDescription: string;
  shots: string[];
}

export interface DualLanguageContent {
  en: GeneratedContent;
  zh: GeneratedContent;
}

export type Language = 'zh' | 'en';
export type FontSize = 'small' | 'medium' | 'large';

export interface PromptTemplateData {
  scene: string;
  gridLabel: string;
  totalShots: number;
  shots: string[]; // Just the strings for display
  lang: Language;
}