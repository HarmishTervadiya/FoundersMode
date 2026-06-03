import { GAME_MASTER_SYSTEM_PROMPT } from '@/lib/gameMasterPrompt';
import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface LogAnalysisResult {
  total_fp: number;
  total_xp: number;
  xp_breakdown: {
    STR: number;
    CHA: number;
    INT: number;
    CON: number;
    WIS: number;
  };
  difficulty_tier: number;
  analysis_short: string;
  insight: string;
}

// Initialize client
const aiClient = new GoogleGenAI({ apiKey: API_KEY || '' });

export const ai = {
  /**
   * Sends the log content to Gemini API for analysis.
   * Uses GoogleGenAI SDK.
   */
  analyzeLog: async (logContent: string): Promise<LogAnalysisResult> => {
    // validate key existence
    if (!API_KEY) {
      console.error('Gemini API Key is missing. Ensure EXPO_PUBLIC_GEMINI_API_KEY is set.');
      throw new Error('System Error: Neural Link Disconnected (Missing API Key).');
    }

    try {
      const prompt = GAME_MASTER_SYSTEM_PROMPT.replace('{user_log_text}', logContent);

      // Using 'gemini-1.5-flash' as standard efficient model.
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: {
          role: 'user',
          parts: [{ text: prompt }],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (!response || !response.text) {
        throw new Error('Analysis failed: received empty data from the Game Engine.');
      }

      const rawText = response.text;

      // Clean up code blocks if the AI wraps JSON in markdown
      const jsonText = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      try {
        const result = JSON.parse(jsonText) as LogAnalysisResult;

        // Basic validation of the result structure
        if (typeof result.total_fp !== 'number' || typeof result.total_xp !== 'number') {
          throw new Error('Invalid data structure received from AI.');
        }

        return result;
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Raw Text:', rawText);
        throw new Error('Data Corruption: Unable to decode Game Engine response.');
      }
    } catch (error: any) {
      console.error('AI Service Error:', error);
      throw new Error(error.message || 'Neural Link Failure.');
    }
  },
};
