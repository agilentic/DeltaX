
import React, { useState } from 'react';
import { generateImagePro, editImageFlash, generateVideoVeo, analyzeMedia, thinkMore, fastChat } from '../services/gemini';

const AILab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visualize' | 'modify' | 'direct' | 'think' | 'oracle'>('think');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const res = re.target?.result as string;
        setMediaFile(res.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecute = async () => {
    if (!prompt && activeTab !== 'oracle') return;
    setLoading(true);
    setResult(null);
    try {
      if (activeTab === 'visualize') {
        const url = await generateImagePro(prompt, imageSize);
        setResult(url);
      } else if (activeTab === 'modify' && mediaFile) {
        const url = await editImageFlash(mediaFile, 'image/png', prompt);
        setResult(url);
      } else if (activeTab === 'direct') {
        const url = await generateVideoVeo(prompt, mediaFile || undefined, aspectRatio);
        setResult(url);
      } else if (activeTab === 'think') {
        const txt = await thinkMore(prompt);
        setResult(txt);
      } else if (activeTab === 'oracle' && mediaFile) {
        const txt = await analyzeMedia(mediaFile, 'image/png', prompt || "Analyze this image for mathematical patterns.");
        setResult(txt);
      }
    } catch (err: any) {
      alert("Neural Link Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-fade-in">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">AI Neural Lab</h1>
        <p className="text-gray-500">The cutting edge of multimodal mathematical synthesis.</p>
      </header>

      <div className="flex justify-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit mx-auto">
        {[
          { id: 'think', label: 'Reason', icon: '🧠' },
          { id: 'visualize', label: 'Imagine', icon: '🎨' },
          { id: 'modify', label: 'Edit', icon: '✨' },
          { id: 'direct', label: 'Animate', icon: '🎬' },
          { id: 'oracle', label: 'Analyze', icon: '👁️' }
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setResult(null); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      <div className="apple-card apple-shadow p-8 bg-white space-y-6">
        <div className="space-y-4">
          <textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            placeholder={activeTab === 'think' ? "Describe a complex mathematical paradox to analyze..." : "Enter neural command..."}
            className="w-full h-32 p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none resize-none font-medium" 
          />
          
          {(activeTab === 'modify' || activeTab === 'oracle' || activeTab === 'direct') && (
            <div className="p-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center space-y-4 bg-gray-50">
              <input type="file" id="media-upload" hidden onChange={handleFileUpload} accept="image/*,video/*" />
              <label htmlFor="media-upload" className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold cursor-pointer hover:bg-gray-100 transition-all">Upload Reference Media</label>
              {mediaFile && <p className="text-[10px] text-green-500 font-bold uppercase">Ready for Synthesis</p>}
            </div>
          )}

          {activeTab === 'visualize' && (
             <div className="flex gap-4">
                {['1K', '2K', '4K'].map(s => (
                  <button key={s} onClick={() => setImageSize(s as any)} className={`flex-1 py-3 rounded-xl border-2 font-bold ${imageSize === s ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}>{s}</button>
                ))}
             </div>
          )}

          {activeTab === 'direct' && (
             <div className="flex gap-4">
                {['16:9', '9:16'].map(r => (
                  <button key={r} onClick={() => setAspectRatio(r as any)} className={`flex-1 py-3 rounded-xl border-2 font-bold ${aspectRatio === r ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}>{r === '16:9' ? 'Landscape' : 'Portrait'}</button>
                ))}
             </div>
          )}
        </div>

        <button onClick={handleExecute} disabled={loading} className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
          {loading ? 'Processing Neural Commands...' : 'Execute Synthesis'}
        </button>
      </div>

      {result && (
        <div className="apple-card apple-shadow p-8 bg-white animate-fade-in border border-gray-100">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Output Stream</p>
           {result.startsWith('data:') || result.startsWith('blob:') ? (
             activeTab === 'direct' ? <video src={result} controls className="w-full rounded-2xl shadow-lg" /> : <img src={result} className="w-full rounded-2xl shadow-lg" alt="Neural result" />
           ) : (
             <div className="prose prose-blue max-w-none">
               <p className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium">{result}</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default AILab;
