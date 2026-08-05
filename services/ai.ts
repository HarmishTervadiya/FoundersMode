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

// ---------------------------------------------------------------------------
// INPUT SANITIZATION
// Prevents prompt injection by neutralizing XML delimiter characters and
// template syntax before interpolating user content into the AI prompt.
// ---------------------------------------------------------------------------
function sanitizeLogInput(raw: string): string {
  return (
    raw
      // Break any attempt to close the <USER_LOG> XML delimiter
      .replace(/<\/?USER_LOG>/gi, '[USER_LOG]')
      // Neutralize generic XML/HTML tags that could confuse the prompt boundary
      .replace(/<([^>]{0,50})>/g, '($1)')
      // Neutralize template literal / prompt injection braces
      .replace(/\{/g, '[')
      .replace(/\}/g, ']')
      // Trim excessive whitespace but preserve intentional newlines
      .trim()
  );
}

// ---------------------------------------------------------------------------
// OUTPUT SANITIZATION
// Strips any HTML/script injected via the AI response and clamps all numeric
// values to their valid game ranges before the data touches the store or DB.
// ---------------------------------------------------------------------------
function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '') // strip HTML/script tags
    .replace(/[<>]/g, '') // strip any remaining angle brackets
    .trim()
    .slice(0, maxLength);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(n)) return fallback;
  return Math.round(Math.min(max, Math.max(min, n)));
}

function validateAndSanitizeResult(raw: unknown): LogAnalysisResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid data structure received from AI.');
  }

  const r = raw as Record<string, unknown>;

  // Validate required fields exist
  if (typeof r.total_fp !== 'number' || typeof r.total_xp !== 'number') {
    throw new Error('Invalid data structure received from AI.');
  }

  // Clamp FP/XP to valid range
  const total_fp = clampInt(r.total_fp, 0, 100, 10);
  // total_xp must always equal total_fp — enforce regardless of AI output
  const total_xp = total_fp;

  // Validate and clamp xp_breakdown
  const rawBreakdown =
    r.xp_breakdown && typeof r.xp_breakdown === 'object'
      ? (r.xp_breakdown as Record<string, unknown>)
      : {};

  const xp_breakdown = {
    STR: clampInt(rawBreakdown.STR, 0, 100, 0),
    CHA: clampInt(rawBreakdown.CHA, 0, 100, 0),
    INT: clampInt(rawBreakdown.INT, 0, 100, 0),
    CON: clampInt(rawBreakdown.CON, 0, 100, 0),
    WIS: clampInt(rawBreakdown.WIS, 0, 100, 0),
  };

  // Clamp difficulty tier to 1–4
  const difficulty_tier = clampInt(r.difficulty_tier, 1, 4, 1);

  // Sanitize string fields — strip any injected HTML or script content
  const analysis_short = sanitizeString(r.analysis_short, 200);
  const insight = sanitizeString(r.insight, 500);

  return { total_fp, total_xp, xp_breakdown, difficulty_tier, analysis_short, insight };
}

export const ai = {
  /**
   * Sends the log content to Gemini API for analysis.
   * Input is sanitized before prompt interpolation to prevent injection.
   * Output is validated and sanitized before returning.
   */
  analyzeLog: async (logContent: string): Promise<LogAnalysisResult> => {
    if (!API_KEY) {
      console.error('Gemini API Key is missing. Ensure EXPO_PUBLIC_GEMINI_API_KEY is set.');
      throw new Error('System Error: Neural Link Disconnected (Missing API Key).');
    }

    try {
      // Sanitize user input BEFORE interpolating into the prompt
      const safeContent = sanitizeLogInput(logContent);
      const prompt = GAME_MASTER_SYSTEM_PROMPT.replace('{user_log_text}', safeContent);

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
        const parsed = JSON.parse(jsonText);
        // Validate structure + sanitize all fields before returning
        return validateAndSanitizeResult(parsed);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Data Corruption: Unable to decode Game Engine response.');
      }
    } catch (error: any) {
      console.error('AI Service Error:', error);
      throw new Error(error.message || 'Neural Link Failure.');
    }
  },
};
