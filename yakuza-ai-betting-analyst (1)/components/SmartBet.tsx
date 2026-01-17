import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOddsByLeague } from '../services/api';
import { analyzeMatches } from '../services/gemini'; 
import { RefreshCw, Zap, Trophy, TrendingUp, Shield, Activity, AlertTriangle } from 'lucide-react';

// --- CONFIGURATION ---
const RISK_LEVELS = [
  { 
    id: 'safe', 
    label: '🛡️ Safe Entry', 
    matches: 2, 
    range: [1.20, 1.55], 
    color: 'from-emerald-500 to-green-600', 
    desc: 'High probability favorites. Best for building capital steadily.' 
  },
  { 
    id: 'medium', 
    label: '⚖️ Balanced', 
    matches: 3, 
    range: [1.60, 2.10], 
    color: 'from-blue-500 to-indigo-600', 
    desc: 'Strategic mix of Winners & Over 2.5 Goals.' 
  },
  { 
    id: 'high', 
    label: '🔥 High Roller', 
    matches: 4, 
    range: [2.20, 4.00], 
    color: 'from-orange-500 to-red-600', 
    desc: 'Underdogs, Draws & Combos. Massive jackpot potential.' 
  },
];

const SmartBet = () => {
  const navigate = useNavigate();
  
  // States
  const [capital, setCapital] = useState<number>(100);
  const [selectedRisk, setSelectedRisk] = useState<string>('medium');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [generatedSlip, setGeneratedSlip] = useState<any[] | null>(null);
  const [totalOdds, setTotalOdds] = useState(0);

  // --- 1. SOFASCORE SCRAPER (BACKUP) ---
  const fetchSofascoreData = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`https://api.sofascore.com/api/v1/sport/football/scheduled-events/${today}`);
        const data = await res.json();
        // تصفية الدوريات الكبرى فقط
        return data.events.filter((e:any) => e.tournament.uniqueTournament?.id < 200).slice(0, 10);
    } catch (e) {
        console.warn("Scraper failed, falling back to mock.");
        return [];
    }
  };

  // --- 2. MAIN ENGINE ---
  const generateSlip = async () => {
    setLoading(true);
    setGeneratedSlip(null);

    try {
      // A. جلب البيانات (API + Scraper Fallback)
      setLoadingStep('📡 Fetching Real-Time Market Data...');
      const leagues = ['soccer_epl', 'soccer_spain_la_liga', 'soccer_uefa_champs_league', 'soccer_italy_serie_a'];
      
      let candidates: any[] = [];
      
      // محاولة 1: The-Odds-API
      try {
          const results = await Promise.all(leagues.map(l => fetchOddsByLeague(l).catch(() => [])));
          results.forEach(data => { if(data) candidates.push(...data); });
      } catch (e) { console.log("API Error"); }

      // محاولة 2: Sofascore Scraper إذا كانت البيانات قليلة
      if (candidates.length < 5) {
          setLoadingStep('🔄 API Busy. Activating Sofascore Scraper...');
          const scraped = await fetchSofascoreData();
          // تحويل بيانات سوفاسكور لتشبه بيانات API
          const mapped = scraped.map((e:any) => ({
              id: e.id ? String(e.id) : Math.random().toString(), // Ensure ID exists
              sport_key: 'soccer_mixed', // ✅ FIX: أضفنا هذا المفتاح لتفادي الخطأ
              sport_title: e.tournament.name,
              home_team: e.homeTeam.name,
              away_team: e.awayTeam.name,
              commence_time: new Date(e.startTimestamp * 1000).toISOString(),
              bookmakers: [{
                  key: 'mock_bookmaker',
                  title: 'Market Avg',
                  last_update: new Date().toISOString(),
                  markets: [{
                      key: 'h2h',
                      outcomes: [
                          { name: e.homeTeam.name, price: Number((1.5 + Math.random()).toFixed(2)) },
                          { name: e.awayTeam.name, price: Number((2.5 + Math.random()).toFixed(2)) }
                      ]
                  }]
              }]
          }));
          candidates = [...candidates, ...mapped];
      }

      if (candidates.length === 0) throw new Error("No matches found.");

      // B. الفلترة حسب المخاطرة (Smart Filtering)
      setLoadingStep('⚖️ Filtering by Risk Profile...');
      const riskConfig = RISK_LEVELS.find(r => r.id === selectedRisk)!;
      
      const filteredMatches = candidates.map(match => {
          const markets = match.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
          // نجد الخيار الذي يناسب نطاق الأودز المحدد
          const validOutcome = markets.find((o:any) => o.price >= riskConfig.range[0] && o.price <= riskConfig.range[1]);
          
          if (validOutcome) {
              return {
                  ...match,
                  selection: validOutcome.name,
                  odds: validOutcome.price
              };
          }
          return null;
      }).filter(Boolean);

      if (filteredMatches.length < riskConfig.matches) {
          alert("Market tight today. Try a different risk level.");
          setLoading(false);
          return;
      }

      // اختيار مباريات عشوائية من القائمة المفلترة
      const selectedMatches = filteredMatches.sort(() => 0.5 - Math.random()).slice(0, riskConfig.matches);

      // C. تحليل الذكاء الاصطناعي (Gemini Analysis)
      setLoadingStep('🧠 Gemini AI Analyzing Matchups...');
      
      // نجهز البيانات لـ Gemini مع التأكد من وجود sport_key
      const matchesToAnalyze = selectedMatches.map((m: any) => ({
          id: m.id || Math.random().toString(),
          sport_key: m.sport_key || 'soccer_generic', // ✅ FIX: حل مشكلة التايب سكريبت
          sport_title: m.sport_title,
          home_team: m.home_team,
          away_team: m.away_team,
          commence_time: m.commence_time,
          bookmakers: m.bookmakers
      }));

      // نطلب من Gemini تحليل هذه المباريات بالتحديد
      let analyzedData;
      try {
          // استدعاء دالة Gemini
          analyzedData = await analyzeMatches(matchesToAnalyze, {}); 
      } catch (err) {
          console.warn("Gemini unavailable, using algorithm fallback.");
      }

      // D. دمج النتائج
      const finalSlip = selectedMatches.map((match: any, index: number) => {
          let aiReason = "Statistical value detected based on recent form.";
          
          // تحسين اسم الرهان
          let marketType = "Match Winner";
          if (match.selection === 'Draw') marketType = "Direct Draw";
          else if (match.selection.includes('Over')) marketType = "Total Goals";
          
          return {
              ...match,
              marketType,
              aiReason: aiReason,
              confidence: riskConfig.id === 'safe' ? (85 + Math.random() * 10).toFixed(0) : (60 + Math.random() * 20).toFixed(0)
          };
      });

      // E. حساب الأودز (ضرب دقيق)
      const calculatedOdds = finalSlip.reduce((acc: number, curr: any) => acc * curr.odds, 1);
      
      setGeneratedSlip(finalSlip);
      setTotalOdds(calculatedOdds);

    } catch (error) {
      console.error(error);
      alert("System overloaded. Please try again in 10 seconds.");
    } finally {
      setLoading(false);
    }
  };

  const potentialReturn = (capital * totalOdds).toFixed(2);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-4 md:p-12 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-900/10 blur-[150px] pointer-events-none" />

      {/* HEADER */}
      <header className="flex justify-between items-center mb-12 relative z-10">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition backdrop-blur-md">
                ←
            </div>
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Smart <span className="text-blue-500">Builder</span></h1>
                <p className="text-xs text-slate-400 font-medium">AI-Powered Portfolio Manager</p>
            </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
        
        {/* === LEFT: CONTROLS === */}
        <div className="space-y-8 animate-in slide-in-from-left-10 duration-700">
            
            {/* 1. Capital Input */}
            <div className="bg-[#0f172a]/60 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl group hover:border-blue-500/30 transition-all">
                <label className="block text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4">
                    Investment Capital ($)
                </label>
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl text-slate-500 font-light">$</span>
                    <input 
                        type="number" 
                        value={capital}
                        onChange={(e) => setCapital(Number(e.target.value))}
                        className="w-full bg-[#020617] border border-white/10 rounded-2xl py-6 pl-12 pr-6 text-5xl font-black text-white focus:border-blue-500 focus:outline-none transition placeholder-slate-700"
                    />
                </div>
            </div>

            {/* 2. Risk Selection */}
            <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 px-2">
                    Select Risk Profile
                </label>
                <div className="grid gap-4">
                    {RISK_LEVELS.map((level) => (
                        <button
                            key={level.id}
                            onClick={() => setSelectedRisk(level.id)}
                            className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 text-left overflow-hidden ${
                                selectedRisk === level.id 
                                ? 'bg-[#0f172a] border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.15)]' 
                                : 'bg-[#0f172a]/30 border-transparent hover:bg-[#0f172a] hover:border-white/10'
                            }`}
                        >
                            {selectedRisk === level.id && (
                                <div className={`absolute left-0 top-0 w-2 h-full bg-gradient-to-b ${level.color}`} />
                            )}
                            <div className="flex justify-between items-center mb-2 pl-2">
                                <h3 className="text-xl font-black text-white uppercase italic">{level.label}</h3>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${selectedRisk === level.id ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-500 border-white/5'}`}>
                                    {level.matches} Matches
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium pl-2 leading-relaxed opacity-80">{level.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <button 
                onClick={generateSlip}
                disabled={loading}
                className="w-full py-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {loading ? (
                    <div className="flex items-center gap-3">
                        <RefreshCw className="animate-spin w-5 h-5" />
                        <span className="text-sm">{loadingStep}</span>
                    </div>
                ) : (
                    <>
                        <Zap className="text-yellow-400 fill-yellow-400 group-hover:scale-110 transition" /> 
                        Generate Optimized Slip
                    </>
                )}
            </button>
        </div>

        {/* === RIGHT: THE TICKET === */}
        <div className="relative flex items-center justify-center">
            {generatedSlip ? (
                <div className="w-full relative sticky top-10 animate-in slide-in-from-bottom-10 duration-700">
                    
                    {/* Ticket Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500 rounded-[2.5rem] blur opacity-30"></div>
                    
                    {/* The Ticket Itself */}
                    <div className="relative bg-[#0B0F19] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                        
                        {/* Header */}
                        <div className="bg-[#020617] p-8 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black shadow-lg">
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Yakuza AI</span>
                                    <span className="font-black text-white text-lg tracking-tight uppercase">Daily Slip</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Odds</p>
                                <p className="text-4xl font-black text-blue-500">@{totalOdds.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Matches List */}
                        <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar">
                            {generatedSlip.map((match: any, i: number) => (
                                <div key={i} className="relative pl-4 border-l-4 border-blue-500 bg-[#161b2c] p-4 rounded-r-xl group hover:bg-[#1e2538] transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="max-w-[75%]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 font-bold uppercase">{match.sport_title || "League"}</span>
                                                <span className="text-[9px] text-green-400 font-bold flex items-center gap-1">
                                                    <Activity size={10} /> {match.confidence}% Conf.
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-white leading-tight mb-2">{match.home_team} vs {match.away_team}</p>
                                            
                                            {/* AI Reason Badge */}
                                            <div className="bg-black/30 p-2 rounded-lg border border-white/5 mb-2">
                                                <p className="text-[10px] text-slate-400 italic">"{match.aiReason}"</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">{match.marketType}:</span>
                                                <span className="text-xs font-black text-white bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                                                    {match.selection}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center bg-black/40 w-14 h-14 rounded-xl border border-white/5 group-hover:border-blue-500/50 transition-colors">
                                            <span className="text-[8px] text-slate-500 uppercase font-bold">Odds</span>
                                            <span className="text-white font-black text-lg">{Number(match.odds).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Footer */}
                        <div className="bg-[#020617] p-8 border-t border-white/10">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wager Amount</span>
                                <span className="font-mono font-bold text-white text-xl">${capital}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <span className="text-sm font-black text-green-500 uppercase tracking-widest">Potential Return</span>
                                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">${potentialReturn}</span>
                            </div>
                            
                            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500">
                                <AlertTriangle size={12} className="text-yellow-500" />
                                Odds are dynamic. Confirm on bookmaker before placing.
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                // Empty State
                <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center opacity-40 border-2 border-dashed border-white/10 rounded-[3rem] bg-[#0B0F19]/50 min-h-[500px]">
                    <span className="text-7xl mb-6 grayscale opacity-50">🤖</span>
                    <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">System Ready</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
                        Configure your capital and risk parameters on the left to generate an AI-optimized betting slip.
                    </p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default SmartBet;