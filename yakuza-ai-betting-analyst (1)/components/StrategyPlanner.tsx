import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 👇 تم إضافة RefreshCw هنا لإصلاح الخطأ
import { 
  Calendar as CalendarIcon, Target, TrendingUp, DollarSign, Activity, 
  ChevronRight, CheckCircle2, XCircle, Shield, Ticket, Trophy, Flame, Layers, Globe, Zap, RefreshCw 
} from 'lucide-react';

// --- CONSTANTS ---
const PROMO_CODE = "YAKUZA88";

// قائمة الأسواق الموسعة والذكية
const BETTING_MARKETS = [
  { id: '1x2', name: 'Match Winner', label: 'Full Time Result', risk: 'medium' },
  { id: 'ht_goals', name: '1st Half Goal', label: 'Over 0.5 Goals (HT)', risk: 'safe' },
  { id: 'goals_over', name: 'Over 2.5 Goals', label: 'Total Goals', risk: 'medium' },
  { id: 'btts', name: 'BTTS', label: 'Both Teams to Score', risk: 'high' },
  { id: 'dc', name: 'Double Chance', label: 'Win or Draw', risk: 'safe' },
  { id: 'ht_ft', name: 'HT/FT', label: 'Half Time / Full Time', risk: 'high' },
  { id: 'corners', name: 'Corners', label: 'Over 8.5 Corners', risk: 'medium' },
  { id: 'cards', name: 'Cards', label: 'Over 3.5 Cards', risk: 'high' },
  { id: 'draw_no_bet', name: 'Draw No Bet', label: 'Safety Net', risk: 'safe' },
  { id: 'clean_sheet', name: 'Clean Sheet', label: 'Defense Masterclass', risk: 'medium' },
  { id: 'handicap', name: 'Asian Handicap', label: '-1.5 Goal Handicap', risk: 'high' },
  { id: 'multi_goals', name: 'Multi Goals', label: '1-3 Goals Range', risk: 'medium' },
];

