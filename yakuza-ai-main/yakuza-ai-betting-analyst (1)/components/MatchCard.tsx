import React, { useMemo, useState } from "react";
import { MatchOdds } from "../types";

interface MatchCardProps {
  match: MatchOdds;
  onAnalyze: (match: MatchOdds) => void;
  isAnalyzing: boolean;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const TeamLogo: React.FC<{ name: string }> = ({ name }) => {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const two = parts.map((n) => n[0]).join("").slice(0, 2);
    return (two || name.slice(0, 2)).toUpperCase();
  }, [name]);

  // نفس URL تاعك (خليتها باش ما نكسروش أي حاجة)
  const officialLogoUrl = useMemo(() => {
    const slug = name.toLowerCase().replace(/\s+/g, "");
    return `https://unavatar.io/reddit/${slug}?fallback=false`;
  }, [name]);

  const fallbackUrl = useMemo(() => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0b1220&color=60a5fa&bold=true&format=svg&size=128`;
  }, [name]);

  return (
    <div className="relative">
      {/* glow */}
      <div className="pointer-events-none absolute -inset-2 rounded-[22px] bg-blue-500/15 blur-xl opacity-70" />

      <div
        className={cx(
          "relative w-16 h-16 rounded-2xl overflow-hidden",
          "border border-white/10 bg-gradient-to-b from-white/10 to-black/40",
          "shadow-[0_18px_50px_rgba(0,0,0,0.6)]"
        )}
      >
        {/* skeleton shimmer while loading */}
        {!loaded && !hasError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
        )}

        {!hasError ? (
          <img
            src={officialLogoUrl}
            alt={`${name} logo`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => {
              setHasError(true);
              setLoaded(true);
            }}
            className={cx(
              "relative z-10 w-full h-full object-contain p-2 transition-transform duration-500",
              "hover:scale-110"
            )}
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={fallbackUrl}
              alt={`${name} placeholder`}
              className="w-full h-full object-cover opacity-60"
              loading="lazy"
            />
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-blue-300 font-black text-xl tracking-tight drop-shadow">
                {initials}
              </span>
            </div>
          </div>
        )}

        {/* subtle shine */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
      </div>
    </div>
  );
};

const OddsTile: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => {
  const isDash = value === "-" || value === "" || value === null || value === undefined;

  return (
    <div
      className={cx(
        "rounded-3xl border border-white/10 bg-black/35 p-4 text-center",
        "transition-colors duration-300 hover:bg-black/45"
      )}
    >
      <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.22em]">
        {label}
      </p>
      <p
        className={cx(
          "mt-1 text-xl font-black leading-none",
          isDash ? "text-slate-500" : "text-blue-300"
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
        "relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl",
        "shadow-[0_20px_90px_rgba(0,0,0,0.6)]",
        "transition-transform duration-500 hover:scale-[1.015]"
      )}
    >
      {/* top gradient sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      {/* side glow */}
      <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
      <div className="pointer-events-none absolute -left-24 bottom-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-[90px]" />

      <div className="relative z-10 p-7">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <time className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200/90">
              {dateLabel} • {timeLabel}
            </time>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/15 bg-blue-600/10 px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200/90">
              Analysis Ready
            </span>
          </div>
        </div>

        {/* Teams */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="mx-auto w-fit">
              <TeamLogo name={match.home_team} />
            </div>
            <h2 className="mt-4 text-sm font-black tracking-tight uppercase text-white line-clamp-2">
              {match.home_team}
            </h2>
          </div>

          <div className="flex flex-col items-center px-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
              <span className="text-[11px] font-black tracking-[0.28em] text-slate-400">
                VS
              </span>
            </div>
          </div>

          <div className="flex-1 text-center">
            <div className="mx-auto w-fit">
              <TeamLogo name={match.away_team} />
            </div>
            <h2 className="mt-4 text-sm font-black tracking-tight uppercase text-white line-clamp-2">
              {match.away_team}
            </h2>
          </div>
        </div>

        {/* Odds */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <OddsTile label="Home" value={homeOdds} />
          <OddsTile label="Draw" value={drawOdds} />
          <OddsTile label="Away" value={awayOdds} />
        </div>

        {/* CTA */}
        <button
          onClick={() => onAnalyze(match)}
          disabled={isAnalyzing}
          aria-busy={isAnalyzing}
          aria-label={`Start AI analysis for ${match.home_team} vs ${match.away_team}`}
          className={cx(
            "mt-7 w-full rounded-[2rem] py-5",
            "font-black text-xs uppercase tracking-widest",
            "flex items-center justify-center gap-3",
            "transition-all duration-500",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
            isAnalyzing
              ? "cursor-not-allowed bg-white/5 text-slate-500 border border-white/10"
              : "bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-700 hover:from-blue-600 hover:to-indigo-600 text-white shadow-[0_18px_55px_rgba(37,99,235,0.22)]"
          )}
        >
          {isAnalyzing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-200" />
              <span className="text-[10px] tracking-[0.22em]">
                OPTIMIZING NEURAL PATHS...
              </span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Start AI Analysis
            </>
          )}
        </button>
      </div>
    </article>
  );
};

export default MatchCard;
