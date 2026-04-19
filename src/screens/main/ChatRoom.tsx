import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Send, Mic, X, Loader2, Users, Info } from 'lucide-react';
import { UserBadge } from '../../components/ui/UserBadge';
import { VoiceMessage } from '../../components/ui/VoiceMessage';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const ChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { userProfile, currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomName, setRoomName] = useState('...');
  const bottomRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roomId) return;
    if (roomId === 'general_chat_room') {
      setRoomName('General Fellowship');
    } else {
      getDoc(doc(db, 'forums', roomId)).then(snap => {
        setRoomName(snap.exists() ? snap.data().name : 'Forum Chat');
      });
    }

    const q = query(collection(db, `chat_rooms/${roomId}/messages`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => {
        const data = d.data({ serverTimestamps: 'estimate' });
        return { id: d.id, ...data };
      }));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      console.error("ChatRoom listener error:", error);
    });
  }, [roomId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = newMessage.trim();
    if (!msg || !userProfile || !currentUser || !roomId) return;
    setNewMessage('');
    await addDoc(collection(db, `chat_rooms/${roomId}/messages`), {
      roomId,
      senderId: currentUser.uid,
      senderName: userProfile.name,
      senderAvatar: userProfile.avatarUrl,
      senderBadgeStatus: userProfile.badgeStatus,
      content: msg,
      type: 'text',
      createdAt: serverTimestamp(),
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await uploadVoiceNote(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      alert('Microphone access denied.');
    }
  };

  const uploadVoiceNote = async (blob: Blob) => {
    if (!currentUser || !userProfile || !roomId) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `voice_notes/${roomId}/${currentUser.uid}_${Date.now()}.webm`);
      const snap = await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(snap.ref);
      await addDoc(collection(db, `chat_rooms/${roomId}/messages`), {
        roomId, senderId: currentUser.uid, senderName: userProfile.name,
        senderAvatar: userProfile.avatarUrl, senderBadgeStatus: userProfile.badgeStatus,
        mediaUrl: url, type: 'voice', duration: recordingTime, createdAt: serverTimestamp(),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F2F2F7] dark:bg-black animate-reveal">
      {/* Premium iOS Header */}
      <div className="glass px-4 py-4 border-b border-white/20 flex items-center gap-3 sticky top-0 z-30">
        <Link to="/chats" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition active-scale">
          <ArrowLeft size={20} className="text-navy dark:text-white" />
        </Link>

        <div className="w-10 h-10 rounded-[1.2rem] bg-gradient-to-tr from-brand to-navy flex items-center justify-center shrink-0 shadow-lg">
          <Users size={18} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-black text-navy dark:text-white text-base tracking-tight truncate">{roomName}</h2>
          <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Session</span>
          </div>
        </div>

        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-brand transition active-scale">
          <Info size={20} />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUser?.uid;
          const showSender = !isMine && (i === 0 || messages[i-1].senderId !== msg.senderId);
          const ts = msg.createdAt?.toDate?.() || null;

          return (
            <div key={msg.id} className={cn('flex flex-col animate-reveal', isMine ? 'items-end' : 'items-start')}>
              {showSender && (
                <div className="flex items-center gap-1.5 mb-1 mt-3 px-1">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{msg.senderName}</span>
                   <UserBadge status={msg.senderBadgeStatus} size={10} />
                </div>
              )}
              
              <div className={cn('flex items-end gap-2 max-w-[85%]', isMine && 'flex-row-reverse')}>
                {!isMine && (
                  <div className={cn('w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-white', !showSender && 'opacity-0')}>
                    {msg.senderAvatar ? <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                  </div>
                )}
                
                <div className={cn(
                  'px-4 py-2.5 shadow-sm text-sm font-medium',
                  isMine 
                    ? 'bg-brand text-white rounded-[1.5rem] rounded-tr-none' 
                    : 'bg-white dark:bg-white/10 text-navy dark:text-white rounded-[1.5rem] rounded-tl-none border border-black/5 dark:border-white/5',
                  msg.type === 'voice' && 'p-1.5'
                )}>
                  {msg.type === 'voice' ? <VoiceMessage url={msg.mediaUrl} isMine={isMine} /> : <p className="leading-relaxed">{msg.content}</p>}
                </div>
              </div>
              
              {ts && <span className="text-[8px] font-bold text-gray-400 mt-1 px-1 opacity-60">{formatDistanceToNow(ts, { addSuffix: true })}</span>}
            </div>
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Floating Input Bar */}
      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="glass px-2 py-2 rounded-[2rem] border border-white/40 dark:border-white/5 shadow-2xl flex items-center gap-2">
          <button 
            type="button" 
            onMouseDown={startRecording}
            onMouseUp={() => { mediaRecorder?.stop(); setIsRecording(false); if (timerRef.current) clearInterval(timerRef.current); }}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all active-scale",
              isRecording ? "bg-red-500 text-white animate-pulse shadow-lg" : "text-gray-400 hover:text-brand"
            )}
          >
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Mic size={22} />}
          </button>

          {isRecording ? (
             <div className="flex-1 flex items-center gap-3 px-4">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-black text-navy dark:text-white tabular-nums">Recording {recordingTime}s</span>
                <div className="flex-1 h-1 bg-brand/10 rounded-full overflow-hidden">
                   <div className="h-full bg-brand animate-reveal" style={{ width: `${(recordingTime % 10) * 10}%` }} />
                </div>
             </div>
          ) : (
            <input 
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(e as any)}
              placeholder="Message..."
              className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-bold text-navy dark:text-white placeholder:text-gray-400"
            />
          )}

          <button 
            onClick={handleSend}
            disabled={!newMessage.trim() && !isRecording}
            className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 active-scale disabled:opacity-30 disabled:grayscale transition-all"
          >
            <Send size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
