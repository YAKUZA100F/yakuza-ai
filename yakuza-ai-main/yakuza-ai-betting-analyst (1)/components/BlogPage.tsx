import React from "react";

// Example blog posts (replace or extend as needed)
const BLOG_POSTS = [
  {
    id: 1,
    title: "How to Analyze Football Matches with AI",
    date: "2026-01-10",
    author: "Yakuza AI Team",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    summary: "Learn how to use artificial intelligence to analyze football matches and make smarter predictions.",
    content: `Artificial intelligence is revolutionizing the way we analyze football matches. In this article, we explore the latest AI techniques and how you can use them to gain an edge in sports betting.\n\nKey topics include:\n- Data collection and preprocessing\n- Machine learning models for match prediction\n- Real-world case studies\n- Tips for using AI responsibly in betting.`,
  },
  {
    id: 2,
    title: "Top 5 Football Analytics Tools in 2026",
    date: "2026-01-05",
    author: "Yakuza AI Team",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80",
    summary: "A rundown of the best football analytics tools and platforms available this year.",
    content: `Football analytics tools are more powerful than ever. Here are our top picks for 2026:\n\n1. Yakuza AI\n2. StatsBomb\n3. Wyscout\n4. InStat\n5. Opta\n\nEach tool offers unique features for data-driven fans and professionals.`,
  },
];

const BlogPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selected, setSelected] = React.useState<number | null>(null);

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
        <h1 className="text-3xl font-black mb-6 text-center text-blue-200 tracking-tight">Blog</h1>
        {selected === null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {BLOG_POSTS.map(post => (
              <div key={post.id} className="glass-card rounded-3xl border border-white/10 bg-[#0B0F19] flex flex-col overflow-hidden shadow-xl hover:scale-[1.025] transition-transform duration-200">
                <img src={post.image} alt="blog" className="w-full h-48 object-cover" />
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <button onClick={() => setSelected(post.id)} className="font-black text-lg text-blue-400 hover:underline text-left mb-2 line-clamp-2">{post.title}</button>
                  <p className="text-xs text-slate-300 mb-3 line-clamp-4">{post.summary}</p>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest border border-blue-500/10">{post.author}</span>
                    <span className="text-[10px] text-slate-400">{new Date(post.date).toLocaleDateString("en-GB", { dateStyle: 'medium' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl border border-white/10 bg-[#0B0F19] p-8 shadow-xl max-w-2xl mx-auto">
            <button onClick={() => setSelected(null)} className="text-blue-400 hover:underline mb-4">← Back to Blog</button>
            <h2 className="font-black text-2xl text-blue-300 mb-2">{BLOG_POSTS.find(p => p.id === selected)?.title}</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest border border-blue-500/10">{BLOG_POSTS.find(p => p.id === selected)?.author}</span>
              <span className="text-[10px] text-slate-400">{new Date(BLOG_POSTS.find(p => p.id === selected)?.date || '').toLocaleDateString("en-GB", { dateStyle: 'medium' })}</span>
            </div>
            <img src={BLOG_POSTS.find(p => p.id === selected)?.image} alt="blog" className="w-full h-56 object-cover rounded-2xl mb-4" />
            <div className="text-slate-200 text-base leading-relaxed whitespace-pre-line" style={{wordBreak:'break-word'}}>
              {BLOG_POSTS.find(p => p.id === selected)?.content}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogPage;
