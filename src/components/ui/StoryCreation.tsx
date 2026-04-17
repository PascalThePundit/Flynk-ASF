import React, { useState, useRef } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { X, Image as ImageIcon, Type, Send, Loader2 } from 'lucide-react';

interface StoryCreationProps {
  onClose: () => void;
}

export const StoryCreation: React.FC<StoryCreationProps> = ({ onClose }) => {
  const { userProfile, currentUser } = useAuth();
  const [type, setType] = useState<'selection' | 'text' | 'image'>('selection');
  const [loading, setLoading] = useState(false);
  
  // Text story state
  const [textContent, setTextContent] = useState('');
  const [bgColor, setBgColor] = useState('#0A1628');
  
  // Image story state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = ['#0A1628', '#D4A843', '#E63946', '#457B9D', '#1D3557', '#06D6A0', '#FFD166'];

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
    if (!currentUser || !userProfile) return;
    setLoading(true);

    try {
      let mediaUrl = '';
      if (type === 'image' && selectedImage) {
        const storageRef = ref(storage, `stories/${currentUser.uid}/${Date.now()}_${selectedImage.name}`);
        const uploadTask = await uploadBytes(storageRef, selectedImage);
        mediaUrl = await getDownloadURL(uploadTask.ref);
      }

      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

      await addDoc(collection(db, 'stories'), {
        userId: currentUser.uid,
        userName: userProfile.name,
        userAvatar: userProfile.avatarUrl,
        userBadge: userProfile.badgeStatus,
        type: type === 'image' ? 'image' : 'text',
        mediaUrl: mediaUrl || null,
        textContent: type === 'text' ? textContent : null,
        backgroundColor: type === 'text' ? bgColor : null,
        createdAt: Date.now(),
        expiresAt,
        viewers: []
      });

      onClose();
    } catch (err) {
      console.error("Error creating story", err);
      alert("Failed to post story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-white font-display">Create Story</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {type === 'selection' && (
          <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
            <button 
              onClick={() => setType('text')}
              className="aspect-square rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-[#D4A843] flex items-center justify-center text-white shadow-lg shadow-[#D4A843]/20 group-hover:scale-110 transition-transform">
                <Type className="w-6 h-6" />
              </div>
              <span className="font-bold text-white text-sm">Text Story</span>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-[#0A1628] border border-white/20 flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-white text-sm">Image Story</span>
            </button>
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />
          </div>
        )}

        {type === 'text' && (
          <div className="w-full h-full flex flex-col items-center justify-center relative py-10">
            <div 
              className="w-full aspect-[9/16] max-w-[280px] md:max-w-[320px] rounded-[2rem] p-8 flex items-center justify-center text-center shadow-2xl overflow-hidden transition-all duration-500"
              style={{ backgroundColor: bgColor }}
            >
              <textarea 
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={200}
                className="w-full bg-transparent border-none outline-none text-white text-xl md:text-2xl font-bold placeholder:text-white/30 text-center resize-none h-auto"
                style={{ height: 'auto' }}
              />
            </div>
            
            <div className="flex gap-3 mt-8 overflow-x-auto w-full max-w-sm px-4 pb-2 scrollbar-hide justify-center">
              {colors.map(c => (
                <button 
                  key={c}
                  onClick={() => setBgColor(c)}
                  className={`w-10 h-10 rounded-full shrink-0 border-2 ${bgColor === c ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {type === 'image' && imagePreview && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full aspect-[9/16] max-w-[320px] rounded-[2rem] bg-gray-800 shadow-2xl overflow-hidden border border-white/10">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => { setSelectedImage(null); setImagePreview(null); setType('selection'); }}
              className="mt-6 text-white/50 font-bold text-sm hover:text-white transition-colors"
            >
              Choose different image
            </button>
          </div>
        )}
      </div>

      {(type === 'text' || type === 'image') && (
        <div className="mt-8 flex justify-center pb-8">
           <button 
             onClick={handleUpload}
             disabled={loading || (type === 'text' && !textContent.trim())}
             className="flex items-center gap-3 px-10 py-4 bg-[#D4A843] text-[#0A1628] rounded-2xl font-extrabold shadow-xl shadow-[#D4A843]/20 disabled:opacity-50 transition-all active:scale-95 group"
           >
             {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
               <>
                 <span>Share to Story</span>
                 <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               </>
             )}
           </button>
        </div>
      )}
    </div>
  );
};
