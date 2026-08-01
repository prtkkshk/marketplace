import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { updateProfile, deleteAccount } from '../../lib/data/profiles';
import { MyListingsTab } from './MyListingsTab';
import { MyRequestsTab } from '../wanted/MyRequestsTab';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { KGP_HALLS } from '../../lib/constants';
import { Link } from 'react-router-dom';
import { User, LogOut, Shield, Trash2, Edit3, Heart, ShoppingBag, Radio } from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { profile, isAdmin, signOut, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'listings' | 'requests' | 'saved' | 'settings'>('listings');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Edit form state
  const [fullName, setFullName] = useState<string>(profile?.fullName || '');
  const [hall, setHall] = useState<string>(profile?.hallOfResidence || '');
  const [whatsapp, setWhatsapp] = useState<string>(profile?.whatsappNumber || '');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSaveLoading(true);
    setSaveError(null);

    try {
      await updateProfile(profile.id, {
        fullName,
        hallOfResidence: hall,
        whatsappNumber: whatsapp,
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setSaveError(msg);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    try {
      await deleteAccount(profile.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      alert(msg);
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

        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between">
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
          <Radio className="w-4 h-4" />
          <span>My Requests</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-2.5 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'saved'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'settings'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'listings' && profile?.id && <MyListingsTab userId={profile.id} />}
      {activeTab === 'requests' && profile?.id && <MyRequestsTab userId={profile.id} />}

      {activeTab === 'saved' && (
        <div className="p-8 text-center bg-surface-card border border-surface-border rounded-2xl">
          <Heart className="w-10 h-10 text-content-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-content-primary">No saved items</p>
          <p className="text-xs text-content-muted mt-1">Items you bookmark will appear here.</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-4 flex flex-col gap-3">
          <Button variant="outline" className="w-full justify-start text-content-primary" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>

          <Button variant="danger" className="w-full justify-start" onClick={() => setIsDeleting(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-sm text-left">
            <h2 className="text-lg font-bold text-content-primary mb-4">Edit Profile</h2>

            {saveError && <p className="text-xs text-status-danger mb-3">{saveError}</p>}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <Select label="Hall of Residence" value={hall} onChange={(e) => setHall(e.target.value)} options={KGP_HALLS} />
              <Input label="WhatsApp Number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />

              <div className="flex gap-2 justify-end mt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={saveLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-sm text-center">
            <Trash2 className="w-10 h-10 text-status-danger mx-auto mb-3" />
            <h2 className="text-lg font-bold text-content-primary mb-2">Delete Account?</h2>
            <p className="text-xs text-content-muted mb-6">
              This will permanently delete your profile, listings, wanted requests, and uploaded photos. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsDeleting(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleDeleteAccount}>
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
