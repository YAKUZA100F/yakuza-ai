import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
// --- IMPORTS FOR ROUTING & SEO ---
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useNavigate, 
  useLocation, 
  Navigate 
} from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
// إضافة مكتبة الأيقونات الجديدة
import { Check, CreditCard, Smartphone, MessageCircle } from 'lucide-react';

// --- EXISTING IMPORTS ---
import MatchCard from "./components/MatchCard";
import LandingPage from "./components/LandingPage";
import Contact from "./components/Contact";
import NewsPage from "./components/NewsPage";

// --- BLOG IMPORTS ---
import BlogPage from "./components/BlogPage"; 
import SinglePost from "./components/SinglePost";
import CreatePost from "./components/CreatePost";

// --- NEW FEATURES IMPORTS ---
import SmartBet from "./components/SmartBet";
import StrategyPlanner from "./components/StrategyPlanner"; // <--- NEW IMPORT

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
type DashboardViewState = "leagues" | "matches" | "analysis";
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
  // Unused but kept for utility
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

// --- SUB-COMPONENTS ---

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (e: any) { console.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-1/3 left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[140px]" />
      </div>
      <GlassCard className="p-10 w-full max-w-md text-center">
          <button onClick={() => navigate('/')} className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors">← Back</button>
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
};

// --- SUBSCRIPTION PAGE (PayPal + Local Payment) ---
const SubscriptionPage: React.FC<{ user: UserSession | null, onUpgradeSuccess: () => void }> = ({ user, onUpgradeSuccess }) => {
  const navigate = useNavigate();
  const paypalRenderingRef = useRef<boolean>(false);

  // إعدادات الدفع اليدوي
  const WHATSAPP_NUMBER = "212634211840"; 
  const WHATSAPP_MESSAGE = "سلام عليكم، بغيت نشترك في العرض ديال Yakuza VIP. (Wafacash / CIH)";

  useEffect(() => {
    // PayPal Logic Preserved
    if (window.paypal && user && !paypalRenderingRef.current) {
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
              onUpgradeSuccess();
            }
          },
        }).render("#paypal-button-container");
      }
    }
  }, [user, onUpgradeSuccess]);

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4 font-sans">
        {/* Background FX */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -bottom-48 right-[-80px] h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-[140px]" />
        </div>

        {/* Main Grid */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
            
            {/* Left Side: Features & Value */}
            <div className="space-y-8 p-4">
                <div>
                    <span className="text-blue-500 font-bold tracking-widest text-xs uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                        Premium Access
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mt-4 leading-tight">
                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Winners Circle</span>
                    </h1>
                    <p className="text-slate-400 mt-4 text-lg leading-relaxed">
                        Get AI-powered predictions with +85% accuracy. Secure your betting strategy today.
                    </p>
                </div>

                <ul className="space-y-4">
                    {[
                        "Unlimited AI Match Analysis",
                        "Safe Bets & Combo Predictions",
                        "Access to VIP Telegram Group",
                        "24/7 Priority Support"
                    ].map((item, index) => (
                        <li key={index} className="flex items-center gap-4 text-slate-300">
                            <div className="bg-green-500/20 p-1.5 rounded-full border border-green-500/30">
                                <Check className="w-4 h-4 text-green-500" />
                            </div>
                            <span className="font-medium">{item}</span>
                        </li>
                    ))}
                </ul>

                <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-white underline transition-colors">
                    Sign out current account
                </button>
            </div>

            {/* Right Side: Payment Methods */}
            <GlassCard className="p-8 border-indigo-500/30 shadow-2xl">
                <div className="text-center mb-8">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Monthly Plan</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                        <span className="text-5xl font-black text-white">$5</span>
                        <span className="text-slate-500 font-medium">/mo</span>
                    </div>
                </div>

                {/* PayPal Section */}
                <div className="mb-6 bg-white p-4 rounded-2xl">
                    <div id="paypal-button-container"></div>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wide">
                        <CreditCard className="w-3 h-3" />
                        Secure Payment
                    </div>
                </div>

                {/* Divider */}
                <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] uppercase tracking-widest font-bold">Or Pay Locally (Maroc)</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                {/* Local Payment Section */}
                <div className="space-y-3">
                    <button 
                        onClick={handleWhatsAppClick}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 group border border-white/10"
                    >
                        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition" />
                        Pay via WhatsApp
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-slate-300 hover:bg-white/10 transition cursor-pointer">
                            <Smartphone className="w-5 h-5 text-yellow-500 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Wafacash</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-slate-300 hover:bg-white/10 transition cursor-pointer">
                            <CreditCard className="w-5 h-5 text-blue-400 mb-1" />
                            <span className="text-[10px] font-bold uppercase">CIH Bank</span>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    </div>
  );
};

