import React, { useState } from 'react';
import kjvData from '../../data/kjv.json';
import sdahData from '../../data/sdah.json';

export const BibleReader: React.FC = () => {
  const [tab, setTab] = useState<'bible' | 'hymnal'>('bible');
  const [selectedBook, setSelectedBook] = useState(kjvData.books[0]);
  const [selectedChapter, setSelectedChapter] = useState(selectedBook.chapters[0]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <div className="bg-white px-6 py-6 pb-0 sticky top-0 z-20 border-b border-gray-100 md:rounded-t-[2.5rem] md:mt-6">
        <h1 className="text-3xl font-extrabold text-[#0A1628] font-display tracking-tight mb-4 md:hidden">Library</h1>
        
        <div className="flex gap-6 border-b border-gray-100">
          <button 
            onClick={() => setTab('bible')}
            className={`pb-3 text-sm font-bold transition-all ${tab === 'bible' ? 'text-[#0A1628] border-b-2 border-[#0A1628]' : 'text-gray-400'}`}
          >
            Holy Bible (KJV)
          </button>
          <button 
            onClick={() => setTab('hymnal')}
            className={`pb-3 text-sm font-bold transition-all ${tab === 'hymnal' ? 'text-[#0A1628] border-b-2 border-[#0A1628]' : 'text-gray-400'}`}
          >
            SDA Hymnal
          </button>
        </div>

        {tab === 'bible' && (
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide snap-x">
             {kjvData.books.map(book => (
               <button 
                 key={book.name}
                 onClick={() => { setSelectedBook(book); setSelectedChapter(book.chapters[0]); }}
                 className={`px-4 py-2 rounded-xl text-sm font-bold shrink-0 snap-start transition-all ${selectedBook.name === book.name ? 'bg-[#0A1628] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
               >
                 {book.name}
               </button>
             ))}
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 pb-24 overflow-y-auto font-serif">
        {tab === 'bible' && (
          <div className="space-y-6">
            {/* Daily Verse */}
            <div className="bg-[#0A1628] p-6 rounded-[2rem] shadow-xl text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4A843]/10 rounded-bl-full -mr-8 -mt-8" />
               <div className="relative z-10">
                 <span className="text-[10px] font-bold text-[#D4A843] uppercase tracking-[0.2em] mb-4 block">Daily Manna</span>
                 <p className="text-white text-lg leading-relaxed italic mb-4">
                   "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
                 </p>
                 <span className="text-white/40 text-xs font-bold">— John 3:16</span>
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h2 className="text-2xl font-extrabold text-[#0A1628] mb-6 font-display text-center tracking-tight">
                {selectedBook.name} {selectedChapter.chapter}
              </h2>
              <div className="space-y-4">
                {selectedChapter.verses.map(v => (
                  <p key={v.verse} className="text-gray-800 leading-relaxed text-lg">
                    <sup className="text-xs font-bold text-[#D4A843] mr-2">{v.verse}</sup>
                    {v.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'hymnal' && (
          <div className="space-y-6">
            {sdahData.hymns.map(hymn => (
              <div key={hymn.number} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                <div className="text-[#D4A843] font-bold text-sm mb-2 font-display">No. {hymn.number}</div>
                <h2 className="text-2xl font-bold text-[#0A1628] mb-8 font-display">{hymn.title}</h2>
                <div className="space-y-6">
                  {hymn.verses.map((v, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 mb-2 uppercase">{v.verseNumber === 'R' ? '' : `Verse ${v.verseNumber}`}</p>
                      {v.lines.map((line, j) => (
                        <p key={j} className={`text-lg leading-relaxed ${v.verseNumber === 'R' && line.startsWith('Leader') ? 'font-bold text-[#0A1628]' : 'text-gray-700'}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
