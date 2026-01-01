import React, { useState, useEffect } from 'react';
import { MatchOdds } from '../types';

// بيانات وهمية للمباريات الرابحة (جانبية فقط)
const MOCK_WINNERS = [
  { match: "Man City vs Arsenal", tip: "Over 2.5", odds: "1.85", status: "WON" },
  { match: "Real Madrid vs Betis", tip: "Home Win", odds: "1.45", status: "WON" },
  { match: "Liverpool vs Chelsea", tip: "BTTS", odds: "1.70", status: "WON" },
  { match: "Bayern vs Dortmund", tip: "Over 3.5", odds: "2.10", status: "WON" },
  { match: "Milan vs Inter", tip: "Draw", odds: "3.20", status: "WON" },
];

const MOCK_REVIEWS = [
  { name: "Ahmed K.", stars: 5, text: "Yakuza AI changed my game. The combo bets are insane!" },
  { name: "Sarah M.", stars: 5, text: "Finally a tool that uses real data. Worth every penny." },
  { name: "John D.", stars: 4, text: "Great predictions, especially for Premier League." },
  { name: "Mehdi B.", stars: 5, text: "Recovered my subscription cost in the first day." },
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
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- دالة الاختبار المباشر (Direct Test) ---
  const handleGetFreePick = async () => {
    setIsLoadingMatch(true);
    setShowMatch(true);
    setApiError(null);

    // هذا هو الرابط المباشر من كود n8n الخاص بك مع المفتاح الجديد
    const TEST_URL = "https://api.the-odds-api.com/v4/sports/soccer_italy_serie_a/odds/?regions=uk,eu&markets=h2h&dateFormat=iso&oddsFormat=decimal&apiKey=d1406e5211639323c0e79daafff8ce0d";

    try {
      console.log("Testing API Connection...");
      const response = await fetch(TEST_URL);
      const data = await response.json();
      
      console.log("API Response:", data); // شوف الكونسول فاش تضغط

      if (Array.isArray(data) && data.length > 0) {
        // نأخذ أول مباراة مباشرة بدون أي شروط (فقط للتأكد أن البيانات وصلت)
        const match = data[0]; 
        
        setFreeMatch(match);
        
        const date = new Date(match.commence_time);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMatchDate(`${dayName} • ${time}`);
      } else {
        // إذا كانت القائمة فارغة أو هناك رسالة خطأ من الـ API
        setApiError(JSON.stringify(data).slice(0, 100)); // عرض جزء من الخطأ
        setFreeMatch(null);
      }

    } catch (error: any) {
      console.error("Fetch Error:", error);
      setApiError(error.message);
      setFreeMatch(null);
    } finally {
      setIsLoadingMatch(false);
    }
  };

  const currentWinners = MOCK_WINNERS.slice(tickerIndex, tickerIndex + 4); // Simplified ticker
  const currentReviews = MOCK_REVIEWS.slice(tickerIndex, tickerIndex + 4);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-['Inter']">
      {/* --- HEADER --- */}
      <header className="glass-card px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white">YKZ</div>
          <span className="font-extrabold text-xl tracking-tighter uppercase">Yakuza AI</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={onEnter} className="px-6 py-2 bg-white text-blue-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            GET FREE ACCESS
          </button>
        </nav>
      </header>

      {/* --- MAIN GRID --- */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 max-w-[1600px] mx-auto w-full">
        
        {/* --- LEFT SIDEBAR --- */}
        <aside className="lg:col-span-1 space-y-4 order-3 lg:order-1 hidden lg:block">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Community Intel</h3>
          <div className="space-y-4">
            {currentReviews.map((review, idx) => (
              <div key={idx} className="glass-card p-4 rounded-2xl border border-white/5 animate-in">
                <div className="flex justify-between items-start mb-2">
                   <span className="font-bold text-sm text-white">{review.name}</span>
                   <div className="flex text-yellow-500 text-[10px]">{"★".repeat(review.stars)}</div>
                </div>
                <p className="text-xs text-slate-400 italic">"{review.text}"</p>
              </div>
            ))}
          </div>
        </aside>

        {/* --- CENTER: HERO & FREE BET --- */}
        <section className="lg:col-span-2 flex flex-col gap-2 order-1 lg:order-2">
          
          {/* Hero Section (Small & Compact as requested) */}
          <div className="text-center py-4 space-y-3">
             <div className="inline-block px-6 py-2 bg-blue-900/30 border border-blue-500/30 rounded-full animate-bounce">
                <span className="text-blue-400 font-black text-[10px] tracking-[0.3em] uppercase">
                  ✨ API LIVE TEST MODE
                </span>
             </div>
             
             {/* تصغير العنوان كما طلبت */}
             <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
               ELITE <br />
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                 AI BETTING
               </span>
             </h1>
          </div>

          {/* Free Weekly Bet Card - MOVED UP (Margin Top reduced) */}
          <div className="glass-card p-8 rounded-[3rem] border border-blue-500/30 relative overflow-hidden group min-h-[300px] flex flex-col items-center justify-center mt-2">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-bl-2xl">
              LIVE API CHECK
            </div>
            
            {!showMatch ? (
               // الحالة 1: زر الفحص
               <div className="text-center space-y-6 animate-in">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/30 animate-pulse">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase text-white tracking-tighter italic">
                    TEST CONNECTION
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-bold uppercase tracking-wider">
                    Click below to fetch raw data from Italy Serie A using your n8n Key.
                  </p>
                  <button 
                    onClick={handleGetFreePick}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 shadow-lg shadow-blue-900/50"
                  >
                    TEST API NOW
                  </button>
               </div>
            ) : isLoadingMatch ? (
               // الحالة 2: التحميل
               <div className="flex flex-col items-center justify-center space-y-6 animate-in">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 animate-pulse">
                    FETCHING FROM API...
                  </p>
               </div>
            ) : freeMatch ? (
                // الحالة 3: نجاح! عرض المباراة
                <div className="text-center space-y-6 w-full animate-in">
                  <h3 className="text-green-500 text-xs font-black uppercase tracking-[0.4em]">
                    ✅ CONNECTION SUCCESSFUL
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500">{matchDate}</p>
                  
                  <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                     <div className="text-2xl font-black uppercase text-white">{freeMatch.home_team}</div>
                     <div className="text-xs font-bold text-slate-600 bg-white/10 px-2 py-1 rounded">VS</div>
                     <div className="text-2xl font-black uppercase text-white">{freeMatch.away_team}</div>
                  </div>

                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl max-w-xs mx-auto">
                     <div className="text-[10px] font-black uppercase text-blue-400 mb-1">RAW DATA RECEIVED</div>
                     <div className="text-xs font-mono text-slate-300 break-words">
                        ID: {freeMatch.id.substring(0, 15)}...
                     </div>
                  </div>
                  
                  <button onClick={() => setShowMatch(false)} className="mt-4 text-blue-400 text-xs underline font-bold">
                    Test Again
                  </button>
                </div>
            ) : (
                // الحالة 4: فشل
                <div className="text-center max-w-md mx-auto">
                   <div className="text-red-500 text-4xl mb-2">⚠</div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-2">API Fetch Failed</p>
                   {apiError && (
                     <div className="bg-red-900/20 border border-red-500/20 p-3 rounded-xl text-[9px] font-mono text-red-200 break-all">
                       {apiError}
                     </div>
                   )}
                   <button onClick={() => setShowMatch(false)} className="mt-4 text-white text-xs underline">Reset</button>
                </div>
            )}
          </div>
        </section>

        {/* --- RIGHT SIDEBAR --- */}
        <aside className="lg:col-span-1 space-y-4 order-2 lg:order-3 hidden lg:block">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-4 animate-pulse">● Live Verified Wins</h3>
          <div className="space-y-3">
            {currentWinners.map((win, idx) => (
              <div key={idx} className="glass-card p-3 rounded-2xl border-l-4 border-l-green-500 flex items-center justify-between animate-in">
                 <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">{win.match}</p>
                    <p className="text-xs font-bold text-white">{win.tip}</p>
                 </div>
                 <div className="text-right">
                    <span className="block text-green-400 font-black text-xs italic">WON</span>
                    <span className="text-[9px] font-bold text-slate-500">@ {win.odds}</span>
                 </div>
              </div>
            ))}
          </div>
        </aside>

      </main>
      
      <footer className="py-6 text-center text-[10px] text-slate-600 font-black uppercase tracking-widest">
        Yakuza AI © 2025 • Neural Betting Systems
      </footer>
    </div>
  );
};

export default LandingPage;
