import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import paymentService from '../api/paymentService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Settings() {
  const { user } = useAuth();
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
      await paymentService.updateUpiId(upiId);
      showToast('UPI ID saved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
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
        <p className="text-text-muted text-sm mb-4">
          Your account details
        </p>
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
        <h2 className="font-semibold mb-1">Payment Settings</h2>
        <p className="text-text-muted text-sm mb-4">
          If you own groups, members will pay to this UPI ID. Set your UPI ID below to receive payments.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="UPI ID"
            type="text"
            placeholder="yourname@upi"
            value={upiId}
            onChange={(e) => {
              setUpiId(e.target.value);
              setError('');
            }}
          />
          <p className="text-text-muted text-xs">
            Example: name@paytm, name@okicici, name@ybl
          </p>
          <Button type="submit" loading={saving} className="w-full">
            Save UPI ID
          </Button>
        </form>

        {user?.upiId && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">
              UPI ID configured: <span className="font-medium">{user.upiId}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
