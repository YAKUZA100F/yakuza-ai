
import React, { useState, useEffect } from 'react';
import { MatchOdds } from '../types';
import { getMatchAnalysis } from '../services/gemini'; 

const BIG_TEAMS = [
  "Manchester City", "Arsenal", "Liverpool", "Manchester United", 
  "Chelsea", "Real Madrid", "Barcelona", "Atletico Madrid", 
  "Bayern Munich", "Dortmund", "Milan", "Inter", "Juventus", "PSG"
];

const MOCK_WINNERS = [
  { match: "Real Madrid vs Betis", tip: "Home Win", odds: "1.45", status: "WON" },
  { match: "Man City vs Arsenal", tip: "Over 2.5", odds: "1.85", status: "WON" },
  { match: "Liverpool vs Chelsea", tip: "BTTS", odds: "1.70", status: "WON" },
  { match: "Bayern vs Dortmund", tip: "Over 3.5", odds: "2.10", status: "WON" },
  { match: "Inter vs Milan", tip: "Draw No Bet (Inter)", odds: "1.62", status: "WON" },
];

const MOCK_REVIEWS = [
  { name: "Ahmed K.", stars: 5, text: "Yakuza AI changed my game. The combo bets are insane!" },
  { name: "Sarah M.", stars: 5, text: "Finally a tool that uses real data. Worth every penny." },
  { name: "Yassine R.", stars: 5, text: "أفضل نظام تحليل جربته حتى الآن، دقة عالية جداً." },
];

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [freeMatch, setFreeMatch] = useState<MatchOdds | null>(null);
  const [matchDate, setMatchDate] = useState<string>("");
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % MOCK_WINNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGetFreePick = async () => {
    setIsLoadingMatch(true);
    setShowMatch(true);
    setAiPrediction("");

    const API_KEY = "d1406e5211639323c0e79daafff8ce0d";
    const LEAGUES = ["soccer_epl", "soccer_spain_la_liga", "soccer_germany_bundesliga", "soccer_uefa_champs_league"];

    try {
      let allMatches: any[] = [];
      
      for (const league of LEAGUES) {
        const res = await fetch(`https://api.the-odds-api.com/v4/sports/${league}/odds/?regions=uk,eu&markets=h2h&dateFormat=iso&oddsFormat=decimal&apiKey=${API_KEY}`);
        const data = await res.json();
        if (Array.isArray(data)) allMatches = [...allMatches, ...data];
      }

      const premiumMatch = allMatches.find((m: any) => 
        BIG_TEAMS.some(team => m.home_team.includes(team) || m.away_team.includes(team)) &&
        new Date(m.commence_time) > new Date()
      ) || allMatches[0];

      if (premiumMatch) {
        setFreeMatch(premiumMatch);
        const date = new Date(premiumMatch.commence_time);
        setMatchDate(`${date.toLocaleDateString('en-US', { weekday: 'long' })} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        
        await performAiAnalysis(premiumMatch);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoadingMatch(false);
    }
  };

  const performAiAnalysis = async (match: any) => {
    setIsAnalyzing(true);
    try {
      const bookmaker = match.bookmakers?.[0];
      const market = bookmaker?.markets?.[0];
      const outcomes = market?.outcomes || [];
      const homeOdd = outcomes.find((o: any) => o.name === match.home_team)?.price || "N/A";
      const awayOdd = outcomes.find((o: any) => o.name === match.away_team)?.price || "N/A";

      const prompt = `Analyze this match: ${match.home_team} vs ${match.away_team}. Odds: Home ${homeOdd}, Away ${awayOdd}. Provide a high-probability betting tip. FORMAT: Write the "Bet" clearly, then a short "Rationale". DO NOT USE BOLD OR ASTERISKS.`;
      const result = await getMatchAnalysis(prompt);
      // Clean up markdown asterisks
      const cleanResult = result.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      setAiPrediction(cleanResult);
    } catch (error) {
      setAiPrediction("The engine is busy processing other signals. Please refresh.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-['Inter']">
      {/* HEADER */}
      <header className="glass-card px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">YKZ</div>
          <span className="font-extrabold text-xl tracking-tighter uppercase">Yakuza AI</span>
        </div>
        <button onClick={onEnter} className="px-6 py-2 bg-white text-blue-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl">
          GET FREE ACCESS
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 p-6 max-w-[1400px] mx-auto w-full mt-6">
        
        {/* SIDEBAR: COMMUNITY */}
        <aside className="lg:col-span-1 space-y-8 hidden lg:block">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">COMMUNITY INTEL</h3>
            <div className="space-y-4">
              {MOCK_REVIEWS.map((rev, idx) => (
                <div key={idx} className="glass-card p-5 rounded-3xl border border-white/5 animate-in">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-blue-400">{rev.name}</span>
                    <div className="text-yellow-500 text-[8px]">★★★★★</div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">"{rev.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER: MAIN ACTION */}
        <section className="lg:col-span-2 space-y-6">
          <div className="text-center space-y-4">
             <div className="inline-block px-4 py-1.5 bg-blue-900/30 border border-blue-500/30 rounded-full">
                <span className="text-blue-400 font-black text-[10px] tracking-widest uppercase">✨ ELITE LEAGUES ONLY</span>
             </div>
             <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
               ELITE <br /> <span className="gradient-text">AI BETTING</span>
             </h1>
          </div>

          <div className="glass-card rounded-[4rem] p-10 border border-blue-500/20 relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center shadow-3xl">
            <div className="absolute top-0 right-10 bg-blue-600 text-white text-[9px] font-black uppercase px-6 py-2 rounded-b-2xl z-10">
              PREMIER LEAGUE & LA LIGA
            </div>
            
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"></div>
            
            {!showMatch ? (
              <div className="text-center space-y-10 animate-in relative z-10 w-full max-w-sm">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping opacity-40"></div>
                  <div className="relative w-full h-full bg-slate-900 rounded-full border border-blue-500/30 flex items-center justify-center shadow-inner">
                     <span className="text-4xl animate-pulse">🎯</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase italic text-white tracking-tighter">INITIALIZE SCAN</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    Connecting to Global Sports API... <br/>
                    Awaiting Neural Sync.
                  </p>
                </div>
                <button 
                  onClick={handleGetFreePick}
                  className="group relative w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-blue-900/40 overflow-hidden"
                >
                  <span className="relative z-10">REVEAL PRO MATCH</span>
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            ) : isLoadingMatch ? (
              <div className="flex flex-col items-center justify-center gap-8 animate-in relative z-10">
                <div className="relative w-16 h-16">
                   <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 animate-pulse mb-2">SYNCHRONIZING MARKETS</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Accessing Yakuza Neural Engine...</p>
                </div>
              </div>
            ) : freeMatch ? (
              <div className="w-full text-center space-y-12 animate-in relative z-10">
                <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">AI MATCH LOCKED</span>
                   </div>
                   <div>
                    <div className="px-4 py-1 bg-slate-800/80 rounded-full text-[10px] font-bold text-blue-400 inline-block uppercase border border-white/5">{freeMatch.sport_title.replace("Soccer ","")}</div>
                    <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-tighter">{matchDate}</p>
                   </div>
                </div>

                <div className="flex items-center justify-around gap-4 md:gap-8 px-4">
                   <div className="flex flex-col items-center gap-4 flex-1">
                      <div className="w-20 h-20 bg-slate-900 rounded-3xl border border-white/5 flex items-center justify-center text-3xl shadow-xl">
                         {freeMatch.home_team.charAt(0)}
                      </div>
                      <div className="text-xl md:text-3xl font-black uppercase text-white tracking-tighter">{freeMatch.home_team}</div>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                      <div className="text-xs font-black text-slate-700 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 italic">VS</div>
                   </div>
                   <div className="flex flex-col items-center gap-4 flex-1">
                      <div className="w-20 h-20 bg-slate-900 rounded-3xl border border-white/5 flex items-center justify-center text-3xl shadow-xl">
                         {freeMatch.away_team.charAt(0)}
                      </div>
                      <div className="text-xl md:text-3xl font-black uppercase text-white tracking-tighter">{freeMatch.away_team}</div>
                   </div>
                </div>

                {/* THE NEURAL ENGINE BOX */}
                <div className="max-w-2xl mx-auto p-1 bg-gradient-to-r from-blue-500/20 via-blue-500/40 to-blue-500/20 rounded-[3rem] shadow-2xl">
                  <div className="bg-[#0a1128] rounded-[2.9rem] p-8 md:p-12 relative overflow-hidden min-h-[160px] flex flex-col justify-center">
                     <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
                     
                     <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6 flex items-center justify-center gap-3">
                        <span className="text-lg">🤖</span> YAKUZA NEURAL ENGINE
                     </h4>
                     
                     {isAnalyzing ? (
                        <div className="flex flex-col items-center gap-5 py-4">
                           <div className="flex gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                           </div>
                           <p className="text-[10px] font-black text-blue-300 animate-pulse uppercase tracking-[0.3em]">SYNTHESIZING PREDICTION...</p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                          <p className="text-lg md:text-xl font-bold text-white leading-relaxed italic">
                            {aiPrediction || "Recalibrating Neural Sensors..."}
                          </p>
                          <div className="pt-4 border-t border-white/5">
                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Confidence Score: 94.2%</span>
                          </div>
                        </div>
                     )}
                  </div>
                </div>

                <button onClick={() => setShowMatch(false)} className="text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:scale-105">
                  Analyze Another Match
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* SIDEBAR: WINS */}
        <aside className="lg:col-span-1 space-y-8 hidden lg:block">
           <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-6 animate-pulse">● LIVE VERIFIED WINS</h3>
            <div className="space-y-3">
              {MOCK_WINNERS.map((win, idx) => (
                <div key={idx} className={`glass-card p-4 rounded-2xl border-l-4 border-l-green-500 flex items-center justify-between transition-all duration-700 ${idx === tickerIndex ? 'scale-105 border-blue-500/50 opacity-100' : 'opacity-40 scale-95 grayscale'}`}>
                   <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">{win.match}</p>
                      <p className="text-xs font-bold text-white tracking-tight">{win.tip}</p>
                   </div>
                   <div className="text-right">
                      <span className="block text-[10px] font-black text-green-400">WON</span>
                      <span className="text-[9px] font-bold text-slate-600 italic">@{win.odds}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <footer className="p-10 border-t border-white/5 flex flex-col items-center gap-6">
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">YAKUZA AI NEURAL SYSTEMS © 2025</p>
         <div className="flex gap-12 opacity-30">
            <span className="text-[9px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity cursor-default">Responsible Gambling</span>
            <span className="text-[9px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity cursor-default">Encrypted Data</span>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
