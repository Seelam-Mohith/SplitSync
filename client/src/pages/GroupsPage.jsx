import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import PlatformLogo from '../components/ui/PlatformLogo';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/groups')
      .then(({ data }) => setGroups(data.data.groups))
      .catch((err) => {
        if (!err.response) {
          setError('Cannot connect to server. Make sure the backend is running.');
        } else {
          setError(err.response?.data?.message || 'Failed to load groups');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <Header />
        <div className="bg-surface-card border border-white/10 rounded-xl p-10 text-center">
          <p className="text-text-secondary text-lg">
            No groups yet
          </p>
          <p className="text-text-muted text-sm mt-2">
            Create a group to start splitting subscriptions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Header />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <GroupCard key={group._id} group={group} />
        ))}
      </div>
    </div>
  );
}

function GroupCard({ group }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/groups/${group._id}`)}
      className="bg-surface-card border border-white/10 rounded-xl p-5 hover:bg-surface-hover transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <PlatformLogo type={group.subscriptionType} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">
              {group.name}
            </h3>
            <RoleBadge role={group.role} />
          </div>

          <p className="text-text-muted text-xs capitalize mt-0.5">
            {group.subscriptionType}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
        <Stat label="Your share" value={`₹${group.contributionPerMember}`} />
        <Stat label="Members" value={`${group.memberCount} / ${group.maxMembers}`} />
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const isOwner = role === 'OWNER';
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
        isOwner
          ? 'bg-accent/20 text-accent'
          : 'bg-white/10 text-text-secondary'
      }`}
    >
      {isOwner ? 'Owner' : 'Member'}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-text-muted text-xs">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold">My Groups</h1>
        <p className="text-text-secondary text-sm mt-1">
          Groups you own or are a member of.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/join">
          <Button variant="secondary" size="sm">
            Join Group
          </Button>
        </Link>
        <Link to="/groups/new">
          <Button variant="primary" size="sm">
            Create Group
          </Button>
        </Link>
      </div>
    </div>
  );
}
