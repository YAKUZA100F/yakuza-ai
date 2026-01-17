import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, Timestamp, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

// --- FAKE DATA FOR "PRO" FEEL ---
const FAKE_COMMENTS = [
  { id: 'fake1', user: 'Alex Trader', text: 'This strategy completely changed my ROI last month. The analysis on Haaland is spot on! 📈', time: '2 hours ago', isVerified: true },
  { id: 'fake2', user: 'Sarah Betting', text: 'Been following Yakuza AI for a year now. Best decision ever.', time: '5 hours ago', isVerified: false },
  { id: 'fake3', user: 'Karim_Casablanca', text: 'Hadchi nadi! The stats are unbelievable.', time: '1 day ago', isVerified: true },
];

const RECENT_SALES = [
  { name: "Omar from Marrakech", action: "subscribed to Premium" },
  { name: "John from London", action: "purchased VIP Tips" },
  { name: "Khalid from Dubai", action: "renewed Membership" },
];

const SinglePost = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Interactive States
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(142);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Live Toast State
  const [toast, setToast] = useState(null);

  // Comments State
  const [realComments, setRealComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Scroll Progress Logic
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Simulated Live Sales Notification
  useEffect(() => {
    const interval = setInterval(() => {
      const randomSale = RECENT_SALES[Math.floor(Math.random() * RECENT_SALES.length)];
      setToast(randomSale);
      setTimeout(() => setToast(null), 5000); 
    }, 15000); 
    return () => clearInterval(interval);
  }, []);

  // 3. Text-to-Speech Implementation (WORKING NOW)
  useEffect(() => {
    // Cleanup speech when component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleTTS = () => {
    if (!article?.content) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      // Strip HTML tags to read only text
      const cleanText = article.content.replace(/<[^>]+>/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Select a good voice (English)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-GB')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = 1; // Speed
      utterance.pitch = 1; 

      utterance.onend = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  // 4. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setArticle({ id: docSnap.id, ...data });

          const q = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(4));
          const querySnapshot = await getDocs(q);
          const related = querySnapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((a) => a.id !== id)
            .slice(0, 3);
          setRelatedArticles(related);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 5. Real-time Comments
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "articles", id, "comments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRealComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userName.trim() || !id) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "articles", id, "comments"), {
        user: userName, text: newComment, createdAt: Timestamp.now(), isReal: true
      });
      setNewComment('');
    } catch (err) { alert("Error posting comment"); } 
    finally { setSubmitting(false); }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard! 🔗");
  };

  const copyPromoCode = () => {
    navigator.clipboard.writeText("YAKUZA88");
    alert("Promo Code Copied: YAKUZA88 ✅");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-400 font-mono animate-pulse">Initializing AI...</p>
        </div>
    </div>
  );

  if (!article) return <div className="min-h-screen bg-[#0b1120] flex items-center justify-center text-white font-bold">404 - Article Not Found</div>;

  const formattedDate = article.createdAt?.seconds 
    ? new Date(article.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : 'Oct 24, 2025';

  const readTime = Math.ceil((article.content?.split(' ').length || 0) / 200) + " min read";

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden relative">
      
      {/* --- LIVE SALES TOAST --- */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-[200] bg-[#1e293b] border border-blue-500/30 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up-fade">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          <div>
            <p className="text-xs text-slate-400">Just now</p>
            <p className="text-sm font-bold text-white"><span className="text-blue-400">{toast.name}</span> {toast.action}</p>
          </div>
        </div>
      )}

      {/* --- TOP READING PROGRESS BAR --- */}
      <div className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 z-[100] shadow-[0_0_15px_rgba(59,130,246,0.8)]" style={{ width: `${scrollProgress}%` }} />

      {/* --- NAVBAR --- */}
      <nav className="border-b border-white/5 bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-40 w-full transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between text-sm">
             <div className="flex items-center gap-2 text-slate-400 overflow-hidden">
                <Link to="/" className="hover:text-white transition flex-shrink-0">Home</Link>
                <span className="text-slate-600">/</span>
                <span className="text-blue-400 font-medium truncate max-w-[150px] md:max-w-xs">{article.title}</span>
             </div>
             <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-green-400 font-bold">124 Live Readers</span>
                </div>
                <Link to="/" className="font-black text-2xl text-white tracking-tighter">YAKUZA<span className="text-blue-500">.AI</span></Link>
             </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* --- LEFT SIDEBAR (Sticky Actions & TOC) --- */}
            <aside className="hidden lg:block lg:col-span-2">
                <div className="sticky top-28 flex flex-col gap-8">
                    {/* Actions */}
                    <div className="flex flex-col gap-4 items-center bg-[#131b2e] p-4 rounded-full border border-white/5 shadow-xl">
                        <button onClick={handleLike} className={`p-3 rounded-full transition-all duration-300 ${isLiked ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-slate-400'}`}>
                            <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </button>
                        <span className="text-xs font-bold text-slate-500">{likeCount}</span>
                        
                        <div className="w-8 h-px bg-white/10"></div>

                        <button onClick={() => setIsBookmarked(!isBookmarked)} className={`p-3 rounded-full transition ${isBookmarked ? 'text-blue-400' : 'hover:bg-white/10 text-slate-400'}`}>
                            <svg className={`w-6 h-6 ${isBookmarked ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>

                        <button onClick={handleShare} className="p-3 rounded-full hover:bg-white/10 text-slate-400 transition">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        </button>
                    </div>

                    {/* Table of Contents */}
                    <div className="bg-[#131b2e] p-6 rounded-2xl border border-white/5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">On this page</h4>
                        <ul className="space-y-3 text-sm border-l border-white/10 pl-4">
                            <li className="text-blue-400 font-bold border-l-2 border-blue-500 -ml-[17px] pl-4 transition-all">Match Preview</li>
                            <li className="text-slate-400 hover:text-white cursor-pointer transition">Tactical Analysis</li>
                            <li className="text-slate-400 hover:text-white cursor-pointer transition">Betting Odds</li>
                            <li className="text-slate-400 hover:text-white cursor-pointer transition">Final Prediction</li>
                        </ul>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="lg:col-span-7 w-full min-w-0">
                
                {/* Article Header */}
                <header className="mb-10">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg shadow-blue-500/20 border border-white/10">
                            {article.category || "Pro Analysis"}
                        </span>
                        <span className="text-slate-400 text-sm font-medium flex items-center gap-1">
                            {formattedDate}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400 text-sm font-medium flex items-center gap-1">
                            {readTime}
                        </span>
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-8 tracking-tight break-words drop-shadow-2xl">
                        {article.title}
                    </h1>

                    {/* Featured Image */}
                    {article.image && (
                        <div className="relative rounded-2xl mb-8 group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-video bg-[#1e293b]">
                                <img src={article.image} alt={article.title} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700 ease-out" />
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                                    <p className="text-[10px] text-white uppercase tracking-wider font-bold">Getty Images</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REAL Working Audio Player */}
                    <div className="bg-[#1e293b] rounded-xl p-4 border border-white/5 flex items-center gap-4 mb-10 shadow-lg">
                        <button onClick={handleTTS} className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition shadow-lg ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500'}`}>
                            {isPlaying ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                            ) : (
                                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            )}
                        </button>
                        <div className="flex-1">
                            <p className="text-xs text-blue-300 font-bold mb-1 uppercase tracking-wider">
                                {isPlaying ? 'Now Reading...' : 'Listen to this article'}
                            </p>
                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full bg-blue-500 rounded-full ${isPlaying ? 'w-full animate-[progress_10s_linear_infinite]' : 'w-0'}`}></div>
                            </div>
                        </div>
                    </div>

                </header>

                {/* --- ARTICLE BODY --- */}
                <div className="bg-[#1e293b]/30 backdrop-blur-sm p-6 md:p-10 rounded-3xl border border-white/5 shadow-inner w-full overflow-hidden break-words relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                    {article.excerpt && (
                        <div className="mb-10 pl-6 border-l-4 border-blue-500">
                            <p className="text-xl md:text-2xl text-blue-100 font-serif italic leading-relaxed">
                                "{article.excerpt}"
                            </p>
                        </div>
                    )}

                    <article className="prose prose-lg prose-invert max-w-none w-full
                        prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
                        prose-p:text-slate-300 prose-p:leading-8 prose-p:mb-6
                        prose-a:text-blue-400 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-white prose-strong:font-black
                        prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-300
                        prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-white/5 prose-img:w-full prose-img:my-8
                        prose-blockquote:bg-[#131b2e] prose-blockquote:p-8 prose-blockquote:rounded-2xl prose-blockquote:border-none prose-blockquote:italic prose-blockquote:shadow-lg
                        prose-hr:border-white/10 prose-hr:my-12
                        break-words
                    ">
                        <div dangerouslySetInnerHTML={{ __html: article.content }} />
                    </article>

                    {/* Tags */}
                    <div className="mt-12 flex flex-wrap gap-2">
                        {['Premier League', 'Betting', 'Strategy', 'Analysis'].map(tag => (
                            <span key={tag} className="text-xs bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-1 rounded-full border border-white/5 cursor-pointer transition">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Author Section */}
                <div className="mt-12 bg-gradient-to-r from-[#1e293b] to-[#0f172a] rounded-3xl p-8 border border-white/5 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-slate-800 p-1 border-2 border-blue-500">
                            <img src="https://i.pravatar.cc/150?u=yakuza" alt="Author" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded text-white border border-[#0f172a]">PRO</div>
                    </div>
                    
                    <div className="text-center sm:text-left flex-1 relative z-10">
                        <h3 className="text-white font-bold text-xl">Analysis by Yakuza Team</h3>
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Senior Sports Analysts</p>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Specialized in data-driven sports predictions.
                            <span className="text-white font-bold block mt-1">ROI last month: +320% 📈</span>
                        </p>
                    </div>
                </div>

                {/* --- NEWSLETTER BOX (Moved Here) --- */}
                <div className="mt-12 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 p-8 rounded-3xl border border-blue-500/20 text-center relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                     <span className="text-4xl mb-4 block animate-bounce">📩</span>
                     <h4 className="text-white text-2xl font-black mb-2">Get Daily Winning Tips</h4>
                     <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">Join 15,000+ smart bettors. We send +EV picks directly to your inbox every morning.</p>
                     
                     <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                        <input type="email" placeholder="Enter your email" className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition" />
                        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-blue-600/30">
                            Subscribe Free
                        </button>
                     </div>
                     <p className="text-[10px] text-slate-600 mt-4">No spam. Unsubscribe anytime.</p>
                </div>

                {/* Comments Section */}
                <div className="mt-16">
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        Discussion <span className="bg-white/10 px-2 py-0.5 rounded text-base text-slate-300">({realComments.length + FAKE_COMMENTS.length})</span>
                    </h3>
                    
                    <div className="bg-[#1e293b]/30 p-1 rounded-3xl border border-white/5 mb-10 shadow-lg">
                        <form onSubmit={handleCommentSubmit} className="bg-[#0b1120] p-6 rounded-[20px]">
                            <div className="flex flex-col gap-4">
                                <input 
                                    type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Your Name" 
                                    className="bg-[#1e293b] border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                    required 
                                />
                                <textarea 
                                    value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add your expert insight..." 
                                    className="bg-[#1e293b] border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none h-32 resize-none transition"
                                    required 
                                />
                                <button type="submit" disabled={submitting} className="self-end bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-600/25 transform active:scale-95 flex items-center gap-2">
                                    {submitting ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-6">
                        {/* Fake Comments */}
                        {FAKE_COMMENTS.map((comment) => (
                             <div key={comment.id} className="bg-[#1e293b]/40 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-sm font-bold text-white border border-white/10">
                                            {comment.user.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-white">{comment.user}</span>
                                                {comment.isVerified && (
                                                    <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-500">{comment.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-300 leading-relaxed pl-13 text-sm">{comment.text}</p>
                            </div>
                        ))}

                        {/* Real Comments */}
                        {realComments.map((comment) => (
                            <div key={comment.id} className="bg-[#1e293b]/20 p-6 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400">
                                            {comment.user.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-200 block">{comment.user}</span>
                                            <span className="text-xs text-slate-600">
                                                {comment.createdAt?.seconds ? new Date(comment.createdAt.seconds*1000).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-400 leading-relaxed text-sm">{comment.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* --- RIGHT SIDEBAR (Sticky Ads) --- */}
            <aside className="lg:col-span-3 w-full">
                <div className="sticky top-24 space-y-6">
                    
                    {/* 1. BET SMARTER (Blue Gradient) */}
                    <div className="rounded-2xl p-6 text-center relative overflow-hidden shadow-2xl transition-transform hover:-translate-y-1 duration-300" 
                         style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                        <h3 className="text-white font-black text-2xl mb-2 relative z-10">Bet Smarter</h3>
                        <p className="text-blue-100 text-sm mb-6 leading-relaxed relative z-10">
                            Get AI-powered predictions with <span className="font-bold text-white">85% accuracy</span>.
                        </p>

                        <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-xl w-full shadow-lg hover:bg-blue-50 transition relative z-10">
                            Go Premium
                        </button>
                    </div>

                    {/* 2. PROMO CODE (Green / 1XBET) */}
                    <div className="relative group overflow-hidden rounded-2xl border border-green-500/20 shadow-xl opacity-90 hover:opacity-100 transition">
                        <div className="absolute inset-0 bg-[#0f2d1e] z-0"></div>
                        <div className="relative z-10 p-5 text-center">
                            <div className="text-green-500 font-black text-xl italic mb-1">1XBET</div>
                            <p className="text-[10px] text-slate-400 mb-3">Bonus up to $500</p>
                            <div onClick={copyPromoCode} className="cursor-pointer bg-black/40 border border-dashed border-green-500/40 rounded-lg p-2 mb-3 hover:border-green-400 group-hover:scale-105 transition">
                                <div className="text-xl font-black text-white font-mono">YAKUZA88</div>
                            </div>
                            <a href="https://1xbet.com" target="_blank" rel="noreferrer" className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-sm transition shadow-lg shadow-green-900/50">
                                Claim Bonus
                            </a>
                        </div>
                    </div>

                    {/* 3. TRENDING NOW (Related Articles) */}
                    <div className="bg-[#131b2e] rounded-2xl p-6 border border-white/5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Trending Now</h4>
                        <div className="flex flex-col gap-5">
                            {relatedArticles.map((item) => (
                                <Link key={item.id} to={`/blog/${item.id}`} className="group flex gap-3 items-start">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-white/10 relative">
                                        {item.image && <img src={item.image} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition" />}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-white text-xs leading-snug group-hover:text-blue-400 transition line-clamp-2 mb-1">
                                            {item.title}
                                        </h5>
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                            🔥 Hot Topic
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Search Box (Optional, kept at bottom of sidebar) */}
                    <div className="relative">
                        <input type="text" placeholder="Search..." className="w-full bg-[#131b2e] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none" />
                        <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>

                </div>
            </aside>

        </div>
      </div>
    </div>
  );
};

export default SinglePost;