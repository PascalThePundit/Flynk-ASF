import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Plus, Users, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Forum, UserProfile } from '../../types';

export const ManageForums: React.FC = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', forumHeadId: '' });

  useEffect(() => {
    const unsubForums = onSnapshot(query(collection(db, 'forums')), snap => {
      setForums(snap.docs.map(d => ({ id: d.id, ...d.data() } as Forum)));
    });
    const unsubUsers = onSnapshot(query(collection(db, 'users')), snap => {
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
        memberCount: isEditing ? (forums.find(f => f.id === isEditing)?.memberCount || 0) : 0,
      };

      if (!isEditing) {
        batch.set(forumRef, { id: forumId, ...forumData });
        const chatRoomRef = doc(db, 'chat_rooms', forumId);
        batch.set(chatRoomRef, { id: forumId, type: 'forum', forumId, createdAt: Date.now(), lastMessage: null, lastMessageTime: null });
      } else {
        batch.update(forumRef, forumData);
        const oldForum = forums.find(f => f.id === isEditing);
        if (oldForum && oldForum.forumHeadId !== formData.forumHeadId && oldForum.forumHeadId) {
          batch.update(doc(db, 'users', oldForum.forumHeadId), { isForumHead: false, forumHeadOf: null, role: 'member' });
        }
      }

      if (formData.forumHeadId) {
        batch.update(doc(db, 'users', formData.forumHeadId), { isForumHead: true, forumHeadOf: forumId, role: 'forum_head' });
      }

      await batch.commit();
      setIsModalOpen(false);
      setIsEditing(null);
      setFormData({ name: '', description: '', forumHeadId: '' });
    } catch (err) {
      console.error('Error saving forum', err);
      alert('Failed to save forum.');
    }
  };

  const handleDelete = async (forumId: string) => {
    if (!window.confirm('Deleting this forum will archive its chat and remove it from all members. Continue?')) return;
    try {
      const batch = writeBatch(db);
      const forum = forums.find(f => f.id === forumId);
      batch.delete(doc(db, 'forums', forumId));
      batch.update(doc(db, 'chat_rooms', forumId), { archived: true });
      if (forum?.forumHeadId) {
        batch.update(doc(db, 'users', forum.forumHeadId), { isForumHead: false, forumHeadOf: null, role: 'member' });
      }
      await batch.commit();
    } catch (e) {
      console.error('Error deleting forum:', e);
    }
  };

  const openEdit = (forum: Forum) => {
    setIsEditing(forum.id);
    setFormData({ name: forum.name, description: forum.description, forumHeadId: forum.forumHeadId || '' });
    setIsModalOpen(true);
  };

  const inputCls = "w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1C2128] text-[#0A1628] dark:text-gray-100 border border-transparent focus:border-[#D4A843] outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600";

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117] flex flex-col relative pb-24 md:pb-8 page-enter">
      {/* Header */}
      <div className="bg-white dark:bg-[#161B22] border-b border-gray-100 dark:border-gray-800 p-4 pt-8 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-[#1C2128] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#0A1628] dark:text-gray-100" />
          </Link>
          <h1 className="text-xl font-bold text-[#0A1628] dark:text-gray-100 font-display">Manage Forums</h1>
        </div>
        <button
          onClick={() => { setIsEditing(null); setFormData({ name: '', description: '', forumHeadId: '' }); setIsModalOpen(true); }}
          className="w-8 h-8 rounded-full bg-[#0A1628] dark:bg-[#D4A843] text-white dark:text-[#0A1628] flex items-center justify-center hover:bg-[#D4A843] hover:text-[#0A1628] dark:hover:bg-yellow-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Forum List */}
      <div className="p-4 space-y-4">
        {forums.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm">No forums created yet.</div>
        ) : (
          forums.map(forum => {
            const headUser = users.find(u => u.uid === forum.forumHeadId);
            return (
              <div key={forum.id} className="bg-white dark:bg-[#161B22] p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-[#0A1628] dark:text-gray-100">{forum.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(forum)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#0A1628] dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1C2128] rounded-full transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(forum.id)} className="p-2 text-red-300 dark:text-red-700 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{forum.description}</p>

                <div className="flex items-center justify-between text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#1C2128] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {forum.memberCount} Members
                  </div>
                  <div className="flex items-center gap-1.5 uppercase">
                    ⭐ Head: <span className="text-[#0A1628] dark:text-gray-300">{headUser ? headUser.name : 'Unassigned'}</span>
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
          <div className="bg-white dark:bg-[#161B22] w-full max-w-sm rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-[#0A1628] dark:text-gray-100 mb-6">{isEditing ? 'Edit Forum' : 'New Forum'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Forum Name</label>
                <input
                  type="text" required value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={inputCls} placeholder="e.g. Gospel Magnets"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea
                  required value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={inputCls + " resize-none min-h-[100px]"}
                  placeholder="What is this forum for?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Assign Forum Head</label>
                <select
                  value={formData.forumHeadId}
                  onChange={e => setFormData({ ...formData, forumHeadId: e.target.value })}
                  className={inputCls + " appearance-none"}
                >
                  <option value="">-- No head assigned --</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>{u.name} {u.badgeStatus === 'gold' ? '(Gold)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-3.5 rounded-2xl font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1C2128] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="w-2/3 py-3.5 rounded-2xl font-bold text-white bg-[#0A1628] dark:bg-[#D4A843] dark:text-[#0A1628] hover:bg-[#D4A843] hover:text-[#0A1628] dark:hover:bg-yellow-400 transition-colors">
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
