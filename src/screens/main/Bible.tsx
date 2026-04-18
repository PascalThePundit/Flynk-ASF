import React, { useMemo, useState } from 'react';
import kjvData from '../../data/kjv.json';
import sdahData from '../../data/sdah.json';
import { Search, ChevronLeft, BookOpen, Music } from 'lucide-react';
import { cn } from '../../lib/utils';

// Daily verse — consistent per day across all users
const DAILY_VERSES = [
  { ref: 'John 3:16', text: '"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."' },
  { ref: 'Philippians 4:13', text: '"I can do all things through Christ which strengtheneth me."' },
  { ref: 'Psalm 23:1', text: '"The LORD is my shepherd; I shall not want."' },
  { ref: 'Romans 8:28', text: '"And we know that all things work together for good to them that love God."' },
  { ref: 'Proverbs 3:5', text: '"Trust in the LORD with all thine heart; and lean not unto thine own understanding."' },
  { ref: 'Isaiah 40:31', text: '"But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles."' },
  { ref: 'Jeremiah 29:11', text: '"For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end."' },
];
const _now = new Date();
const dailyVerse = DAILY_VERSES[(_now.getDate() + _now.getMonth() * 3) % DAILY_VERSES.length];

export const BibleReader: React.FC = () => {
  const [tab, setTab] = useState<'bible' | 'hymnal'>('bible');

  // Bible state
  const [selectedBook, setSelectedBook] = useState(kjvData.books[0]);
  const [selectedChapter, setSelectedChapter] = useState(kjvData.books[0].chapters[0]);
  const [bookSearch, setBookSearch] = useState('');
  const [bibleSearch, setBibleSearch] = useState('');
  const [bibleMode, setBibleMode] = useState<'read' | 'books' | 'search'>('read');

  // Hymnal state
  const [hymnSearch, setHymnSearch] = useState('');
  const [selectedHymn, setSelectedHymn] = useState<any | null>(null);

  const filteredBooks = useMemo(() =>
    kjvData.books.filter(b => b.name.toLowerCase().includes(bookSearch.toLowerCase())),
    [bookSearch]
  );

  const bibleSearchResults = useMemo(() => {
    if (bibleSearch.trim().length < 3) return [];
    const q = bibleSearch.toLowerCase();
    const results: { book: string; chapter: number; verse: number; text: string }[] = [];
    for (const book of kjvData.books) {
      for (const ch of book.chapters) {
        for (const v of ch.verses) {
          if (v.text.toLowerCase().includes(q)) {
            results.push({ book: book.name, chapter: ch.chapter, verse: v.verse, text: v.text });
            if (results.length >= 40) break;
          }
        }
        if (results.length >= 40) break;
      }
      if (results.length >= 40) break;
    }
    return results;
  }, [bibleSearch]);

  const filteredHymns = useMemo(() =>
    sdahData.hymns.filter(h =>
      h.title.toLowerCase().includes(hymnSearch.toLowerCase()) ||
      String(h.number).includes(hymnSearch)
    ),
    [hymnSearch]
  );

  const selectBook = (book: (typeof kjvData.books)[0]) => {
    setSelectedBook(book);
    setSelectedChapter(book.chapters[0]);
    setBookSearch('');
    setBibleMode('read');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col pb-28 md:pb-8 page-enter">
      {/* Header */}
      <div className="bg-white px-5 py-5 sticky top-0 z-20 border-b border-gray-100">
        <h1 className="text-2xl font-extrabold text-[#0A1628] font-display md:hidden mb-4">Library</h1>

        {/* Tab switcher */}
        <div className="flex bg-[#F8F9FA] p-1 rounded-2xl gap-1">
          <button
            onClick={() => setTab('bible')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === 'bible' ? 'bg-[#0A1628] text-white shadow-sm' : 'text-gray-500 hover:text-[#0A1628]'
            )}
          >
            <BookOpen size={16} />
            Holy Bible
          </button>
          <button
            onClick={() => setTab('hymnal')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === 'hymnal' ? 'bg-[#0A1628] text-white shadow-sm' : 'text-gray-500 hover:text-[#0A1628]'
            )}
          >
            <Music size={16} />
            SDA Hymnal
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ══ BIBLE TAB ══ */}
        {tab === 'bible' && (
          <div className="p-4 md:p-6 space-y-4">
            {/* Daily Manna */}
            <div className="bg-[#0A1628] rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#D4A843]/10 -mr-10 -mt-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-6 -mb-6" />
              <div className="relative z-10">
                <span className="text-[#D4A843] text-[10px] font-extrabold uppercase tracking-[0.2em] block mb-3">Daily Manna</span>
                <p className="text-white text-base leading-relaxed italic font-serif mb-4">{dailyVerse.text}</p>
                <span className="text-white/40 text-xs font-bold">— {dailyVerse.ref}</span>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={bibleSearch}
                onChange={e => { setBibleSearch(e.target.value); setBibleMode(e.target.value ? 'search' : 'read'); }}
                placeholder="Search the Bible..."
                className="w-full bg-white rounded-2xl pl-10 pr-4 py-3.5 text-sm font-medium text-[#0A1628] placeholder:text-gray-400 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4A843]/40 shadow-sm transition"
              />
            </div>

            {/* ── Search Results ── */}
            {bibleMode === 'search' && (
              <div className="space-y-2">
                {bibleSearchResults.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8 font-medium">No results for "{bibleSearch}"</p>
                ) : (
                  bibleSearchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const book = kjvData.books.find(b => b.name === r.book)!;
                        const ch = book.chapters.find(c => c.chapter === r.chapter)!;
                        setSelectedBook(book);
                        setSelectedChapter(ch);
                        setBibleSearch('');
                        setBibleMode('read');
                      }}
                      className="w-full text-left bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-[#D4A843] transition-all"
                    >
                      <p className="text-[11px] font-extrabold text-[#D4A843] mb-1">{r.book} {r.chapter}:{r.verse}</p>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 font-serif">{r.text}</p>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ── Book selector row ── */}
            {bibleMode !== 'search' && (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBibleMode(bibleMode === 'books' ? 'read' : 'books')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all',
                      bibleMode === 'books'
                        ? 'bg-[#0A1628] text-white border-[#0A1628]'
                        : 'bg-white text-[#0A1628] border-gray-100'
                    )}
                  >
                    <BookOpen size={15} />
                    {selectedBook.name}
                  </button>

                  {bibleMode === 'read' && (
                    <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
                      {selectedBook.chapters.map(ch => (
                        <button
                          key={ch.chapter}
                          onClick={() => setSelectedChapter(ch)}
                          className={cn(
                            'w-9 h-9 rounded-xl text-xs font-extrabold shrink-0 transition-all',
                            selectedChapter.chapter === ch.chapter
                              ? 'bg-[#D4A843] text-white'
                              : 'bg-white text-gray-500 border border-gray-100 hover:border-[#D4A843]'
                          )}
                        >
                          {ch.chapter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Book list ── */}
                {bibleMode === 'books' && (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-gray-50">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={bookSearch}
                          onChange={e => setBookSearch(e.target.value)}
                          placeholder="Find book..."
                          className="w-full bg-[#F8F9FA] rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredBooks.map(book => (
                        <button
                          key={book.name}
                          onClick={() => selectBook(book)}
                          className={cn(
                            'w-full text-left px-5 py-3 text-sm font-bold border-b border-gray-50 last:border-0 transition-colors',
                            selectedBook.name === book.name
                              ? 'bg-[#0A1628]/5 text-[#0A1628]'
                              : 'text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          {book.name}
                          <span className="text-gray-400 font-normal text-xs ml-2">{book.chapters.length} ch</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Reading view ── */}
                {bibleMode === 'read' && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-7">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-8 bg-[#D4A843] rounded-full" />
                      <h2 className="text-xl font-extrabold text-[#0A1628] font-display">
                        {selectedBook.name} <span className="text-[#D4A843]">{selectedChapter.chapter}</span>
                      </h2>
                    </div>
                    <div className="space-y-4 font-serif">
                      {selectedChapter.verses.map(v => (
                        <p key={v.verse} className="text-gray-800 leading-relaxed text-[17px]">
                          <sup className="text-[10px] font-extrabold text-[#D4A843] mr-2 not-italic">{v.verse}</sup>
                          {v.text}
                        </p>
                      ))}
                    </div>

                    {/* Chapter navigation */}
                    <div className="flex gap-3 mt-8 pt-6 border-t border-gray-50">
                      <button
                        disabled={selectedChapter.chapter <= 1}
                        onClick={() => {
                          const prev = selectedBook.chapters.find(c => c.chapter === selectedChapter.chapter - 1);
                          if (prev) setSelectedChapter(prev);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#F8F9FA] rounded-xl text-sm font-bold text-[#0A1628] disabled:opacity-30 hover:bg-gray-100 transition"
                      >
                        <ChevronLeft size={16} />
                        Prev
                      </button>
                      <button
                        disabled={selectedChapter.chapter >= selectedBook.chapters.length}
                        onClick={() => {
                          const next = selectedBook.chapters.find(c => c.chapter === selectedChapter.chapter + 1);
                          if (next) setSelectedChapter(next);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0A1628] text-white rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-[#D4A843] transition ml-auto"
                      >
                        Next
                        <ChevronLeft size={16} className="rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ HYMNAL TAB ══ */}
        {tab === 'hymnal' && (
          <div className="p-4 md:p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={hymnSearch}
                onChange={e => setHymnSearch(e.target.value)}
                placeholder="Search hymns by title or number..."
                className="w-full bg-white rounded-2xl pl-10 pr-4 py-3.5 text-sm font-medium text-[#0A1628] placeholder:text-gray-400 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4A843]/40 shadow-sm transition"
              />
            </div>

            {/* Hymn detail view */}
            {selectedHymn ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#0A1628] px-5 py-4 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedHymn(null)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                  <div>
                    <p className="text-[#D4A843] text-[10px] font-extrabold uppercase tracking-widest">No. {selectedHymn.number}</p>
                    <h3 className="text-white font-extrabold font-display">{selectedHymn.title}</h3>
                  </div>
                </div>
                <div className="p-5 md:p-7 space-y-6 font-serif">
                  {selectedHymn.verses.map((v: any, i: number) => {
                    const isRefrain = v.verseNumber === 'R' || String(v.verseNumber).toLowerCase() === 'chorus';
                    return (
                      <div key={i} className={cn('space-y-1', isRefrain && 'bg-[#F8F9FA] rounded-2xl p-4 border-l-4 border-[#D4A843]')}>
                        {!isRefrain && (
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">
                            Verse {v.verseNumber}
                          </p>
                        )}
                        {isRefrain && (
                          <p className="text-[10px] font-extrabold text-[#D4A843] uppercase tracking-widest mb-2">Refrain</p>
                        )}
                        {v.lines.map((line: string, j: number) => (
                          <p key={j} className={cn('text-base leading-relaxed', isRefrain ? 'font-bold text-[#0A1628]' : 'text-gray-700')}>
                            {line}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHymns.slice(0, 50).map(hymn => (
                  <button
                    key={hymn.number}
                    onClick={() => setSelectedHymn(hymn)}
                    className="w-full text-left bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm flex items-center gap-4 hover:border-[#D4A843] transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#F8F9FA] flex items-center justify-center shrink-0 group-hover:bg-[#0A1628] transition-colors">
                      <span className="text-sm font-extrabold text-[#D4A843]">{hymn.number}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-[#0A1628] text-sm font-display truncate">{hymn.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{hymn.verses.length} verses</p>
                    </div>
                    <ChevronLeft size={16} className="text-gray-200 group-hover:text-[#D4A843] rotate-180 transition-colors ml-auto shrink-0" />
                  </button>
                ))}
                {filteredHymns.length > 50 && (
                  <p className="text-center text-xs text-gray-400 py-3 font-medium">
                    Showing 50 of {filteredHymns.length} — refine your search
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
