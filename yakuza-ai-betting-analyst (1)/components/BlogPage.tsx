import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';

const BlogPage = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // فلاتر البحث
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // جلب المقالات
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setArticles(posts);
        setFilteredArticles(posts);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // منطق البحث والتصفية
  useEffect(() => {
    let result = articles;

    // 1. فلتر التصنيف
    if (selectedCategory !== 'All') {
      result = result.filter(post => post.category === selectedCategory);
    }

    // 2. فلتر البحث
    if (searchTerm) {
      result = result.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredArticles(result);
  }, [searchTerm, selectedCategory, articles]);

  // دالة حساب وقت القراءة
  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  // دالة تنظيف النص
  const getExcerpt = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent?.slice(0, 120) + "..." || "";
  };

  // استخراج أول مقال ليكون هو "Hero Post"
  const heroPost = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const gridPosts = filteredArticles.length > 0 ? filteredArticles.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* BACKGROUND ACCENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
        
        {/* === HEADER & CONTROLS === */}
        <header className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Yakuza Intelligence Hub</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              News & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Insights</span>
            </h1>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto bg-slate-900/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
             {/* Categories */}
             <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-300 px-4 py-2 focus:outline-none cursor-pointer hover:text-white"
             >
                <option value="All">All Topics</option>
                <option value="Analysis">Analysis</option>
                <option value="Prediction">Prediction</option>
                <option value="News">News</option>
             </select>
             
             <div className="w-px h-6 bg-white/10 self-center hidden sm:block"></div>

             {/* Search Input */}
             <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="Search articles..." 
                    className="w-full sm:w-64 bg-white/5 border border-transparent focus:border-blue-500 rounded-xl px-4 py-2 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>
        </header>

        {loading ? (
           <div className="space-y-8">
              <div className="w-full h-[500px] bg-white/5 rounded-3xl animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[1,2,3].map(i => <div key={i} className="h-80 bg-white/5 rounded-3xl animate-pulse"></div>)}
              </div>
           </div>
        ) : (
          <>
            {/* === HERO SECTION (Featured Article) === */}
            {heroPost && (
              <Link to={`/blog/${heroPost.id}`} className="group relative block w-full h-[400px] md:h-[550px] rounded-[2rem] overflow-hidden mb-12 border border-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-slate-900">
                    {heroPost.image ? (
                        <img src={heroPost.image} alt={heroPost.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-60" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-900 to-slate-900"></div>
                    )}
                </div>
                
                {/* Hero Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent"></div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
                   <div className="flex items-center gap-3 mb-4">
                      <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-lg shadow-blue-600/20">
                         {heroPost.category || 'Featured'}
                      </span>
                      <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">
                         {heroPost.createdAt?.seconds ? new Date(heroPost.createdAt.seconds * 1000).toLocaleDateString() : ''}
                      </span>
                   </div>
                   <h2 className="text-3xl md:text-6xl font-black text-white mb-4 leading-tight max-w-4xl group-hover:text-blue-200 transition-colors">
                      {heroPost.title}
                   </h2>
                   <p className="text-slate-300 text-base md:text-lg max-w-2xl line-clamp-2 mb-6 hidden md:block">
                      {getExcerpt(heroPost.content)}
                   </p>
                   <div className="flex items-center gap-2 text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                      Read Full Analysis <span className="text-blue-400">→</span>
                   </div>
                </div>
              </Link>
            )}

            {/* === ARTICLES GRID === */}
            {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gridPosts.map((article) => (
                    <Link 
                    key={article.id} 
                    to={`/blog/${article.id}`} 
                    className="group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden hover:bg-slate-800/60 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
                    >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                        {article.image ? (
                            <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-600 font-bold">NO IMAGE</div>
                        )}
                        <div className="absolute top-4 left-4">
                            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-white/10">
                                {article.category || 'News'}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">
                            <span>{article.createdAt?.seconds ? new Date(article.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                            <span>{calculateReadTime(article.content)}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                            {article.title}
                        </h3>
                        
                        <p className="text-slate-400 text-sm line-clamp-3 mb-6 leading-relaxed flex-1">
                            {article.excerpt || getExcerpt(article.content)}
                        </p>

                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 grid place-items-center text-xs font-bold text-white">
                                Y
                            </div>
                            <span className="text-xs font-bold text-slate-300">By Yakuza Team</span>
                        </div>
                    </div>
                    </Link>
                ))}
                </div>
            ) : (
                // Empty State if search finds nothing
                !heroPost && (
                    <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/5">
                        <p className="text-2xl mb-2">🔍</p>
                        <h3 className="text-xl font-bold text-white">No articles found</h3>
                        <p className="text-slate-400">Try adjusting your search or filters.</p>
                        <button onClick={() => {setSearchTerm(''); setSelectedCategory('All');}} className="mt-4 text-blue-400 hover:underline">
                            Reset Filters
                        </button>
                    </div>
                )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;