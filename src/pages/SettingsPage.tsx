import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'profile' | 'bank' | 'security' | 'notifications'>('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from('users').update({ display_name: displayName, phone }).eq('id', user!.id);
    await refreshProfile();
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPassword !== confirmNew) { setPasswordMsg('Passwords do not match'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(error ? error.message : 'Password updated successfully');
    setCurrentPassword(''); setNewPassword(''); setConfirmNew('');
  };

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'bank', label: 'Bank Accounts' },
    { key: 'security', label: 'Security' },
    { key: 'notifications', label: 'Notifications' },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="nexol-card p-6 space-y-5 max-w-lg">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="nexol-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email</label>
            <input type="email" value={user?.email ?? ''} className="nexol-input opacity-60" readOnly />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="nexol-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">KYC Status</label>
            <span className={profile?.kyc_status === 'verified' ? 'nexol-badge-success' : profile?.kyc_status === 'rejected' ? 'nexol-badge-error' : 'nexol-badge-pending'}>
              {profile?.kyc_status ?? 'unknown'}
            </span>
          </div>
          <button onClick={saveProfile} disabled={saving} className="nexol-btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'security' && (
        <div className="nexol-card p-6 space-y-5 max-w-lg">
          <h3 className="font-semibold text-foreground">Change Password</h3>
          {passwordMsg && <div className="text-sm text-primary">{passwordMsg}</div>}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="nexol-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="nexol-input" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Confirm New Password</label>
            <input type="password" value={confirmNew} onChange={(e) => setConfirmNew(e.target.value)} className="nexol-input" />
          </div>
          <button onClick={changePassword} className="nexol-btn-primary">Update Password</button>
        </div>
      )}

      {tab === 'bank' && (
        <div className="nexol-card p-6 max-w-lg">
          <p className="text-muted-foreground text-sm">Manage your bank accounts from the Wallet & Off-Ramp page.</p>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="nexol-card p-6 space-y-4 max-w-lg">
          <h3 className="font-semibold text-foreground">Notification Preferences</h3>
          {['Email when scheduler releases funds', 'Email when vault unlocks', 'Email when withdrawal completes', 'Email when gift card approved'].map((label) => (
            <label key={label} className="flex items-center justify-between text-sm text-foreground">
              <span>{label}</span>
              <input type="checkbox" defaultChecked className="accent-primary" />
            </label>
          ))}
          <button className="nexol-btn-primary">Save Preferences</button>
        </div>
      )}
    </div>
  );
}
