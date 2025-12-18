
import React, { useState, useEffect, useRef } from 'react';
import { fetchOddsByLeague, fetchTeamNews, searchMatchAssets, LEAGUES_DATA } from './services/api';
import { analyzeMatches } from './services/gemini';
import { MatchOdds, AnalysisResult } from './types';
import MatchCard from './components/MatchCard';
import { supabase } from './services/supabase';

declare global { interface Window { paypal: any; } }

type AppState = 'auth' | 'subscription' | 'leagues' | 'matches' | 'analysis';
interface UserSession { email: string; subscribed?: boolean; }

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('auth');
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<typeof LEAGUES_DATA[0] | null>(null);
  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [searchTeam, setSearchTeam] = useState('');
  
  // Use a ref to track if the PayPal button is currently rendering or has rendered
  const paypalRenderingRef = useRef<boolean>(false);
  const paypalButtonInstance = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) handleUserRouting(session.user.email || '');
      } catch (err) {
        console.error("Auth session check failed", err);
      }
    };
    initSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        if (session) handleUserRouting(session.user.email || '');
        else { setUser(null); setAppState('auth'); }
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUserRouting = (userEmail: string) => {
    const isSubscribed = localStorage.getItem(`yakuza_sub_${userEmail}`) === 'true';
    setUser({ email: userEmail, subscribed: isSubscribed });
    if (isSubscribed) setAppState('leagues');
    else setAppState('subscription');
  };

  // Robust PayPal rendering logic to fix "unhandled exception" and "window host" errors
  useEffect(() => {
    let isMounted = true;

    const renderPaypal = async () => {
      // Only proceed if in subscription state, paypal is loaded, user is available, and not already rendering
      if (appState === 'subscription' && window.paypal && user && !paypalRenderingRef.current) {
        const container = document.getElementById('paypal-button-container');
        if (container) {
          try {
            paypalRenderingRef.current = true;
            container.innerHTML = ''; // Clean start
            
            const buttons = window.paypal.Buttons({
              createOrder: (_data: any, actions: any) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: { value: '5.00', currency_code: 'USD' },
                    description: "Yakuza AI - Elite Neural Subscription"
                  }]
                });
              },
              onApprove: async (_data: any, actions: any) => {
                try {
                  const details = await actions.order.capture();
                  console.log('Transaction completed by ' + details.payer.name.given_name);
                  if (isMounted) {
                    localStorage.setItem(`yakuza_sub_${user.email}`, 'true');
                    setUser(prev => prev ? { ...prev, subscribed: true } : null);
                    setAppState('leagues');
                  }
                } catch (err) {
                  console.error("Order capture failed:", err);
                  paypalRenderingRef.current = false;
                  // Allow retry on failure
                  setTimeout(() => { if (isMounted) renderPaypal(); }, 2000);
                }
              },
              onError: (err: any) => {
                console.error("PayPal SDK Unhandled Exception Intercepted:", err);
                // Reset rendering ref so it can potentially retry
                paypalRenderingRef.current = false;
                if (container) container.innerHTML = '<p class="text-red-500 text-xs font-bold uppercase p-4">Payment system initialization failed. Please refresh.</p>';
              },
              onCancel: () => {
                console.log("Payment cancelled by user");
                paypalRenderingRef.current = false;
              },
              style: { 
                layout: 'vertical', 
                color: 'blue', 
                shape: 'pill', 
                label: 'pay',
                height: 45
              }
            });

            if (buttons.isEligible()) {
              paypalButtonInstance.current = buttons;
              await buttons.render('#paypal-button-container');
            } else {
              console.warn("PayPal buttons not eligible for this client/environment");
            }
          } catch (err) {
            console.error("PayPal button rendering error:", err);
            paypalRenderingRef.current = false;
          }
        }
      }
    };

    // Use a small timeout to ensure the DOM is fully ready and avoid "window host" race conditions
    const timer = setTimeout(() => {
      if (isMounted) renderPaypal();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (appState !== 'subscription') {
        paypalRenderingRef.current = false;
        if (paypalButtonInstance.current && paypalButtonInstance.current.close) {
          paypalButtonInstance.current.close().catch(() => {});
        }
      }
    };
  }, [appState, user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setAuthError("Passwords do not match");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        if (data.user) setAuthError("Success! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { 
    try {
      await supabase.auth.signOut(); 
      setUser(null); 
      setAppState('auth'); 
      paypalRenderingRef.current = false;
      if (paypalButtonInstance.current && paypalButtonInstance.current.close) {
        paypalButtonInstance.current.close().catch(() => {});
      }
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleSelectLeague = async (league: typeof LEAGUES_DATA[0]) => {
    setLoading(true); 
    setSelectedLeague(league);
    try {
      const data = await fetchOddsByLeague(league.id);
      const now = new Date();
      setMatches(data.filter(m => new Date(m.commence_time) > now));
      setAppState('matches');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMatch = async (match: MatchOdds) => {
    setAnalyzing(true); 
    setAppState('analysis');
    setAnalysisResult(null);
    try {
      const [news, assets] = await Promise.all([
        fetchTeamNews(match.home_team, match.away_team),
        searchMatchAssets(`${match.home_team} vs ${match.away_team}`)
      ]);
      const res = await analyzeMatches([match], { [match.id]: news });
      if (res) {
        setAnalysisResult({ 
          matchName: `${match.home_team} vs ${match.away_team}`, 
          data: res, 
          imageUrl: assets?.imageUrl || `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop`, 
          sofascoreLink: assets?.link || 'https://www.sofascore.com'
        });
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally { 
      setAnalyzing(false); 
    }
  };

  if (appState === 'auth') return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#020617]">
      <article className="max-w-md w-full glass-card rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-in">
        <header className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl mx-auto mb-6">YKZ</div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white">{isSignUp ? "Join" : "Login"}</h1>
          <p className="text-slate-400 text-sm">Access neural betting intel.</p>
        </header>
        {authError && <div className="mb-6 p-4 border rounded-2xl text-xs font-bold bg-red-500/10 border-red-500/20 text-red-400 italic">⚠ {authError}</div>}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 outline-none text-sm text-white focus:border-blue-500/50 transition-colors" placeholder="Email" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 outline-none text-sm text-white focus:border-blue-500/50 transition-colors" placeholder="Password" />
          {isSignUp && <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 outline-none text-sm text-white focus:border-blue-500/50 transition-colors" placeholder="Confirm" />}
          <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all active:scale-95 mt-4 disabled:opacity-50">{loading ? "..." : isSignUp ? "CREATE ACCOUNT" : "AUTHENTICATE"}</button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-xs text-slate-500 font-bold uppercase tracking-widest">{isSignUp ? "Already a member? Login" : "New? Sign Up"}</button>
      </article>
    </main>
  );

  if (appState === 'subscription') return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#020617]">
      <section className="max-w-xl w-full text-center animate-in">
        <h1 className="text-5xl font-black mb-12 italic uppercase tracking-tighter text-white">Elite <span className="gradient-text">Access</span></h1>
        <article className="glass-card rounded-[3.5rem] p-12 border-blue-500/20 shadow-3xl">
          <h2 className="text-2xl font-black mb-2 uppercase text-white">Analysis Plan</h2>
          <p className="text-4xl font-black mb-8 text-blue-500">$5.00 <span className="text-sm text-slate-500">/mo</span></p>
          
          <div id="paypal-button-container" className="min-h-[150px] flex items-center justify-center">
            {/* The container will be populated by the PayPal SDK */}
            <div className="flex flex-col items-center gap-4">
               <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Initializing Secure Checkout...</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="mt-8 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">Logout</button>
        </article>
      </section>
    </main>
  );

  return (
    <div className="min-h-screen pb-20 bg-[#020617] text-slate-100">
      <header className="sticky top-0 z-50 glass-card px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setAppState('leagues'); setAnalysisResult(null); setSelectedLeague(null);}}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white">YKZ</div>
          <span className="font-extrabold text-xl tracking-tighter uppercase">Yakuza AI</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 group relative">
          <span className="text-[10px] font-black text-blue-400">PRO</span>
          <div className="absolute top-12 right-0 w-48 hidden group-hover:block glass-card p-4 rounded-2xl shadow-2xl z-[100] animate-in">
            <p className="text-[10px] text-slate-500 font-black uppercase mb-2 truncate px-2">{user?.email}</p>
            <button onClick={handleLogout} className="w-full py-2 bg-red-500/10 text-red-500 text-[10px] font-black rounded-lg uppercase hover:bg-red-500/20 transition-all">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12">
        {appState === 'leagues' && (
          <div className="space-y-12 animate-in">
            <header className="text-center">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 italic text-white">Neural <span className="text-blue-500">Selection</span></h1>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">Select a league to initiate odds extraction</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {LEAGUES_DATA.map(league => (
                <div key={league.id} onClick={() => handleSelectLeague(league)} className="glass-card p-10 rounded-[2.5rem] cursor-pointer hover:bg-blue-600/10 hover:border-blue-500/40 hover:scale-[1.03] transition-all group border border-white/5">
                  <div className="h-20 mb-8 flex items-center justify-center">
                    <img src={league.logo} className="h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                  </div>
                  <h3 className="text-2xl font-black mb-1 text-white uppercase tracking-tight">{league.name}</h3>
                  <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">{league.country}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {appState === 'matches' && (
          <div className="space-y-8 animate-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <button onClick={() => setAppState('leagues')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Back to Leagues
              </button>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="FILTER BY TEAM..." 
                  value={searchTeam}
                  onChange={(e) => setSearchTeam(e.target.value)}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black tracking-widest outline-none focus:border-blue-500/50 w-full md:w-64 text-white"
                />
              </div>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Scraping Global Markets...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="glass-card p-12 rounded-[2rem] text-center border-dashed border-white/10">
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No active matches found for this sector.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {matches.filter(m => m.home_team.toLowerCase().includes(searchTeam.toLowerCase()) || m.away_team.toLowerCase().includes(searchTeam.toLowerCase())).map(match => (
                  <MatchCard key={match.id} match={match} isAnalyzing={analyzing && analysisResult?.matchName === `${match.home_team} vs ${match.away_team}`} onAnalyze={() => handleAnalyzeMatch(match)} />
                ))}
              </div>
            )}
          </div>
        )}

        {appState === 'analysis' && (
          <div className="max-w-4xl mx-auto pb-24 animate-in">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-8">
                <div className="relative">
                   <div className="w-24 h-24 border-8 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-blue-400">YKZ</div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Synthesizing Intel</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">Scanning news feeds & historical odds...</p>
                </div>
              </div>
            ) : analysisResult ? (
              <article className="space-y-12">
                <header className="relative h-[30rem] rounded-[4rem] overflow-hidden shadow-3xl group">
                  <img src={analysisResult.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent"></div>
                  <div className="absolute bottom-16 left-16 right-16">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="px-4 py-1.5 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Elite Report</span>
                      <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">{analysisResult.data.dateTime}</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-white drop-shadow-2xl">{analysisResult.matchName}</h1>
                    <p className="mt-4 text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">{analysisResult.data.stadium}</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <section className="lg:col-span-2 space-y-8">
                    {/* Safe Bet */}
                    <div className="glass-card p-10 rounded-[3rem] border-l-4 border-l-green-500 relative overflow-hidden group">
                      <h3 className="text-green-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">🛡️ Safe Selection</h3>
                      <div className="flex items-end justify-between gap-4 mb-4">
                         <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white">{analysisResult.data.safeBet.selection}</h2>
                         <span className="text-2xl md:text-3xl font-black text-green-400 italic">@ {analysisResult.data.safeBet.odds}</span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed italic border-t border-white/5 pt-4">"{analysisResult.data.safeBet.reason}"</p>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-6 mb-6">Strategic Alternatives</h3>
                       {analysisResult.data.additionalOptions.map((opt, idx) => (
                         <div key={idx} className="glass-card p-6 rounded-[2rem] flex items-center justify-between border border-white/5 hover:border-blue-500/20 transition-colors">
                           <div className="flex-1">
                             <div className="flex items-center gap-3 mb-1">
                               <span className={`w-2 h-2 rounded-full ${opt.probability === 'likely' ? 'bg-blue-500' : 'bg-slate-700'}`}></span>
                               <h4 className="font-black uppercase text-sm text-white tracking-tight">{opt.option}</h4>
                             </div>
                             <p className="text-[10px] text-slate-500 font-bold ml-5 uppercase">{opt.reason}</p>
                           </div>
                           <div className="text-right">
                             <span className="text-xl font-black text-blue-400 italic">@ {opt.odds}</span>
                           </div>
                         </div>
                       ))}
                    </div>
                  </section>

                  <aside className="space-y-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-200 mb-8 flex items-center gap-2">🚀 Yakuza Combo</h3>
                      <div className="space-y-6 mb-8 relative z-10">
                        <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                          <p className="text-[9px] font-black uppercase text-blue-100 mb-1">Pick One</p>
                          <p className="font-bold text-white leading-tight">{analysisResult.data.comboBet.bet1}</p>
                        </div>
                        <div className="flex justify-center -my-3 relative z-20">
                           <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-black">X</div>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                          <p className="text-[9px] font-black uppercase text-blue-100 mb-1">Pick Two</p>
                          <p className="font-bold text-white leading-tight">{analysisResult.data.comboBet.bet2}</p>
                        </div>
                      </div>
                      <div className="text-center pt-6 border-t border-white/20">
                        <p className="text-[10px] font-black uppercase text-blue-100 mb-1">Combined Odds</p>
                        <p className="text-5xl font-black text-white italic">@ {analysisResult.data.comboBet.totalOdds}</p>
                      </div>
                    </div>

                    <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Risk Profile</h4>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          analysisResult.data.comboBet.riskLevel === 'Low' ? 'bg-green-500/10 text-green-400' :
                          analysisResult.data.comboBet.riskLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {analysisResult.data.comboBet.riskLevel} Risk
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                        {analysisResult.data.comboBet.riskReason}
                      </p>
                    </div>

                    <div className="space-y-3">
                       <a href={analysisResult.sofascoreLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all">
                         SofaScore Match Data
                       </a>
                       <a href="https://1xlite-81807.bar/en" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all">
                         Place Bet on 1xBet
                       </a>
                    </div>
                  </aside>
                </div>
              </article>
            ) : null}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full glass-card py-3 px-6 border-t border-white/5 flex items-center justify-between z-[60]">
        <p className="hidden md:block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">USE CODE <span className="text-blue-500">YAKUZA</span> FOR ELITE REWARDS</p>
        <div className="flex items-center gap-4 ml-auto md:ml-0">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Neural Network Active</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
