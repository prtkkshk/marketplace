import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { updateProfile, deleteAccount } from '../../lib/data/profiles';
import { MyListingsTab } from './MyListingsTab';
import { MyRequestsTab } from '../wanted/MyRequestsTab';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Dialog } from '../../components/ui/Dialog';
import { KGP_HALLS } from '../../lib/constants';
import { ShoppingBag, Megaphone, Shield, LogOut, Trash2, Edit3, FileText, Settings, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Stat } from '../../components/ui/Stat';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useQuery } from '@tanstack/react-query';
import { fetchMyListings } from '../../lib/data/listings';
import { fetchSavedListings } from '../../lib/data/saved_items';

export const ProfileScreen: React.FC = () => {
  const { profile, signOut, isAdmin, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'requests' | 'settings'>('listings');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState<string>(profile?.fullName || '');
  const [hall, setHall] = useState<string>(profile?.hallOfResidence || '');
  const [whatsapp, setWhatsapp] = useState<string>(profile?.whatsappNumber || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { data: activeListings = [] } = useQuery({
    queryKey: ['myListings', profile?.id, 'active'],
    queryFn: () => fetchMyListings(profile!.id, 'active'),
    enabled: !!profile?.id,
  });
  const { data: soldListings = [] } = useQuery({
    queryKey: ['myListings', profile?.id, 'sold'],
    queryFn: () => fetchMyListings(profile!.id, 'sold'),
    enabled: !!profile?.id,
  });
  const { data: savedItems = [] } = useQuery({
    queryKey: ['savedItems'],
    queryFn: () => fetchSavedListings(profile!.id),
    enabled: !!profile?.id,
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      await updateProfile(profile.id, {
        fullName,
        hallOfResidence: hall,
        whatsappNumber: whatsapp,
      });

      await refreshProfile();
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      await deleteAccount(profile.id);
      await signOut();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <PageContainer className="pt-4 pb-20">
      {/* Hero */}
      <div className="bg-surface rounded-2xl p-6 mb-6 text-center border border-line shadow-sm relative overflow-hidden">
        <div className="mx-auto w-16 h-16 bg-paper border-2 border-brand rounded-2xl flex items-center justify-center text-ink font-display text-3xl mb-3 shadow-sm">
          {profile?.fullName ? profile.fullName[0]?.toUpperCase() : 'U'}
        </div>
        <h1 className="font-display text-[26px] text-ink leading-tight mb-1">{profile?.fullName || 'Student Profile'}</h1>
        <p className="text-sm text-ink-3 mb-4">{profile?.email}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-surface border border-line text-ink">{profile?.rollNumber}</span>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-surface border border-line text-ink">{profile?.hallOfResidence} Hall</span>
          {isAdmin && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-brand-wash border border-brand-line text-brand">Admin</span>}
        </div>
        
        {/* Stat strip */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-line">
          <Stat value={activeListings.length.toString()} label="Active" className="flex-1 text-center items-center" />
          <div className="w-[1px] h-10 bg-line"></div>
          <Stat value={soldListings.length.toString()} label="Sold" className="flex-1 text-center items-center" />
          <div className="w-[1px] h-10 bg-line"></div>
          <Stat value={savedItems.length.toString()} label="Saved" className="flex-1 text-center items-center" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line mb-6">
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex-1 py-2.5 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'listings'
              ? 'border-brand text-brand'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Listings</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'requests'
              ? 'border-brand text-brand'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Requests</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'settings'
              ? 'border-brand text-brand'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'listings' && profile?.id && <MyListingsTab userId={profile.id} />}
      {activeTab === 'requests' && profile?.id && <MyRequestsTab userId={profile.id} />}
      
      {activeTab === 'settings' && (
        <div className="flex flex-col gap-6 text-left">
          
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <Link to="/rules" className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-line">
              <div className="w-8 h-8 rounded-full bg-brand-wash text-brand flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink">Campus Trading Rules</div>
                <div className="text-xs text-ink-3">Policies and guidelines</div>
              </div>
            </Link>

            <div className="flex items-center justify-between p-4 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-ink flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">Appearance</div>
                  <div className="text-xs text-ink-3">Theme preference</div>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <button 
              onClick={() => {
                setFullName(profile?.fullName || '');
                setHall(profile?.hallOfResidence || '');
                setWhatsapp(profile?.whatsappNumber || '');
                setIsEditing(true);
              }}
              className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 text-ink flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-ink">Edit Profile</div>
                <div className="text-xs text-ink-3">Update your details</div>
              </div>
            </button>
          </div>

          {isAdmin && (
            <div className="bg-surface border border-brand-line rounded-xl overflow-hidden">
              <Link to="/admin" className="flex items-center justify-between p-4 hover:bg-brand-wash transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand text-paper flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand">Admin Panel</div>
                    <div className="text-xs text-brand/80">Manage platform</div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          <div className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-3">
            <Button
              variant="ghost"
              className="w-full text-ink-3 justify-center"
              onClick={() => signOut()}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
            <Button
              variant="ghost"
              className="w-full text-danger hover:bg-danger-wash justify-center"
              onClick={() => setIsDeleting(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Account
            </Button>
          </div>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile">
        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-left">
          {error && <div className="p-3 bg-danger-wash text-danger text-xs rounded-xl">{error}</div>}

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Select
            label="Hall of Residence"
            value={hall}
            onChange={(e) => setHall(e.target.value)}
            options={KGP_HALLS}
            required
          />

          <Input
            label="WhatsApp Contact Number"
            type="tel"
            inputMode="numeric"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+919876543210"
            required
          />

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog isOpen={isDeleting} onClose={() => setIsDeleting(false)} title="Delete Account">
        <div className="text-left flex flex-col gap-4">
          <p className="text-xs text-ink-3 leading-relaxed">
            Are you sure you want to delete your account? This will hide all your active listings and remove your profile data.
          </p>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" isLoading={loading} onClick={handleDeleteAccount}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
};
