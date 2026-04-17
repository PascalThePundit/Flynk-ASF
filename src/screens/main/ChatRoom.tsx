import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Send, Mic, X, Loader2 } from 'lucide-react';
import { UserBadge } from '../../components/ui/UserBadge';
import { VoiceMessage } from '../../components/ui/VoiceMessage';

export const ChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { userProfile, currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomName, setRoomName] = useState('Loading...');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId) return;

    // Get Room Info
    if (roomId === 'general_chat_room') {
      setRoomName('General Fellowship');
    } else {
      getDoc(doc(db, 'forums', roomId)).then(snap => {
        if (snap.exists()) setRoomName(snap.data().name);
        else setRoomName('Forum Chat');
      });
    }

    // Listen to messages
    const q = query(collection(db, `chat_rooms/${roomId}/messages`), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [roomId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile || !currentUser || !roomId) return;
    
    const msg = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, `chat_rooms/${roomId}/messages`), {
        roomId,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderAvatar: userProfile.avatarUrl,
        senderBadgeStatus: userProfile.badgeStatus,
        content: msg,
        type: 'text',
        createdAt: serverTimestamp()
      });
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch(err) {
      console.error("Error sending message", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await uploadVoiceNote(audioBlob);
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
      setAudioChunks([]);
    }
  };

  const uploadVoiceNote = async (blob: Blob) => {
    if (!currentUser || !userProfile || !roomId) return;
    setIsUploading(true);

    try {
      const fileName = `voice_notes/${roomId}/${currentUser.uid}_${Date.now()}.webm`;
      const storageRef = ref(storage, fileName);
      const uploadTask = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(uploadTask.ref);

      await addDoc(collection(db, `chat_rooms/${roomId}/messages`), {
        roomId,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderAvatar: userProfile.avatarUrl,
        senderBadgeStatus: userProfile.badgeStatus,
        mediaUrl: downloadURL,
        type: 'voice',
        duration: recordingTime,
        createdAt: serverTimestamp()
      });
      
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error("Error uploading voice note:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] relative">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-20 border-b border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/chats" className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#0A1628]" />
          </Link>
          <h2 className="font-display font-extrabold text-lg text-[#0A1628]">{roomName}</h2>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map(msg => {
          const isMine = msg.senderId === currentUser?.uid;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-2 max-w-[80%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {!isMine && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 flex-col mb-1">
                    {msg.senderAvatar ? (
                      <img src={msg.senderAvatar} alt="av" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-500">
                        {msg.senderName?.charAt(0)}
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && (
                    <div className="flex items-center gap-1 mb-1 ml-1">
                      <span className="text-[10px] font-bold text-gray-500">{msg.senderName}</span>
                      <UserBadge status={msg.senderBadgeStatus || 'none'} />
                    </div>
                  )}
                  <div className={`rounded-2xl text-sm font-medium shadow-sm overflow-hidden ${isMine ? 'bg-[#0A1628] text-white rounded-br-sm' : 'bg-white text-[#0A1628] border border-gray-100 rounded-bl-sm'} ${msg.type === 'voice' ? 'p-1' : 'px-4 py-3'}`}>
                    {msg.type === 'voice' ? (
                      <VoiceMessage url={msg.mediaUrl} isMine={isMine} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-100 p-4 pb-10 md:pb-6 z-20">
        {isRecording ? (
          <div className="flex items-center justify-between bg-[#F8F9FA] rounded-full py-3 px-5 transition-all animate-in slide-in-from-bottom-4">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-gray-600">{formatTime(recordingTime)}</span>
             </div>
             <div className="flex items-center gap-4">
               <button onClick={cancelRecording} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-5 h-5" />
               </button>
               <button 
                 onClick={stopRecording}
                 className="w-10 h-10 rounded-full bg-[#D4A843] text-white flex items-center justify-center shadow-lg shadow-[#D4A843]/20"
               >
                  <Send className="w-4 h-4 ml-0.5" />
               </button>
             </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            {isUploading ? (
              <div className="p-3 text-[#D4A843] bg-gray-50 rounded-full">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <button 
                type="button" 
                onClick={startRecording}
                className="p-3 text-gray-400 hover:text-[#D4A843] transition-colors rounded-full bg-gray-50 active:scale-90"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-[#F8F9FA] rounded-full py-3 px-5 outline-none focus:ring-2 focus:ring-[#D4A843] font-medium text-sm transition-all"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-full bg-[#D4A843] text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-all active:scale-95"
            >
              <Send className="w-5 h-5 relative right-[1px]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

