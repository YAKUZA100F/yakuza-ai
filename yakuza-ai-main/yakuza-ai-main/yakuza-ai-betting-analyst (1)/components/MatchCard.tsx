
import React, { useState } from 'react';
import { MatchOdds } from '../types';

interface MatchCardProps {
  match: MatchOdds;
  onAnalyze: (match: MatchOdds) => void;
  isAnalyzing: boolean;
}

const TeamLogo: React.FC<{ name: string }> = ({ name }) => {
  const [hasError, setHasError] = useState(false);
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  const officialLogoUrl = `https://unavatar.io/reddit/${name.toLowerCase().replace(/\s+/g, '')}?fallback=false`;
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=3b82f6&bold=true&format=svg&size=128`;

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/40 transition-all duration-700 opacity-50 group-hover:opacity-100"></div>
      <div className="relative w-16 h-16 rounded-2xl border-2 border-white/5 overflow-hidden bg-gradient-to-b from-slate-900 to-black flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:border-blue-500/40 group-hover:-translate-y-1">
        {!hasError ? (
          <img 
            src={officialLogoUrl} 
            alt={`${name} official club logo`} 
            onError={() => setHasError(true)}
            className="w-12 h-12 object-contain transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-1">
            <img 
              src={fallbackUrl} 
              alt={`${name} club placeholder`} 
              className="w-full h-full object-cover opacity-60 rounded-xl"
            />
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-blue-500 font-black text-xl tracking-tighter drop-shadow-lg">{initials}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MatchCard: React.FC<MatchCardProps> = ({ match, onAnalyze, isAnalyzing }) => {
  const h2h = match.bookmakers?.[0]?.markets.find(m => m.key === 'h2h');
  const homeOdds = h2h?.outcomes.find(o => o.name === match.home_team)?.price || '-';
  const awayOdds = h2h?.outcomes.find(o => o.name === match.away_team)?.price || '-';
  const drawOdds = h2h?.outcomes.find(o => o.name === 'Draw')?.price || '-';

  return (
    <article className="glass-card rounded-[3rem] p-8 transition-all duration-500 hover:scale-[1.02] border-white/5 hover:border-blue-500/30 group shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-green-500/10 rounded-2xl border border-green-500/20">
          <time className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">
            {new Date(match.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-blue-400/80 uppercase tracking-widest px-4 py-1.5 bg-blue-500/5 rounded-2xl border border-blue-500/10 backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          ANALYSIS READY
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-6 mb-12 relative z-10">
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex-1 flex flex-col items-center text-center gap-4">
            <TeamLogo name={match.home_team} />
            <h2 className="font-black text-sm text-white line-clamp-2 h-10 tracking-tight uppercase">{match.home_team}</h2>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-[11px] font-black text-slate-700 italic tracking-widest">VS</span>
          </div>
          <div className="flex-1 flex flex-col items-center text-center gap-4">
            <TeamLogo name={match.away_team} />
            <h2 className="font-black text-sm text-white line-clamp-2 h-10 tracking-tight uppercase">{match.away_team}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
        {[
          { label: 'Home', odds: homeOdds },
          { label: 'Draw', odds: drawOdds },
          { label: 'Away', odds: awayOdds }
        ].map((item, idx) => (
          <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-[9px] text-slate-500 font-black uppercase mb-1">{item.label}</p>
            <p className="font-black text-blue-400 text-xl leading-none">{item.odds}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAnalyze(match)}
        disabled={isAnalyzing}
        aria-label={`Start AI analysis for ${match.home_team} vs ${match.away_team}`}
        className={`w-full py-5 rounded-[2rem] font-black text-xs flex items-center justify-center gap-3 transition-all duration-500 relative z-10 overflow-hidden ${
          isAnalyzing 
          ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
          : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-700 hover:from-blue-600 hover:to-indigo-600 text-white shadow-xl shadow-blue-600/20'
        }`}
      >
        {isAnalyzing ? (
          <span className="tracking-[0.2em] text-[10px] animate-pulse">OPTIMIZING NEURAL PATHS...</span>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="tracking-widest font-black uppercase">Start AI Analysis</span>
          </>
        )}
      </button>
    </article>
  );
};

export default MatchCard;
