import { useState } from 'react';
import api from '../../api/axios';
import Button from './Button';

const QR_API = 'https://api.qrserver.com/v1/create-qr-code';

export default function InviteModal({ group, isOwner, onClose, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const inviteLink = `${window.location.origin}/join?code=${group.inviteCode}`;
  const qrUrl = `${QR_API}/?size=200x200&data=${encodeURIComponent(inviteLink)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.getElementById('invite-link-input');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join "${group.name}" on SplitSync`,
          text: `Join my "${group.name}" group on SplitSync! Use invite code: ${group.inviteCode}`,
          url: inviteLink,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerating the invite code will invalidate the previous one. Continue?')) return;
    setRegenerating(true);
    try {
      const { data } = await api.put(`/groups/${group._id}/invite`);
      onUpdate(data.data.inviteCode);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to regenerate invite code');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-surface-card border border-white/10 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Invite Members</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none">&times;</button>
        </div>

        <p className="text-text-secondary text-sm mb-4">
          Share this link or QR code with people you want to invite to <strong>{group.name}</strong>.
        </p>

        <div className="flex justify-center mb-4">
          <div className="bg-white p-3 rounded-xl">
            <img
              src={qrUrl}
              alt="QR Code for invite link"
              className="w-40 h-40 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-light rounded-lg px-3 py-2 mb-4">
          <input
            id="invite-link-input"
            type="text"
            value={inviteLink}
            readOnly
            className="flex-1 bg-transparent text-sm text-text-primary outline-none truncate"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopy} className="flex-1">
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleShare} className="flex-1">
            Share
          </Button>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={handleRegenerate} loading={regenerating} className="flex-1">
              Regenerate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
