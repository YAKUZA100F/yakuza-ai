
export interface OddsOutcome {
  name: string;
  price: number;
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

export interface NewsArticle {
  source: { id: string | null; name: string };
  author: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

export interface AnalysisJSON {
  matchName: string;
  dateTime: string;
  stadium: string;
  bettingType: string;
  safeBet: {
    selection: string;
    odds: string;
    reason: string;
  };
  additionalOptions: Array<{
    option: string;
    odds: string;
    reason: string;
    probability: 'likely' | 'less-likely';
  }>;
  comboBet: {
    bet1: string;
    bet2: string;
    totalOdds: string;
    comment: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    riskReason: string;
  };
}

export interface AnalysisResult {
  matchName: string;
  data: AnalysisJSON;
  imageUrl?: string;
  sofascoreLink?: string;
}
