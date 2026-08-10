import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { AdminReportsScreen } from './AdminReportsScreen';
import { AdminUsersScreen } from './AdminUsersScreen';
import { AdminListingsScreen } from './AdminListingsScreen';
import { AdminAnnouncementsScreen } from './AdminAnnouncementsScreen';
import { AdminAuditScreen } from './AdminAuditScreen';

export const AdminRoutes: React.FC = () => {
 return (
 <Routes>
 <Route element={<AdminLayout />}>
 <Route path="/" element={<AdminDashboardScreen />} />
 <Route path="/reports" element={<AdminReportsScreen />} />
 <Route path="/users" element={<AdminUsersScreen />} />
 <Route path="/listings" element={<AdminListingsScreen />} />
 <Route path="/announcements" element={<AdminAnnouncementsScreen />} />
 <Route path="/audit" element={<AdminAuditScreen />} />
 </Route>
 </Routes>
 );
};

export default AdminRoutes;
