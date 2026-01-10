// src/App.tsx
import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import MatchCard from "./components/MatchCard";
import LandingPage from "./components/LandingPage";
import Contact from "./components/Contact";
import BlogPage from "./components/BlogPage";
import NewsPage from "./components/NewsPage";
import {
  LEAGUES_DATA,
  fetchOddsByLeague,
  fetchTeamNews,
  searchMatchAssets,
} from "./services/api";
import { analyzeMatches } from "./services/gemini";
import type { MatchOdds, AnalysisResult } from "./types";
import { auth, googleProvider, db } from "./services/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

// --- Types ---
type AppState = "landing" | "auth" | "contact" | "news" | "blog" | "subscription" | "leagues" | "matches" | "analysis";
interface UserSession { email: string; uid: string; subscribed?: boolean; }
declare global { interface Window { paypal: any; } }

type League = {
  id: string;
  name: string;
  logo: string;
  country?: string;
};

// --- Utilities & Helpers ---
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isTomorrow(dateISO: string) {
  const matchDate = new Date(dateISO);
  if (Number.isNaN(matchDate.getTime())) return false;
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return matchDate.toDateString() === tomorrow.toDateString();
}

function formatKickoff(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// --- UI Components ---
const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  return (
    <div className={cx("relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.55)]", className)}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      {children}
    </div>
  );
};

const SoftButton: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; title?: string }> = ({ children, onClick, disabled, className, title }) => {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wider",
        "border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
        disabled && "cursor-not-allowed opacity-60 hover:bg-white/5",
        className
      )}
    >
      {children}
    </button>
  );
};

const Pill: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] border-white/10 bg-black/30 text-slate-200", className)}>
    {children}
  </span>
);

const SkeletonBlock: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cx("animate-pulse rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5", className)} />
);

