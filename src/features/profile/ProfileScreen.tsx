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
import { ShoppingBag, Megaphone, Bookmark, Shield, LogOut, Trash2, Edit3, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfileScreen: React.FC = () => {
  const { profile, signOut, isAdmin, refetchProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'requests' | 'saved'>('listings');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState<string>(profile?.fullName || '');
  const [hall, setHall] = useState<string>(profile?.hallOfResidence || '');
  const [whatsapp, setWhatsapp] = useState<string>(profile?.whatsappNumber || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

      await refetchProfile();
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
    <div className="min-h-screen bg-surface-bg pb-20 pt-4 px-4 max-w-lg mx-auto">
      {/* Header Profile Info Card */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm mb-6 text-left">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-wash rounded-full flex items-center justify-center text-brand-primary text-xl font-bold">
              {profile?.fullName ? profile.fullName[0]?.toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-content-primary">{profile?.fullName || 'Student Profile'}</h1>
              <p className="text-xs text-content-muted">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-content-primary">
                  {profile?.rollNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-wash text-brand-primary">
                  {profile?.hallOfResidence} Hall
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setFullName(profile?.fullName || '');
              setHall(profile?.hallOfResidence || '');
              setWhatsapp(profile?.whatsappNumber || '');
              setIsEditing(true);
            }}
            className="p-2 rounded-xl text-content-muted hover:text-brand-primary hover:bg-slate-50 transition-colors"
            title="Edit Profile"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        </div>

        {/* Action Links Row */}
        <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between">
          <Link
            to="/rules"
            className="text-xs font-semibold text-content-muted hover:text-brand-primary flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-brand-primary" />
            <span>Campus Trading Rules & Policy</span>
          </Link>
        </div>

        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-brand-primary">
              <Shield className="w-4 h-4" />
              <span>Administrator Privileges</span>
            </div>
            <Link
              to="/admin"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-sky-700 transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-6">
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex-1 py-2.5 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'listings'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>My Listings</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'requests'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>My Requests</span>
        </button>

        <Link
          to="/profile/saved"
          className="flex-1 py-2.5 text-xs font-medium border-b-2 border-transparent text-content-muted hover:text-content-primary flex items-center justify-center gap-1.5 transition-colors"
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved</span>
        </Link>
      </div>

      {/* Tab Panels */}
      {activeTab === 'listings' && profile?.id && <MyListingsTab userId={profile.id} />}
      {activeTab === 'requests' && profile?.id && <MyRequestsTab userId={profile.id} />}

      {/* Account Actions */}
      <div className="mt-12 pt-6 border-t border-surface-border flex flex-col gap-3">
        <Button
          variant="ghost"
          className="w-full text-content-muted justify-center"
          onClick={() => signOut()}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Sign Out
        </Button>

        <Button
          variant="ghost"
          className="w-full text-status-danger hover:bg-rose-50 justify-center"
          onClick={() => setIsDeleting(true)}
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Delete Account
        </Button>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profile">
        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-left">
          {error && <div className="p-3 bg-rose-50 text-status-danger text-xs rounded-xl">{error}</div>}

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
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+919876543210"
            required
          />

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
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
          <p className="text-xs text-content-muted leading-relaxed">
            Are you sure you want to delete your account? This will hide all your active listings and remove your profile data.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" isLoading={loading} onClick={handleDeleteAccount}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
