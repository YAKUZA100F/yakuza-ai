// src/components/LandingPage.tsx
import React, { useState, useEffect } from 'react';

// --- بيانات وهمية للواجهة الجانبية (Mock Data) ---
const MOCK_WINNERS = [
  { match: "Man City vs Arsenal", tip: "Over 2.5", odds: "1.85", status: "WON" },
  { match: "Real Madrid vs Betis", tip: "Home Win", odds: "1.45", status: "WON" },
  { match: "Liverpool vs Chelsea", tip: "BTTS", odds: "1.70", status: "WON" },
  { match: "Bayern vs Dortmund", tip: "Over 3.5", odds: "2.10", status: "WON" },
  { match: "Milan vs Inter", tip: "Draw", odds: "3.20", status: "WON" },
  { match: "PSG vs Lyon", tip: "Home Win", odds: "1.30", status: "WON" },
  { match: "Ajax vs Feyenoord", tip: "Over 2.5", odds: "1.60", status: "WON" },
  { match: "Porto vs Benfica", tip: "BTTS", odds: "1.90", status: "WON" },
];

const MOCK_REVIEWS = [
  { name: "Ahmed K.", stars: 5, text: "Yakuza AI changed my game. The combo bets are insane!" },
  { name: "Sarah M.", stars: 5, text: "Finally a tool that uses real data. Worth every penny." },
  { name: "John D.", stars: 4, text: "Great predictions, especially for Premier League." },
  { name: "Mehdi B.", stars: 5, text: "Recovered my subscription cost in the first day." },
  { name: "Karim L.", stars: 5, text: "The accuracy on safe bets is scary good." },
  { name: "Omar X.", stars: 4, text: "Simple interface, powerful results. Loving it." },
  { name: "Youssef F.", stars: 5, text: "Best investment I made this year." },
  { name: "Hassan R.", stars: 5, text: "Customer support is top notch." },
];

// تعريف الـ Props (شنو كايستقبل هاد المكون من App.tsx)
interface LandingPageProps {
  onEnter: () => void;
  onGoToContact: () => void;
  onGoToBlog: () => void;
  onGoToNews: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onGoToContact, onGoToBlog, onGoToNews }) => {
  const [tickerIndex, setTickerIndex] = useState(0);

  // تحريك التيكر كل 5 ثواني
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // دالة لجلب العناصر بشكل دائري (Loop)
  const getVisibleItems = (data: any[], count: number) => {
    const visible = [];
    for (let i = 0; i < count; i++) {
      visible.push(data[(tickerIndex + i) % data.length]);
    }
    return visible;
  };

  const visibleReviews = getVisibleItems(MOCK_REVIEWS, 4);
  const visibleWinners = getVisibleItems(MOCK_WINNERS, 4);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-['Inter']">
      
      {/* HEADER */}
      <header className="glass-card px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-900/20">
            YKZ
          </div>
          <span className="font-extrabold text-xl tracking-tighter uppercase hidden sm:block">Yakuza AI</span>
        </div>

        <nav className="flex items-center gap-8">
          {/* === الروابط الجديدة === */}
          <div className="hidden md:flex items-center gap-6 mr-4">
            <button onClick={onGoToNews} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors duration-300">
              News
            </button>
            <button onClick={onGoToBlog} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors duration-300">
              Blog
            </button>
            <button onClick={onGoToContact} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors duration-300">
              Contact
            </button>
          </div>

          <button
            onClick={onEnter}
            className="px-6 py-2 bg-white text-blue-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-95"
          >
            ENTER DASHBOARD
          </button>
        </nav>
      </header>

      {/* MAIN GRID */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 max-w-[1600px] mx-auto w-full">
        
        {/* --- LEFT SIDEBAR (Reviews) --- */}
        <aside className="lg:col-span-1 space-y-4 order-3 lg:order-1 hidden lg:block">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Community Intel
          </h3>
          <div className="space-y-4 transition-all duration-500">
            {visibleReviews.map((review, idx) => (
              <div
                key={`${tickerIndex}-${idx}`}
                className="glass-card p-4 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-left-4 duration-500 hover:bg-white/5 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm text-white">{review.name}</span>
                  <div className="flex text-yellow-500 text-[10px]">
                    {"★".repeat(review.stars)}
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic">"{review.text}"</p>
              </div>
            ))}
          </div>
        </aside>

        {/* --- CENTER: HERO SECTION --- */}
        <section className="lg:col-span-2 flex flex-col gap-4 order-1 lg:order-2">
          
          <div className="text-center py-4 space-y-2 animate-in zoom-in duration-700">
            <div className="inline-block px-4 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full">
              <span className="text-blue-400 font-black text-[9px] tracking-[0.3em] uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                SYSTEM OPERATIONAL
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
              YAKUZA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">AI</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-[0.2em] max-w-lg mx-auto pt-2">
              Advanced Neural Networks for Elite Sports Prediction
            </p>
          </div>

          {/* بطاقة التعريف الرئيسية (Hero Card) */}
          <div className="glass-card p-8 rounded-[3rem] border border-blue-500/20 relative overflow-hidden group min-h-[350px] bg-white/5 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-600/10 blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 max-w-lg space-y-6">
                <h2 className="text-3xl font-black uppercase text-white tracking-tight">
                    Stop Guessing. <br/> Start <span className="text-blue-500">Investing.</span>
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                    Access our premium neural engine that analyzes thousands of data points, real-time odds, and team news to deliver high-confidence betting opportunities.
                </p>

                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
                        <div className="text-blue-400 text-xl mb-2">⚡</div>
                        <h4 className="text-white font-bold text-xs uppercase">Real-Time Data</h4>
                        <p className="text-slate-500 text-[10px]">Live odds from global markets</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-green-500/30 transition-colors">
                        <div className="text-green-400 text-xl mb-2">🧠</div>
                        <h4 className="text-white font-bold text-xs uppercase">Gemini AI Logic</h4>
                        <p className="text-slate-500 text-[10px]">Deep analysis & reasoning</p>
                    </div>
                </div>

                <button
                    onClick={onEnter}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-900/50 hover:scale-[1.02] active:scale-95"
                >
                    Access Premium Terminal
                </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Success Rate', val: '78%' },
              { label: 'Active Users', val: '2.4k' },
              { label: 'Daily Tips', val: '50+' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-3 rounded-2xl text-center border border-white/5 hover:bg-white/5 transition-colors">
                <p className="text-xl font-black text-white">{stat.val}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* --- RIGHT SIDEBAR (Live Wins) --- */}
        <aside className="lg:col-span-1 space-y-4 order-2 lg:order-3 hidden lg:block">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-4 animate-pulse flex items-center justify-end gap-2">
            Live Verified Wins
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          </h3>
          <div className="space-y-3 transition-all duration-500">
            {visibleWinners.map((win, idx) => (
              <div
                key={`${tickerIndex}-${idx}`}
                className="glass-card p-3 rounded-2xl border-l-4 border-l-green-500 flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-500 hover:bg-white/5 transition-colors"
              >
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