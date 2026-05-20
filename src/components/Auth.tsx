import React from "react";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { LogIn, LogOut, User } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Auth() {
  const user = auth.currentUser;

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Welcome aboard!");
    } catch (error) {
      console.error(error);
      toast.error("Login failed");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Safe travels!");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5">
        <div className="flex flex-col items-end hidden sm:block">
           <span className="text-xs font-black text-white uppercase tracking-tighter truncate max-w-[120px]">{user.displayName || "Navigator"}</span>
           <span className="text-[8px] font-bold text-cyan-500 uppercase tracking-widest">{user.email?.split('@')[0]}</span>
        </div>
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || "User"} className="w-10 h-10 rounded-xl border-2 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border-2 border-slate-700">
             <User className="w-5 h-5 text-slate-500" />
          </div>
        )}
        <button 
          id="logout-btn"
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          title="Disconnect Session"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button 
      id="login-btn"
      onClick={handleLogin}
      className="group relative flex items-center gap-3 bg-white text-slate-950 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
    >
      <LogIn className="w-4 h-4 group-hover:rotate-12 transition-transform" />
      Initialize Link
      <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
    </button>
  );
}
