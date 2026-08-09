import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminListings, updateListingAdminAction } from '../../lib/data/admin';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../lib/utils/formatINR';
import { timeAgo } from '../../lib/utils/timeAgo';


type AdminListingItem = Awaited<ReturnType<typeof fetchAdminListings>>[0];

export const AdminListingsScreen: React.FC = () => {
 const { session } = useAuth();
 const { showToast } = useToast();

 const [items, setItems] = useState<AdminListingItem[]>([]);
 const [loading, setLoading] = useState<boolean>(true);
 const [statusFilter, setStatusFilter] = useState<string>('all');
 const [actionLoading, setActionLoading] = useState<boolean>(false);

 const loadListings = useCallback(async () => {
 setLoading(true);
 fetchAdminListings(statusFilter)
 .then((data) => setItems(data))
 .catch((err) => showToast(err.message, 'error'))
 .finally(() => setLoading(false));
 }, [statusFilter, showToast]);

 useEffect(() => {
 loadListings();
 }, [loadListings]);

 const handleAdminAction = async (
 id: string,
 action: 'pin' | 'unpin' | 'hide' | 'restore' | 'delete' | 'force_sold'
 ) => {
 if (!session?.user?.id) return;
 setActionLoading(true);
 try {
 await updateListingAdminAction(id, action, `Admin triggered action: ${action}`, session.user.id);
 showToast(`Action "${action}" applied`, 'success');
 loadListings();
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Action failed';
 showToast(msg, 'error');
 } finally {
 setActionLoading(false);
 }
 };

 return (
 <div className="flex flex-col gap-6 text-left">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-xl font-bold text-ink">Content Management</h1>
 <p className="text-xs text-subtle">Manage all campus listings (active, hidden, deleted, pinned)</p>
 </div>

 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-3 py-1.5 bg-surface border border-line rounded-xl text-xs font-semibold text-ink shrink-0"
 >
 <option value="all">All Content</option>
 <option value="active">Active Only</option>
 <option value="sold">Sold Only</option>
 <option value="hidden">Hidden Only</option>
 <option value="deleted">Deleted Only</option>
 </select>
 </div>

 {loading ? (
 <div className="p-12 flex justify-center">
 <Spinner size={32} />
 </div>
 ) : items.length === 0 ? (
 <Card className="p-8 text-center">
 <p className="text-sm font-medium text-ink">No listings match the selected status filter.</p>
 </Card>
 ) : (
 <div className="flex flex-col gap-3">
 {items.map((item) => (
 <Card key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm font-bold text-ink">{item.title}</span>
 <span className="text-sm font-black text-accent">{formatINR(item.price)}</span>
 {item.is_pinned && <Badge variant="default">PINNED</Badge>}
 {item.deleted_at ? (
 <Badge variant="default">DELETED</Badge>
 ) : (
 <Badge variant={item.status === 'active' ? 'success' : 'default'}>
 {item.status.toUpperCase()}
 </Badge>
 )}
 </div>

 <div className="text-xs text-subtle">
 Seller: <strong>{item.profiles?.full_name || 'Student'}</strong> • {item.hall_of_residence} Hall • Listed {timeAgo(item.created_at)}
 </div>
 </div>

 {/* Action Toolbar */}
 <div className="flex items-center gap-1.5 flex-wrap shrink-0">
 {item.is_pinned ? (
 <Button variant="secondary" size="sm" onClick={() => handleAdminAction(item.id, 'unpin')} disabled={actionLoading}>
 Unpin
 </Button>
 ) : (
 <Button variant="secondary" size="sm" onClick={() => handleAdminAction(item.id, 'pin')} disabled={actionLoading} >
 Pin to Feed
 </Button>
 )}

 {item.status === 'active' && (
 <Button variant="secondary" size="sm" onClick={() => handleAdminAction(item.id, 'force_sold')} disabled={actionLoading} >
 Force Sold
 </Button>
 )}

 {item.status === 'hidden' && !item.deleted_at && (
 <Button variant="secondary" size="sm" onClick={() => handleAdminAction(item.id, 'restore')} disabled={actionLoading} >
 Restore
 </Button>
 )}
 
 {item.status !== 'hidden' && !item.deleted_at && (
 <Button variant="secondary" size="sm" onClick={() => handleAdminAction(item.id, 'hide')} disabled={actionLoading} >
 Hide
 </Button>
 )}

 <Button variant="secondary" size="sm" onClick={() => handleAdminAction(item.id, 'delete')} disabled={actionLoading} >
 Delete
 </Button>
 </div>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
};
