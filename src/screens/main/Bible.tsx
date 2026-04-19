import React, { useMemo, useState, useEffect } from 'react';
import sdahData from '../../data/sdah.json';
import { Search, ChevronLeft, BookOpen, Music, Sparkles, ChevronRight, Loader2, Settings2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Bible Metadata with Chapter Counts (Standard 66 Books)
const BIBLE_BOOKS = [
  { name: "Genesis", chapters: 50 }, { name: "Exodus", chapters: 40 }, { name: "Leviticus", chapters: 27 },
  { name: "Numbers", chapters: 36 }, { name: "Deuteronomy", chapters: 34 }, { name: "Joshua", chapters: 24 },
  { name: "Judges", chapters: 21 }, { name: "Ruth", chapters: 4 }, { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 }, { name: "1 Kings", chapters: 22 }, { name: "2 Kings", chapters: 25 },
  { name: "1 Chronicles", chapters: 29 }, { name: "2 Chronicles", chapters: 36 }, { name: "Ezra", chapters: 10 },
  { name: "Nehemiah", chapters: 13 }, { name: "Esther", chapters: 10 }, { name: "Job", chapters: 42 },
  { name: "Psalms", chapters: 150 }, { name: "Proverbs", chapters: 31 }, { name: "Ecclesiastes", chapters: 12 },
  { name: "Song of Solomon", chapters: 8 }, { name: "Isaiah", chapters: 66 }, { name: "Jeremiah", chapters: 52 },
  { name: "Lamentations", chapters: 5 }, { name: "Ezekiel", chapters: 48 }, { name: "Daniel", chapters: 12 },
  { name: "Hosea", chapters: 14 }, { name: "Joel", chapters: 3 }, { name: "Amos", chapters: 9 },
  { name: "Obadiah", chapters: 1 }, { name: "Jonah", chapters: 4 }, { name: "Micah", chapters: 7 },
  { name: "Nahum", chapters: 3 }, { name: "Habakkuk", chapters: 3 }, { name: "Zephaniah", chapters: 3 },
  { name: "Haggai", chapters: 2 }, { name: "Zechariah", chapters: 14 }, { name: "Malachi", chapters: 4 },
  { name: "Matthew", chapters: 28 }, { name: "Mark", chapters: 16 }, { name: "Luke", chapters: 24 },
  { name: "John", chapters: 21 }, { name: "Acts", chapters: 28 }, { name: "Romans", chapters: 16 },
  { name: "1 Corinthians", chapters: 16 }, { name: "2 Corinthians", chapters: 13 }, { name: "Galatians", chapters: 6 },
  { name: "Ephesians", chapters: 6 }, { name: "Philippians", chapters: 4 }, { name: "Colossians", chapters: 4 },
  { name: "1 Thessalonians", chapters: 5 }, { name: "2 Thessalonians", chapters: 3 }, { name: "1 Timothy", chapters: 6 },
  { name: "2 Timothy", chapters: 4 }, { name: "Titus", chapters: 3 }, { name: "Philemon", chapters: 1 },
  { name: "Hebrews", chapters: 13 }, { name: "James", chapters: 5 }, { name: "1 Peter", chapters: 5 },
  { name: "2 Peter", chapters: 3 }, { name: "1 John", chapters: 5 }, { name: "2 John", chapters: 1 },
  { name: "3 John", chapters: 1 }, { name: "Jude", chapters: 1 }, { name: "Revelation", chapters: 22 }
];

const BIBLE_VERSIONS = [
  { id: 'NKJV', name: 'New King James Version' },
  { id: 'AMP', name: 'Amplified Bible' },
  { id: 'RSV', name: 'Revised Standard Version' },
  { id: 'KJV', name: 'King James Version' },
  { id: 'ASV', name: 'American Standard Version' },
  { id: 'WEB', name: 'World English Bible' },
  { id: 'BBE', name: 'Bible in Basic English' },
  { id: 'YLT', name: "Young's Literal Translation" },
];

const DAILY_VERSES = [
  { ref: 'John 3:16', text: '"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."' },
  { ref: 'Philippians 4:13', text: '"I can do all things through Christ which strengtheneth me."' },
  { ref: 'Psalm 23:1', text: '"The LORD is my shepherd; I shall not want."' },
  { ref: 'Romans 8:28', text: '"And we know that all things work together for good to them that love God."' },
  { ref: 'Proverbs 3:5', text: '"Trust in the LORD with all thine heart; and lean not unto thine own understanding."' },
];

const _now = new Date();
const dailyVerse = DAILY_VERSES[(_now.getDate() + _now.getMonth() * 3) % DAILY_VERSES.length];

export const BibleReader: React.FC = () => {
  const [tab, setTab] = useState<'bible' | 'hymnal'>('bible');
  const [selectedBook, setSelectedBook] = useState(BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState(BIBLE_VERSIONS[0]);
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [bookSearch, setBookSearch] = useState('');
  const [bibleSearch, setBibleSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [bibleMode, setBibleMode] = useState<'read' | 'books' | 'search' | 'versions'>('read');
  const [hymnSearch, setHymnSearch] = useState('');
  const [selectedHymn, setSelectedHymn] = useState<any | null>(null);

  // Fetch Chapter Content from Bolls Life API
  useEffect(() => {
    if (tab !== 'bible' || bibleMode === 'books' || bibleMode === 'versions' || bibleMode === 'search') return;
    
    const fetchChapter = async () => {
      setLoading(true);
      try {
        const bookId = BIBLE_BOOKS.findIndex(b => b.name === selectedBook.name) + 1;
        const response = await fetch(`https://bolls.life/get-text/${selectedVersion.id}/${bookId}/${selectedChapter}/`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setVerses(data.map((v: any) => ({ verse: v.verse, text: v.text })));
        }
      } catch (error) {
        console.error("Failed to fetch bible verses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [selectedBook, selectedChapter, selectedVersion, tab, bibleMode]);

  // Global Search Effect using Bolls Life API
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (bibleSearch.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(`https://bolls.life/search/${selectedVersion.id}/?search=${encodeURIComponent(bibleSearch)}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setSearchResults(data.slice(0, 30));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [bibleSearch, selectedVersion]);

  const filteredBooks = useMemo(() =>
    BIBLE_BOOKS.filter(b => b.name.toLowerCase().includes(bookSearch.toLowerCase())),
    [bookSearch]
  );

  const filteredHymns = useMemo(() =>
    sdahData.hymns.filter(h => h.title.toLowerCase().includes(hymnSearch.toLowerCase()) || String(h.number).includes(hymnSearch)),
    [hymnSearch]
  );

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex flex-col pb-32 md:pb-8 animate-reveal">
      {/* Premium Library Header */}
      <div className="glass px-6 pt-8 pb-6 sticky top-0 z-20 border-b border-white/20 flex flex-col gap-6">
        <h1 className="text-4xl font-black text-navy dark:text-white tracking-tighter md:hidden">Library</h1>

        <div className="flex glass dark:bg-white/5 p-1 rounded-[1.5rem] border-white/40 shadow-xl">
          <button
            onClick={() => setTab('bible')}
            className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.2rem] text-xs font-black transition-all active-scale', tab === 'bible' ? 'bg-navy dark:bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-navy dark:hover:text-white')}
          >
            <BookOpen size={16} />
            Holy Bible
          </button>
          <button
            onClick={() => setTab('hymnal')}
            className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.2rem] text-xs font-black transition-all active-scale', tab === 'hymnal' ? 'bg-navy dark:bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-navy dark:hover:text-white')}
          >
            <Music size={16} />
            SDA Hymnal
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">

        {/* ══ BIBLE TAB ══ */}
        {tab === 'bible' && (
          <div className="space-y-6">
            {/* Masterpiece Daily Bread Card */}
            <div className="bg-navy dark:bg-brand rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl gold-glow group">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-brand/20 -mr-16 -mt-16 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-10 -mb-10" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                   <Sparkles className="text-gold w-4 h-4" />
                   <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Manna of the Day</span>
                </div>
                <p className="text-white text-xl leading-relaxed italic font-serif mb-6 group-hover:scale-[1.02] transition-transform duration-500">{dailyVerse.text}</p>
                <div className="flex items-center gap-3">
                   <div className="h-px w-6 bg-gold/50" />
                   <span className="text-gold text-xs font-black tracking-widest">{dailyVerse.ref}</span>
                </div>
              </div>
            </div>

            {/* Premium Search */}
            <div className="relative group">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand" />
              <input
                value={bibleSearch}
                onChange={e => { setBibleSearch(e.target.value); setBibleMode(e.target.value ? 'search' : 'read'); }}
                placeholder="Search the Word (e.g. faith)..."
                className="w-full bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 glass rounded-[1.5rem] pl-12 pr-12 py-4 text-sm font-bold text-navy dark:text-white outline-none transition-all"
              />
              {bibleSearch && (
                 <button onClick={() => { setBibleSearch(''); setBibleMode('read'); }} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand">
                    <X size={16} />
                 </button>
              )}
            </div>

            {bibleMode === 'search' ? (
              <div className="space-y-3 animate-reveal">
                {isSearching ? (
                   <div className="py-10 text-center flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-brand" size={24} />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Searching the scrolls...</p>
                   </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const book = BIBLE_BOOKS[r.book - 1];
                        setSelectedBook(book);
                        setSelectedChapter(r.chapter);
                        setBibleSearch('');
                        setBibleMode('read');
                      }}
                      className="w-full text-left glass dark:bg-white/5 rounded-[1.8rem] p-5 border-white/40 dark:border-white/5 shadow-xl active-scale"
                    >
                      <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1.5">{BIBLE_BOOKS[r.book-1]?.name} {r.chapter}:{r.verse}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-serif" dangerouslySetInnerHTML={{ __html: r.text }} />
                    </button>
                  ))
                ) : (
                   <div className="py-10 text-center">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No results found for "{bibleSearch}"</p>
                   </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                  <button
                    onClick={() => setBibleMode(bibleMode === 'books' ? 'read' : 'books')}
                    className={cn('px-5 py-3 rounded-2xl glass border-brand/20 text-brand font-black text-xs shrink-0 active-scale flex items-center gap-2', bibleMode === 'books' && 'bg-brand text-white')}
                  >
                    <BookOpen size={14} />
                    {selectedBook.name}
                  </button>
                  <button
                    onClick={() => setBibleMode(bibleMode === 'versions' ? 'read' : 'versions')}
                    className={cn('px-5 py-3 rounded-2xl glass border-navy/20 text-navy dark:text-white font-black text-xs shrink-0 active-scale flex items-center gap-2', bibleMode === 'versions' && 'bg-navy text-white')}
                  >
                    <Settings2 size={14} />
                    {selectedVersion.id}
                  </button>
                  <div className="flex gap-2">
                     {[...Array(selectedBook.chapters)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => { setSelectedChapter(i + 1); setBibleMode('read'); }}
                          className={cn('w-10 h-10 rounded-xl shrink-0 font-black text-xs transition-all active-scale', selectedChapter === i + 1 ? 'bg-navy dark:bg-brand text-white shadow-lg' : 'glass dark:bg-white/5 text-gray-500 border-none')}
                        >
                          {i + 1}
                        </button>
                     ))}
                  </div>
                </div>

                {bibleMode === 'books' && (
                  <div className="glass dark:bg-white/5 rounded-[2.5rem] border-white/40 dark:border-white/5 overflow-hidden shadow-2xl animate-reveal">
                    <div className="p-4 border-b border-black/5 dark:border-white/5">
                       <input 
                         value={bookSearch} 
                         onChange={e => setBookSearch(e.target.value)}
                         placeholder="Search Books..."
                         className="w-full bg-transparent font-black text-sm outline-none px-2 text-navy dark:text-white"
                       />
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                       {filteredBooks.map(book => (
                          <button
                            key={book.name}
                            onClick={() => { setSelectedBook(book); setSelectedChapter(1); setBibleMode('read'); }}
                            className={cn('text-left px-5 py-3 rounded-xl font-black text-xs transition-all', selectedBook.name === book.name ? 'bg-brand/20 text-brand' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5')}
                          >
                            {book.name}
                          </button>
                       ))}
                    </div>
                  </div>
                )}

                {bibleMode === 'versions' && (
                  <div className="glass dark:bg-white/5 rounded-[2.5rem] border-white/40 dark:border-white/5 overflow-hidden shadow-2xl animate-reveal">
                    <div className="p-6 flex flex-col gap-2">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Available Versions</p>
                       {BIBLE_VERSIONS.map(v => (
                          <button
                            key={v.id}
                            onClick={() => { setSelectedVersion(v); setBibleMode('read'); }}
                            className={cn('text-left px-6 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-between', selectedVersion.id === v.id ? 'bg-navy dark:bg-brand text-white shadow-xl' : 'glass dark:bg-white/5 text-gray-500')}
                          >
                            {v.name}
                            <span className="opacity-50 text-[10px]">{v.id}</span>
                          </button>
                       ))}
                    </div>
                  </div>
                )}

                {bibleMode === 'read' && (
                  <div className="space-y-6">
                    {loading ? (
                       <div className="glass dark:bg-white/5 rounded-[2.5rem] p-20 flex flex-col items-center justify-center gap-4">
                          <Loader2 className="animate-spin text-brand w-10 h-10" />
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Opening the Word...</p>
                       </div>
                    ) : (
                      <div className="glass dark:bg-white/5 rounded-[2.5rem] border-white/40 dark:border-white/5 p-8 md:p-10 shadow-2xl animate-reveal">
                        <div className="flex items-center gap-4 mb-10">
                           <div className="w-1.5 h-10 bg-brand rounded-full" />
                           <h2 className="text-3xl font-black text-navy dark:text-white tracking-tighter">
                              {selectedBook.name} <span className="text-brand">{selectedChapter}</span>
                           </h2>
                        </div>
                        <div className="space-y-6 font-serif">
                          {verses.map(v => (
                            <p key={v.verse} className="text-gray-800 dark:text-gray-200 leading-relaxed text-[18px]">
                              <sup className="text-[10px] font-black text-brand mr-2 not-italic">{v.verse}</sup>
                              <span dangerouslySetInnerHTML={{ __html: v.text }} />
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ HYMNAL TAB ══ */}
        {tab === 'hymnal' && (
          <div className="space-y-6">
            <div className="relative group">
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand" />
              <input
                value={hymnSearch}
                onChange={e => setHymnSearch(e.target.value)}
                placeholder="Search by title or number..."
                className="w-full bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 glass rounded-[1.5rem] pl-12 pr-6 py-4 text-sm font-bold text-navy dark:text-white outline-none transition-all"
              />
            </div>

            {selectedHymn ? (
              <div className="glass dark:bg-white/5 rounded-[2.5rem] border-white/40 dark:border-white/5 shadow-2xl overflow-hidden animate-reveal">
                <div className="bg-navy dark:bg-brand px-8 py-6 flex items-center gap-4">
                  <button onClick={() => setSelectedHymn(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active-scale">
                    <ChevronLeft className="text-white" size={20} />
                  </button>
                  <div>
                    <p className="text-gold text-[10px] font-black uppercase tracking-widest">Hymn No. {selectedHymn.number}</p>
                    <h3 className="text-white text-xl font-black tracking-tight">{selectedHymn.title}</h3>
                  </div>
                </div>
                <div className="p-8 md:p-12 space-y-10 font-serif overflow-y-auto max-h-[60vh] scrollbar-hide">
                   {selectedHymn.verses.map((v: any, i: number) => (
                      <div key={i} className={cn('space-y-2', (v.verseNumber === 'R' || String(v.verseNumber).toLowerCase() === 'chorus') && 'bg-brand/5 rounded-3xl p-6 border-l-4 border-brand')}>
                         <p className="text-[10px] font-black text-brand/50 uppercase tracking-[0.2em] mb-4">
                           {v.verseNumber === 'R' ? 'Refrain' : `Verse ${v.verseNumber}`}
                         </p>
                         {v.lines.map((line: string, j: number) => (
                           <p key={j} className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{line}</p>
                         ))}
                      </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHymns.slice(0, 50).map(hymn => (
                  <button
                    key={hymn.number}
                    onClick={() => setSelectedHymn(hymn)}
                    className="w-full text-left glass dark:bg-white/5 rounded-[2rem] p-5 shadow-xl flex items-center gap-5 group active-scale border border-white/40 dark:border-white/5 transition-all"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand transition-colors">
                      <span className="text-lg font-black text-brand group-hover:text-white">{hymn.number}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-navy dark:text-white text-base tracking-tight truncate">{hymn.title}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{hymn.verses.length} Stanzas</p>
                    </div>
                    <ChevronRight size={20} className="ml-auto text-gray-300 group-hover:text-brand transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
