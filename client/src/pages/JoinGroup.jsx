import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function JoinGroup() {
  const [inviteCode, setInviteCode] = useState('');
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setGroup(null);

    try {
      const { data } = await api.post('/groups/join', { inviteCode });
      setGroup(data.data.group);
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Make sure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to join group');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Join Group</h1>
        <p className="text-text-secondary text-sm mt-1">
          Enter an invite code to join a subscription group.
        </p>
      </div>

      {!group && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface-light rounded-xl p-6 space-y-5"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Input
            label="Invite Code"
            type="text"
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value);
              setError('');
            }}
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={submitting}
          >
            Join Group
          </Button>
        </form>
      )}

      {group && (
        <div className="bg-surface-card border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-lg">Joined successfully!</p>
              <p className="text-text-secondary text-sm">
                You are now a member of this group.
              </p>
            </div>
          </div>

          <div className="bg-surface-light rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Group</span>
              <span className="text-sm font-medium">{group.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Type</span>
              <span className="text-sm capitalize">{group.subscriptionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Your share</span>
              <span className="text-sm font-medium">
                ₹{group.contributionPerMember}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-sm">Members</span>
              <span className="text-sm">
                {group.memberCount} / {group.maxMembers}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/groups" className="flex-1">
              <Button variant="primary" className="w-full">
                View my groups
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setGroup(null);
                setInviteCode('');
              }}
            >
              Join another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
