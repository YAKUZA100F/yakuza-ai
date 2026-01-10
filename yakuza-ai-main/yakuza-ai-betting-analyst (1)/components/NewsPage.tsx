import React, { useEffect, useState } from "react";

// مصادر RSS لأخبار كرة القدم العالمية
const RSS_FEEDS = [
  {
    name: "Sky Sports",
    url: "https://www.skysports.com/rss/12040"
  },
  {
    name: "Goal.com",
    url: "https://www.goal.com/feeds/en/news"
  },
  {
    name: "ESPN Football",
    url: "https://www.espn.com/espn/rss/soccer/news"
  }
];

const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
  source: string;
}

const NewsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
        for (const feed of RSS_FEEDS) {
          const res = await fetch(RSS2JSON + encodeURIComponent(feed.url));
          const data = await res.json();
          if (data.items && Array.isArray(data.items)) {
            all = all.concat(
              data.items.slice(0, 10).map((item: any) => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                description: item.description.replace(/<[^>]+>/g, '').slice(0, 220) + '...',
                thumbnail: item.thumbnail || item.enclosure?.link || '',
                source: feed.name
              }))
            );
          }
        }
        // فلترة الأخبار لكرة القدم فقط
        const filtered = all.filter(article => {
          const text = (article.title + ' ' + article.description).toLowerCase();
          return keywords.some(word => text.includes(word));
        });
        setArticles(filtered);
        if (filtered.length === 0) setError("No football news found.");
      } catch (e) {
        setError("Failed to load news.");
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // فلترة حسب البحث
  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-['Inter']">
      <header className="glass-card px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-900/20">YKZ</div>
          <span className="font-extrabold text-xl tracking-tighter uppercase hidden sm:block">Yakuza AI</span>
        </div>
        <button onClick={onBack} className="px-6 py-2 bg-white text-blue-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          Back
        </button>
      </header>
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-black mb-6 text-center text-blue-200 tracking-tight">Latest Football News</h1>
        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="Search by team, player, or keyword..."
            className="w-full max-w-md px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading && <div className="text-center py-10">Loading news...</div>}
        {error && <div className="text-center text-red-400 py-10">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {filtered.map((article, idx) => (
            <div key={idx} className="glass-card rounded-3xl border border-white/10 bg-[#0B0F19] flex flex-col overflow-hidden shadow-xl hover:scale-[1.025] transition-transform duration-200">
              {article.thumbnail && (
                <img src={article.thumbnail} alt="news" className="w-full h-48 object-cover" />
              )}
              <div className="flex-1 p-5 flex flex-col justify-between">
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="font-black text-lg text-blue-400 hover:underline line-clamp-2 mb-2">
                  {article.title}
                </a>
                <p className="text-xs text-slate-300 mb-3 line-clamp-4">{article.description}</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest border border-blue-500/10">{article.source}</span>
                  <span className="text-[10px] text-slate-400">{new Date(article.pubDate).toLocaleString("en-GB", { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center text-slate-400 py-10">No news found for your search.</div>
        )}
      </main>
    </div>
  );
};

export default NewsPage;
