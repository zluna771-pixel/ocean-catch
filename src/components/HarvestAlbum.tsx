import React, { useEffect, useState } from "react";
import { firebaseService, HarvestRecord } from "../services/firebaseService";
import { Trash2, Calendar, MapPin, Search, Fish } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";

export default function HarvestAlbum() {
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestRecord | null>(null);

  const fetchHarvests = async () => {
    setLoading(true);
    try {
      const data = await firebaseService.getMyHarvests();
      setHarvests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHarvests();
  }, []);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (deletingId !== id) {
      setDeletingId(id);
      toast("Target locked. Click again to purge.", { 
        icon: '⚠️',
        style: {
          borderRadius: '1rem',
          background: '#0f172a',
          color: '#fff',
          border: '1px solid #ef4444'
        }
      });
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      await firebaseService.deleteHarvest(id);
      setHarvests(harvests.filter(h => h.id !== id));
      toast.success("Bio-signature purged from registry.");
      if (selectedHarvest?.id === id) setSelectedHarvest(null);
      setDeletingId(null);
    } catch (error) {
      toast.error("Purge failed. Connection unstable.");
    }
  };

  const filteredHarvests = harvests.filter(h => 
    h.speciesName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.speciesNameZh && h.speciesNameZh.includes(searchTerm)) ||
    h.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="album-section" className="space-y-12 mb-20 px-4">
      {/* Search & Header Bento Block */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Harvest Archive</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Registry of Marine Bio-Data</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
          <input 
            type="text"
            placeholder="Search Registry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-slate-800 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-full md:w-80 text-white font-medium placeholder:text-slate-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-12 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="col-span-12 md:col-span-4 h-96 bg-slate-900 border border-slate-800 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : filteredHarvests.length === 0 ? (
        <div className="text-center py-32 bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-800 flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center opacity-30">
            <Fish className="w-10 h-10 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Registry Entries</p>
            <p className="text-slate-600 text-xs">Start by identifying a catch in the Capture tab.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <AnimatePresence>
            {filteredHarvests.map((harvest) => (
              <motion.div 
                key={harvest.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedHarvest(harvest)}
                className="col-span-12 md:col-span-6 lg:col-span-4 group bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 hover:border-cyan-500/30 transition-all duration-500 shadow-xl cursor-crosshair"
              >
                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src={harvest.imageUrl} 
                    alt={harvest.speciesName} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                     <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 backdrop-blur-md px-2 py-1 rounded-md border border-cyan-400/20 mb-2 inline-block">
                        {harvest.scientificName}
                     </span>
                     <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                        {harvest.speciesName}
                     </h3>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (harvest.id) handleDelete(e, harvest.id);
                    }}
                    className={cn(
                      "absolute top-4 right-4 z-30 p-4 backdrop-blur-xl border transition-all transform translate-y-2 group-hover:translate-y-0 shadow-2xl rounded-2xl",
                      deletingId === harvest.id 
                        ? "bg-red-600 text-white border-red-400 opacity-100 scale-110" 
                        : "bg-slate-950/80 text-slate-400 hover:text-white border-white/10 opacity-0 group-hover:opacity-100"
                    )}
                    title="Purge Record"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                  {harvest.speciesNameZh && (
                    <div className="space-y-1">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local Name / 中文名</span>
                       <p className="text-xl font-bold text-cyan-400/80">{harvest.speciesNameZh}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                      <Calendar className="w-3 h-3 text-cyan-500" />
                      {harvest.caughtAt?.toDate ? harvest.caughtAt.toDate().toLocaleDateString() : "Active"}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                      <MapPin className="w-3 h-3 text-cyan-500" />
                      {harvest.habitatZh || harvest.habitat}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedHarvest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHarvest(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedHarvest(null)}
                className="absolute top-6 right-6 z-10 bg-slate-950/50 backdrop-blur-xl p-3 rounded-2xl text-white border border-white/10 hover:bg-slate-800 transition-all font-black uppercase text-xs tracking-widest"
              >
                Close Portal
              </button>

              <div className="lg:w-1/2 aspect-square lg:aspect-auto overflow-hidden">
                <img 
                  src={selectedHarvest.imageUrl} 
                  alt={selectedHarvest.speciesName} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="lg:w-1/2 p-10 overflow-y-auto space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-cyan-500 text-slate-950 text-[10px] font-black rounded-md uppercase tracking-[0.2em]">Registry Entry</span>
                    <span className="text-cyan-500/60 font-mono text-xs italic">{selectedHarvest.scientificName}</span>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedHarvest.speciesName}</h2>
                    <h3 className="text-3xl font-bold text-cyan-400/60 tracking-tight">{selectedHarvest.speciesNameZh}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 border border-slate-700/30 rounded-[2rem] p-8 space-y-3 col-span-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-2 block">Marine Encyclopedia</span>
                    <div className="space-y-4">
                      <p className="text-slate-300 text-sm leading-relaxed italic">{selectedHarvest.description}</p>
                      <p className="text-slate-500 text-xs leading-relaxed">{selectedHarvest.descriptionZh}</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/30 rounded-[2rem] p-8 space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-2 block">Habitat Origin</span>
                    <p className="text-white font-black text-xl uppercase italic leading-none">{selectedHarvest.habitat}</p>
                    <p className="text-cyan-500/60 text-sm font-bold">{selectedHarvest.habitatZh}</p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/30 rounded-[2rem] p-8 space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-2 block">Registry Date</span>
                    <p className="text-white font-black text-xl uppercase italic leading-none">
                      {selectedHarvest.caughtAt?.toDate ? selectedHarvest.caughtAt.toDate().toLocaleDateString() : "Live"}
                    </p>
                    <p className="text-cyan-500/60 text-sm font-bold uppercase tracking-widest">Temporal Log</p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/10 rounded-[2rem] p-8 col-span-2 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 p-8 opacity-5 rotate-12">
                      <Fish className="w-32 h-32" />
                    </div>
                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest block mb-4">Neural Bio-Fact</span>
                    <div className="space-y-3 relative z-10">
                      <p className="text-2xl font-black text-white tracking-tight leading-tight italic">"{selectedHarvest.funFact}"</p>
                      <p className="text-slate-500 font-bold text-sm">"{selectedHarvest.funFactZh}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
