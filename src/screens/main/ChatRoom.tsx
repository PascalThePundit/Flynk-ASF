import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Send, Mic } from 'lucide-react';
import { UserBadge } from '../../components/ui/UserBadge';

export const ChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { userProfile, currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomName, setRoomName] = useState('Loading...');
  const bottomRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA]">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
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
                  <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${isMine ? 'bg-[#0A1628] text-white rounded-br-sm' : 'bg-white text-[#0A1628] border border-gray-100 rounded-bl-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-4 pb-6">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <button type="button" className="p-3 text-gray-400 hover:text-[#D4A843] transition-colors rounded-full bg-gray-50">
            <Mic className="w-5 h-5" />
          </button>
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
      </div>
    </div>
  );
};
