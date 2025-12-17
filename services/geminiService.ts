import { GoogleGenAI, Type } from "@google/genai";
import { DualLanguageContent } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image to get a detailed scene description suitable for image generation prompts.
 * Returns both English and Chinese versions.
 */
export const analyzeImageForScene = async (base64Data: string, mimeType: string): Promise<{en: string, zh: string}> => {
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this image and provide a highly descriptive prompt suitable for an AI image generator (like Midjourney or Stable Diffusion). Focus on the subject, setting, lighting, artistic style, clothing, and atmosphere. Provide both English ('en') and Chinese ('zh') versions. Output JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            en: { type: Type.STRING },
            zh: { type: Type.STRING }
          },
          required: ["en", "zh"]
        }
      }
    });

    return JSON.parse(response.text || '{"en":"", "zh":""}') as {en: string, zh: string};
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

/**
 * Generates the specific storyboard shots based on the scene and requested shot types.
 */
export const generateStoryboardContent = async (
  sceneDescription: string,
  gridLabel: string,
  requestedShots: string[]
): Promise<DualLanguageContent> => {
  const ai = getAI();
  const totalShots = requestedShots.length;
  
  const prompt = `
    Context:
    I need to generate a prompt for a ${gridLabel} grid image containing ${totalShots} specific camera shots.
    The Base Scene Description is: "${sceneDescription}"
    
    The requested shot types for the ${totalShots} frames are:
    ${requestedShots.map((s, i) => `${i + 1}. ${s}`).join('\n')}
    
    Task:
    1. Summarize/Refine the Base Scene Description into a cohesive prompt string.
    2. Write a specific, detailed visual description for EACH of the ${totalShots} shots based on the requested shot type, maintaining strict consistency with the base scene.
    
    Output Format (JSON):
    {
      "en": { "sceneDescription": "...", "shots": ["...", ...] },
      "zh": { "sceneDescription": "...", "shots": ["...", ...] }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            en: {
              type: Type.OBJECT,
              properties: {
                sceneDescription: { type: Type.STRING },
                shots: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["sceneDescription", "shots"],
            },
            zh: {
              type: Type.OBJECT,
              properties: {
                sceneDescription: { type: Type.STRING },
                shots: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["sceneDescription", "shots"],
            }
          },
          required: ["en", "zh"],
        },
      },
    });

    return JSON.parse(response.text || "{}") as DualLanguageContent;
  } catch (error) {
    console.error("Error generating storyboard:", error);
    throw error;
  }
};

/**
 * Generates a SINGLE shot description.
 */
export const generateSingleShotContent = async (
  sceneDescription: string,
  shotType: string
): Promise<{ en: string; zh: string }> => {
  const ai = getAI();
  
  const prompt = `
    Context:
    Base Scene: "${sceneDescription}"
    Target Shot Type: "${shotType}"
    
    Task:
    Write a detailed visual description for this ONE specific camera shot. It must strictly match the base scene's character, lighting, and style.
    
    Output Format (JSON):
    {
      "en": "Description in English",
      "zh": "Description in Chinese"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            en: { type: Type.STRING },
            zh: { type: Type.STRING },
          },
          required: ["en", "zh"],
        },
      },
    });

    return JSON.parse(response.text || "{}") as { en: string; zh: string };
  } catch (error) {
    console.error("Error generating single shot:", error);
    throw error;
  }
};