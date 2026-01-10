import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { MatchOdds, NewsArticle, AnalysisJSON } from "../types";

// ⚠️ مفتاح API الخاص بك
const GEMINI_API_KEY = "AIzaSyAPLNS6yd2s2qZai4oZMNCwd7gC99dmOPg"; 

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const analyzeMatches = async (matches: MatchOdds[], news: Record<string, NewsArticle[]>): Promise<AnalysisJSON | null> => {
  
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("ضع_مفتاح")) {
    console.error("❌ Gemini API Key is missing!");
    alert("Please set your Gemini API Key inside src/services/gemini.ts");
    return null;
  }

  const model = genAI.getGenerativeModel({
    // ✅ الحل هنا: تأكد أنك تستخدم هذا الموديل بالتحديد
    model: "gemini-2.5-flash", 
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          matchName: { type: SchemaType.STRING },
          dateTime: { type: SchemaType.STRING, description: "e.g. May 6, 2025, 21:00" },
          stadium: { type: SchemaType.STRING },
          bettingType: { type: SchemaType.STRING },
          safeBet: {
            type: SchemaType.OBJECT,
            properties: {
              selection: { type: SchemaType.STRING },
              odds: { type: SchemaType.STRING },
              reason: { type: SchemaType.STRING },
            },
            required: ["selection", "odds", "reason"]
          },
          additionalOptions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                option: { type: SchemaType.STRING },
                odds: { type: SchemaType.STRING },
                reason: { type: SchemaType.STRING },
                probability: { 
                  type: SchemaType.STRING, 
                  format: "enum", 
                  enum: ['likely', 'less-likely'] 
                }
              },
              required: ["option", "odds", "reason", "probability"]
            }
          },
          comboBet: {
            type: SchemaType.OBJECT,
            properties: {
              bet1: { type: SchemaType.STRING },
              bet2: { type: SchemaType.STRING },
              totalOdds: { type: SchemaType.STRING },
              comment: { type: SchemaType.STRING },
              riskLevel: { 
                type: SchemaType.STRING, 
                format: "enum", 
                enum: ['Low', 'Medium', 'High'] 
              },
              riskReason: { type: SchemaType.STRING }
            },
            required: ["bet1", "bet2", "totalOdds", "comment", "riskLevel", "riskReason"]
          }
        },
        required: ["matchName", "dateTime", "stadium", "bettingType", "safeBet", "additionalOptions", "comboBet"]
      }
    }
  });
  
  const matchesContext = matches.map(m => ({
    competition: m.sport_title,
    match: `${m.home_team} vs ${m.away_team}`,
    date: m.commence_time,
    odds: m.bookmakers?.[0]?.markets.find(mk => mk.key === 'h2h')?.outcomes.map(o => `${o.name}: ${o.price}`).join(', ') || "Odds not available"
  }));

  const newsContext = Object.entries(news).map(([matchId, articles]) => ({
    matchId,
    articles: articles.map(a => ({
      title: a.title,
      description: a.description
    })).slice(0, 3)
  }));

  const prompt = `
  You are an expert sports betting analyst.
  
  MATCH DATA: ${JSON.stringify(matchesContext)}
  NEWS INTEL: ${JSON.stringify(newsContext)}
  
  TASK:
  Generate a high-conversion betting guide in JSON format based on the schema provided.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    if (text) {
        return JSON.parse(text);
    }
    return null;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // تنبيه المستخدم إذا انتهى الرصيد المجاني
    if (error.toString().includes("429")) {
        alert("⚠️ You hit the free usage limit. Please wait a minute and try again.");
    }
    return null;
  }
};