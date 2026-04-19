import React, { useState, useRef } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { X, Image as ImageIcon, Type, Send, Loader2, Sparkles, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StoryCreationProps {
  onClose: () => void;
}

export const StoryCreation: React.FC<StoryCreationProps> = ({ onClose }) => {
  const { userProfile, currentUser } = useAuth();
  const [type, setType] = useState<'selection' | 'text' | 'image'>('selection');
  const [loading, setLoading] = useState(false);
  
  const [textContent, setTextContent] = useState('');
  const [bgColor, setBgColor] = useState('#007AFF'); // Brand Blue default
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    '#007AFF', // brand blue
    '#001A33', // navy
    '#FFD700', // gold
    '#FF3B30', // ios red
    '#34C759', // ios green
    '#5856D6', // ios indigo
    '#FF9500'  // ios orange
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!currentUser) {
      alert("You must be logged in to post a story.");
      return;
    }
    if (!userProfile) {
      alert("Your profile is still loading. Please try again in a moment.");
      return;
    }
    if (type === 'text' && !textContent.trim()) {
      alert("Please enter some text for your story.");
      return;
    }

    setLoading(true);

    try {
      let mediaUrl = '';
      if (type === 'image' && selectedImage) {
        console.log("Uploading story image to storage...");
        const storageRef = ref(storage, `stories/${currentUser.uid}/${Date.now()}_${selectedImage.name}`);
        const uploadTask = await uploadBytes(storageRef, selectedImage);
        mediaUrl = await getDownloadURL(uploadTask.ref);
        console.log("Story image uploaded successfully:", mediaUrl);
      }

      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); 

      console.log("Saving story to Firestore...");
      await addDoc(collection(db, 'stories'), {
        userId: currentUser.uid,
        userName: userProfile.name,
        userAvatar: userProfile.avatarUrl,
        userBadge: userProfile.badgeStatus,
        type: type === 'image' ? 'image' : 'text',
        mediaUrl: mediaUrl || null,
        textContent: type === 'text' ? textContent : null,
        backgroundColor: type === 'text' ? bgColor : null,
        createdAt: serverTimestamp(),
        expiresAt,
        viewers: []
      });
      console.log("Story saved successfully!");
      onClose();
    } catch (err: any) {
      console.error("CRITICAL ERROR creating story:", err);
      alert(`Story failed: ${err.message || "Unknown database error"}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col animate-reveal overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 inset-x-0 glass border-none px-6 py-8 flex justify-between items-center z-10">
        <button onClick={onClose} className="w-12 h-12 rounded-full glass border-none flex items-center justify-center text-white active-scale">
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
           <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">Story Studio</h2>
           <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse mt-1" />
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {type === 'selection' && (
          <div className="grid grid-cols-2 gap-6 w-full max-w-sm animate-reveal">
            <button 
              onClick={() => setType('text')}
              className="aspect-[4/5] rounded-[2.5rem] glass dark:bg-white/5 border border-white/20 flex flex-col items-center justify-center gap-4 active-scale group shadow-2xl"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-brand flex items-center justify-center text-white shadow-xl shadow-brand/20 group-hover:scale-110 transition-transform">
                <Type className="w-7 h-7" />
              </div>
              <span className="font-black text-white text-xs uppercase tracking-widest">Text Word</span>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[4/5] rounded-[2.5rem] glass dark:bg-white/5 border border-white/20 flex flex-col items-center justify-center gap-4 active-scale group shadow-2xl"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-navy border border-white/10 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                <ImageIcon className="w-7 h-7 text-gold" />
              </div>
              <span className="font-black text-white text-xs uppercase tracking-widest">Visual Word</span>
            </button>
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />
          </div>
        )}

        {type === 'text' && (
          <div className="w-full h-full flex flex-col items-center justify-center relative py-20 animate-reveal">
            <div 
              className="w-full aspect-[9/16] max-w-[320px] rounded-[3rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl border-[8px] border-white/10 relative overflow-hidden"
              style={{ backgroundColor: bgColor }}
            >
              {/* Abstract Glass Glow */}
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/20 blur-3xl rounded-full" />
              
              <textarea 
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Declare His glory..."
                maxLength={180}
                autoFocus
                className="w-full bg-transparent border-none outline-none text-white text-2xl md:text-3xl font-black placeholder:text-white/20 text-center resize-none z-10 leading-tight"
              />
            </div>
            
            <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-6">
               <div className="flex gap-3 overflow-x-auto w-full max-w-sm px-10 pb-2 scrollbar-hide justify-center">
                  {colors.map(c => (
                    <button 
                      key={c}
                      onClick={() => setBgColor(c)}
                      className={cn(
                        "w-10 h-10 rounded-full shrink-0 border-2 transition-all active-scale",
                        bgColor === c ? "border-white scale-125 shadow-lg" : "border-transparent opacity-60"
                      )}
                      style={{ backgroundColor: c }}
                    >
                       {bgColor === c && <Check className="w-4 h-4 text-white mx-auto" strokeWidth={4} />}
                    </button>
                  ))}
               </div>
               
               <button 
                 onClick={handleUpload}
                 disabled={loading || !textContent.trim()}
                 className="flex items-center gap-3 px-12 py-5 bg-white text-navy rounded-[2rem] font-black text-sm shadow-2xl active-scale disabled:opacity-30 group"
               >
                 {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                   <>
                     <span>Share to Fellowship</span>
                     <Sparkles className="w-5 h-5 text-brand" />
                   </>
                 )}
               </button>
            </div>
          </div>
        )}

        {type === 'image' && imagePreview && (
          <div className="w-full h-full flex flex-col items-center justify-center py-20 animate-reveal">
            <div className="w-full aspect-[9/16] max-w-[340px] rounded-[3rem] bg-gray-900 shadow-2xl overflow-hidden border-[8px] border-white/10 relative group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              
              <button 
                onClick={() => { setSelectedImage(null); setImagePreview(null); setType('selection'); }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 glass border-white/20 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest active-scale"
              >
                Retake Visual
              </button>
            </div>

            <div className="mt-12">
               <button 
                 onClick={handleUpload}
                 disabled={loading}
                 className="flex items-center gap-3 px-14 py-5 bg-brand text-white rounded-[2rem] font-black text-sm shadow-2xl shadow-brand/40 active-scale group"
               >
                 {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                   <>
                     <span>Post Visual Story</span>
                     <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   </>
                 )}
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
