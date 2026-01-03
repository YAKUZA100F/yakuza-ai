import React from 'react';

interface ContactProps {
  onBack: () => void;
}

const Contact: React.FC<ContactProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-['Inter'] flex items-center justify-center p-6 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <button 
          onClick={onBack}
          className="mb-8 text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          ← Back to Home
        </button>

        <div className="glass-card p-10 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-4">
              Get in <span className="text-blue-500">Touch</span>
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-green-500 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-8">
            <div className="bg-blue-900/20 p-6 rounded-3xl border border-blue-500/20 text-center">
              <p className="text-sm md:text-base leading-relaxed text-slate-200 font-medium">
                "We developed <span className="text-blue-400 font-black">Yakuza AI</span> as a cutting-edge neural prediction engine. 
                Thanks to its extreme accuracy, my partners and I have generated over 
                <span className="text-green-400 font-black text-lg mx-1">$3,000,000</span> 
                in betting profits. Now, we are opening this technology to the public."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-green-500/30 transition-all group cursor-pointer">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl">📞</div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">WhatsApp</h3>
                </div>
                <p className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">+212 620-438075</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">✉️</div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Email Support</h3>
                </div>
                <p className="text-sm font-bold text-white break-all group-hover:text-blue-400 transition-colors">abdoskikim1000@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; // <--- ضروري جداً