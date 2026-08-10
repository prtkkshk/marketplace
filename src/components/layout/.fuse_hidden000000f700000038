import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, Megaphone, Heart, Plus } from 'lucide-react';
import { PostChooserSheet } from './PostChooserSheet';

/**
 * Mobile bottom navigation.
 *
 * Layout: a FIVE-column grid — Home · Wanted · [Sell] · Saved · Profile.
 *
 * The previous version used `justify-between` with two items on the left and one on the
 * right, which put the Sell button visibly right of centre. PRODUCT_SPEC §3 calls for a
 * "raised centre" action, and a centred item needs an equal number of siblings either side.
 * Adding Saved as the fourth destination both balances the grid and fixes a real gap:
 * Saved Items was previously reachable only by going through Profile.
 *
 * Contrast: inactive items use `text-muted` (5.6:1) rather than `text-ink opacity-55`.
 * The .55 opacity figure in DESIGN_SYSTEM.md was derived for ICONS against the 3:1
 * non-text requirement (1.4.11). These items also carry a 10px text label, and small text
 * needs 4.5:1 — opacity-55 gives roughly 3.7:1 and fails for the label. `text-muted`
 * clears both thresholds with one token and no opacity maths.
 */

type NavDestination = {
 path: string;
 label: string;
 icon: typeof Home;
 /** Treat nested routes as active, e.g. /profile/edit should still light up Profile. */
 matchPrefix?: boolean;
};

const LEFT: NavDestination[] = [
 { path: '/', label: 'Home', icon: Home },
 { path: '/wanted', label: 'Wanted', icon: Megaphone },
];

const RIGHT: NavDestination[] = [
 { path: '/profile/saved', label: 'Saved', icon: Heart },
 { path: '/profile', label: 'Profile', icon: User, matchPrefix: true },
];

export const BottomNav: React.FC = () => {
 const location = useLocation();
 const [isChooserOpen, setIsChooserOpen] = useState<boolean>(false);

 const isActive = (item: NavDestination): boolean => {
 if (item.path === '/profile') {
 // Profile must NOT claim /profile/saved, which is its own destination.
 return location.pathname === '/profile';
 }
 return item.matchPrefix
 ? location.pathname.startsWith(item.path)
 : location.pathname === item.path;
 };

 const renderItem = (item: NavDestination) => {
 const active = isActive(item);
 const Icon = item.icon;
 return (
 <NavLink
 key={item.path}
 to={item.path}
 aria-current={active ? 'page' : undefined}
 className={[
 // 44px minimum target in BOTH axes — WCAG 2.2 target size. The icon is 22px;
 // the rest is padding, and it must not be trimmed to tighten the bar.
 'flex min-h-tap min-w-tap flex-col items-center justify-center gap-0.5 rounded',
 'transition-colors duration-press ease-press',
 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
 active ? 'text-accent' : 'text-muted',
 ].join(' ')}
 >
 <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 2} aria-hidden="true" />
 <span className="text-[10px] font-bold leading-none">{item.label}</span>
 </NavLink>
 );
 };

 return (
 <>
 <nav
 className="fixed bottom-0 left-0 z-40 w-full border-t-[1.5px] border-ink bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
 aria-label="Main"
 >
 <div className="grid grid-cols-5 items-center px-2 py-1.5">
 {LEFT.map(renderItem)}

 {/* Raised centre action. Not a NavLink — it opens a chooser sheet rather than
 navigating, so it is a button and is labelled, not an anonymous "+". */}
 <div className="flex justify-center">
 <button
 type="button"
 onClick={() => setIsChooserOpen(true)}
 aria-haspopup="dialog"
 aria-expanded={isChooserOpen}
 className={[
 'press flex min-h-tap items-center justify-center gap-1 rounded px-4',
 'border-[1.5px] border-ink bg-accent text-white',
 'text-[13px] font-extrabold tracking-[0.01em]',
 'active:bg-accent-press',
 ].join(' ')}
 >
 <Plus className="h-4 w-4" aria-hidden="true" />
 Sell
 </button>
 </div>

 {RIGHT.map(renderItem)}
 </div>
 </nav>

 <PostChooserSheet isOpen={isChooserOpen} onClose={() => setIsChooserOpen(false)} />
 </>
 );
};
