import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./lib/firebase";
import Capture from "./components/Capture";
import HarvestAlbum from "./components/HarvestAlbum";
import Auth from "./components/Auth";
import { Toaster } from "react-hot-toast";
import { Fish, Waves, Camera, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";

type Tab = "capture" | "album";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("capture");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Fish className="w-12 h-12 text-cyan-500 animate-bounce" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500 selection:text-slate-900 pb-24 font-sans">
      <Toaster 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
          }
        }}
      />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-float">
              <Waves className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                OCEAN<span className="text-cyan-400">CATCH</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] -mt-1">
                AI Marine Intelligence
              </p>
            </div>
          </div>
          <Auth />
        </div>
      </header>

      {/* Main Bento Grid Container */}
      <main className="max-w-7xl mx-auto px-6">
        {!user ? (
          <div className="grid grid-cols-12 gap-6 items-center py-12">
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="col-span-12 lg:col-span-7 space-y-8"
            >
              <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-widest">
                Now Integrated with Gemini AI
              </div>
              <h2 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter">
                YOUR CATCH, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 italic">IDENTIFIED.</span>
              </h2>
              <p className="text-xl text-slate-400 font-medium max-w-xl">
                Experience the next generation of sea fishing journals. Real-time species detection and bilingual marine encyclopedia.
              </p>
              <div className="pt-4 scale-125 origin-left">
                <Auth />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="col-span-12 lg:col-span-5 hidden lg:block"
            >
              <div className="relative aspect-square">
                <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse"></div>
                <div className="relative h-full bg-slate-900 border border-slate-800 rounded-[3rem] p-8 flex flex-col items-center justify-center gap-6 overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                     <Fish className="w-12 h-12 text-slate-800 rotate-12" />
                  </div>
                  <Fish className="w-32 h-32 text-cyan-500 animate-float" />
                  <div className="text-center space-y-2">
                    <div className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Scanner Active</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-8 h-1 bg-cyan-500/30 rounded-full overflow-hidden">
                           <div className="h-full bg-cyan-400 animate-[loading_2s_infinite]" style={{ animationDelay: `${i * 0.2}s` }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <AnimatePresence mode="wait">
              {activeTab === "capture" ? (
                <motion.div 
                  key="capture"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="col-span-12"
                >
                  <Capture onHarvestAdded={() => setActiveTab("album")} />
                </motion.div>
              ) : (
                <motion.div 
                  key="album"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="col-span-12"
                >
                  <HarvestAlbum />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <AnimatePresence>
        {user && (
          <motion.nav 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-2 py-2 bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[2rem] flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <button 
              id="capture-tab-btn"
              onClick={() => setActiveTab("capture")}
              className={cn(
                "flex items-center gap-2 px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-tighter transition-all",
                activeTab === "capture" 
                  ? "bg-cyan-500 text-slate-950 scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                  : "text-slate-500 hover:text-white"
              )}
            >
              <Camera className="w-5 h-5 font-bold" />
              Capture
            </button>
            <div className="w-px h-6 bg-slate-800 mx-1" />
            <button 
              id="album-tab-btn"
              onClick={() => setActiveTab("album")}
              className={cn(
                "flex items-center gap-2 px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-tighter transition-all",
                activeTab === "album" 
                  ? "bg-cyan-500 text-slate-950 scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                  : "text-slate-500 hover:text-white"
              )}
            >
              <BookOpen className="w-5 h-5" />
              Album
            </button>
          </motion.nav>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
