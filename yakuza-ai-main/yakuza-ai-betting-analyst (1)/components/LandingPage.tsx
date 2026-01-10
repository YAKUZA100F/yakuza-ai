// src/components/LandingPage.tsx
import React, { useState, useEffect } from 'react';
import { fetchOddsByLeague, fetchTeamNews, searchMatchAssets } from '../services/api';
import { analyzeMatches } from '../services/gemini';
import type { MatchOdds, AnalysisJSON, NewsArticle } from '../types';

// --- Utility Components ---
const Pill: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${className}`}>
    {children}
  </span>
);

// --- Mock Data ---
const MOCK_WINNERS = [
  { match: "Man City vs Arsenal", tip: "Over 2.5", odds: "1.85", status: "WON" },
  { match: "Real Madrid vs Betis", tip: "Home Win", odds: "1.45", status: "WON" },
  { match: "Liverpool vs Chelsea", tip: "BTTS", odds: "1.70", status: "WON" },
  { match: "Bayern vs Dortmund", tip: "Over 3.5", odds: "2.10", status: "WON" },
];

const MOCK_REVIEWS = [
  { name: "Ahmed K.", stars: 5, text: "The new dashboard layout is insane! Looks exactly like the pro tools." },
  { name: "Sarah M.", stars: 5, text: "Accuracy on the Safe Entry is 10/10." },
  { name: "John D.", stars: 4, text: "Love the Neural Combo feature." },
];

interface LandingPageProps {
  onEnter: () => void;
  onGoToContact: () => void;
  onGoToBlog: () => void;
  onGoToNews: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onGoToContact, onGoToBlog, onGoToNews }) => {
  const [tickerIndex, setTickerIndex] = useState(0);
  
  // --- Analysis Logic State ---
  const [freePickLoading, setFreePickLoading] = useState(false);
  const [freePick, setFreePick] = useState<AnalysisJSON | null>(null);
  const [freePickImage, setFreePickImage] = useState<string | null>(null);
  const [freePickError, setFreePickError] = useState<string | null>(null);

  const handleGetFreePick = async () => {
    setFreePickLoading(true);
    setFreePick(null);
    setFreePickImage(null);
    setFreePickError(null);
    
    try {
      // 1. Fetch Matches from top leagues
      const leagues = ['soccer_epl', 'soccer_spain_la_liga', 'soccer_uefa_champs_league', 'soccer_germany_bundesliga', 'soccer_italy_serie_a'];
      let matches: MatchOdds[] = [];
      
      for (const league of leagues) {
        try {
            const data = await fetchOddsByLeague(league);
            if (data && data.length > 0) { matches = data; break; }
        } catch (e) { continue; }
      }

      // 2. Filter for a "Big Match"
      const bigTeams = ['Real Madrid', 'Barcelona', 'Man City', 'Arsenal', 'Liverpool', 'Bayern', 'PSG', 'Juventus', 'Inter', 'Milan', 'Dortmund'];
      const strongMatch = matches.find(m =>
        bigTeams.some(team => m.home_team.includes(team) || m.away_team.includes(team))
      ) || matches[0];

      if (!strongMatch) {
        setFreePickError('No suitable matches found at the moment.');
        setFreePickLoading(false);
        return;
      }

      // 3. Get News & Image
      const matchName = `${strongMatch.home_team} vs ${strongMatch.away_team}`;
      let news: Record<string, NewsArticle[]> = {};
      
      const [newsData, assets] = await Promise.all([
         fetchTeamNews(strongMatch.home_team, strongMatch.away_team).catch(() => []),
         searchMatchAssets(matchName).catch(() => null)
      ]);

      if (newsData) news[strongMatch.id] = newsData;
      
      // 4. Run AI Analysis
      const analysis = await analyzeMatches([strongMatch], news);
      
      if (!analysis) {
        setFreePickError('AI Analysis failed. Please try again.');
      } else {
        setFreePick(analysis);
        setFreePickImage(assets?.imageUrl || null);
      }
    } catch (err) {
      console.error(err);
      setFreePickError('Error fetching prediction.');
    }
    setFreePickLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(() => setTickerIndex((prev) => prev + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const getVisibleItems = (data: any[], count: number) => {
    const visible = [];
    for (let i = 0; i < count; i++) {
      visible.push(data[(tickerIndex + i) % data.length]);
    }
    return visible;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-['Inter'] selection:bg-blue-500/30">
      
      {/* HEADER */}
      <header className="glass-card px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-900/20">YKZ</div>
          <span className="font-extrabold text-xl tracking-tighter uppercase hidden sm:block">Yakuza AI</span>
        </div>
        <nav className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 mr-4">
            <button onClick={onGoToNews} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">News</button>
            <button onClick={onGoToBlog} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Blog</button>
            <button onClick={onGoToContact} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Contact</button>
          </div>
          <button onClick={onEnter} className="px-6 py-2 bg-white text-blue-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            ENTER TERMINAL
          </button>
        </nav>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDEBAR (REVIEWS) - 2 Cols */}
        <aside className="hidden lg:block lg:col-span-2 space-y-4 pt-10">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Intel Feed
          </h3>
          {getVisibleItems(MOCK_REVIEWS, 3).map((review, idx) => (
            <div key={idx} className="glass-card p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-xs text-white">{review.name}</span>
                <div className="text-yellow-500 text-[8px]">{"★".repeat(review.stars)}</div>
              </div>
              <p className="text-[10px] text-slate-400 italic leading-relaxed">"{review.text}"</p>
            </div>
          ))}
        </aside>

        {/* CENTER (CONTENT) - 8 Cols */}
        <section className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          
          {/* HERO TEXT */}
          <div className="text-center py-6 space-y-3">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/20 border border-blue-500/20 rounded-full mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                <span className="text-[9px] font-black text-blue-400 tracking-[0.3em] uppercase">System Online</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-none">
                Yakuza <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Neural</span>
             </h1>
          </div>

          {/* === ANALYSIS BOARD === */}
          <div className="glass-card rounded-[2.5rem] border border-white/10 bg-[#0B0F19] relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-1">
            
            {/* Loading / Empty State */}
            {!freePick && !freePickLoading && (
              <div className="p-10 text-center max-w-lg mx-auto z-10">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-600/10 blur-[80px]" />
                 <h2 className="text-2xl font-black uppercase text-white mb-4">Unlock Professional Grade <br/><span className="text-blue-500">Sports Analysis</span></h2>
                 <p className="text-slate-400 text-xs mb-8 leading-relaxed">Our neural engine processes thousands of data points to generate elite-level predictions with calculated risk assessments.</p>
                 <button onClick={handleGetFreePick} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg shadow-blue-900/50">
                    Initialize Analysis
                 </button>
                 
                 {/* Stats for Empty State */}
                 <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/5 pt-8">
                     {[
                       { label: 'Success Rate', val: '78%' },
                       { label: 'Active Users', val: '2.4k' },
                       { label: 'Daily Tips', val: '50+' },
                     ].map((stat, i) => (
                       <div key={i} className="text-center">
                         <p className="text-xl font-black text-white">{stat.val}</p>
                         <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                       </div>
                     ))}
                 </div>

                 {freePickError && <p className="mt-4 text-red-400 text-xs font-bold">{freePickError}</p>}
              </div>
            )}

            {/* Loading Spinner */}
            {freePickLoading && (
               <div className="flex flex-col items-center gap-4 z-10">
                  <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/>
                  <span className="text-xs font-black uppercase tracking-widest text-blue-400 animate-pulse">Decrypting Match Data...</span>
               </div>
            )}

            {/* === RESULT DISPLAY === */}
            {freePick && (
              <div className="w-full h-full p-4 md:p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-[#05080f]">
                
                {/* 1. Header & Image */}
                <div className="relative w-full h-40 md:h-56 rounded-[2rem] overflow-hidden mb-6 border border-white/10 group">
                   {freePickImage && <img src={freePickImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" alt="Match" />}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#05080f] via-transparent to-transparent"/>
                   <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
                      <div>
                        <Pill className="mb-2 bg-blue-600/20 border-blue-500/30 text-blue-300">Analysis Complete</Pill>
                        <h2 className="text-2xl md:text-4xl font-black uppercase text-white leading-none drop-shadow-xl">{freePick.matchName}</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">{freePick.dateTime} • {freePick.stadium}</p>
                      </div>
                   </div>
                </div>

                {/* 2. GRID LAYOUT: SAFE BET (Left) + COMBO (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* --- LEFT: ELITE SAFE ENTRY --- */}
                    <div className="md:col-span-2 relative rounded-[2rem] bg-[#0B0F19] border border-white/10 overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                        <div className="p-6 pl-8 md:p-8 md:pl-10 h-full flex flex-col justify-between">
                            <div>
                                <h3 className="text-emerald-500 font-bold tracking-[0.3em] text-[10px] uppercase mb-4">Elite Safe Entry</h3>
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase leading-[0.9]">{freePick.safeBet.selection}</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Decoded Odds</span>
                                        <span className="text-3xl md:text-4xl font-black text-emerald-400">@{freePick.safeBet.odds}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                                <p className="text-slate-300 text-xs md:text-sm italic leading-relaxed font-medium">"{freePick.safeBet.reason}"</p>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT: NEURAL COMBO --- */}
                    <div className="md:col-span-1 rounded-[2rem] bg-gradient-to-b from-[#1e1b4b] to-[#0B0F19] border border-indigo-500/30 p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/20 blur-[40px] pointer-events-none"/>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-lg">🚀</span>
                            <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-indigo-200">Neural Combo</h3>
                        </div>
                        <div className="space-y-3 flex-1">
                            <div className="bg-[#020617]/50 p-4 rounded-2xl border border-indigo-500/20 shadow-inner">
                                <p className="font-black text-white text-xs uppercase">{freePick.comboBet.bet1}</p>
                            </div>
                            <div className="flex justify-center text-indigo-400 font-black text-xs">+</div>
                            <div className="bg-[#020617]/50 p-4 rounded-2xl border border-indigo-500/20 shadow-inner">
                                <p className="font-black text-white text-xs uppercase">{freePick.comboBet.bet2}</p>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-indigo-500/20 text-center">
                            <span className="text-[9px] font-bold uppercase text-indigo-300/60 tracking-widest block mb-1">Synthesized Multiplier</span>
                            <div className="text-4xl font-black text-white">@{freePick.comboBet.totalOdds}</div>
                        </div>
                    </div>
                </div>

                {/* 3. SECONDARY EXTRACTIONS */}
                <div className="mt-8">
                    <h4 className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-4 pl-2">Secondary Extractions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {freePick.additionalOptions.map((opt, i) => (
                            <div key={i} className="bg-[#0B0F19] border border-white/5 p-5 rounded-[1.5rem] hover:bg-white/[0.03] transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-black text-white uppercase text-sm group-hover:text-blue-400 transition-colors">{opt.option}</h5>
                                    <span className="text-blue-400 font-black text-lg">@{opt.odds}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{opt.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. PROMO CODE */}
                <div className="mt-8 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-transparent p-4 rounded-2xl border border-blue-500/20">
                     <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg grid place-items-center text-[10px] font-black">1X</div>
                        <div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Promo Code</p>
                            <p className="text-white font-mono font-bold tracking-widest">YAKUZA101</p>
                        </div>
                     </div>
                     <button onClick={() => {navigator.clipboard.writeText('yakuza101')}} className="text-[10px] font-black uppercase text-blue-400 hover:text-white transition-colors">Copy Code</button>
                </div>
                
                {/* 5. NEW BUTTON & RESTORED STATS */}
                <div className="mt-8 space-y-8">
                    {/* The Big Button (Replacing the small link) */}
                    <button 
                        onClick={onEnter} 
                        className="group w-full py-4 bg-white hover:bg-slate-200 text-blue-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-3"
                    >
                        <span>Access Premium Terminal</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>

                    {/* Restored Stats Section (Grid) */}
                    <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-8">
                        {[
                          { label: 'Success Rate', val: '78%' },
                          { label: 'Active Users', val: '2.4k' },
                          { label: 'Daily Tips', val: '50+' },
                        ].map((stat, i) => (
                          <div key={i} className="glass-card p-4 rounded-2xl text-center border border-white/5 bg-white/[0.02]">
                            <p className="text-2xl font-black text-white">{stat.val}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                          </div>
                        ))}
                    </div>
                </div>

              </div>
            )}
          </div>
        </section>

        {/* RIGHT SIDEBAR (LIVE WINS) - 2 Cols */}
        <aside className="hidden lg:block lg:col-span-2 space-y-4 pt-10">
           <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-4 flex items-center justify-end gap-2">
            Live Wins <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          </h3>
          {getVisibleItems(MOCK_WINNERS, 3).map((win, idx) => (
            <div key={idx} className="glass-card p-3 rounded-2xl border-r-2 border-r-emerald-500 bg-white/[0.02]">
               <div className="flex justify-between mb-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">{win.match}</span>
                  <span className="text-[9px] font-bold text-emerald-400">WON</span>
               </div>
               <div className="flex justify-between items-end">
                   <span className="text-xs font-bold text-white">{win.tip}</span>
                   <span className="text-[10px] font-black text-slate-500">@{win.odds}</span>
               </div>
            </div>
          ))}
        </aside>

      </main>

      <footer className="py-6 text-center text-[9px] text-slate-600 font-black uppercase tracking-widest border-t border-white/5">
        Yakuza AI Neural Systems © 2025
      </footer>
    </div>
  );
};

export default LandingPage;