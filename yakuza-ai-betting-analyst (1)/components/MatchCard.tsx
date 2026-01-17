import React, { useMemo, useState, useEffect } from "react";
import { MatchOdds } from "../types";

interface MatchCardProps {
  match: MatchOdds;
  onAnalyze: (match: MatchOdds) => void;
  isAnalyzing: boolean;
}

// --- 1. القائمة الذهبية (لضمان سرعة التحميل للفرق الكبرى) ---
// يمكنك إضافة المزيد هنا لضمان دقة 100% للفرق المشهورة
const VIP_LOGOS: Record<string, string> = {
  "Arsenal": "https://media.api-sports.io/football/teams/42.png",
  "Manchester City": "https://media.api-sports.io/football/teams/50.png",
  "Liverpool": "https://media.api-sports.io/football/teams/40.png",
  "Chelsea": "https://media.api-sports.io/football/teams/49.png",
  "Manchester United": "https://media.api-sports.io/football/teams/33.png",
  "Tottenham": "https://media.api-sports.io/football/teams/47.png",
  "Real Madrid": "https://media.api-sports.io/football/teams/541.png",
  "Barcelona": "https://media.api-sports.io/football/teams/529.png",
  "Atletico Madrid": "https://media.api-sports.io/football/teams/530.png",
  "Bayern Munich": "https://media.api-sports.io/football/teams/157.png",
  "Borussia Dortmund": "https://media.api-sports.io/football/teams/165.png",
  "Paris Saint Germain": "https://media.api-sports.io/football/teams/85.png",
  "Juventus": "https://media.api-sports.io/football/teams/496.png",
  "AC Milan": "https://media.api-sports.io/football/teams/489.png",
  "Inter": "https://media.api-sports.io/football/teams/505.png",
  "Napoli": "https://media.api-sports.io/football/teams/492.png",
  "Bayer Leverkusen": "https://media.api-sports.io/football/teams/168.png",
  "Newcastle": "https://media.api-sports.io/football/teams/34.png",
  "Aston Villa": "https://media.api-sports.io/football/teams/66.png",
  "West Ham": "https://media.api-sports.io/football/teams/48.png"
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// --- 2. مكون الشعار الذكي (Smart Logo Component) ---
const TeamLogo: React.FC<{ name: string }> = ({ name }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // تنظيف اسم الفريق (حذف الزوائد مثل FC)
  const cleanName = useMemo(() => {
    return name.replace(/ FC| CF| United| City| Real|AC | AS/gi, "").trim();
  }, [name]);

  // الحروف الأولى (للفشل)
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
  }, [name]);

  useEffect(() => {
    let isMounted = true;

    const fetchLogo = async () => {
      setLoading(true);
      
      // الخطوة 1: فحص القائمة الذهبية (أسرع وأدق)
      // نفحص الاسم الكامل أو الاسم المنظف
      if (VIP_LOGOS[name] || VIP_LOGOS[cleanName]) {
        if (isMounted) {
          setLogoUrl(VIP_LOGOS[name] || VIP_LOGOS[cleanName]);
          setLoading(false);
        }
        return;
      }

      // الخطوة 2: فحص الذاكرة (Cache) لتجنب كثرة الطلبات
      const cached = localStorage.getItem(`logo_${name}`);
      if (cached) {
        if (isMounted) {
          setLogoUrl(cached);
          setLoading(false);
        }
        return;
      }

      // الخطوة 3: البحث عبر TheSportsDB API (مجاني ومفتوح)
      try {
        const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`);
        const data = await response.json();
        
        if (data.teams && data.teams.length > 0) {
          const fetchedLogo = data.teams[0].strBadge;
          // حفظ في الذاكرة
          localStorage.setItem(`logo_${name}`, fetchedLogo);
          if (isMounted) setLogoUrl(fetchedLogo);
        } else {
          // محاولة ثانية بالاسم المنظف
           const res2 = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(cleanName)}`);
           const data2 = await res2.json();
           if (data2.teams && data2.teams.length > 0) {
             const fetchedLogo2 = data2.teams[0].strBadge;
             localStorage.setItem(`logo_${name}`, fetchedLogo2);
             if (isMounted) setLogoUrl(fetchedLogo2);
           } else {
             setHasError(true); 
           }
        }
      } catch (err) {
        setHasError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLogo();

    return () => { isMounted = false; };
  }, [name, cleanName]);

  return (
    <div className="relative group">
      {/* تأثير الضوء الخلفي */}
      <div className="pointer-events-none absolute -inset-3 rounded-full bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div
        className={cx(
          "relative w-20 h-20 rounded-2xl overflow-hidden p-3", // كبرت الحجم شوية
          "border border-white/10 bg-gradient-to-b from-white/5 to-black/60",
          "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center"
        )}
      >
        {/* Loading Skeleton */}
        {loading && (
          <div className="absolute inset-0 animate-pulse bg-white/5" />
        )}

        {/* Image Display */}
        {!loading && logoUrl && !hasError ? (
          <img
            src={logoUrl}
            alt={name}
            onError={() => setHasError(true)}
            className="w-full h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110"
          />
        ) : !loading && (
          // Fallback UI
          <div className="flex flex-col items-center justify-center w-full h-full text-slate-500">
             <span className="text-xl font-black text-blue-500">{initials}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- باقي المكونات كما هي مع تحسينات طفيفة ---

const OddsTile: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => {
  const isDash = value === "-" || value === "" || value === null;

  return (
    <div
      className={cx(
        "rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-center",
        "transition-all duration-300 hover:bg-white/[0.05] hover:border-blue-500/30 group"
      )}
    >
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-blue-400 transition-colors">
        {label}
      </p>
      <p
        className={cx(
          "mt-1 text-lg font-black leading-none",
          isDash ? "text-slate-600" : "text-slate-200"
        )}
      >
        {String(value)}
      </p>
    </div>
  );
};

const MatchCard: React.FC<MatchCardProps> = ({ match, onAnalyze, isAnalyzing }) => {
  const kickoff = useMemo(() => new Date(match.commence_time), [match.commence_time]);

  const timeLabel = useMemo(() => {
    if (Number.isNaN(kickoff.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(kickoff);
  }, [kickoff]);

  const dateLabel = useMemo(() => {
    if (Number.isNaN(kickoff.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
    }).format(kickoff);
  }, [kickoff]);

  const { homeOdds, awayOdds, drawOdds } = useMemo(() => {
    const h2h = match.bookmakers?.[0]?.markets?.find((m: any) => m.key === "h2h");
    const home = h2h?.outcomes?.find((o: any) => o.name === match.home_team)?.price ?? "-";
    const away = h2h?.outcomes?.find((o: any) => o.name === match.away_team)?.price ?? "-";
    const draw = h2h?.outcomes?.find((o: any) => o.name === "Draw")?.price ?? "-";
    return { homeOdds: home, awayOdds: away, drawOdds: draw };
  }, [match.away_team, match.bookmakers, match.home_team]);

  return (
    <article
      className={cx(
        "relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0f172a]/40 backdrop-blur-xl",
        "shadow-2xl hover:shadow-blue-900/10",
        "transition-all duration-500 hover:-translate-y-1"
      )}
    >
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="relative z-10 p-6">
        
        {/* Top Info Bar */}
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {dateLabel} <span className="text-slate-600">|</span> {timeLabel}
              </span>
           </div>
           {match.bookmakers?.[0]?.title && (
             <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
               {match.bookmakers[0].title}
             </span>
           )}
        </div>

        {/* Teams Layout */}
        <div className="flex items-center justify-between gap-2">
          {/* Home */}
          <div className="flex flex-col items-center flex-1 gap-3">
            <TeamLogo name={match.home_team} />
            <h2 className="text-xs font-bold text-white text-center uppercase tracking-wide max-w-[100px] leading-tight">
              {match.home_team}
            </h2>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center pb-6">
            <span className="text-2xl font-black text-slate-700 italic opacity-50">VS</span>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center flex-1 gap-3">
            <TeamLogo name={match.away_team} />
            <h2 className="text-xs font-bold text-white text-center uppercase tracking-wide max-w-[100px] leading-tight">
              {match.away_team}
            </h2>
          </div>
        </div>

        {/* Odds Grid */}
        <div className="mt-8 grid grid-cols-3 gap-3 bg-black/20 p-2 rounded-3xl border border-white/5">
          <OddsTile label="1 (Home)" value={homeOdds} />
          <OddsTile label="X (Draw)" value={drawOdds} />
          <OddsTile label="2 (Away)" value={awayOdds} />
        </div>

        {/* Analyze Button */}
        <button
          onClick={() => onAnalyze(match)}
          disabled={isAnalyzing}
          className={cx(
            "mt-6 w-full rounded-2xl py-4",
            "font-black text-xs uppercase tracking-[0.2em]",
            "flex items-center justify-center gap-2",
            "transition-all duration-300",
            isAnalyzing
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-600/40 hover:scale-[1.02]"
          )}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>⚡ Analyze Match</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};

export default MatchCard;