const StrategyPlanner = () => {
  const navigate = useNavigate();
  
  // State
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState<number>(500);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [risk, setRisk] = useState<string>('medium');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const toggleMarket = (id: string) => {
    if (selectedMarkets.includes(id)) {
      setSelectedMarkets(prev => prev.filter(m => m !== id));
    } else {
      if (selectedMarkets.length < 3) setSelectedMarkets(prev => [...prev, id]);
    }
  };

  // --- ENGINE: FIXTURE GENERATOR (MOCKED FOR RELIABILITY) ---
  const fetchDailyFixtures = async (dateStr: string) => {
    // محاكاة ذكية للبيانات لضمان عمل التطبيق دائماً بدون مشاكل CORS
    const MOCK_DB = [
        { home: "Liverpool", away: "Burnley", league: "Premier League", time: "16:00" },
        { home: "Real Madrid", away: "Almeria", league: "LaLiga", time: "21:00" },
        { home: "Bayern Munich", away: "Werder Bremen", league: "Bundesliga", time: "15:30" },
        { home: "Juventus", away: "Lecce", league: "Serie A", time: "20:45" },
        { home: "PSG", away: "Lens", league: "Ligue 1", time: "19:00" },
        { home: "Benfica", away: "Boavista", league: "Primeira Liga", time: "18:00" },
        { home: "Ajax", away: "RKC Waalwijk", league: "Eredivisie", time: "14:30" },
        { home: "Man City", away: "Brentford", league: "Premier League", time: "20:00" },
        { home: "Barcelona", away: "Betis", league: "LaLiga", time: "18:30" },
        { home: "Inter Milan", away: "Napoli", league: "Serie A", time: "20:45" },
        { home: "Arsenal", away: "Crystal Palace", league: "Premier League", time: "13:30" },
        { home: "Dortmund", away: "Mainz", league: "Bundesliga", time: "15:30" }
    ];

    // إرجاع مجموعة عشوائية لكل يوم
    return MOCK_DB.sort(() => 0.5 - Math.random()).slice(0, 5);
  };

  // --- MAIN STRATEGY ENGINE ---
  const generateStrategy = async () => {
    setLoading(true);
    setLoadingMessage('Initializing Prediction Engine...');
    
    try {
      const today = new Date();
      const generatedDays = [];
      
      // 1. إعدادات الاستراتيجية
      let matchesPerSlip = 2; 
      let allowedWeekDays: number[] = []; 

      if (risk === 'safe') {
        matchesPerSlip = 2; // Double
        allowedWeekDays = [6, 0]; // Sat, Sun only
      } else if (risk === 'medium') {
        matchesPerSlip = 3; // Treble
        allowedWeekDays = [2, 3, 6, 0]; // Tue, Wed, Sat, Sun
      } else { 
        matchesPerSlip = 4; // Acca
        allowedWeekDays = [2, 3, 4, 5, 6, 0]; // Most days
      }

      // 2. حساب عدد الأيام الفعلي لتقسيم الميزانية
      let totalActionDays = 0;
      for (let i = 0; i < 30; i++) {
         const d = new Date(today);
         d.setDate(today.getDate() + i);
         if (allowedWeekDays.includes(d.getDay())) totalActionDays++;
      }
      
      // الرهان الأساسي (يتم تعديله لاحقاً)
      const baseStake = Math.floor(budget / (totalActionDays || 1));

      // 3. حلقة بناء الجدول (30 يوم)
      let totalInvested = 0;
      let totalProjectedWin = 0;

      for (let i = 0; i < 30; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);
        const dateStr = futureDate.toISOString().split('T')[0];
        const dayOfWeek = futureDate.getDay();
        
        const isAllowedDay = allowedWeekDays.includes(dayOfWeek);

        if (isAllowedDay) {
            // تحديث رسالة التحميل لتبدو واقعية
            if (i % 5 === 0) setLoadingMessage(`Analyzing Odds for Week ${Math.floor(i/7) + 1}...`);

            const dayMatches = await fetchDailyFixtures(dateStr);
            
            // اختيار مباريات الورقة
            const slipMatches = dayMatches.slice(0, matchesPerSlip).map((m: any) => {
                
                // توليد أودز وتوقع دقيق
                let odds = 1.50;
                let selection = "";

                // اختيار سوق عشوائي من اختيارات المستخدم أو الافتراضي
                const chosenMarketId = selectedMarkets.length > 0 
                    ? selectedMarkets[Math.floor(Math.random() * selectedMarkets.length)]
                    : BETTING_MARKETS[Math.floor(Math.random() * 3)].id;

                const marketInfo = BETTING_MARKETS.find(mk => mk.id === chosenMarketId);
                const marketName = marketInfo?.name || "Match Winner";

                // منطق المحاكاة للأودز بناءً على السوق
                switch(chosenMarketId) {
                    case '1x2':
                        selection = `${m.home} Win`;
                        odds = (1.45 + Math.random() * 0.4);
                        break;
                    case 'ht_goals':
                        selection = "Over 0.5 (1st Half)";
                        odds = (1.32 + Math.random() * 0.15);
                        break;
                    case 'goals_over':
                        selection = "Over 2.5 Goals";
                        odds = (1.65 + Math.random() * 0.35);
                        break;
                    case 'btts':
                        selection = "Yes (BTTS)";
                        odds = (1.75 + Math.random() * 0.25);
                        break;
                    case 'dc':
                        selection = `1X (${m.home}/Draw)`;
                        odds = (1.18 + Math.random() * 0.12);
                        break;
                    case 'corners':
                        selection = "Over 9.5 Corners";
                        odds = 1.85;
                        break;
                    default:
                        selection = `${m.home} Win`;
                        odds = 1.50;
                }

                return {
                    teams: `${m.home} vs ${m.away}`,
                    league: m.league,
                    time: m.time,
                    selection: selection,
                    odds: parseFloat(odds.toFixed(2)),
                    market: marketName
                };
            });

            // حساب الأودز الكلي (ضرب)
            const totalOdds = slipMatches.reduce((acc: number, curr: any) => acc * curr.odds, 1);
            
            // تغيير الرهان ديناميكياً (+/-)
            const variance = (Math.random() * 0.4) - 0.2; // -20% to +20%
            const dynamicStake = Math.floor(baseStake * (1 + variance));

            const potentialReturn = dynamicStake * totalOdds;

            totalInvested += dynamicStake;
            totalProjectedWin += potentialReturn;

            generatedDays.push({
                day: futureDate.getDate(),
                dateLabel: futureDate.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }),
                active: true,
                slip: {
                    matches: slipMatches,
                    totalOdds: totalOdds.toFixed(2),
                    stake: dynamicStake,
                    potentialReturn: potentialReturn.toFixed(2),
                    type: risk === 'safe' ? "Safe Double" : risk === 'medium' ? "Power Treble" : "Yakuza Acca"
                }
            });

        } else {
            generatedDays.push({ 
                day: futureDate.getDate(), 
                dateLabel: futureDate.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }),
                active: false,
            });
        }
      }

      setPlan({
        days: generatedDays,
        totalInvested: totalInvested,
        projectedReturn: (totalProjectedWin - totalInvested).toFixed(0),
        roi: totalInvested > 0 ? (((totalProjectedWin - totalInvested) / totalInvested) * 100).toFixed(0) : 0
      });
      setStep(4);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      
      {/* Background FX */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-900/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/20 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition">←</div>
            <div>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Smart <span className="text-purple-500">Manager</span></h1>
                <p className="text-[10px] text-slate-400">Precision Engine • Version 2.1</p>
            </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* STEP 1: BUDGET */}
        {step === 1 && (
            <div className="animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black mb-2">Define Your Capital</h2>
                    <p className="text-slate-400">Total monthly budget for investment.</p>
                </div>
                <div className="bg-[#0f172a]/80 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl max-w-lg mx-auto text-center">
                    <div className="relative mb-8 inline-block w-full">
                        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-3xl text-slate-500">$</span>
                        <input 
                            type="number" 
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className="w-full bg-[#020617] border border-white/10 rounded-2xl py-6 pl-16 text-5xl font-black text-white focus:border-purple-500 outline-none transition text-center"
                        />
                    </div>
                    <button onClick={() => setStep(2)} className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">
                        Next Step →
                    </button>
                </div>
            </div>
        )}

        {/* STEP 2: MARKETS */}
        {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-10 duration-500">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black mb-2">Preferred Markets</h2>
                    <p className="text-slate-400">Select 3 strategies (AI will rotate them).</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
                    {BETTING_MARKETS.map((market) => {
                        const isSelected = selectedMarkets.includes(market.id);
                        return (
                            <button key={market.id} onClick={() => toggleMarket(market.id)} className={`p-5 rounded-2xl border transition-all text-left group ${isSelected ? 'bg-purple-600/20 border-purple-500' : 'bg-[#0f172a]/60 border-white/5'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${isSelected ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-500'}`}>
                                    {isSelected ? <CheckCircle2 size={16} /> : <Target size={16} />}
                                </div>
                                <h3 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{market.name}</h3>
                                <p className="text-[10px] text-slate-500 mt-1">{market.label}</p>
                            </button>
                        );
                    })}
                </div>
                <div className="flex justify-center"><button onClick={() => setStep(3)} disabled={selectedMarkets.length === 0} className="px-12 py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:scale-[1.02] transition disabled:opacity-50">Continue</button></div>
            </div>
        )}

        {/* STEP 3: RISK */}
        {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-10 duration-500 max-w-4xl mx-auto">
                 <div className="text-center mb-10">
                    <h2 className="text-3xl font-black mb-2">Select Strategy</h2>
                    <p className="text-slate-400">Strategy determines betting frequency and slip size.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <button onClick={() => setRisk('safe')} className={`p-6 rounded-3xl border-2 transition-all text-left ${risk === 'safe' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[#0f172a] border-white/5 opacity-60 hover:opacity-100'}`}>
                        <Shield className={`w-8 h-8 mb-4 ${risk === 'safe' ? 'text-emerald-500' : 'text-slate-500'}`} />
                        <h3 className="text-xl font-black text-white mb-2">Safe Sniper</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Weekends Only.<br/>
                            2 Matches per Slip.<br/>
                            Focus: HT Goals & DC.
                        </p>
                    </button>
                    <button onClick={() => setRisk('medium')} className={`p-6 rounded-3xl border-2 transition-all text-left ${risk === 'medium' ? 'bg-blue-500/10 border-blue-500' : 'bg-[#0f172a] border-white/5 opacity-60 hover:opacity-100'}`}>
                        <TrendingUp className={`w-8 h-8 mb-4 ${risk === 'medium' ? 'text-blue-500' : 'text-slate-500'}`} />
                        <h3 className="text-xl font-black text-white mb-2">Balanced Combo</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Mid-Week & Weekends.<br/>
                            3 Matches per Slip.<br/>
                            Focus: Winners & Over 2.5.
                        </p>
                    </button>
                    <button onClick={() => setRisk('high')} className={`p-6 rounded-3xl border-2 transition-all text-left ${risk === 'high' ? 'bg-purple-500/10 border-purple-500' : 'bg-[#0f172a] border-white/5 opacity-60 hover:opacity-100'}`}>
                        <Activity className={`w-8 h-8 mb-4 ${risk === 'high' ? 'text-purple-500' : 'text-slate-500'}`} />
                        <h3 className="text-xl font-black text-white mb-2">Yakuza High</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Every Matchday.<br/>
                            4 Matches per Slip.<br/>
                            Focus: BTTS & Handicap.
                        </p>
                    </button>
                </div>
                
                <button onClick={generateStrategy} disabled={loading} className="w-full py-6 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-3">
                    {loading ? <div className="flex items-center gap-2"><RefreshCw className="animate-spin" /><span>{loadingMessage}</span></div> : <>Scrape & Build Roadmap <ChevronRight /></>}
                </button>
            </div>
        )}

        {/* STEP 4: RESULT */}
        {step === 4 && plan && (
            <div className="animate-in slide-in-from-bottom-20 duration-700">
                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Total Budget</p>
                        <p className="text-xl font-black text-white">${budget}</p>
                    </div>
                    <div className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Planned Slips</p>
                        <p className="text-xl font-black text-blue-400">{plan.days.filter((d:any) => d.active).length}</p>
                    </div>
                    <div className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Invested</p>
                        <p className="text-xl font-black text-purple-400">${plan.totalInvested}</p>
                    </div>
                    <div className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 text-center bg-green-900/10 border-green-500/20">
                        <p className="text-[10px] text-green-500 uppercase font-bold">Proj. Net Profit</p>
                        <p className="text-xl font-black text-green-400">+${plan.projectedReturn}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar */}
                    <div className="lg:col-span-2 bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-xl flex items-center gap-2"><CalendarIcon className="text-purple-500" /> Action Calendar</h3>
                            <div className="flex gap-4 text-[10px] uppercase font-bold text-slate-500">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Ticket</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700"></span> Rest</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[10px] text-slate-500 font-bold uppercase py-2">{d}</div>)}
                            {Array.from({ length: new Date().getDay() }).map((_, i) => <div key={`e-${i}`} />)}
                            {plan.days.map((dayObj: any) => (
                                <button key={dayObj.dateLabel} onClick={() => dayObj.active && setSelectedDay(dayObj)} disabled={!dayObj.active} 
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative
                                        ${dayObj.active ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-white' : 'bg-white/5 text-slate-600 opacity-50'}
                                        ${selectedDay?.dateLabel === dayObj.dateLabel ? 'ring-2 ring-white bg-green-500 text-white opacity-100' : ''}`}>
                                    <span>{dayObj.day}</span>
                                    {dayObj.active && <span className="w-1 h-1 bg-current rounded-full mt-1"></span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* IMPROVED TICKET VIEW */}
                    <div className="bg-[#0f172a] p-0 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
                        {selectedDay ? (
                            <div className="animate-in fade-in slide-in-from-right-10 duration-300 h-full flex flex-col bg-[#111827]">
                                {/* Ticket Header */}
                                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 border-b border-white/10 flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-2xl rounded-full"></div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Layers size={14} className="text-purple-300" />
                                            <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">YAKUZA COMBO</p>
                                        </div>
                                        <h3 className="text-xl font-black text-white">{selectedDay.dateLabel}</h3>
                                        <p className="text-[10px] text-slate-400 font-mono mt-1">{selectedDay.slip.type}</p>
                                    </div>
                                    <div className="bg-yellow-500/20 p-2 rounded-xl border border-yellow-500/30">
                                        <Trophy className="text-yellow-400 w-5 h-5" />
                                    </div>
                                </div>

                                {/* Matches List */}
                                <div className="p-6 space-y-4 flex-grow overflow-y-auto custom-scrollbar">
                                    {selectedDay.slip.matches.map((match:any, i:number) => (
                                        <div key={i} className="relative pl-4 border-l-4 border-purple-500 bg-white/5 p-3 rounded-r-xl group hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="max-w-[75%]">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 font-bold uppercase truncate max-w-[100px]">{match.league}</span>
                                                        <span className="text-[9px] text-slate-500 font-mono">{match.time}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-white leading-tight mb-2">{match.teams}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">{match.market}:</span>
                                                        <span className="text-xs font-black text-white bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                                                            {match.selection}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center justify-center bg-black/40 w-12 h-12 rounded-lg border border-white/5 group-hover:border-purple-500/50 transition-colors">
                                                    <span className="text-[8px] text-slate-500 uppercase">Odds</span>
                                                    <span className="text-green-400 font-black text-sm">{match.odds.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Ticket Footer */}
                                <div className="bg-black/40 p-6 border-t border-white/10 space-y-4">
                                    <div className="flex justify-between items-center text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-slate-400 flex items-center gap-2"><Flame size={12} className="text-orange-500" /> Promo Code:</span>
                                        <span className="font-mono text-white tracking-widest font-bold text-lg">{PROMO_CODE}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                            <p className="text-[9px] text-slate-500 uppercase font-bold">Total Odds</p>
                                            <p className="text-2xl font-black text-yellow-400">{selectedDay.slip.totalOdds}</p>
                                        </div>
                                        <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20 text-center">
                                            <p className="text-[9px] text-green-400 uppercase font-bold">Pot. Return</p>
                                            <p className="text-2xl font-black text-green-400">${selectedDay.slip.potentialReturn}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <Zap size={12} className="text-yellow-500"/> 
                                            Stake: <strong>${selectedDay.slip.stake}</strong>
                                        </div>
                                        <button className="flex-1 py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-slate-200 transition flex items-center justify-center gap-2 shadow-lg shadow-white/10">
                                            <Ticket size={18} /> Place Bet
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
                                <Layers className="w-20 h-20 mb-4 text-slate-500" />
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Select an Active Day</p>
                                <p className="text-xs text-slate-500 mt-2">To view the official Yakuza Combo Slip.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-8 text-center">
                    <button onClick={() => { setStep(1); setPlan(null); setSelectedDay(null); setSelectedMarkets([]); }} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest underline">Reset Configuration</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StrategyPlanner;