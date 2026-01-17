import React, { useState, useEffect, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css'; 
// @ts-ignore
import ImageResize from 'quill-image-resize-module-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';

// 👇👇👇 تم تصحيح الإيميل هنا (زدنا 0) 👇👇👇
const ADMIN_EMAIL = "abdoskikim1000@gmail.com"; 

// --- 1. إعدادات مكتبة QUILL ---
Quill.register('modules/imageResize', ImageResize);
const Font = Quill.import('formats/font') as any;
Font.whitelist = ['arial', 'comic-sans', 'courier-new', 'georgia', 'helvetica', 'lucida'];
Quill.register(Font, true);

// --- 2. مكون التنبيهات (TOAST) ---
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border transition-all duration-500 animate-bounce-in ${
    type === 'success' ? 'bg-[#0f2d1e] border-green-500/50 text-green-400' : 'bg-[#2d0f0f] border-red-500/50 text-red-400'
  }`}>
    <span className="text-xl">{type === 'success' ? '✅' : '❌'}</span>
    <div>
      <h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
      <p className="text-xs opacity-80">{message}</p>
    </div>
    <button onClick={onClose} className="ml-4 hover:bg-white/10 rounded-full p-1">✕</button>
  </div>
);

const CreatePost = () => {
  const navigate = useNavigate();
  
  // --- AUTH STATE ---
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  // Login Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- EDITOR STATE ---
  const [title, setTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [category, setCategory] = useState<string>('Analysis'); 
  const [excerpt, setExcerpt] = useState<string>(''); 
  const [status, setStatus] = useState<string>('draft');
  const [author, setAuthor] = useState<string>('Yakuza Admin');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [showJsonInput, setShowJsonInput] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // --- AUTH CHECK EFFECT ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // --- دالة تسجيل الدخول (Email & Password) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      // 1. محاولة تسجيل الدخول
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (error: any) {
      console.error("Login Error:", error.code);
      
      // 2. إذا كان المستخدم غير موجود، نقوم بإنشائه تلقائياً
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
         try {
            await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
         } catch (createError: any) {
            setAuthError("خطأ: " + createError.message);
         }
      } else if (error.code === 'auth/wrong-password') {
        setAuthError("كلمة المرور غير صحيحة");
      } else {
        setAuthError("فشل الدخول: " + error.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // --- QUILL MODULES ---
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': Font.whitelist }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
    },
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize', 'Toolbar'],
    },
    clipboard: { matchVisual: false }
  }), []);

  const formats = [
    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'script', 'align', 'list', 'bullet', 'indent',
    'blockquote', 'code-block', 'link', 'image', 'video'
  ];

  // --- LOGIC ---
  useEffect(() => {
    if (title && !slug) {
      const generatedSlug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleJsonImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (data.title) setTitle(data.title);
      if (data.slug) setSlug(data.slug);
      if (data.content) setContent(data.content);
      if (data.image) setImage(data.image);
      if (data.category) setCategory(data.category);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.tags) setTags(data.tags);
      if (data.status) setStatus(data.status);
      showToast("تم استيراد البيانات بنجاح! 🤖", "success");
      setShowJsonInput(false);
      setJsonInput('');
    } catch (error) {
      showToast("كود JSON غير صالح! ❌", "error");
    }
  };

  const handlePublish = async (targetStatus: string) => {
    if (!title || !content) return showToast("العنوان والمحتوى مطلوبان!", "error");
    setLoading(true);
    try {
      const finalExcerpt = excerpt || content.replace(/<[^>]+>/g, '').substring(0, 160) + "...";
      const finalSlug = slug || title.toLowerCase().replace(/\s+/g, '-');

      await addDoc(collection(db, "articles"), {
        title, slug: finalSlug, image, content, category,
        excerpt: finalExcerpt, tags, status: targetStatus, author,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        views: 0, likes: 0
      });
      
      showToast(targetStatus === 'published' ? "تم النشر بنجاح! 🚀" : "تم الحفظ كمسودة! 💾", "success");
      if (targetStatus === 'published') setTimeout(() => navigate('/blog'), 1500);
    } catch (error) {
      console.error("Error:", error);
      showToast("خطأ في الاتصال بقاعدة البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(w => w !== '').length;
  const readTime = Math.ceil(wordCount / 200);

  // --- 1. شاشة التحميل ---
  if (isChecking) {
    return <div className="min-h-screen bg-[#0b1120] flex items-center justify-center text-white"><div className="animate-spin text-4xl">⏳</div></div>;
  }

  // --- 2. شاشة الحماية (LOGIN FORM) ---
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-blue-500/20 text-center max-w-md w-full shadow-2xl relative overflow-hidden">
          
          <div className="mb-8">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30 mb-4">🔐</div>
             <h1 className="text-2xl font-black text-white">Yakuza Admin</h1>
             <p className="text-slate-400 text-sm mt-2">Enter credentials to access dashboard</p>
          </div>

          {user && user.email !== ADMIN_EMAIL && (
             <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 mb-6 text-left">
                <p className="text-red-400 text-xs uppercase font-bold mb-1">Access Denied:</p>
                <p className="text-white font-mono text-sm">{user.email}</p>
                <p className="text-slate-400 text-xs mt-2">This email is not authorized.</p>
                <button onClick={() => signOut(auth)} className="text-red-400 underline text-xs mt-2 hover:text-white">Sign out</button>
             </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                <input 
                    type="email" 
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-black/30 border border-slate-700 focus:border-blue-500 rounded-xl p-3 text-white outline-none transition mt-1"
                />
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                <input 
                    type="password" 
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/30 border border-slate-700 focus:border-blue-500 rounded-xl p-3 text-white outline-none transition mt-1"
                />
             </div>

             {authError && (
                <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {authError}
                </div>
             )}

             <button 
                type="submit" 
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition transform hover:scale-[1.02] flex items-center justify-center gap-2 mt-4"
             >
                {authLoading ? <span className="animate-spin">↻</span> : 'Login to Dashboard 🚀'}
             </button>
          </form>

          <Link to="/" className="block mt-8 text-slate-600 hover:text-white text-xs transition">← Return to Website</Link>
        </div>
      </div>
    );
  }

  // --- 3. لوحة التحكم الكاملة ---
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 font-sans p-4 md:p-8 relative selection:bg-blue-500 selection:text-white">
      
      <style>{`
        .ql-toolbar.ql-snow {
          background-color: #f8fafc;
          border-radius: 16px 16px 0 0;
          border: none !important;
          padding: 16px;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 4px 20px -5px rgba(0,0,0,0.1);
        }
        .ql-container.ql-snow {
          border: none !important;
          background-color: white;
          color: #334155;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          min-height: 700px;
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
        }
        .ql-editor {
          min-height: 700px;
          padding: 40px;
          line-height: 1.8;
        }
        .ql-editor h1, .ql-editor h2, .ql-editor h3 {
            font-weight: 800;
            color: #0f172a;
            margin-top: 1.5em;
        }
        .ql-editor img {
            border-radius: 12px;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
            margin: 20px 0;
        }
      `}</style>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4">
            <div className="relative">
                <span className="absolute inset-0 bg-blue-500 blur-lg opacity-50"></span>
                <span className="relative bg-gradient-to-tr from-blue-600 to-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl border border-white/10">⚡</span>
            </div>
            YAKUZA CMS
          </h1>
          <div className="text-slate-500 text-xs font-bold mt-3 ml-[70px] flex items-center gap-3 uppercase tracking-widest">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Admin Session Active
             <span className="text-slate-700">|</span>
             <span className="text-blue-400">{user.email}</span>
             <button onClick={() => signOut(auth)} className="text-red-400 hover:text-red-300 underline lowercase ml-2">logout</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowJsonInput(!showJsonInput)}
            className={`flex-1 md:flex-none px-5 py-3 rounded-xl border transition font-bold text-sm flex items-center justify-center gap-2 ${
                showJsonInput 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/20' 
                : 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500 hover:text-white'
            }`}
          >
            {showJsonInput ? 'Close Import' : '{ } Import JSON'}
          </button>

          <button onClick={() => handlePublish('draft')} disabled={loading} className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700 transition font-bold text-sm hover:scale-[1.02]">
            💾 Save Draft
          </button>

          <button onClick={() => handlePublish('published')} disabled={loading} className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:to-indigo-500 text-white font-bold transition text-sm shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 hover:scale-[1.05]">
            {loading ? <span className="animate-spin text-lg">↻</span> : <span>🚀 Publish Now</span>}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showJsonInput ? 'max-h-[800px] mb-10 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="max-w-7xl mx-auto bg-[#131b2e] border border-purple-500/30 rounded-[2rem] p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-purple-400 font-bold flex items-center gap-2 text-xl"><span className="text-2xl">🤖</span> AI / JSON Import</h3>
                    <p className="text-slate-500 text-xs mt-1">Paste your AI-generated JSON here to auto-fill all fields.</p>
                </div>
            </div>
            <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{ "title": "...", "content": "..." }'
                className="w-full bg-black/30 border border-slate-700 rounded-2xl p-6 text-xs font-mono text-green-400 focus:border-purple-500 outline-none h-48 resize-none shadow-inner"
            />
            <button onClick={handleJsonImport} className="mt-6 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl text-sm font-bold w-full transition shadow-lg flex items-center justify-center gap-2">
                <span>⚡</span> Process & Fill Data
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#1e293b]/50 p-8 rounded-[2rem] border border-white/5 shadow-sm group focus-within:border-blue-500/50 transition duration-500">
            <input type="text" placeholder="Enter an epic headline..." className="w-full bg-transparent text-4xl md:text-5xl font-black placeholder-slate-700 border-none focus:ring-0 outline-none text-white mb-6 leading-tight" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex items-center gap-3 text-sm text-slate-500 bg-black/20 p-4 rounded-2xl border border-white/5">
                <span className="text-slate-600 font-mono select-none">/blog/</span>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-transparent text-blue-400 outline-none flex-1 font-mono text-sm font-bold" placeholder="post-url-slug" />
            </div>
          </div>

          <div className="rounded-[2rem] shadow-2xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-[2rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative bg-white rounded-[2rem] overflow-hidden text-black min-h-[700px]">
                <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} formats={formats} placeholder="Start writing your masterpiece..." />
                <div className="absolute bottom-0 left-0 w-full bg-slate-50 border-t py-3 px-8 text-xs font-bold text-slate-400 flex justify-between items-center z-10">
                    <div className="flex gap-6"><span className="flex items-center gap-1">📝 {wordCount} Words</span><span className="flex items-center gap-1">⏱️ {readTime} Min Read</span></div>
                    <span className="text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">● Auto-saved</span>
                </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-[2rem] border border-white/5 shadow-xl hover:shadow-2xl transition duration-500">
             <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-xs uppercase tracking-widest opacity-70"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Publishing</h3>
             <div className="space-y-5">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Current Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={`w-full bg-transparent border-none p-0 text-lg font-black outline-none cursor-pointer ${status === 'published' ? 'text-green-400' : 'text-amber-400'}`}>
                        <option value="draft">Draft Mode</option>
                        <option value="published">Live Public</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Author Alias</label>
                    <div className="relative">
                        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:border-blue-500 outline-none transition" />
                        <span className="absolute left-3 top-3.5 text-slate-500">👤</span>
                    </div>
                </div>
             </div>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-[2rem] border border-white/5 shadow-xl hover:shadow-2xl transition duration-500">
             <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-xs uppercase tracking-widest opacity-70"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Organization</h3>
             <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Category</label>
                <div className="relative">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-300 appearance-none font-bold">
                        <option value="Analysis">📊 Tactical Analysis</option>
                        <option value="Prediction">🎯 Match Prediction</option>
                        <option value="News">📰 Breaking News</option>
                        <option value="Strategy">♟️ Betting Strategy</option>
                        <option value="Crypto">💰 Crypto & Finance</option>
                    </select>
                    <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">▼</div>
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[30px]">
                    {tags.map((tag, idx) => (
                        <span key={idx} className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-blue-500/20 group hover:bg-blue-500 hover:text-white transition">
                            #{tag} <button onClick={() => removeTag(tag)} className="ml-1 opacity-50 hover:opacity-100">×</button>
                        </span>
                    ))}
                </div>
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="+ Add tag & Enter" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-white transition placeholder-slate-600" />
             </div>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-[2rem] border border-white/5 shadow-xl hover:shadow-2xl transition duration-500">
             <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-xs uppercase tracking-widest opacity-70"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Visuals & SEO</h3>
             <div className="mb-5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Featured Image</label>
                <div className="flex gap-2 mb-3">
                    <input type="text" placeholder="Paste Image URL..." className="flex-1 bg-black/30 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-slate-300" value={image} onChange={(e) => setImage(e.target.value)} />
                </div>
                 <div className="aspect-video bg-black/50 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative group hover:border-blue-500/30 transition">
                    {image ? (
                        <>
                            <img src={image} alt="Preview" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold">Preview Mode</div>
                        </>
                    ) : (
                        <div className="text-center opacity-30">
                            <span className="text-4xl block mb-2 grayscale">🖼️</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                        </div>
                    )}
                 </div>
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">SEO Description</label>
                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-xs focus:border-blue-500 outline-none h-28 resize-none text-slate-300 leading-relaxed" placeholder="Write a catchy summary for Google & Social Media..." />
                <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-slate-600">Optimal: 150-160 chars</span>
                    <div className={`text-[10px] font-bold ${excerpt.length > 160 ? 'text-red-500' : 'text-slate-500'}`}>{excerpt.length}/160</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;