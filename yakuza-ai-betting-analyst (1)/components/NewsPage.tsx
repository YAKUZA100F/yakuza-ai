import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

// --- RSS Configuration ---
const RSS_FEEDS = [
  { name: "Sky Sports", url: "https://www.skysports.com/rss/12040", color: "text-blue-400" },
  { name: "Goal.com", url: "https://www.goal.com/feeds/en/news", color: "text-white" },
  { name: "ESPN", url: "https://www.espn.com/espn/rss/soccer/news", color: "text-red-400" }
];

const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
  source: string;
  sourceColor?: string;
}

const NewsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // --- Fetch Logic (نفس اللوجيك القوي) ---
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        let all: Article[] = [];
        const keywords = [
          'football', 'soccer', 'premier league', 'la liga', 'bundesliga', 'serie a', 'ligue 1',
          'champions league', 'ucl', 'fifa', 'uefa', 'goal', 'match', 'transfer', 'coach', 'manager',
          'player', 'striker', 'midfielder', 'defender', 'goalkeeper', 'cup', 'final', 'draw', 'fixture',
          'manchester', 'liverpool', 'arsenal', 'chelsea', 'barcelona', 'real madrid', 'bayern', 'psg',
          'juventus', 'inter', 'milan', 'dortmund', 'tottenham', 'city', 'united', 'madrid', 'roma', 'napoli',
          'marseille', 'ajax', 'benfica', 'porto', 'sporting', 'celtic', 'rangers', 'galatasaray', 'fenerbahce',
          'al hilal', 'al nassr', 'riyadh', 'saudi', 'afc', 'caf', 'africa cup', 'afcon', 'world cup', 'euros', 'euro'
        ];
        
        const promises = RSS_FEEDS.map(async (feed) => {
            const res = await fetch(RSS2JSON + encodeURIComponent(feed.url));
            const data = await res.json();
            if (data.items && Array.isArray(data.items)) {
                return data.items.slice(0, 10).map((item: any) => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    description: item.description.replace(/<[^>]+>/g, '').slice(0, 150) + '...',
                    thumbnail: item.thumbnail || item.enclosure?.link || null,
                    source: feed.name,
                    sourceColor: feed.color
                }));
            }
            return [];
        });

        const results = await Promise.all(promises);
        all = results.flat();
        all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        const filtered = all.filter(article => {
          const text = (article.title + ' ' + article.description).toLowerCase();
          return keywords.some(word => text.includes(word));
        });

        setArticles(filtered);
        if (filtered.length === 0) setError("No football news found. Check connection.");
      } catch (e) {
        setError("Failed to initialize news feed.");
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>News Feed | Yakuza AI</title>
        <meta name="description" content="Latest football news and transfer updates aggregated by Yakuza AI." />
      </Helmet>

      {/* رجعنا للخلفية الزرقاء ديال Yakuza */}
      <div className="min-h-screen bg-[#020617] text-slate-100 font-['Inter'] flex flex-col">
        
        {/* --- HEADER --- */}
        <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-900/20">Y</div>
                    <span className="font-extrabold text-xl tracking-tighter uppercase hidden sm:block">Yakuza AI</span>
                </div>
                
                {/* Search Bar (Blue Theme Style) */}
                <div className="flex-1 max-w-md mx-6 hidden md:block relative">
                    <input
                        type="text"
                        placeholder="Search Database..."
                        className="w-full bg-[#0B0F19] border border-white/10 rounded-xl py-2 px-5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-bold"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <button onClick={onBack} className="px-5 py-2 bg-white text-blue-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    Exit
                </button>
            </div>

            {/* --- BLUE TICKER --- */}
            <div className="bg-blue-900/10 border-y border-blue-500/10 py-1 overflow-hidden relative flex">
                <div className="bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1 z-10 absolute left-0 h-full flex items-center tracking-widest shadow-lg">
                    Live Feed
                </div>
                <div className="whitespace-nowrap animate-marquee flex gap-10 pl-24 items-center">
                    {articles.slice(0, 5).map((a, i) => (
                        <span key={i} className="text-[10px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            {a.title}
                        </span>
                    ))}
                </div>
            </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
            
            {/* Mobile Search */}
            <div className="md:hidden mb-6">
                 <input
                    type="text"
                    placeholder="Search keywords..."
                    className="w-full bg-[#0B0F19] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                 <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest animate-pulse">Scanning Global Feeds...</span>
                 </div>
            ) : error ? (
                <div className="text-center py-20 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <p className="text-red-400 font-bold text-sm">{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map((article, idx) => (
                        <a 
                            key={idx} 
                            href={article.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex flex-col bg-[#0B0F19] border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(37,99,235,0.2)]"
                        >
                            {/* Image with Blue Overlay */}
                            <div className="h-48 overflow-hidden relative bg-slate-900">
                                {article.thumbnail ? (
                                    <img src={article.thumbnail} alt="news" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-[#020617]">
                                        <div className="text-2xl font-black text-white/10">YAKUZA</div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent opacity-60"></div>
                                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase text-white tracking-widest border border-white/10 shadow-sm">
                                    <span className={article.sourceColor}>{article.source}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex flex-col flex-1 relative">
                                <div className="flex items-center gap-2 mb-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                    <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                                    <span className="text-blue-500">•</span>
                                    <span>{new Date(article.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <h3 className="text-sm font-black text-white mb-3 leading-relaxed group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3 mb-4 flex-1">
                                    {article.description}
                                </p>
                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Read Article <span>→</span>
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </main>
      </div>
    </>
  );
};

export default NewsPage;