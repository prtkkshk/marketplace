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
    <div className="min-h-screen bg-slate-100/70 text-left antialiased pb-20">
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-brand-light" />
            <span className="font-bold text-base tracking-wide">KGP Marketplace Admin</span>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Student Feed</span>
          </Link>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="bg-slate-800 border-t border-slate-700/60 overflow-x-auto no-scrollbar px-4">
          <div className="max-w-6xl mx-auto flex items-center gap-1 py-1 text-xs font-semibold">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-brand-primary text-white font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};
