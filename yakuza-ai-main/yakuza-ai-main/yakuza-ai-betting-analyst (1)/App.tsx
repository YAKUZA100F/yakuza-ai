// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { fetchOddsByLeague, fetchTeamNews, searchMatchAssets, LEAGUES_DATA } from './services/api';
import { analyzeMatches } from './services/gemini';
import { MatchOdds, AnalysisResult } from './types';
import MatchCard from './components/MatchCard';
import { auth, googleProvider, db } from './services/firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import LandingPage from './components/LandingPage';
import Contact from './components/Contact'; // Import Contact Only

declare global { interface Window { paypal: any; } }

// حيدنا 'blog' و 'news' من هنا
type AppState = 'landing' | 'auth' | 'subscription' | 'leagues' | 'matches' | 'analysis' | 'contact';
interface UserSession { email: string; uid: string; subscribed?: boolean; }

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [user, setUser] = useState<UserSession | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<any>(null);
  const paypalRenderingRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) await checkSubscription(currentUser);
      else { 
        setUser(null); 
        // إلا ماكانش ف contact يرجع landing
        if(appState !== 'contact' && appState !== 'landing') setAppState('landing'); 
      }
    });
    return () => unsubscribe();
  }, []);

  const checkSubscription = async (currentUser: User) => {
    try {
      const userSnap = await getDoc(doc(db, "subscribers", currentUser.uid));
      let isSubscribed = false;
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.expireAt && data.expireAt.toDate() > new Date()) isSubscribed = true;
      }
      setUser({ email: currentUser.email || '', uid: currentUser.uid, subscribed: isSubscribed });
      if (appState !== 'contact') {
         setAppState(isSubscribed ? 'leagues' : 'subscription');
      }
    } catch (err) { console.error(err); setAppState('subscription'); }
  };

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e: any) { setAuthError(e.message); }
  };

  const handleLogout = async () => { await signOut(auth); setUser(null); setAppState('landing'); };

  // Paypal Logic
  useEffect(() => {
    if (appState === 'subscription' && window.paypal && user && !paypalRenderingRef.current) {
        const container = document.getElementById('paypal-button-container');
        if(container) {
            container.innerHTML = '';
            paypalRenderingRef.current = true;
            window.paypal.Buttons({
                createOrder: (_: any, actions: any) => actions.order.create({ purchase_units: [{ amount: { value: '5.00', currency_code: 'USD' } }] }),
                onApprove: async (_: any, actions: any) => {
                   const expiry = new Date(); expiry.setDate(expiry.getDate() + 30);
                   if(user) {
                       await setDoc(doc(db, "subscribers", user.uid), { email: user.email, isActive: true, expireAt: Timestamp.fromDate(expiry) }, { merge: true });
                       setUser(prev => prev ? { ...prev, subscribed: true } : null);
                       setAppState('leagues');
                   }
                }
            }).render('#paypal-button-container');
        }
    }
  }, [appState, user]);

  const handleSelectLeague = async (league: any) => {
    setLoading(true); setSelectedLeague(league);
    try {
        const data = await fetchOddsByLeague(league.id);
        setMatches(data); setAppState('matches');
    } finally { setLoading(false); }
  };

  const handleAnalyzeMatch = async (match: MatchOdds) => {
    setAnalyzing(true); setAppState('analysis');
    try {
        const [news, assets] = await Promise.all([
            fetchTeamNews(match.home_team, match.away_team),
            searchMatchAssets(`${match.home_team} vs ${match.away_team}`)
        ]);
        const res = await analyzeMatches([match], { [match.id]: news });
        if(res) setAnalysisResult({ matchName: `${match.home_team} vs ${match.away_team}`, data: res, imageUrl: assets?.imageUrl || '', sofascoreLink: assets?.link || '' });
    } finally { setAnalyzing(false); }
  };

  // === RENDER SECTIONS ===

  // غير Contact اللي بقات
  if (appState === 'contact') return <Contact onBack={() => setAppState('landing')} />;

  if (appState === 'landing') return (
    <LandingPage 
      onEnter={() => setAppState('auth')} 
      onGoToContact={() => setAppState('contact')}
    />
  );
  
  if (appState === 'auth') return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
      <div className="glass-card p-10 rounded-3xl text-center relative">
        <button onClick={() => setAppState('landing')} className="absolute top-4 left-4 text-slate-500 hover:text-white">←</button>
        <h1 className="text-3xl font-black mb-6">LOGIN</h1>
        <button onClick={handleGoogleLogin} className="bg-white text-black px-8 py-3 rounded-xl font-bold">Sign in with Google</button>
      </div>
    </div>
  );

  if (appState === 'subscription') return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
      <div className="glass-card p-10 rounded-3xl text-center">
        <h1 className="text-3xl font-black mb-4">PREMIUM</h1>
        <div id="paypal-button-container"></div>
        <button onClick={handleLogout} className="mt-4 text-xs text-slate-500 underline">Logout</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black cursor-pointer" onClick={() => setAppState('leagues')}>YAKUZA AI</h1>
        <button onClick={handleLogout} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-xs font-bold">LOGOUT</button>
      </header>

      {appState === 'leagues' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEAGUES_DATA.map(league => (
            <div key={league.id} onClick={() => handleSelectLeague(league)} className="glass-card p-8 rounded-2xl cursor-pointer hover:bg-white/5 border border-white/10">
              <img src={league.logo} className="h-16 mx-auto mb-4" alt={league.name}/>
              <h3 className="text-center font-bold">{league.name}</h3>
            </div>
          ))}
        </div>
      )}

      {appState === 'matches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setAppState('leagues')} className="md:col-span-2 text-left text-slate-400">← Back</button>
            {matches.map(match => (
                <div key={match.id} className="glass-card p-6 rounded-2xl border border-white/5">
                    <h3 className="font-bold text-center mb-4">{match.home_team} vs {match.away_team}</h3>
                    <button onClick={() => handleAnalyzeMatch(match)} className="w-full bg-blue-600 py-2 rounded-lg font-bold">ANALYZE</button>
                </div>
            ))}
        </div>
      )}

      {appState === 'analysis' && analysisResult && (
        <div className="max-w-4xl mx-auto">
             <button onClick={() => setAppState('matches')} className="mb-4 text-slate-400">← Back to Matches</button>
             <div className="glass-card p-8 rounded-3xl border-l-4 border-green-500">
                <h2 className="text-xl font-bold text-green-400 mb-2">SAFE BET</h2>
                <p className="text-2xl font-black">{analysisResult.data.safeBet.selection}</p>
                <p className="text-slate-400 mt-2">{analysisResult.data.safeBet.reason}</p>
             </div>
        </div>
      )}
    </div>
  );
};

export default App;