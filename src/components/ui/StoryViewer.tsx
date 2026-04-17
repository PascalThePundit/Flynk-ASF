import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserBadge } from './UserBadge';
import type { Story } from '../../types';

interface StoryViewerProps {
  stories: Story[];
  userName: string;
  userAvatar?: string | null;
  onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, userName, userAvatar, onClose }) => {
  const { currentUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    // Mark as seen
    if (currentUser && currentStory && !currentStory.viewers.includes(currentUser.uid)) {
      const storyRef = doc(db, 'stories', currentStory.id);
      updateDoc(storyRef, {
        viewers: arrayUnion(currentUser.uid)
      });
    }

    // Progress bar logic
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 100;
        }
        return prev + 1;
      });
    }, 50); // 5 seconds total (50ms * 100)

    return () => clearInterval(interval);
  }, [currentIndex, currentStory?.id]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-white/20">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                {userName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col">
             <div className="flex items-center gap-1">
               <span className="text-white font-bold text-sm">{userName}</span>
               <UserBadge status={currentStory.userBadge} />
             </div>
             <span className="text-white/60 text-[10px] font-medium">Active Story</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative w-full max-w-[450px] mx-auto overflow-hidden">
        {/* Navigation Areas */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
        </div>

        {currentStory.type === 'image' ? (
          <img src={currentStory.mediaUrl} alt="Story" className="w-full h-full object-cover rounded-md md:rounded-3xl" />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center p-12 text-center rounded-md md:rounded-3xl shadow-2xl"
            style={{ backgroundColor: currentStory.backgroundColor }}
          >
            <h2 className="text-3xl font-extrabold text-white leading-tight font-display">
              {currentStory.textContent}
            </h2>
          </div>
        )}
      </div>

      {/* Footer / View Count (Simple) */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center">
         <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full text-white/60 text-xs font-bold border border-white/10">
           {currentStory.viewers.length} views
         </div>
      </div>
    </div>
  );
};
