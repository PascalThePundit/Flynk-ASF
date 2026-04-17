import React, { useState, useRef } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { X, Image as ImageIcon, Send, Loader2 } from 'lucide-react';

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
    if (!currentUser || !userProfile || (!content.trim() && !selectedImage)) return;
    setLoading(true);

    try {
      let mediaUrl = null;
      if (selectedImage) {
        const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${selectedImage.name}`);
        const uploadTask = await uploadBytes(storageRef, selectedImage);
        mediaUrl = await getDownloadURL(uploadTask.ref);
      }

      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        userName: userProfile.name,
        userAvatar: userProfile.avatarUrl,
        userBadge: userProfile.badgeStatus,
        content: content.trim(),
        mediaUrl,
        createdAt: Date.now(),
        likes: []
      });

      onClose();
    } catch (err) {
      console.error("Error creating post", err);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden animate-in slide-in-from-bottom-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#0A1628] font-display">Create Post</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in fellowship?"
            className="w-full min-h-[120px] bg-gray-50 rounded-2xl p-4 text-[#0A1628] font-medium outline-none focus:ring-2 focus:ring-[#D4A843] transition-all resize-none"
          />

          {imagePreview && (
            <div className="relative rounded-2xl overflow-hidden border border-gray-100 aspect-video">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-md"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all font-bold text-sm"
            >
              <ImageIcon size={18} className="text-[#D4A843]" />
              <span>Photo</span>
            </button>
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />

            <button 
              onClick={handlePost}
              disabled={loading || (!content.trim() && !selectedImage)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0A1628] text-white rounded-full font-bold shadow-lg shadow-[#0A1628]/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={18} />}
              <span>Post</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
