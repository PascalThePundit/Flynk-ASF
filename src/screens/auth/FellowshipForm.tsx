import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { Forum } from '../../types';

export const FellowshipForm: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForums, setSelectedForums] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    phone: '',
    department: '',
    level: '',
    bio: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingForums, setFetchingForums] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // If they magically ended up here but form is already filled
    if (userProfile?.formFilled) {
      navigate('/', { replace: true });
    }

    // Initialize form with whatever they put in during registration
    if (userProfile) {
      setFormData({
        phone: userProfile.phone || '',
        department: userProfile.department || '',
        level: userProfile.level || '',
        bio: userProfile.bio || ''
      });
    }

    // Fetch existing forums
    const fetchForums = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'forums'));
        const forumsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Forum));
        setForums(forumsList);
      } catch (err) {
        console.error("Error fetching forums", err);
      } finally {
        setFetchingForums(false);
      }
    };
    fetchForums();
  }, [userProfile, navigate]);

  const toggleForum = (forumId: string) => {
    setSelectedForums(prev => 
      prev.includes(forumId) ? prev.filter(id => id !== forumId) : [...prev, forumId]
    );
  };

  const handleNextStep1 = () => {
    if (forums.length > 0 && selectedForums.length === 0) {
      setError("Please select at least one forum to join.");
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!currentUser || !userProfile) return;
    setLoading(true);
    setError('');

    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', currentUser.uid);

      // 1. Update user document
      batch.update(userRef, {
        formFilled: true,
        badgeStatus: 'grey', // Instantly gets the grey tick
        forumIds: selectedForums,
        phone: formData.phone || null,
        department: formData.department || null,
        level: formData.level || null,
        bio: formData.bio || null,
      });

      // 2. Add user to each forum's members subcollection
      selectedForums.forEach(forumId => {
        const memberRef = doc(db, 'forums', forumId, 'members', currentUser.uid);
        batch.set(memberRef, {
          joinedAt: Date.now()
        });
      });

      // Commit the batch
      await batch.commit();

      // Navigation will happen automatically via ProtectedRoutes when formFilled updates
    } catch (err: any) {
      setError(err.message || "Failed to submit form");
      setLoading(false);
    }
  };

  if (fetchingForums) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A1628]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-xl relative min-h-screen px-6 py-10 overflow-y-auto">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#0A1628]">Fellowship Form</h1>
          <span className="text-sm font-medium text-gray-400">Step {step} of 3</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full mb-8 overflow-hidden">
          <div 
            className="bg-[#D4A843] h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {error && <div className="p-3 mb-6 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Select Your Forums</h2>
              <p className="text-gray-500 text-sm">Choose the sub-forums you belong to. You must select at least one.</p>
            </div>

            {forums.length === 0 ? (
              <div className="p-6 bg-gray-50 text-center rounded-2xl text-gray-500 text-sm border border-gray-100">
                No forums have been created yet. You can proceed.
              </div>
            ) : (
              <div className="space-y-3">
                {forums.map(forum => {
                  const isSelected = selectedForums.includes(forum.id);
                  return (
                    <div 
                      key={forum.id}
                      onClick={() => toggleForum(forum.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected ? 'border-[#0A1628] bg-[#0A1628]/5' : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-gray-900">{forum.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{forum.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-[#0A1628] border-[#0A1628]' : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleNextStep1}
              className="w-full py-3.5 px-4 rounded-xl shadow-sm font-semibold text-white bg-[#0A1628] hover:bg-opacity-90 transition-all mt-8"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">About You</h2>
              <p className="text-gray-500 text-sm">Update your public profile. This helps others know you better.</p>
            </div>

            <div className="space-y-4">
              <input
                type="tel" placeholder="Phone Number" value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4A843] focus:border-transparent outline-none transition-all"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" placeholder="Department" value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4A843] focus:border-transparent outline-none transition-all"
                />
                <select
                  value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4A843] focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="">Level</option>
                  <option value="100 Level">100 Level</option>
                  <option value="200 Level">200 Level</option>
                  <option value="300 Level">300 Level</option>
                  <option value="400 Level">400 Level</option>
                  <option value="500 Level">500 Level</option>
                </select>
              </div>
              <div>
                <textarea
                  placeholder="Short Bio (150 chars max)" value={formData.bio} maxLength={150}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4A843] justify-center focus:border-transparent outline-none transition-all min-h-[100px] resize-none"
                />
                <div className="text-right text-xs text-gray-400 mt-1">{formData.bio.length}/150</div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 px-4 rounded-xl font-semibold text-[#0A1628] bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 py-3.5 px-4 rounded-xl shadow-sm font-semibold text-white bg-[#0A1628] hover:bg-opacity-90 transition-all"
              >
                Review Specs
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Review & Submit</h2>
              <p className="text-gray-500 text-sm">Please verify your details. Once submitted, you will receive your Grey Tick.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
               <div>
                 <span className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Name</span>
                 <p className="font-medium text-gray-900">{userProfile?.name}</p>
               </div>
               <div>
                 <span className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Selected Forums</span>
                 <p className="font-medium text-gray-900">
                   {selectedForums.length === 0 ? 'None selected' : 
                     forums.filter(f => selectedForums.includes(f.id)).map(f => f.name).join(', ')}
                 </p>
               </div>
               <div className="grid grid-cols-2">
                 <div>
                   <span className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Department</span>
                   <p className="font-medium text-gray-900">{formData.department || 'N/A'}</p>
                 </div>
                 <div>
                   <span className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Level</span>
                   <p className="font-medium text-gray-900">{formData.level || 'N/A'}</p>
                 </div>
               </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(2)} disabled={loading}
                className="w-1/3 py-3.5 px-4 rounded-xl font-semibold text-[#0A1628] bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-2/3 flex justify-center py-3.5 px-4 rounded-xl shadow-sm flex items-center justify-center font-semibold text-white bg-[#0A1628] hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Submit & Join'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
