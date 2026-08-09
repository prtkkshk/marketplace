import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { Search, Bell, Shield } from 'lucide-react';
import { PostChooserSheet } from './PostChooserSheet';
import { Button } from '../ui/Button';

export const DesktopHeader: React.FC = () => {
 const { isAdmin, profile } = useAuth();
 const location = useLocation();
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const [isChooserOpen, setIsChooserOpen] = useState<boolean>(false);
 const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
 const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

 const isHomeActive = location.pathname === '/';
 const isWantedActive = location.pathname === '/wanted';

 useEffect(() => {
 setSearchQuery(searchParams.get('q') || '');
 }, [searchParams]);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
 e.preventDefault();
 document.getElementById('desktop-search')?.focus();
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 const handleSearchSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (searchQuery.trim()) {
 navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
 } else {
 navigate(`/`);
 }
 };

 return (
 <>
 <header className="hidden md:flex sticky top-0 z-40 bg-bg/85  border-b border-line h-16 w-full justify-center">
 <div className="max-w-[1280px] mx-auto w-full px-[34px] flex items-center gap-6">
 {/* Brand */}
 <Link to="/" className="flex items-baseline gap-1.5 hover:opacity-90 transition-opacity">
 <span className="font-display text-[24px] tracking-tight text-ink">KGP</span>
 <span className="font-display text-[24px] text-accent">Bazaar</span>
 </Link>

 {/* Navigation destinations */}
 <nav className="flex items-center gap-0.5 ml-2" aria-label="Desktop main navigation">
 <Link
 to="/"
 className={`px-3.5 py-1.5 rounded-sm text-sm font-bold transition-colors focus-visible:outline-ink ${
 isHomeActive
 ? 'bg-accent text-white shadow-hard'
 : 'text-subtle hover:text-ink hover:bg-surface-2'
 }`}
 >
 Home
 </Link>

 <Link
 to="/wanted"
 className={`px-3.5 py-1.5 rounded-sm text-sm font-bold transition-colors focus-visible:outline-ink ${
 isWantedActive
 ? 'bg-accent text-white shadow-hard'
 : 'text-subtle hover:text-ink hover:bg-surface-2'
 }`}
 >
 Wanted
 </Link>
 </nav>

 {/* Center Search */}
 <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[420px]">
 <div className="relative flex items-center w-full h-[38px] rounded bg-surface border border-line px-[15px] shadow-1 focus-within:ring-2 focus-within:ring-accent/15 focus-within:border-accent transition-all">
 <Search className="w-4 h-4 text-subtle mr-2 shrink-0" />
 <input
 id="desktop-search"
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Cycles, books, calculators..."
 className="flex-1 bg-transparent border-none text-[13.5px] text-ink placeholder:text-subtle min-w-0"
 />
 <kbd className="hidden lg:flex items-center justify-center font-mono text-[10px] font-medium text-subtle border border-line rounded-[5px] px-1.5 py-0.5 ml-2">
 ⌘K
 </kbd>
 </div>
 </form>

 {/* Right Actions */}
 <div className="flex items-center gap-2.5 ml-auto">
 <Button variant="primary" size="md" onClick={() => setIsChooserOpen(true)}>
 Sell
 </Button>

 <button className="w-[33px] h-[33px] rounded border border-line bg-surface flex items-center justify-center text-muted hover:text-ink hover:border-line-strong transition-colors">
 <Bell className="w-4 h-4" />
 </button>

 {/* User Badge / Dropdown */}
 {profile && (
 <div className="relative">
 <button 
 onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
 className="flex items-center gap-2.5 pl-3.5 border-l border-line "
 >
 <div className="w-[33px] h-[33px] rounded bg-accent-wash text-accent font-bold text-[12.5px] flex items-center justify-center border border-ink">
 {profile.fullName ? profile.fullName[0]?.toUpperCase() : 'U'}
 </div>
 <div className="text-left hidden lg:block">
 <span className="font-semibold text-ink text-[12.5px] block leading-tight">{profile.fullName}</span>
 <span className="text-subtle text-[10.5px] font-medium">{profile.hallOfResidence} Hall · {profile.rollNumber}</span>
 </div>
 </button>

 {isUserMenuOpen && (
 <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-line rounded-xl shadow-2 overflow-hidden py-1 z-50">
 <Link to="/profile" className="block px-4 py-2 text-sm text-ink hover:bg-surface-2" onClick={() => setIsUserMenuOpen(false)}>
 Profile
 </Link>
 {isAdmin && (
 <Link to="/admin" className="block px-4 py-2 text-sm text-accent font-medium hover:bg-accent-wash flex items-center gap-2" onClick={() => setIsUserMenuOpen(false)}>
 <Shield className="w-4 h-4" />
 Admin Panel
 </Link>
 )}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </header>

 <PostChooserSheet isOpen={isChooserOpen} onClose={() => setIsChooserOpen(false)} />
 </>
 );
};