const Dashboard: React.FC<{ user: UserSession; onLogout: () => void }> = ({ user, onLogout }) => {
  const navigate = useNavigate(); // Added navigate hook
  const [dashboardView, setDashboardView] = useState<DashboardViewState>("leagues");
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [analyzingMatchId, setAnalyzingMatchId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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
    setDashboardView("leagues");
    setSelectedLeague(null);
    setMatches([]);
    setAnalysisResult(null);
    setMatchesError(null);
    setAnalysisError(null);
    setAnalyzingMatchId(null);
  }, []);

  const handleSelectLeague = useCallback(async (league: League) => {
    setSelectedLeague(league);
    setDashboardView("matches");
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
    setDashboardView("analysis");

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
    if (dashboardView === "analysis") setDashboardView("matches");
    else resetToLeagues();
  }, [resetToLeagues, dashboardView]);

  const breadcrumb = useMemo(() => {
    const parts: string[] = ["Leagues"];
    if (selectedLeague?.name) parts.push(selectedLeague.name);
    if (dashboardView === "analysis") parts.push("Analysis");
    return parts;
  }, [selectedLeague?.name, dashboardView]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
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
              <button onClick={onLogout} className="text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl transition-all">
                LOGOUT
              </button>
            {dashboardView !== "leagues" ? (
              <SoftButton onClick={backAction} title="Back">
                <span className="text-base leading-none">←</span> Back
              </SoftButton>
            ) : null}
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {dashboardView === "leagues" && "Choose a League"}
              {dashboardView === "matches" && "Upcoming Matches"}
              {dashboardView === "analysis" && "AI Match Analysis"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {dashboardView === "leagues" && "Pick a league to load odds and matches."}
              {dashboardView === "matches" && (tomorrowMode ? "Showing tomorrow’s matches (auto-filter)." : "Showing all available matches.")}
              {dashboardView === "analysis" && "Safe bet + extra options + combo."}
            </p>
          </div>

          {dashboardView === "matches" && (
            <div className="flex flex-wrap items-center gap-2">
              <Pill className="text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{visibleMatches.length} matches</Pill>
              {selectedLeague?.country && <Pill className="text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{selectedLeague.country}</Pill>}
              {tomorrowMode && <Pill className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200">Tomorrow only</Pill>}
            </div>
          )}
        </div>

        <main className="mt-7">
          {dashboardView === "leagues" && (
            <div className="space-y-8">
              
              {/* 🔥🔥 DUAL FEATURES GRID 🔥🔥 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  
                  {/* 1. SMART BET BUILDER (Left) */}
                  <button 
                    onClick={() => navigate('/smart-bet')}
                    className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] to-[#1e3a8a]/20 border border-blue-500/30 p-8 text-left transition-all hover:border-blue-500/60 shadow-2xl hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                        <span className="text-8xl">⚡</span>
                    </div>
                    <div className="relative z-10">
                        <span className="inline-block bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded mb-3 tracking-widest shadow-lg shadow-blue-500/40">
                            Daily Engine
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                            Smart <span className="text-blue-400">Builder</span>
                        </h2>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs mb-6 h-10">
                            Instant daily slips based on your capital & risk.
                        </p>
                        <div className="inline-flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                            Launch Terminal <span>→</span>
                        </div>
                    </div>
                  </button>

                  {/* 2. STRATEGY PLANNER (Right - NEW) */}
                  <button 
                    onClick={() => navigate('/strategy-planner')}
                    className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] to-[#581c87]/20 border border-purple-500/30 p-8 text-left transition-all hover:border-purple-500/60 shadow-2xl hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                        <span className="text-8xl">📅</span>
                    </div>
                    <div className="relative z-10">
                        <span className="inline-block bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded mb-3 tracking-widest shadow-lg shadow-purple-500/40">
                            Monthly Plan
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                            Strategy <span className="text-purple-400">Planner</span>
                        </h2>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs mb-6 h-10">
                            AI roadmap to manage your bankroll for 30 days.
                        </p>
                        <div className="inline-flex items-center gap-2 text-purple-400 font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                            Create Roadmap <span>→</span>
                        </div>
                    </div>
                  </button>

              </div>
              {/* 🔥🔥 END DUAL GRID 🔥🔥 */}

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
            </div>
          )}

          {dashboardView === "matches" && (
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

          {dashboardView === "analysis" && (
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="flex items-center justify-between gap-3">
                <SoftButton onClick={() => setDashboardView("matches")} title="Back to matches">
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

// --- MAIN APP (With Routes) ---
const AppContent: React.FC = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // AUTH LOGIC
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await checkSubscription(currentUser);
      } else {
        setUser(null);
        // Only redirect out of protected routes
        if (location.pathname === '/dashboard' || location.pathname === '/subscription') {
            navigate('/');
        }
      }
    });
    return () => unsubscribe();
  }, []); // Run once on mount

  const checkSubscription = async (currentUser: User) => {
    try {
      const userSnap = await getDoc(doc(db, "subscribers", currentUser.uid));
      let isSubscribed = false;
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.expireAt && data.expireAt.toDate() > new Date()) isSubscribed = true;
      }
      
      const session = { email: currentUser.email || "", uid: currentUser.uid, subscribed: isSubscribed };
      setUser(session);
      
      // Smart Redirects based on subscription status
      const isAuthPage = location.pathname === '/auth';
      const isLanding = location.pathname === '/';
      
      if (isSubscribed) {
          if (isAuthPage || isLanding) navigate('/dashboard');
      } else {
          if (isAuthPage || isLanding) navigate('/subscription');
      }

    } catch (err) {
      console.error(err);
      navigate('/subscription');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    navigate('/');
  };

  const handleUpgradeSuccess = () => {
      setUser((prev) => (prev ? { ...prev, subscribed: true } : null));
      navigate('/dashboard');
  };

  // SEO Helpers
  const getCanonicalUrl = () => {
    return `https://yakuza-ai.com${location.pathname === '/' ? '' : location.pathname}`;
  };

  return (
    <>
      <Helmet>
         <link rel="canonical" href={getCanonicalUrl()} />
      </Helmet>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage onEnter={() => navigate('/auth')} onGoToContact={() => navigate('/contact')} onGoToNews={() => navigate('/news')} onGoToBlog={() => navigate('/blog')} />} />
        <Route path="/news" element={<NewsPage onBack={() => navigate('/')} />} />
        <Route path="/contact" element={<Contact onBack={() => navigate('/')} />} />
        
        {/* --- BLOG SYSTEM ROUTES --- */}
        <Route path="/admin" element={<CreatePost />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<SinglePost />} />
        {/* ------------------------- */}

        {/* Auth Routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/subscription" element={user ? <SubscriptionPage user={user} onUpgradeSuccess={handleUpgradeSuccess} /> : <Navigate to="/auth" />} />

        {/* Protected Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            user && user.subscribed 
              ? <Dashboard user={user} onLogout={handleLogout} /> 
              : <Navigate to={user ? "/subscription" : "/auth"} />
          } 
        />
        
        {/* Smart Bet Route */}
        <Route
          path="/smart-bet"
          element={
            user && user.subscribed
              ? <SmartBet />
              : <Navigate to={user ? "/subscription" : "/auth"} />
          }
        />

        {/* Strategy Planner Route (NEW) */}
        <Route
          path="/strategy-planner"
          element={
            user && user.subscribed
              ? <StrategyPlanner />
              : <Navigate to={user ? "/subscription" : "/auth"} />
          }
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

// Root Component
const App: React.FC = () => {
    return (
        <HelmetProvider>
            <Router>
                <AppContent />
            </Router>
        </HelmetProvider>
    );
};

export default App;