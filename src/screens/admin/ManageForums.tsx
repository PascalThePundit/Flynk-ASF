import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Plus, Users, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Forum, UserProfile } from '../../types';

export const ManageForums: React.FC = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    forumHeadId: '' // The UID of the selected head
  });

  useEffect(() => {
    const unsubForums = onSnapshot(query(collection(db, 'forums')), (snap) => {
      setForums(snap.docs.map(d => ({ id: d.id, ...d.data() } as Forum)));
    });
    
    // Fetch users for the forum head dropdown
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setUsers(snap.docs.map(d => d.data() as UserProfile));
    });

    return () => { unsubForums(); unsubUsers(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const batch = writeBatch(db);

      let forumId = isEditing || doc(collection(db, 'forums')).id;
      const forumRef = doc(db, 'forums', forumId);
      
      const forumData = {
        name: formData.name,
        description: formData.description,
        forumHeadId: formData.forumHeadId || null,
        memberCount: isEditing ? (forums.find(f => f.id === isEditing)?.memberCount || 0) : 0
      };

      if (!isEditing) {
        batch.set(forumRef, { id: forumId, ...forumData });
        
        // **CRITICAL**: Automatically create the chat room for this forum
        const chatRoomRef = doc(db, 'chat_rooms', forumId);
        batch.set(chatRoomRef, {
          id: forumId,
          type: 'forum',
          forumId: forumId,
          createdAt: Date.now(),
          lastMessage: null,
          lastMessageTime: null,
        });
      } else {
        batch.update(forumRef, forumData);
        // If editing and we changed the head, we have to revoke the old head and assign the new head
        const oldForum = forums.find(f => f.id === isEditing);
        if (oldForum && oldForum.forumHeadId !== formData.forumHeadId) {
          if (oldForum.forumHeadId) {
             const oldHeadRef = doc(db, 'users', oldForum.forumHeadId);
             batch.update(oldHeadRef, { isForumHead: false, forumHeadOf: null, role: 'member' });
          }
        }
      }

      // If a head is selected, grant them the role
      if (formData.forumHeadId) {
        const newHeadRef = doc(db, 'users', formData.forumHeadId);
        batch.update(newHeadRef, { isForumHead: true, forumHeadOf: forumId, role: 'forum_head' });
      }

      await batch.commit();
      
      setIsModalOpen(false);
      setIsEditing(null);
      setFormData({ name: '', description: '', forumHeadId: '' });
    } catch (err) {
      console.error("Error saving forum", err);
      alert("Failed to save forum.");
    }
  };

  const handleDelete = async (forumId: string) => {
    if (!window.confirm("Deleting this forum will archive its chat and remove it from all members. Continue?")) return;
    
    try {
      const batch = writeBatch(db);
      
      const forum = forums.find(f => f.id === forumId);
      
      // Delete Forum Document
      batch.delete(doc(db, 'forums', forumId));
      
      // Archive Chat Room
      batch.update(doc(db, 'chat_rooms', forumId), { archived: true });

      // Revoke Forum Head if exists
      if (forum?.forumHeadId) {
        batch.update(doc(db, 'users', forum.forumHeadId), {
          isForumHead: false, forumHeadOf: null, role: 'member'
        });
      }

      // NOTE: A production app would use a Cloud Function to remove this forum ID 
      // from every individual user's `forumIds` array, as doing thousands of 
      // batched writes from the client is unsafe. We will rely on UI filtering for now.

      await batch.commit();
    } catch (e) {
      console.error("Error deleting forum:", e);
    }
  };

  const openEdit = (forum: Forum) => {
    setIsEditing(forum.id);
    setFormData({
      name: forum.name,
      description: forum.description,
      forumHeadId: forum.forumHeadId || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 pt-8 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#0A1628]" />
          </Link>
          <h1 className="text-xl font-bold text-[#0A1628]">Manage Forums</h1>
        </div>
        <button 
          onClick={() => { setIsEditing(null); setFormData({name: '', description: '', forumHeadId: ''}); setIsModalOpen(true); }}
          className="w-8 h-8 rounded-full bg-[#0A1628] text-white flex items-center justify-center hover:bg-opacity-90"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Forum List */}
      <div className="p-4 space-y-4">
        {forums.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No forums created yet.</div>
        ) : (
          forums.map(forum => {
            const headUser = users.find(u => u.uid === forum.forumHeadId);
            return (
              <div key={forum.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-[#0A1628]">{forum.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(forum)} className="p-2 text-gray-400 hover:text-[#0A1628] hover:bg-gray-50 rounded-full transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(forum.id)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">{forum.description}</p>
                
                <div className="flex items-center justify-between text-xs font-semibold text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 ">
                    <Users className="w-4 h-4" /> {forum.memberCount} Members
                  </div>
                  <div className="flex items-center gap-1.5 uppercase">
                    ⭐ Head: <span className="text-[#0A1628]">{headUser ? headUser.name : 'Unassigned'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 animate-in slide-in-from-bottom-8">
            <h2 className="text-2xl font-bold text-[#0A1628] mb-6">{isEditing ? 'Edit Forum' : 'New Forum'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 ml-1">Forum Name</label>
                <input 
                  type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-transparent focus:border-[#D4A843] outline-none"
                  placeholder="e.g. Gospel Magnets"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea 
                  required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-transparent focus:border-[#D4A843] outline-none resize-none min-h-[100px]"
                  placeholder="What is this forum for?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 ml-1">Assign Forum Head</label>
                <select 
                  value={formData.forumHeadId} onChange={e => setFormData({...formData, forumHeadId: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-transparent focus:border-[#D4A843] outline-none appearance-none"
                >
                  <option value="">-- No head assigned --</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>{u.name} {u.badgeStatus === 'gold' ? '(Gold)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/3 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className="w-2/3 py-3.5 rounded-2xl font-bold text-white bg-[#0A1628] hover:bg-opacity-90">
                  {isEditing ? 'Save Changes' : 'Create Forum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
