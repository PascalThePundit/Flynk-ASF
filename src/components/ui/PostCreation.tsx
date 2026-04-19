import React, { useState, useRef } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { X, Image as ImageIcon, Send, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PostCreationProps {
  onClose: () => void;
}

export const PostCreation: React.FC<PostCreationProps> = ({ onClose }) => {
  const { userProfile, currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!currentUser) {
      alert("You must be logged in to post.");
      return;
    }
    if (!userProfile) {
      alert("Your profile is still loading. Please try again in a moment.");
      return;
    }
    if (!content.trim() && !selectedImage) {
      alert("Please add some text or an image to your post.");
      return;
    }
    
    setLoading(true);

    try {
      let mediaUrl = null;
      if (selectedImage) {
        console.log("Uploading image to storage...");
        const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${selectedImage.name}`);
        const uploadTask = await uploadBytes(storageRef, selectedImage);
        mediaUrl = await getDownloadURL(uploadTask.ref);
        console.log("Image uploaded successfully:", mediaUrl);
      }

      console.log("Saving post to Firestore...");
      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        userName: userProfile.name,
        userAvatar: userProfile.avatarUrl,
        userBadge: userProfile.badgeStatus,
        content: content.trim(),
        mediaUrl,
        createdAt: serverTimestamp(),
        likes: []
      });
      console.log("Post saved successfully!");
      // Small delay to prevent snapshot race conditions
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error("CRITICAL ERROR creating post:", err);
      alert(`Post failed: ${err.message || "Unknown database error"}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-reveal">
      <div className="glass dark:bg-white/5 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/40 dark:border-white/5 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-[1.2rem] bg-brand/10 flex items-center justify-center">
                <Sparkles className="text-brand w-5 h-5" />
             </div>
             <div>
                <h2 className="text-xl font-black text-navy dark:text-white tracking-tight">Share Word</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Post to Fellowship</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full glass border-none flex items-center justify-center hover:bg-white transition-all active-scale">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What has the Lord done today?"
              className="w-full min-h-[160px] bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-[1.8rem] p-6 text-navy dark:text-white font-medium outline-none focus:ring-4 focus:ring-brand/10 transition-all resize-none placeholder:text-gray-300"
            />
            <div className="absolute bottom-4 right-6 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
               {content.length} characters
            </div>
          </div>

          {imagePreview && (
            <div className="relative rounded-[2rem] overflow-hidden border border-white/40 shadow-xl aspect-video group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute top-4 right-4 w-8 h-8 glass border-none text-navy rounded-full flex items-center justify-center shadow-lg active-scale"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 px-6 py-3 rounded-full glass border-brand/20 text-brand hover:bg-brand hover:text-white transition-all font-black text-xs active-scale"
            >
              <ImageIcon size={18} />
              <span>Attach Image</span>
            </button>
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />

            <button 
              onClick={handlePost}
              disabled={loading || (!content.trim() && !selectedImage)}
              className="flex items-center gap-3 px-10 py-4 bg-navy dark:bg-brand text-white rounded-[1.5rem] font-black shadow-2xl shadow-brand/20 disabled:opacity-30 disabled:grayscale transition-all active-scale"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} />}
              <span>Post to Feed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
