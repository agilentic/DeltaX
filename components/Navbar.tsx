
import React from 'react';

interface NavbarProps {
  currentView: string;
  setView: (view: any) => void;
  streak: number;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, streak }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'practice', label: 'Practice' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'tutor', label: 'AI Tutor' },
    { id: 'booking', label: 'Coaching' },
    { id: 'ailab', label: 'AI Lab' },
    { id: 'marketplace', label: 'Shop' },
    { id: 'leaderboard', label: 'Ranks' },
  ];

  return (
    <nav className="glass sticky top-0 z-[100] border-b border-gray-200/50">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('dashboard')}>
          <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center transition-transform group-hover:scale-110">
            <span className="text-white font-bold text-sm">dx</span>
          </div>
          <span className="font-semibold text-[17px] tracking-tight text-gray-900">MathMaster</span>
        </div>

        <div className="hidden md:flex items-center gap-7">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setView(item.id)}
              className={`text-[13px] font-medium transition-colors ${currentView === item.id ? 'text-blue-600' : 'text-gray-500 hover:text-black'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
            <span className="text-xs">🔥</span>
            <span className="text-[12px] font-bold text-orange-700">{streak}</span>
          </div>
          <button 
            onClick={() => setView('settings')}
            className="p-1 text-gray-400 hover:text-black transition-colors"
          >
            ⚙️
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
