import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Check, ChevronRight, ChevronLeft, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Forum } from '../../types';

const STEPS = ['Forums', 'About You', 'Review'];

const inputCls = "w-full px-5 py-4 bg-white dark:bg-[#1C2128] border-2 border-gray-100 dark:border-gray-700 text-[#0A1628] dark:text-gray-100 font-medium rounded-2xl focus:outline-none focus:border-[#D4A843] placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all";

export const FellowshipForm: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForums, setSelectedForums] = useState<string[]>([]);
  const [formData, setFormData] = useState({ phone: '', department: '', level: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [fetchingForums, setFetchingForums] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile?.formFilled) navigate('/', { replace: true });
    if (userProfile) {
      setFormData({
        phone: userProfile.phone || '',
        department: userProfile.department || '',
        level: userProfile.level || '',
        bio: userProfile.bio || '',
      });
    }
    getDocs(collection(db, 'forums'))
      .then(snap => setForums(snap.docs.map(d => ({ id: d.id, ...d.data() } as Forum))))
      .catch(console.error)
      .finally(() => setFetchingForums(false));
  }, [userProfile, navigate]);

  const toggleForum = (id: string) =>
    setSelectedForums(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const goNext = () => {
    if (step === 1 && forums.length > 0 && selectedForums.length === 0) {
      setError('Please select at least one forum.');
      return;
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', currentUser.uid), {
        formFilled: true,
        badgeStatus: 'grey',
        forumIds: selectedForums,
        phone: formData.phone || null,
        department: formData.department || null,
        level: formData.level || null,
        bio: formData.bio || null,
      });
      selectedForums.forEach(fId => {
        batch.set(doc(db, 'forums', fId, 'members', currentUser.uid), { joinedAt: Date.now() });
      });
      await batch.commit();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      setLoading(false);
    }
  };

  if (fetchingForums) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA] dark:bg-[#0D1117]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A1628] dark:text-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#161B22] border-b border-gray-100 dark:border-gray-800 px-6 py-5 flex items-center justify-between sticky top-0 z-20">
        <div>
          <span className="text-xl font-extrabold text-[#0A1628] dark:text-gray-100 tracking-[0.15em]" style={{ fontFamily: 'Syne, sans-serif' }}>
            FLYNK
          </span>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Fellowship Registration</p>
        </div>
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#1C2128] px-3 py-1.5 rounded-full">
          Step {step} of 3
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 dark:bg-gray-800">
        <div className="h-full bg-[#D4A843] transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center px-5 py-8">
        <div className="w-full max-w-md space-y-6">

          {/* Step pills */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <React.Fragment key={label}>
                  <div className={cn(
                    'flex items-center gap-1.5 text-xs font-bold transition-all',
                    active ? 'text-[#0A1628] dark:text-gray-100' : done ? 'text-[#D4A843]' : 'text-gray-300 dark:text-gray-600'
                  )}>
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold',
                      done ? 'bg-[#D4A843] text-white' : active ? 'bg-[#0A1628] dark:bg-gray-100 text-white dark:text-[#0A1628]' : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                    )}>
                      {done ? <Check size={12} /> : n}
                    </div>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />}
                </React.Fragment>
              );
            })}
          </div>

          {error && (
            <div className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl">
              {error}
            </div>
          )}

          {/* ── Step 1: Forums ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0A1628] dark:text-gray-100 font-display">Pick Your Forums</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select every sub-group you belong to in ASF FUTO.</p>
              </div>

              {forums.length === 0 ? (
                <div className="bg-white dark:bg-[#161B22] rounded-3xl p-8 text-center border border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 text-sm shadow-sm">
                  <Users className="mx-auto mb-3 text-gray-200 dark:text-gray-700" size={32} />
                  No forums yet — an admin will create them soon. You can proceed.
                </div>
              ) : (
                <div className="space-y-3">
                  {forums.map(forum => {
                    const sel = selectedForums.includes(forum.id);
                    return (
                      <button
                        key={forum.id}
                        onClick={() => toggleForum(forum.id)}
                        className={cn(
                          'w-full text-left p-4 rounded-3xl border-2 flex items-center justify-between transition-all',
                          sel
                            ? 'border-[#0A1628] dark:border-[#D4A843] bg-[#0A1628]/[0.03] dark:bg-[#D4A843]/10 shadow-sm'
                            : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-[#161B22] hover:border-gray-200 dark:hover:border-gray-700'
                        )}
                      >
                        <div className="min-w-0 pr-3">
                          <p className="font-extrabold text-[#0A1628] dark:text-gray-100 text-sm font-display">{forum.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{forum.description}</p>
                          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">{forum.memberCount || 0} members</p>
                        </div>
                        <div className={cn(
                          'w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 transition-all',
                          sel ? 'bg-[#0A1628] dark:bg-[#D4A843] border-[#0A1628] dark:border-[#D4A843]' : 'border-gray-200 dark:border-gray-700'
                        )}>
                          {sel && <Check size={12} className="text-white dark:text-[#0A1628]" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: About You ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0A1628] dark:text-gray-100 font-display">About You</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Help others know you better. All fields are optional.</p>
              </div>

              <div className="space-y-4">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))}
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Department"
                    value={formData.department}
                    onChange={e => setFormData(d => ({ ...d, department: e.target.value }))}
                    className={inputCls}
                  />
                  <select
                    value={formData.level}
                    onChange={e => setFormData(d => ({ ...d, level: e.target.value }))}
                    className={inputCls + " appearance-none"}
                  >
                    <option value="">Level</option>
                    {['100', '200', '300', '400', '500'].map(l => (
                      <option key={l} value={`${l} Level`}>{l} Level</option>
                    ))}
                  </select>
                </div>
                <div>
                  <textarea
                    placeholder="Short bio (max 150 characters)..."
                    value={formData.bio}
                    maxLength={150}
                    rows={3}
                    onChange={e => setFormData(d => ({ ...d, bio: e.target.value }))}
                    className={inputCls + " resize-none"}
                  />
                  <p className="text-right text-[10px] text-gray-400 dark:text-gray-500 mt-1">{formData.bio.length}/150</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0A1628] dark:text-gray-100 font-display">Looks Good?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submitting will grant you your grey membership tick instantly.</p>
              </div>

              <div className="bg-white dark:bg-[#161B22] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                <ReviewRow label="Name" value={userProfile?.name} />
                <ReviewRow
                  label="Forums"
                  value={
                    selectedForums.length === 0
                      ? 'None selected'
                      : forums.filter(f => selectedForums.includes(f.id)).map(f => f.name).join(', ')
                  }
                />
                <ReviewRow label="Department" value={formData.department} />
                <ReviewRow label="Level" value={formData.level} />
                {formData.bio && <ReviewRow label="Bio" value={formData.bio} />}
              </div>

              <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#1C2128] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <Check size={18} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  You'll receive a <span className="font-bold text-gray-600 dark:text-gray-300">grey verification tick</span> immediately. Pay your fellowship dues to upgrade to the gold tick.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-4 bg-white dark:bg-[#161B22] border-2 border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-[#0A1628] dark:text-gray-100 text-sm hover:border-gray-200 dark:hover:border-gray-700 transition-all"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
            <button
              onClick={step < 3 ? goNext : handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-between px-6 py-4 bg-[#0A1628] dark:bg-[#D4A843] text-white dark:text-[#0A1628] rounded-2xl font-bold text-sm hover:bg-[#D4A843] hover:text-[#0A1628] dark:hover:bg-yellow-400 transition-colors shadow-lg shadow-[#0A1628]/10 disabled:opacity-60"
            >
              <span>{loading ? 'Submitting...' : step < 3 ? 'Continue' : 'Submit & Join'}</span>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const ReviewRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">{label}</span>
    <p className="text-sm font-bold text-[#0A1628] dark:text-gray-100">{value || '—'}</p>
  </div>
);
