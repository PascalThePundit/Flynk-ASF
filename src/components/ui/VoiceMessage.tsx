import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceMessageProps {
  url: string;
  isMine: boolean;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ url, isMine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 px-2 py-1 min-w-[160px]`}>
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMine ? 'bg-white/20 text-white' : 'bg-[#D4A843] text-white'}`}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Simple Waveform Placeholder */}
        <div className="flex items-center gap-[2px] h-6">
           {[...Array(15)].map((_, i) => (
             <div 
               key={i} 
               className={`w-1 rounded-full transition-all ${isMine ? 'bg-white/40' : 'bg-gray-200'} ${isPlaying ? 'animate-pulse' : ''}`}
               style={{ height: `${20 + Math.random() * 60}%` }}
             />
           ))}
        </div>
        <div className={`text-[10px] font-bold ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
          {isPlaying ? formatTime(currentTime) : formatTime(duration)}
        </div>
      </div>
      
      <Volume2 className={`w-4 h-4 ${isMine ? 'text-white/40' : 'text-gray-300'}`} />
    </div>
  );
};
