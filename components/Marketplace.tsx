
import React, { useState, useEffect } from 'react';
import { Book, Transaction, Wishlist } from '../types';
import { generateBookCover } from '../services/gemini';

interface MarketplaceProps {
  onPurchase: (tx: Transaction) => void;
  wishlists: Wishlist[];
  onAddToWishlist: (bookId: string, wishlistId: string) => void;
  onCreateWishlist: (name: string) => void;
  recentlyViewed: string[];
  onViewBook: (bookId: string) => void;
}

const MOCK_BOOKS: Book[] = [
  { 
    id: '1', title: 'GCSE Higher Math Mastery', author: 'Dr. Sarah Newton', price: 19.99, category: 'Textbook', 
    image: '', rating: 4.8, featured: true, publishedDate: '2024-01-15',
    reviews: [{ user: 'Alex', rating: 5, comment: 'Excellent clarity!' }] 
  },
  { 
    id: '2', title: 'Target Grade 9 Revision', author: 'Edexcel Press', price: 14.50, category: 'Revision', 
    image: '', rating: 4.5, publishedDate: '2023-11-20',
    reviews: [{ user: 'Maya', rating: 4, comment: 'Very concise.' }] 
  },
  { 
    id: '3', title: 'Algebra & Calculus Workbook', author: 'MathMaster AI', price: 12.00, category: 'Workbook', 
    image: '', rating: 4.9, featured: true, publishedDate: '2024-03-01',
    reviews: [{ user: 'Sam', rating: 5, comment: 'Perfect practice.' }] 
  },
  { 
    id: '4', title: 'OCR Statistics Simplified', author: 'Alan Turing Jr.', price: 16.99, category: 'Textbook', 
    image: '', rating: 4.2, publishedDate: '2023-08-10',
    reviews: [{ user: 'Chris', rating: 4, comment: 'Solid foundation.' }] 
  }
];

const Marketplace: React.FC<MarketplaceProps> = ({ 
  onPurchase, 
  wishlists, 
  onAddToWishlist, 
  onCreateWishlist,
  recentlyViewed,
  onViewBook
}) => {
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | 'date' | 'relevance'>('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [minRating, setMinRating] = useState<number>(0);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [showWishlistMenu, setShowWishlistMenu] = useState<string | null>(null);
  const [newWishlistName, setNewWishlistName] = useState('');

  useEffect(() => {
    const enrichCovers = async () => {
      setLoadingCovers(true);
      const enriched = await Promise.all(books.map(async b => {
        if (!b.image) {
          const cover = await generateBookCover(b.title, b.category);
          return { ...b, image: cover };
        }
        return b;
      }));
      setBooks(enriched);
      setLoadingCovers(false);
    };
    enrichCovers();
  }, []);

  const handleBuy = (book: Book) => {
    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      item: book.title,
      amount: book.price,
      date: new Date().toISOString(),
      type: 'Book'
    };
    onPurchase(tx);
  };

  const filteredBooks = books
    .filter(b => (filter === 'All' || b.category === filter))
    .filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))
    .filter(b => b.price >= priceRange[0] && b.price <= priceRange[1])
    .filter(b => b.rating >= minRating)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'date') return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      return 0;
    });

  const recentBooks = books.filter(b => recentlyViewed.includes(b.id));

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto py-8">
      <header className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">Resource Shop</h1>
            <p className="text-gray-500 font-medium">Elevate your math potential with curated materials.</p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <input 
              type="text" 
              placeholder="Search title, author..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none w-64 shadow-sm"
            />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="date">Newest Arrivals</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-3xl apple-shadow border border-gray-100">
           <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price Limit (£{priceRange[1]})</p>
              <input type="range" min="0" max="100" value={priceRange[1]} onChange={(e) => setPriceRange([0, parseInt(e.target.value)])} className="w-full accent-blue-600" />
           </div>
           <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Min Rating ({minRating}★)</p>
              <div className="flex gap-2">
                 {[1,2,3,4,5].map(r => (
                   <button key={r} onClick={() => setMinRating(r)} className={`px-3 py-1 rounded-lg text-xs font-bold ${minRating >= r ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}>{r}★</button>
                 ))}
                 <button onClick={() => setMinRating(0)} className="text-[10px] text-blue-600 font-bold">Clear</button>
              </div>
           </div>
           <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collection</p>
              <div className="flex gap-1">
                 {['All', 'Textbook', 'Revision', 'Workbook'].map(c => (
                   <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filter === c ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>{c}</button>
                 ))}
              </div>
           </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredBooks.map(book => (
          <div key={book.id} className="apple-card apple-shadow overflow-hidden bg-white border border-gray-100 flex flex-col h-full" onClick={() => onViewBook(book.id)}>
            <div className="relative h-56 bg-gray-50 overflow-hidden">
               {book.image ? <img src={book.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full opacity-20 text-4xl">📚</div>}
               <div className="absolute top-4 right-4 group">
                  <button className="p-2 bg-white/90 backdrop-blur rounded-full shadow hover:bg-white transition">🔖</button>
                  <div className="hidden group-hover:block absolute right-0 mt-2 bg-white border rounded-xl shadow-xl p-2 z-50 min-w-[150px]">
                    <p className="text-[9px] font-bold text-gray-400 uppercase p-2">Add to Wishlist</p>
                    {wishlists.map(w => (
                      <button key={w.id} onClick={(e) => { e.stopPropagation(); onAddToWishlist(book.id, w.id); }} className="w-full text-left p-2 hover:bg-blue-50 text-xs rounded-lg font-medium">{w.name}</button>
                    ))}
                    <div className="p-2 border-t mt-2">
                       <input type="text" placeholder="New list..." value={newWishlistName} onChange={(e) => setNewWishlistName(e.target.value)} className="w-full text-[10px] border rounded p-1 mb-1" />
                       <button onClick={(e) => { e.stopPropagation(); onCreateWishlist(newWishlistName); setNewWishlistName(''); }} className="text-[10px] text-blue-600 font-bold">Create</button>
                    </div>
                  </div>
               </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
               <div className="space-y-1">
                  <div className="flex justify-between items-start">
                     <h3 className="font-bold text-gray-900 truncate pr-2">{book.title}</h3>
                     <span className="font-bold text-blue-600 text-sm">£{book.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-400">{book.author}</p>
               </div>
               
               <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-50">
                  <div className="flex items-center gap-1.5 mb-1">
                     <span className="text-yellow-500 text-xs">★</span>
                     <span className="text-xs font-bold text-gray-800">{book.rating}</span>
                  </div>
                  {book.reviews[0] && (
                    <p className="text-[10px] text-gray-500 italic truncate">"{book.reviews[0].comment}"</p>
                  )}
               </div>

               <button onClick={(e) => { e.stopPropagation(); handleBuy(book); }} className="w-full py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition shadow-sm">Add to Basket</button>
            </div>
          </div>
        ))}
      </div>

      {/* Recently Viewed */}
      {recentBooks.length > 0 && (
        <section className="pt-12 border-t border-gray-100">
          <h2 className="text-xl font-bold mb-8">Recently Viewed</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
            {recentBooks.map(book => (
              <div key={`recent-${book.id}`} className="flex-shrink-0 w-48 apple-card apple-shadow bg-white p-4 space-y-3 cursor-pointer" onClick={() => onViewBook(book.id)}>
                <div className="h-40 bg-gray-50 rounded-xl overflow-hidden">
                   <img src={book.image} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-xs truncate">{book.title}</h4>
                <p className="text-[10px] text-blue-600 font-bold">£{book.price}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Marketplace;