const MatchCardSkeleton: React.FC = () => {
  return (
    <GlassCard className="p-7">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-7 w-28 rounded-2xl" />
        <SkeletonBlock className="h-7 w-32 rounded-2xl" />
      </div>
      <div className="mt-8 flex items-center justify-between gap-6">
        <div className="flex-1 space-y-3 text-center"><SkeletonBlock className="mx-auto h-16 w-16 rounded-2xl" /><SkeletonBlock className="mx-auto h-4 w-32" /></div>
        <SkeletonBlock className="h-6 w-10 rounded-xl" />
        <div className="flex-1 space-y-3 text-center"><SkeletonBlock className="mx-auto h-16 w-16 rounded-2xl" /><SkeletonBlock className="mx-auto h-4 w-32" /></div>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-3"><SkeletonBlock className="h-16 rounded-3xl" /><SkeletonBlock className="h-16 rounded-3xl" /><SkeletonBlock className="h-16 rounded-3xl" /></div>
      <SkeletonBlock className="mt-7 h-14 w-full rounded-[2rem]" />
    </GlassCard>
  );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  // Logic State
  const [appState, setAppState] = useState<AppState>("landing");
  const [user, setUser] = useState<UserSession | null>(null);
  const paypalRenderingRef = useRef<boolean>(false);

  // Data State
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [analyzingMatchId, setAnalyzingMatchId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // --- AUTH & SUBSCRIPTION LOGIC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await checkSubscription(currentUser);
      } else {
        setUser(null);
        // Fix: Use functional update to avoid stale closure state
        setAppState(current => (current === 'contact' ? 'contact' : 'landing'));
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
      setUser({ email: currentUser.email || "", uid: currentUser.uid, subscribed: isSubscribed });
      
      // If user logs in and is on landing/auth page, redirect appropriately
      setAppState(current => {
         if (current === "auth" || current === "landing") {
             return isSubscribed ? "leagues" : "subscription";
         }
         return current;
      });

    } catch (err) {
      console.error(err);
      setAppState("subscription");
    }
  };

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (e: any) { console.error(e.message); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setAppState("landing"); // Force landing page
    
    // Clear Data manually without calling resetToLeagues (which changes page)
    setSelectedLeague(null);
    setMatches([]);
    setAnalysisResult(null);
    setMatchesError(null);
    setAnalysisError(null);
    setAnalyzingMatchId(null);
  };

  // --- PAYPAL LOGIC ---
  useEffect(() => {
    if (appState === "subscription" && window.paypal && user && !paypalRenderingRef.current) {
      const container = document.getElementById("paypal-button-container");
      if (container) {
        container.innerHTML = "";
        paypalRenderingRef.current = true;
        window.paypal.Buttons({
          createOrder: (_: any, actions: any) => actions.order.create({ purchase_units: [{ amount: { value: "5.00", currency_code: "USD" } }] }),
          onApprove: async (_: any, actions: any) => {
            const expiry = new Date(); expiry.setDate(expiry.getDate() + 30);
            if (user) {
              await setDoc(doc(db, "subscribers", user.uid), { email: user.email, isActive: true, expireAt: Timestamp.fromDate(expiry) }, { merge: true });
              setUser((prev) => (prev ? { ...prev, subscribed: true } : null));
              setAppState("leagues");
            }
          },
        }).render("#paypal-button-container");
      }
    }
  }, [appState, user]);

  // --- APP NAVIGATION LOGIC ---
  const visibleMatches = useMemo(() => {
    const sorted = [...matches].sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());
    const tomorrowOnly = sorted.filter((m) => isTomorrow(m.commence_time));
    return tomorrowOnly.length > 0 ? tomorrowOnly : sorted;
  }, [matches]);

  const tomorrowMode = useMemo(() => {
    if (matches.length === 0) return false;
    return visibleMatches.length > 0 && visibleMatches.length < matches.length;
  }, [matches.length, visibleMatches.length]);

  const resetToLeagues = useCallback(() => {
    setAppState("leagues");
    setSelectedLeague(null);
    setMatches([]);
    setAnalysisResult(null);
    setMatchesError(null);
    setAnalysisError(null);
    setAnalyzingMatchId(null);
  }, []);

  const handleSelectLeague = useCallback(async (league: League) => {
    setSelectedLeague(league);
    setAppState("matches");
    setLoadingMatches(true);
    setMatchesError(null);
    setMatches([]);
    setAnalysisResult(null);

    try {
      const data = await fetchOddsByLeague(league.id);
      setMatches(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMatchesError(e?.message || "Failed to load matches");
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  const handleAnalyzeMatch = useCallback(async (match: MatchOdds) => {
    setAnalyzingMatchId(match.id);
    setAnalysisError(null);
    setAnalysisResult(null);
    setAppState("analysis");

    try {
      const [news, assets] = await Promise.all([
        fetchTeamNews(match.home_team, match.away_team),
        searchMatchAssets(`${match.home_team} vs ${match.away_team}`),
      ]);

      const res = await analyzeMatches([match], { [match.id]: news });

      if (res) {
        setAnalysisResult({
          matchName: `${match.home_team} vs ${match.away_team}`,
          data: res,
          imageUrl: assets?.imageUrl || "",
          sofascoreLink: assets?.link || "",
        });
      } else {
        setAnalysisError("AI analysis returned empty result.");
      }
    } catch (e: any) {
      setAnalysisError(e?.message || "Analysis failed");
    } finally {
      setAnalyzingMatchId(null);
    }
  }, []);

  const backAction = useCallback(() => {
    if (appState === "analysis") setAppState("matches");
    else resetToLeagues();
  }, [resetToLeagues, appState]);

  const breadcrumb = useMemo(() => {
    const parts: string[] = ["Leagues"];
    if (selectedLeague?.name) parts.push(selectedLeague.name);
    if (appState === "analysis") parts.push("Analysis");
    return parts;
  }, [selectedLeague?.name, appState]);

  // --- RENDER VIEWS ---


	if (appState === "contact") return <Contact onBack={() => setAppState("landing")} />;

	if (appState === "news") return <NewsPage onBack={() => setAppState("landing")} />;

	if (appState === "blog") return <BlogPage onBack={() => setAppState("landing")} />;

	if (appState === "landing") return <LandingPage onEnter={() => setAppState("auth")} onGoToContact={() => setAppState("contact")} onGoToNews={() => setAppState("news")} onGoToBlog={() => setAppState("blog")} />;

  if (appState === "auth") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
             <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
             <div className="absolute top-1/3 left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[140px]" />
        </div>
        <GlassCard className="p-10 w-full max-w-md text-center">
            <button onClick={() => setAppState("landing")} className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors">← Back</button>
            <div className="mb-6 flex justify-center">
                <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-b from-white/10 to-black/30 border border-white/10">
                    <span className="text-2xl font-black tracking-widest text-white">Y</span>
                </div>
            </div>
            <h1 className="text-3xl font-black mb-2">Welcome Back</h1>
            <p className="text-slate-400 mb-8 text-sm">Sign in to access AI predictions</p>
            <button 
                onClick={handleGoogleLogin} 
                className="w-full flex items-center justify-center gap-3 bg-white text-black px-6 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Sign in with Google
            </button>
        </GlassCard>
      </div>
    );
  }

  if (appState === "subscription") {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -bottom-48 right-[-80px] h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-[140px]" />
            </div>
            <GlassCard className="p-10 w-full max-w-md text-center border-indigo-500/30">
                <Pill className="mb-6 bg-indigo-500/20 text-indigo-200 border-indigo-500/30">Premium Access</Pill>
                <h1 className="text-3xl font-black mb-4">Upgrade to Pro</h1>
                <p className="text-slate-400 mb-8 text-sm leading-relaxed">Unlock unlimited AI analysis, safe bets, and combo predictions for just <span className="text-white font-bold">$5.00/month</span>.</p>
                <div className="bg-white p-4 rounded-2xl mb-6">
                    <div id="paypal-button-container"></div>
                </div>
                <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-white underline">Sign out</button>
            </GlassCard>
        </div>
    );
  }

  // MAIN APP
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background FX */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-48 right-[-80px] h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute top-1/3 left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={resetToLeagues} className={cx("group flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-all duration-300")}>
              <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-b from-white/10 to-black/30 border border-white/10">
                <span className="text-sm font-black tracking-widest">Y</span>
              </div>
              <div className="leading-tight text-left">
                <div className="text-sm font-black tracking-widest">YAKUZA AI</div>
                <div className="text-[11px] text-slate-400">Odds • News • AI Picks</div>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              {breadcrumb.map((p, idx) => (
                <React.Fragment key={`${p}-${idx}`}>
                  <span className={cx(idx === breadcrumb.length - 1 && "text-slate-200 font-bold")}>{p}</span>
                  {idx !== breadcrumb.length - 1 && <span className="opacity-40">/</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={handleLogout} className="text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl transition-all">
                LOGOUT
             </button>
            {appState !== "leagues" ? (
                <SoftButton onClick={backAction} title="Back">
                <span className="text-base leading-none">←</span> Back
                </SoftButton>
            ) : null}
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {appState === "leagues" && "Choose a League"}
              {appState === "matches" && "Upcoming Matches"}
              {appState === "analysis" && "AI Match Analysis"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {appState === "leagues" && "Pick a league to load odds and matches."}
              {appState === "matches" && (tomorrowMode ? "Showing tomorrow’s matches (auto-filter)." : "Showing all available matches.")}
              {appState === "analysis" && "Safe bet + extra options + combo."}
            </p>
          </div>

          {appState === "matches" && (
            <div className="flex flex-wrap items-center gap-2">
              <Pill className="text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{visibleMatches.length} matches</Pill>
              {selectedLeague?.country && <Pill className="text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{selectedLeague.country}</Pill>}
              {tomorrowMode && <Pill className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200">Tomorrow only</Pill>}
            </div>
          )}
        </div>

        <main className="mt-7">
          {appState === "leagues" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {LEAGUES_DATA.map((league: any) => (
                <button
                  key={league.id}
                  onClick={() => handleSelectLeague(league)}
                  className="group text-left rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-300 shadow-[0_18px_70px_rgba(0,0,0,0.55)]"
                >
                  <div className="p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-b from-white/10 to-black/30 border border-white/10 overflow-hidden">
                          <img src={league.logo} className="h-10 w-10 object-contain" alt={league.name} loading="lazy" />
                          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                          <h3 className="text-base font-black tracking-tight">{league.name}</h3>
                          <p className="mt-1 text-xs text-slate-400">{league.country || "International"}</p>
                        </div>
                      </div>
                      <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200">
                          Explore <span className="text-base leading-none">→</span>
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-xs text-slate-500">Load odds & matches for this league</p>
                      <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 grid place-items-center group-hover:bg-white/10 transition-colors">
                        <svg className="h-5 w-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {appState === "matches" && (
            <div className="space-y-6">
              <GlassCard className="p-6 md:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-black/30 overflow-hidden grid place-items-center">
                      {selectedLeague?.logo ? <img src={selectedLeague.logo} alt={selectedLeague.name} className="h-10 w-10 object-contain" /> : <span className="text-sm font-black">L</span>}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">League</p>
                      <h2 className="text-xl md:text-2xl font-black tracking-tight">{selectedLeague?.name}</h2>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SoftButton onClick={() => selectedLeague && handleSelectLeague(selectedLeague)} disabled={loadingMatches} className="border-blue-500/20 bg-blue-600/15 hover:bg-blue-600/25 text-blue-200">
                      {loadingMatches ? "Refreshing..." : "Refresh"}
                    </SoftButton>
                    <SoftButton onClick={resetToLeagues} className="text-slate-200">Change League</SoftButton>
                  </div>
                </div>
              </GlassCard>

              {loadingMatches && <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <MatchCardSkeleton key={i} />)}</div>}
              
              {!loadingMatches && matchesError && (
                <GlassCard className="p-6 border-red-500/20 bg-red-500/10">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl border border-red-500/30 bg-red-500/15 grid place-items-center"><span className="text-red-200 font-black">!</span></div>
                    <div><p className="font-black text-red-200">Failed to load matches</p><p className="mt-1 text-sm text-red-200/80">{matchesError}</p></div>
                  </div>
                </GlassCard>
              )}

              {!loadingMatches && !matchesError && visibleMatches.length === 0 && (
                <GlassCard className="p-7">
                  <div className="flex flex-col items-center text-center">
                     <p className="text-base font-black">No matches found</p>
                     <p className="mt-1 text-sm text-slate-400">Try refreshing or check back later.</p>
                  </div>
                </GlassCard>
              )}

              {!loadingMatches && !matchesError && visibleMatches.length > 0 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {visibleMatches.map((match) => (
                    <MatchCard key={match.id} match={match} onAnalyze={handleAnalyzeMatch} isAnalyzing={analyzingMatchId === match.id} />
                  ))}
                </div>
              )}
            </div>
          )}

          {appState === "analysis" && (
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="flex items-center justify-between gap-3">
                <SoftButton onClick={() => setAppState("matches")} title="Back to matches">
                  <span className="text-base leading-none">←</span> Matches
                </SoftButton>
                <Pill className="text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> AI Engine</Pill>
              </div>

              {analysisError && (
                <GlassCard className="p-6 border-red-500/20 bg-red-500/10">
                  <p className="font-black text-red-200">Analysis failed</p>
                  <p className="mt-1 text-sm text-red-200/80">{analysisError}</p>
                </GlassCard>
              )}

              {!analysisResult && !analysisError && (
                <GlassCard className="p-7">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                      <SkeletonBlock className="h-7 w-64" /><SkeletonBlock className="h-4 w-80" />
                      <div className="pt-2">
                         <Pill className="border-blue-500/20 bg-blue-600/15 text-blue-200">Analyzing…</Pill>
                      </div>
                    </div>
                    <SkeletonBlock className="h-40 w-full md:h-32 md:w-64 rounded-3xl" />
                  </div>
                </GlassCard>
              )}

              {analysisResult && (
                <>
                  <GlassCard className="p-6 md:p-7">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Match</p>
                        <h2 className="mt-1 text-2xl md:text-3xl font-black tracking-tight truncate">{analysisResult.matchName}</h2>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {analysisResult.sofascoreLink && (
                            <a href={analysisResult.sofascoreLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-600/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-200 hover:bg-blue-600/25 transition-all">
                              Open on Sofascore <span className="text-base leading-none">↗</span>
                            </a>
                          )}
                          <Pill className="text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Safe Bet Included</Pill>
                        </div>
                      </div>
                      <div className="w-full md:w-[360px]">
                        {analysisResult.imageUrl ? (
                          <img src={analysisResult.imageUrl} alt={analysisResult.matchName} className="h-[190px] w-full rounded-3xl border border-white/10 object-cover" />
                        ) : (
                          <div className="h-[190px] w-full rounded-3xl border border-white/10 bg-white/5 grid place-items-center"><span className="text-slate-400 text-sm">No image</span></div>
                        )}
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-7 border-emerald-500/25 bg-emerald-500/10">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200/80">Safe Bet</p>
                        <p className="mt-2 text-2xl md:text-3xl font-black text-emerald-100">{analysisResult.data.safeBet.selection}</p>
                        <p className="mt-3 text-sm text-emerald-100/80 leading-relaxed">{analysisResult.data.safeBet.reason}</p>
                      </div>
                      <Pill className="border-emerald-500/30 bg-black/30 text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Recommended</Pill>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6 md:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg md:text-xl font-black tracking-tight">Additional Options</h3>
                      <Pill className="text-slate-200">{analysisResult.data.additionalOptions.length} picks</Pill>
                    </div>
                    <div className="mt-5 space-y-3">
                      {analysisResult.data.additionalOptions.map((opt, idx) => (
                        <div key={idx} className="rounded-3xl border border-white/10 bg-black/30 p-5 hover:bg-black/35 transition-colors">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <p className="font-black tracking-tight">{opt.option}</p>
                              <p className="mt-1 text-sm text-slate-400 leading-relaxed">{opt.reason}</p>
                            </div>
                            <div className="flex items-center gap-2 md:flex-col md:items-end md:gap-1">
                              <span className="inline-flex items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/15 px-3 py-1 text-sm font-black text-blue-200">{opt.odds}</span>
                              <span className="text-[11px] text-slate-400">Prob: <span className="font-bold text-slate-200">{opt.probability}</span></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6 md:p-7">
                    <div className="flex items-center justify-between gap-3">
                       <h3 className="text-lg md:text-xl font-black tracking-tight">YAKUZA COMBO</h3>
                       <Pill className="border-indigo-500/20 bg-indigo-600/15 text-indigo-100">Combo Mode</Pill>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                       <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Bet 1</p>
                          <p className="mt-2 font-black text-slate-100">{analysisResult.data.comboBet.bet1}</p>
                       </div>
                       <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Bet 2</p>
                          <p className="mt-2 font-black text-slate-100">{analysisResult.data.comboBet.bet2}</p>
                       </div>
                    </div>
                    <div className="mt-4 rounded-3xl border border-white/10 bg-black/30 p-5">
                       <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                             <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Total Odds</p>
                             <p className="mt-1 text-2xl font-black text-blue-200">{analysisResult.data.comboBet.totalOdds}</p>
                          </div>
                          <Pill className="border-white/10 bg-white/5 text-slate-100">Risk: <span className="font-black text-slate-100">{analysisResult.data.comboBet.riskLevel}</span></Pill>
                       </div>
                       <p className="mt-3 text-sm text-slate-300/80 leading-relaxed">{analysisResult.data.comboBet.comment}</p>
                    </div>
                  </GlassCard>
                </>
              )}
            </div>
          )}
        </main>

        <footer className="mt-10 pb-4 text-center text-xs text-slate-500">
          Built with <span className="text-slate-300 font-bold">Odds</span> + <span className="text-slate-300 font-bold">News</span> + <span className="text-slate-300 font-bold">AI</span>
        </footer>
      </div>
    </div>
  );
};

export default App;

