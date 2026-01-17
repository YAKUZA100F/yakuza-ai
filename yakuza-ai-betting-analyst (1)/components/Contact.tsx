import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Contact: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Contact & Legal - Yakuza AI</title>
        <meta name="description" content="Contact support and legal disclaimer. Yakuza AI provides sports analysis and predictions. 18+ Only." />
        <link rel="canonical" href="https://oniflow.site/contact" />
      </Helmet>

      <div className="min-h-screen bg-[#020617] text-slate-100 font-['Inter'] flex items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-2xl w-full relative z-10">
          <button 
            onClick={() => navigate('/')}
            className="mb-8 text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            ← Back to Home
          </button>

          <div className="glass-card p-8 md:p-10 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white mb-4">
                Get in <span className="text-blue-500">Touch</span>
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-green-500 mx-auto rounded-full"></div>
            </div>

            <div className="space-y-8">
              {/* Marketing Quote */}
              <div className="bg-blue-900/20 p-6 rounded-3xl border border-blue-500/20 text-center">
                <p className="text-sm md:text-base leading-relaxed text-slate-200 font-medium">
                  "We developed <span className="text-blue-400 font-black">Yakuza AI</span> as a cutting-edge neural prediction engine. 
                  Thanks to its extreme accuracy, my partners and I have generated substantial returns. Now, we are opening this technology to the public."
                </p>
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <a href="https://wa.me/212620438075" target="_blank" rel="noopener noreferrer" className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-green-500/30 transition-all group cursor-pointer block">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl">📞</div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">WhatsApp</h3>
                  </div>
                  <p className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">+212 620-438075</p>
                </a>

                <a href="mailto:abdoskikim1000@gmail.com" className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer block">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">✉️</div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Email Support</h3>
                  </div>
                  <p className="text-sm font-bold text-white break-all group-hover:text-blue-400 transition-colors">abdoskikim1000@gmail.com</p>
                </a>
              </div>

              {/* Legal Disclaimer Section - NEW ADDITION */}
              <div className="mt-8 pt-8 border-t border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                  Legal Disclaimer
                </h4>
                <p className="text-[10px] md:text-xs text-slate-500 text-center leading-relaxed max-w-lg mx-auto">
                  <strong>Yakuza AI is strictly an informational & statistical analysis tool.</strong> We are not a gambling operator and do not accept or facilitate bets. All predictions are based on historical data and AI algorithms. 
                  <br className="my-2"/>
                  <span className="opacity-70">Past performance is not indicative of future results. Betting involves financial risk. Please gamble responsibly and only with money you can afford to lose.</span>
                </p>
                
                <div className="flex justify-center items-center gap-6 mt-6 opacity-60">
                   <div className="flex items-center gap-2">
                      <span className="text-red-500 font-bold text-lg">18+</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Adults Only</span>
                   </div>
                   <div className="h-4 w-px bg-slate-700"></div>
                   <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-lg">⚠️</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Play Responsibly</span>
                   </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;