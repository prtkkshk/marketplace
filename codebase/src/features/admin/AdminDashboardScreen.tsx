import React, { useState, useEffect } from 'react';
import { fetchDashboardStats, type DashboardStats } from '../../lib/data/admin';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Users, ShoppingBag, CheckCircle, Megaphone, Flag, UserPlus, Activity } from 'lucide-react';
import { timeAgo } from '../../lib/utils/timeAgo';

export const AdminDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardStats()
      .then((data: DashboardStats) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!stats) return null;

  const maxCatCount = Math.max(...stats.categoryDistribution.map((c: { category: string; count: number }) => c.count), 1);
  const maxHallCount = Math.max(...stats.hallDistribution.map((h: { hall: string; count: number }) => h.count), 1);

  return (
    <div className="flex flex-col gap-6 text-left">
      <h1 className="text-xl font-bold text-ink">Dashboard & Analytics</h1>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-3 mb-2">
            <span className="text-[11px] font-bold uppercase">Students</span>
            <Users className="w-4 h-4 text-brand" />
          </div>
          <span className="text-2xl font-black text-ink">{stats.totalStudents}</span>
          <span className="text-[10px] text-ink-3 mt-1">+{stats.signupsToday} today</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-3 mb-2">
            <span className="text-[11px] font-bold uppercase">Active Items</span>
            <ShoppingBag className="w-4 h-4 text-whats" />
          </div>
          <span className="text-2xl font-black text-ink">{stats.activeListingsCount}</span>
          <span className="text-[10px] text-ink-3 mt-1">For sale on feed</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-3 mb-2">
            <span className="text-[11px] font-bold uppercase">Sold Items</span>
            <CheckCircle className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-2xl font-black text-ink">{stats.soldListingsCount}</span>
          <span className="text-[10px] text-ink-3 mt-1">Closed deals</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-3 mb-2">
            <span className="text-[11px] font-bold uppercase">Open Wanted</span>
            <Megaphone className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-ink">{stats.openRequestsCount}</span>
          <span className="text-[10px] text-ink-3 mt-1">Wanted requests</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-rose-200 bg-rose-50/40">
          <div className="flex items-center justify-between text-danger mb-2">
            <span className="text-[11px] font-bold uppercase">Reports</span>
            <Flag className="w-4 h-4 text-danger" />
          </div>
          <span className="text-2xl font-black text-danger">{stats.pendingReportsCount}</span>
          <span className="text-[10px] text-danger font-medium mt-1">Pending action</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-3 mb-2">
            <span className="text-[11px] font-bold uppercase">Signups</span>
            <UserPlus className="w-4 h-4 text-brand" />
          </div>
          <span className="text-2xl font-black text-ink">{stats.signupsThisWeek}</span>
          <span className="text-[10px] text-ink-3 mt-1">Past 7 days</span>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <h3 className="text-xs font-bold uppercase text-ink-3 tracking-wider mb-4">Listings by Category</h3>
          <div className="flex flex-col gap-3">
            {stats.categoryDistribution.map((cat: { category: string; count: number }) => (
              <div key={cat.category} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between font-semibold text-ink">
                  <span className="capitalize">{cat.category}</span>
                  <span>{cat.count}</span>
                </div>
                <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden border border-line">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Hall Breakdown */}
        <Card>
          <h3 className="text-xs font-bold uppercase text-ink-3 tracking-wider mb-4">Listings by Hall</h3>
          <div className="flex flex-col gap-3">
            {stats.hallDistribution.slice(0, 6).map((hall: { hall: string; count: number }) => (
              <div key={hall.hall} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between font-semibold text-ink">
                  <span>{hall.hall} Hall</span>
                  <span>{hall.count}</span>
                </div>
                <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden border border-line">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all duration-500"
                    style={{ width: `${(hall.count / maxHallCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-brand" />
          <h3 className="text-xs font-bold uppercase text-ink-3 tracking-wider">Recent Activity Feed</h3>
        </div>

        <div className="flex flex-col gap-2 divide-y divide-line">
          {stats.recentActivity.map((act: { action: string; time: string }, index: number) => (
            <div key={index} className="pt-2 flex items-center justify-between text-xs text-ink">
              <span>{act.action}</span>
              <span className="text-[10px] text-ink-3 shrink-0 ml-2">{timeAgo(act.time)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
