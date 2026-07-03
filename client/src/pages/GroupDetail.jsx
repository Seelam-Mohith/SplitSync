import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import PlatformLogo from '../components/ui/PlatformLogo';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [transferId, setTransferId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGroup = () => {
    setLoading(true);
    api
      .get(`/groups/${id}`)
      .then(({ data }) => {
        const g = data.data.group;
        setGroup(g);
        setEditForm({
          name: g.name,
          description: g.description || '',
          monthlyCost: g.monthlyCost,
          contributionPerMember: g.contributionPerMember,
          maxMembers: g.maxMembers,
          dueDay: g.dueDay,
        });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load group');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const isOwner = group?.role === 'OWNER';

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.put(`/groups/${id}`, editForm);
      setGroup((prev) => ({ ...prev, ...data.data.group }));
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await api.delete(`/groups/${id}`);
      navigate('/groups');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group');
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the group?')) return;
    try {
      await api.delete(`/groups/${id}/members/${userId}`);
      fetchGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleTransfer = async () => {
    if (!transferId) return;
    if (!confirm('Transfer ownership to this member? You will become a regular member.')) return;
    setSubmitting(true);
    try {
      const { data } = await api.put(`/groups/${id}/transfer`, { userId: transferId });
      setGroup((prev) => ({ ...prev, ...data.data.group }));
      setTransferId('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to transfer ownership');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
      </div>
    );
  }

  if (!group) return null;

  const nonOwnerMembers = (group.members || []).filter((m) => m.role !== 'OWNER');

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={() => navigate('/groups')} className="text-text-secondary text-sm hover:text-text-primary mb-4">&larr; Back to Groups</button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">{error}</div>
      )}

      <div className="bg-surface-card border border-white/10 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <PlatformLogo type={group.subscriptionType} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{group.name}</h1>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${isOwner ? 'bg-accent/20 text-accent' : 'bg-white/10 text-text-secondary'}`}>
                {isOwner ? 'Owner' : 'Member'}
              </span>
            </div>
            <p className="text-text-muted text-sm capitalize mt-0.5">{group.subscriptionType}</p>
            {group.description && <p className="text-text-secondary text-sm mt-2">{group.description}</p>}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
          <div><p className="text-text-muted text-xs">Your Share</p><p className="text-sm font-medium mt-0.5">₹{group.contributionPerMember}</p></div>
          <div><p className="text-text-muted text-xs">Total Cost</p><p className="text-sm font-medium mt-0.5">₹{group.monthlyCost}</p></div>
          <div><p className="text-text-muted text-xs">Due Day</p><p className="text-sm font-medium mt-0.5">{group.dueDay}</p></div>
          <div><p className="text-text-muted text-xs">Members</p><p className="text-sm font-medium mt-0.5">{group.memberCount} / {group.maxMembers}</p></div>
          <div><p className="text-text-muted text-xs">Invite Code</p><p className="text-sm font-mono mt-0.5">{group.inviteCode}</p></div>
        </div>
      </div>

      {isOwner && (
        <div className="mt-6 bg-surface-card border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Owner Controls</h2>
          </div>

          <div className="space-y-3">
            {editing ? (
              <form onSubmit={handleEdit} className="space-y-3 p-4 bg-surface-light rounded-lg">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Name</label>
                  <input name="name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-surface-card border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" required />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Description</label>
                  <input name="description" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 bg-surface-card border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Monthly Cost (₹)</label>
                    <input name="monthlyCost" type="number" value={editForm.monthlyCost} onChange={(e) => setEditForm((f) => ({ ...f, monthlyCost: e.target.value }))} className="w-full px-3 py-2 bg-surface-card border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" required />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Contribution/Member (₹)</label>
                    <input name="contributionPerMember" type="number" value={editForm.contributionPerMember} onChange={(e) => setEditForm((f) => ({ ...f, contributionPerMember: e.target.value }))} className="w-full px-3 py-2 bg-surface-card border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Max Members</label>
                    <input name="maxMembers" type="number" value={editForm.maxMembers} onChange={(e) => setEditForm((f) => ({ ...f, maxMembers: e.target.value }))} className="w-full px-3 py-2 bg-surface-card border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" required />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Due Day (1-28)</label>
                    <input name="dueDay" type="number" value={editForm.dueDay} onChange={(e) => setEditForm((f) => ({ ...f, dueDay: e.target.value }))} className="w-full px-3 py-2 bg-surface-card border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" required />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" loading={submitting} size="sm">Save</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="w-full">Edit Group</Button>
            )}

            <Button variant="danger" size="sm" onClick={handleDelete} loading={submitting} className="w-full">Delete Group</Button>
          </div>
        </div>
      )}

      <div className="mt-6 bg-surface-card border border-white/10 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Members ({group.memberCount})</h2>
        <div className="space-y-2">
          {(group.members || []).map((m) => (
            <div key={m._id} className="flex items-center justify-between p-3 bg-surface-light rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                  {m.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-text-muted">{m.userId?.email || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${m.role === 'OWNER' ? 'bg-accent/20 text-accent' : 'bg-white/10 text-text-secondary'}`}>
                  {m.role === 'OWNER' ? 'Owner' : 'Member'}
                </span>
                {isOwner && m.role !== 'OWNER' && (
                  <button onClick={() => handleRemoveMember(m.userId?._id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isOwner && nonOwnerMembers.length > 0 && (
        <div className="mt-6 bg-surface-card border border-white/10 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Transfer Ownership</h2>
          <div className="flex gap-2">
            <select
              value={transferId}
              onChange={(e) => setTransferId(e.target.value)}
              className="flex-1 px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a member...</option>
              {nonOwnerMembers.map((m) => (
                <option key={m.userId?._id} value={m.userId?._id}>{m.userId?.name}</option>
              ))}
            </select>
            <Button size="sm" onClick={handleTransfer} disabled={!transferId} loading={submitting}>Transfer</Button>
          </div>
        </div>
      )}
    </div>
  );
}
