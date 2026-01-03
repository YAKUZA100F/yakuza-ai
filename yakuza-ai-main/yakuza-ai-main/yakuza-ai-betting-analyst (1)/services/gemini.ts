
import { GoogleGenAI, Type } from "@google/genai";
import { MatchOdds, NewsArticle, AnalysisJSON } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeMatches = async (matches: MatchOdds[], news: Record<string, NewsArticle[]>): Promise<AnalysisJSON | null> => {
  const ai = getAI();
  
  const matchesContext = matches.map(m => ({
    competition: m.sport_title,
    match: `${m.home_team} vs ${m.away_team}`,
    date: m.commence_time,
    odds: m.bookmakers?.[0]?.markets.find(mk => mk.key === 'h2h')?.outcomes.map(o => `${o.name}: ${o.price}`).join(', ')
  }));

  const newsContext = Object.entries(news).map(([matchId, articles]) => ({
    matchId,
    articles: articles.map(a => ({
      title: a.title,
      description: a.description,
      content: a.content
    }))
  }));

  const prompt = `
🤖 AI-Powered Betting Analysis | Elite Sports Intel 💸

CONTEXT:
Upcoming Matches: ${JSON.stringify(matchesContext)}
Recent News & Intel: ${JSON.stringify(newsContext)}

TASK:
Generate a high-conversion betting guide for the match provided. Use the provided news to justify unconventional bets (fouls, offsides, cards).

GUIDELINES:
1. "safeBet": The most statistically probable outcome (e.g., Over 1.5 goals, Double Chance).
2. "additionalOptions": Provide exactly 5 diverse options. MUST include:
   - Total Fouls (Over/Under)
   - Offsides (Over/Under)
   - Corners or Yellow Cards
   - Player Shots or Specific Team Goals
3. "comboBet": Combine 2 high-value picks into a lucrative "YAKUZA COMBO".
4. Tone: Professional, authoritative, and data-driven.
5. All odds mentioned must be realistic based on the H2H data provided.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchName: { type: Type.STRING },
            dateTime: { type: Type.STRING, description: "Formatted date and time (e.g. May 6, 2025, 21:00 Mecca Time)" },
            stadium: { type: Type.STRING, description: "Likely stadium based on home team" },
            bettingType: { type: Type.STRING, description: "The main focus category" },
            safeBet: {
              type: Type.OBJECT,
              properties: {
                selection: { type: Type.STRING },
                odds: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["selection", "odds", "reason"]
            },
            additionalOptions: {
              type: Type.ARRAY,
              minItems: 5,
              maxItems: 5,
              items: {
                type: Type.OBJECT,
                properties: {
                  option: { type: Type.STRING },
                  odds: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  probability: { type: Type.STRING, enum: ['likely', 'less-likely'] }
                },
                required: ["option", "odds", "reason", "probability"]
              }
            },
            comboBet: {
              type: Type.OBJECT,
              properties: {
                bet1: { type: Type.STRING },
                bet2: { type: Type.STRING },
                totalOdds: { type: Type.STRING },
                comment: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                riskReason: { type: Type.STRING }
              },
              required: ["bet1", "bet2", "totalOdds", "comment", "riskLevel", "riskReason"]
            }
          },
          required: ["matchName", "dateTime", "stadium", "bettingType", "safeBet", "additionalOptions", "comboBet"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
