import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { fetchPendingReportsCount, subscribeToReportsChange } from '../../lib/data/reports';
import { Shield, LayoutDashboard, Flag, Users, Package, Megaphone, FileText, ArrowLeft } from 'lucide-react';

export const AdminLayout: React.FC = () => {
 const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);

 const loadPendingCount = async () => {
 const count = await fetchPendingReportsCount();
 setPendingReportsCount(count);
 };

 useEffect(() => {
 loadPendingCount();
 // Subscribe to realtime report updates
 const unsubscribe = subscribeToReportsChange(() => {
 loadPendingCount();
 });
 return () => unsubscribe();
 }, []);

 const adminNav = [
 { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
 { path: '/admin/reports', label: 'Moderation', icon: Flag, badge: pendingReportsCount },
 { path: '/admin/users', label: 'Users', icon: Users },
 { path: '/admin/listings', label: 'Content', icon: Package },
 { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
 { path: '/admin/audit', label: 'Audit Log', icon: FileText },
 ];

 return (
 <div className="min-h-screen bg-bg text-left antialiased flex flex-col md:flex-row">
 {/* Left Sidebar (Desktop) / Top Nav (Mobile) */}
 <aside className="w-full md:w-64 bg-surface-2 border-r border-line md:min-h-screen flex flex-col shrink-0">
 <div className="p-4 border-b border-line flex items-center justify-between md:justify-start gap-3 sticky top-0 z-40 bg-surface-2">
 <div className="flex items-center gap-2">
 <Shield className="w-5 h-5 text-accent" />
 <span className="font-bold text-sm text-ink tracking-wide">KGP Admin</span>
 </div>
 <Link
 to="/"
 className="md:hidden flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors bg-surface px-2 py-1 rounded-lg border border-line"
 >
 <ArrowLeft className="w-3.5 h-3.5" />
 <span>Feed</span>
 </Link>
 </div>

 <nav className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar p-2 flex md:flex-col gap-1 border-b border-line md:border-b-0">
 {adminNav.map((item) => {
 const Icon = item.icon;
 return (
 <NavLink
 key={item.path}
 to={item.path}
 end={item.exact}
 className={({ isActive }) =>
 `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-xs font-semibold ${
 isActive
 ? 'bg-surface text-accent shadow-1 border border-line'
 : 'text-muted hover:text-ink hover:bg-surface-2 border border-transparent'
 }`
 }
 >
 <Icon className="w-4 h-4 shrink-0" />
 <span>{item.label}</span>
 {item.badge !== undefined && item.badge > 0 && (
 <span className="ml-auto px-1.5 py-0.5 rounded bg-danger text-white text-[10px] font-extrabold">
 {item.badge}
 </span>
 )}
 </NavLink>
 );
 })}
 </nav>

 <div className="hidden md:block p-4 border-t border-line mt-auto">
 <Link
 to="/"
 className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Return to Student Feed</span>
 </Link>
 </div>
 </aside>

 {/* Main Content Area */}
 <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[100vw] md:max-w-[calc(100vw-16rem)]">
 <div className="max-w-4xl mx-auto">
 <Outlet />
 </div>
 </div>
 </div>
 );
};
