import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import paymentService from '../api/paymentService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(!user?.upiId);
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updatedUser = await paymentService.updateUpiId(upiId);
      updateUser(updatedUser);
      setEditing(false);
      showToast('UPI ID saved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUpiId(user?.upiId || '');
    setEditing(false);
    setError('');
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-accent text-black px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-text-secondary text-sm mb-8">
        Manage your account and payment preferences.
      </p>

      <div className="bg-surface-card border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-1">Profile</h2>
        <p className="text-text-muted text-sm mb-4">Your account details</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Name</label>
            <div className="px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-sm text-text-primary">
              {user?.name}
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Email</label>
            <div className="px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-sm text-text-primary">
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-card border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold">Payment Settings</h2>
          {user?.upiId && !editing && (
            <button
              onClick={() => { setEditing(true); setError(''); }}
              className="text-accent hover:text-accent-hover text-sm"
            >
              Edit
            </button>
          )}
        </div>
        <p className="text-text-muted text-sm mb-4">
          If you own groups, members will pay to this UPI ID.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="UPI ID"
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => { setUpiId(e.target.value); setError(''); }}
            />
            <p className="text-text-muted text-xs">
              Example: name@paytm, name@okicici, name@ybl
            </p>
            <div className="flex gap-2">
              <Button type="submit" loading={saving} className="flex-1">
                Save
              </Button>
              {user?.upiId && (
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving} className="flex-1">
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : user?.upiId ? (
          <div className="p-4 bg-surface-light rounded-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted mb-1">Your UPI ID</p>
              <p className="text-sm font-medium text-accent">{user.upiId}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        ) : (
          <p className="text-text-secondary text-sm">
            No UPI ID configured. Add one to receive payments from group members.
          </p>
        )}
      </div>
    </div>
  );
}
