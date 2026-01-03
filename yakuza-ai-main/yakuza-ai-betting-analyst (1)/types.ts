export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: OddsOutcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface MatchOdds {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface AnalysisJSON {
  match: string;
  prediction: string;
  confidence: "High" | "Medium" | "Low";
  reasoning: string;
  odds: string;
}

// ✅ هذا السطر ضروري جداً باش App.tsx يخدم
export type AnalysisResult = AnalysisJSON;