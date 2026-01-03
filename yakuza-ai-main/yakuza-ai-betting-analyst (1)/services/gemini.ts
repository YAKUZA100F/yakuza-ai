
import { GoogleGenAI } from "@google/genai";
import { MatchOdds, AnalysisJSON } from "../types";

// Always use named parameter for apiKey and use process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * تحليل مجموعة مباريات (للتطبيق الرئيسي)
 */
export const analyzeMatches = async (matches: MatchOdds[], newsData?: Record<string, any>): Promise<AnalysisJSON[]> => {
  if (matches.length === 0) return [];

  try {
    const matchDescriptions = matches.map(m => {
      const odds = m.bookmakers[0]?.markets[0]?.outcomes
        .map(o => `${o.name}: ${o.price}`)
        .join(", ");
      const news = newsData?.[m.id] ? JSON.stringify(newsData[m.id]) : "No specific news available";
      return `Match: ${m.home_team} vs ${m.away_team} (${m.sport_title}). Odds: ${odds}. Recent Context: ${news}`;
    }).join("\n---\n");

    const prompt = `
      As an elite sports betting AI analyst (Yakuza Engine), analyze these matches.
      Return a JSON array of objects. Each object should represent one match analysis and have these exact keys:
      "dateTime" (string), 
      "stadium" (string), 
      "safeBet" (object with keys: "selection", "odds", "reason"), 
      "additionalOptions" (array of objects with keys: "option", "reason", "odds", "probability" (one of: 'likely', 'unlikely')), 
      "comboBet" (object with keys: "bet1", "bet2", "totalOdds", "riskLevel" (one of: 'Low', 'Medium', 'High'), "riskReason").
      
      Matches to analyze:
      ${matchDescriptions}
    `;

    // Use ai.models.generateContent directly with model name and prompt
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    // response.text is a property, not a method
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Multi-Analysis Error:", error);
    return [];
  }
};

/**
 * تحليل مباراة واحدة (لصفحة الهبوط المجانية)
 */
export const getMatchAnalysis = async (promptText: string): Promise<string> => {
  try {
    // Use ai.models.generateContent directly with model name and prompt
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: promptText,
      config: {
        systemInstruction: "You are the Yakuza Neural Engine. Provide direct, professional betting tips based on odds data. Keep it under 40 words."
      }
    });

    // response.text is a property, not a method
    return response.text || "Analysis currently unavailable.";
  } catch (error) {
    console.error("Gemini Single Analysis Error:", error);
    return "The neural engine is currently recalibrating. Please check back in a moment.";
  }
};
