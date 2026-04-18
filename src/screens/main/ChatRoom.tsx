import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Send, Mic, X, Loader2, Users } from 'lucide-react';
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
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
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

      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
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

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const uploadVoiceNote = async (blob: Blob) => {
    if (!currentUser || !userProfile || !roomId) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `voice_notes/${roomId}/${currentUser.uid}_${Date.now()}.webm`);
      const snap = await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(snap.ref);
      await addDoc(collection(db, `chat_rooms/${roomId}/messages`), {
        roomId,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderAvatar: userProfile.avatarUrl,
        senderBadgeStatus: userProfile.badgeStatus,
        mediaUrl: url,
        type: 'voice',
        duration: recordingTime,
        createdAt: serverTimestamp(),
      });
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setIsUploading(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const shouldShowSender = (i: number) => {
    if (i === 0) return true;
    return messages[i].senderId !== messages[i - 1].senderId;
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] dark:bg-[#0D1117]">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-[#161B22] px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 shadow-sm sticky top-0 z-20">
        <Link
          to="/chats"
          className="w-9 h-9 rounded-full hover:bg-gray-50 dark:hover:bg-[#1C2128] flex items-center justify-center transition shrink-0"
        >
          <ArrowLeft size={20} className="text-[#0A1628] dark:text-gray-100" />
        </Link>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A1628] to-[#1a2f4e] flex items-center justify-center shrink-0">
          <Users size={16} className="text-[#D4A843]" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-[#0A1628] dark:text-gray-100 text-base font-display truncate">{roomName}</h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">ASF FUTO</p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-[#161B22] flex items-center justify-center mb-3 shadow-sm border border-gray-100 dark:border-gray-800">
              <Users size={24} className="text-gray-200 dark:text-gray-700" />
            </div>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Be the first to say something 👋</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUser?.uid;
          const showSender = !isMine && shouldShowSender(i);
          const ts = msg.createdAt?.toDate?.() ?? null;

          return (
            <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start', showSender ? 'mt-4' : 'mt-0.5')}>
              <div className={cn('flex items-end gap-2 max-w-[78%]', isMine ? 'flex-row-reverse' : 'flex-row')}>
                {/* Avatar */}
                {!isMine && (
                  <div className={cn('w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0', showSender ? 'opacity-100' : 'opacity-0')}>
                    {msg.senderAvatar ? (
                      <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-extrabold text-gray-400 dark:text-gray-500">
                        {msg.senderName?.charAt(0)}
                      </div>
                    )}
                  </div>
                )}

                <div className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
                  {showSender && (
                    <div className="flex items-center gap-1 mb-1 px-1">
                      <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400">{msg.senderName}</span>
                      <UserBadge status={msg.senderBadgeStatus || 'none'} />
                    </div>
                  )}

                  <div className={cn(
                    'text-sm shadow-sm overflow-hidden transition-all',
                    isMine
                      ? 'bg-[#0A1628] dark:bg-[#D4A843] text-white dark:text-[#0A1628] rounded-2xl rounded-br-md'
                      : 'bg-white dark:bg-[#1C2128] text-[#0A1628] dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-md',
                    msg.type === 'voice' ? 'p-1.5' : 'px-4 py-2.5'
                  )}>
                    {msg.type === 'voice' ? (
                      <VoiceMessage url={msg.mediaUrl} isMine={isMine} />
                    ) : (
                      <span className="leading-relaxed whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>

                  {ts && (
                    <span className="text-[9px] text-gray-300 dark:text-gray-600 font-medium mt-0.5 px-1">
                      {formatDistanceToNow(ts, { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Input ── */}
      <div className="bg-white dark:bg-[#161B22] border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {isRecording ? (
          <div className="flex items-center gap-3 bg-[#F8F9FA] dark:bg-[#1C2128] rounded-full px-5 py-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
            <span className="text-sm font-extrabold text-[#0A1628] dark:text-gray-100 tabular-nums">{fmt(recordingTime)}</span>
            <div className="flex-1 flex gap-0.5 items-center overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#D4A843] rounded-full opacity-60 animate-pulse"
                  style={{ height: `${6 + Math.sin(i * 0.8) * 8}px`, animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
            <button onClick={cancelRecording} className="p-1.5 text-gray-400 hover:text-red-500 transition shrink-0">
              <X size={18} />
            </button>
            <button
              onClick={stopRecording}
              className="w-10 h-10 rounded-full bg-[#D4A843] text-white flex items-center justify-center shadow-md shrink-0 active:scale-90 transition"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              onClick={isUploading ? undefined : startRecording}
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0',
                isUploading
                  ? 'bg-gray-50 dark:bg-[#1C2128] text-[#D4A843]'
                  : 'bg-[#F8F9FA] dark:bg-[#1C2128] text-gray-400 dark:text-gray-500 hover:text-[#D4A843]'
              )}
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-[#F8F9FA] dark:bg-[#1C2128] rounded-full py-3 px-5 text-sm font-medium text-[#0A1628] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-[#D4A843]/40 transition-all"
            />

            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-11 h-11 rounded-full bg-[#D4A843] text-white flex items-center justify-center disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 transition-all active:scale-90 shadow-md shadow-[#D4A843]/20 shrink-0"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
