import React, { useState, useRef } from "react";
import { Camera, Upload, Loader2, Sparkles, Waves, Fish } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { identifySpecies, SpeciesInfo } from "../services/geminiService";
import { firebaseService } from "../services/firebaseService";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";

interface CaptureProps {
  onHarvestAdded: () => void;
}

export default function Capture({ onHarvestAdded }: CaptureProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<SpeciesInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const [isEditing, setIsEditing] = useState(false);

  const handleIdentify = async () => {
    if (!preview) return;
    setIsIdentifying(true);
    try {
      // Compress image before sending to Gemini
      const compressed = await compressImage(preview);
      const info = await identifySpecies(compressed);
      setPreview(compressed);
      setResult(info);
      setIsEditing(false); // Reset edit mode on new scan
      toast.success("Species identified!");
    } catch (error: any) {
      console.error(error);
      const message = error.message || "Failed to identify species. Please try again.";
      toast.error(message);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleSave = async () => {
    if (!result || !preview) return;
    try {
      await firebaseService.addHarvest({
        speciesName: result.name,
        speciesNameZh: result.nameZh,
        scientificName: result.scientificName,
        description: result.description,
        descriptionZh: result.descriptionZh,
        habitat: result.habitat,
        habitatZh: result.habitatZh,
        funFact: result.funFact,
        funFactZh: result.funFactZh,
        imageUrl: preview,
        isPublic: false,
      });
      toast.success("Saved to Harvest Album!");
      setFile(null);
      setPreview(null);
      setResult(null);
      setIsEditing(false);
      onHarvestAdded();
    } catch (error) {
      console.error(error);
      toast.error("Cloud storage limit exceeded or network error.");
    }
  };

  const updateResultField = (field: keyof SpeciesInfo, value: string) => {
    if (!result) return;
    setResult({ ...result, [field]: value });
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to process image."));
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 768; 
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Optimized for mobile upload speed while maintaining recognition detail
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  return (
    <div id="capture-grid" className="grid grid-cols-12 gap-6 mb-12">
      {/* Upload/Preview Block */}
      <div 
        className={cn(
          "col-span-12 lg:col-span-5 bg-slate-900 border-2 border-dashed border-cyan-500/20 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[550px] overflow-hidden transition-all group relative",
          !preview && "hover:border-cyan-500/50 hover:bg-cyan-500/5 cursor-pointer"
        )}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <button 
                id="change-photo-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setFile(null);
                  setResult(null);
                }}
                className="absolute top-6 right-6 bg-slate-950/50 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 hover:bg-red-500/50 transition-all z-10"
              >
                <div className="text-white text-[10px] font-black uppercase tracking-widest">Discard Patch</div>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8 p-12"
            >
              <div className="w-24 h-24 rounded-3xl bg-cyan-500/10 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                <Camera className="w-10 h-10 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Identify Biome</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">System ready for bio-signature detection. Upload species visual data.</p>
              </div>
              <button id="upload-trigger" className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-cyan-500 transition-all active:scale-95">
                Target Payload
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      {/* Info/Stats Area */}
      <div className="col-span-12 lg:col-span-7 space-y-6">
        {!result && preview && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-8 group"
          >
            <div className="w-24 h-24 bg-cyan-500/5 border border-cyan-500/20 rounded-full flex items-center justify-center relative">
               <div className="absolute inset-0 border-2 border-cyan-500/40 rounded-full animate-ping opacity-20"></div>
               <Sparkles className="w-10 h-10 text-cyan-400 group-hover:scale-125 transition-transform" />
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">Bio-Stream Ready</h3>
              <p className="text-slate-500 text-lg font-medium max-w-sm">Neural network standby. Ready to process deep-sea identification.</p>
            </div>
            <button 
              id="identify-btn"
              onClick={handleIdentify}
              disabled={isIdentifying}
              className="w-full max-w-sm bg-cyan-500 text-slate-950 py-6 rounded-2xl font-black text-xl uppercase tracking-tighter shadow-[0_15px_40px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isIdentifying ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Decoding...
                </div>
              ) : "Initialize Scan"}
            </button>
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full space-y-6"
          >
            {/* Header Bento Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col sm:flex-row justify-between items-start gap-8">
               <div className="space-y-6 w-full">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-cyan-500 text-slate-950 text-[10px] font-black rounded-md uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(6,182,212,0.3)]">Signature Match</span>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={result.scientificName}
                          onChange={(e) => updateResultField('scientificName', e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-cyan-500/60 font-mono text-xs tracking-tighter w-full max-w-[200px] outline-none focus:border-cyan-500"
                        />
                      ) : (
                        <span className="text-cyan-500/60 font-mono text-xs tracking-tighter">{result.scientificName}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-cyan-500/50 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      {isEditing ? "Lock Registry" : "Manual Override"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={result.name}
                          onChange={(e) => updateResultField('name', e.target.value)}
                          className="w-full bg-slate-800 border-2 border-cyan-500/30 rounded-xl px-4 py-3 text-2xl font-black text-white leading-none uppercase tracking-tighter focus:border-cyan-500 transition-all outline-none"
                          placeholder="Name (EN)"
                        />
                        <input 
                          type="text" 
                          value={result.nameZh}
                          onChange={(e) => updateResultField('nameZh', e.target.value)}
                          className="w-full bg-slate-800 border-2 border-cyan-500/30 rounded-xl px-4 py-3 text-xl font-bold text-cyan-400/60 focus:border-cyan-500 transition-all outline-none"
                          placeholder="Name (ZH)"
                        />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-5xl font-black text-white leading-none uppercase tracking-tighter italic">{result.name}</h2>
                        <h3 className="text-3xl font-bold text-cyan-400/60 tracking-tight">{result.nameZh}</h3>
                      </>
                    )}
                  </div>
               </div>
               {!isEditing && (
                <button 
                  onClick={handleSave}
                  className="bg-white text-slate-950 p-8 rounded-[2rem] hover:bg-cyan-500 hover:scale-105 transition-all shadow-2xl group border-[6px] border-slate-900 shrink-0"
                  title="Archive Entry"
                >
                  <Sparkles className="w-8 h-8 group-hover:rotate-45 transition-transform" />
                </button>
               )}
            </div>

            {/* Info Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 space-y-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800 pb-2 block">Registry Introduction</span>
                  <div className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <textarea 
                          value={result.description}
                          onChange={(e) => updateResultField('description', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm leading-relaxed min-h-[100px] focus:border-cyan-500 transition-all resize-none outline-none"
                          placeholder="Introduction (EN)"
                        />
                        <textarea 
                          value={result.descriptionZh}
                          onChange={(e) => updateResultField('descriptionZh', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-500 text-xs leading-relaxed min-h-[80px] focus:border-cyan-500 transition-all resize-none outline-none"
                          placeholder="Introduction (ZH)"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-300 text-sm leading-relaxed italic">{result.description}</p>
                        <p className="text-slate-500 text-xs leading-relaxed">{result.descriptionZh}</p>
                      </>
                    )}
                  </div>
               </div>
               
               <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 space-y-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800 pb-2 block">Thermal Habitat</span>
                  <div className="space-y-2">
                    <p className="text-white font-black text-xl uppercase italic leading-none">{result.habitat}</p>
                    <p className="text-cyan-500/60 text-md font-bold">{result.habitatZh}</p>
                  </div>
               </div>

               <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-10 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                    <Waves className="w-40 h-40" />
                  </div>
                  <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest block mb-4">Neural Fact Check</span>
                  <div className="space-y-3 relative z-10">
                    <p className="text-2xl font-black text-white tracking-tight leading-tight group-hover:text-cyan-400 transition-colors">"{result.funFact}"</p>
                    <p className="text-slate-500 font-bold text-sm">"{result.funFactZh}"</p>
                  </div>
               </div>
            </div>

            <div className="pt-4">
              <button 
                id="add-to-harvest-bottom-btn"
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 py-6 rounded-3xl font-black text-xl uppercase tracking-tighter shadow-[0_20px_40px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Fish className="w-6 h-6" />
                Add to my harvest
              </button>
            </div>
          </motion.div>
        )}

        {!preview && (
          <div className="h-full bg-slate-900/30 border border-slate-800 border-dashed rounded-[3rem] flex flex-col items-center justify-center p-12 text-center group">
             <div className="space-y-4 opacity-20 group-hover:opacity-100 transition-all duration-700">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                  <Fish className="w-8 h-8 text-slate-500 group-hover:text-cyan-500 transition-colors" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Awaiting Signature</h4>
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-700">Sector: Coastal • Status: Idle</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
