import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Avatar from '../components/ui/Avatar';
import PlatformLogo from '../components/ui/PlatformLogo';
import Spinner from '../components/ui/Spinner';
import StatusBadge from '../components/payments/StatusBadge';

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [groupPayments, setGroupPayments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/groups');
        const groupList = data.data.groups || [];
        setGroups(groupList);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const paymentMap = {};
        await Promise.all(
          groupList.map(async (g) => {
            try {
              const { data: pData } = await api.get(`/payments/group/${g._id}`);
              const payments = pData.data.payments || [];
              const current = payments.find(
                (p) => p.month === month && p.year === year
              );
              const lastVerified = payments.find((p) => p.status === 'VERIFIED');
              const pending = payments.filter((p) => p.status === 'PENDING' || p.status === 'SUBMITTED');
              const totalPaid = payments
                .filter((p) => p.status === 'VERIFIED')
                .reduce((s, p) => s + p.amount, 0);

              paymentMap[g._id] = {
                current,
                lastVerified,
                pendingCount: pending.length,
                totalPaid,
                recentPayments: payments.slice(0, 3),
              };
            } catch {
              paymentMap[g._id] = null;
            }
          })
        );
        setGroupPayments(paymentMap);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let totalPending = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let pendingGroups = 0;
  let paidGroups = 0;

  groups.forEach((g) => {
    const p = groupPayments[g._id];
    if (p?.current) {
      totalOutstanding += p.current.amount;
      if (p.current.status === 'VERIFIED') {
        totalPaid += p.current.amount;
        paidGroups++;
      } else if (p.current.status !== 'MISSED') {
        totalPending += p.current.amount;
        pendingGroups++;
      }
    }
  });

  const recentAll = [];
  groups.forEach((g) => {
    const p = groupPayments[g._id];
    if (p?.recentPayments) {
      p.recentPayments.forEach((pay) => {
        recentAll.push({ ...pay, groupName: g.name, groupType: g.subscriptionType, groupId: g._id });
      });
    }
  });
  recentAll.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const recentTop = recentAll.slice(0, 5);

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Avatar name={user?.name} size="lg" />
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Here&apos;s what&apos;s happening with your groups.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Groups"
          value={groups.length}
          description="Groups you're part of"
        />
        <StatCard
          title="Pending"
          value={`₹${totalPending}`}
          description={`${pendingGroups} group${pendingGroups !== 1 ? 's' : ''} awaiting`}
          accent="text-yellow-400"
        />
        <StatCard
          title="Paid This Month"
          value={`₹${totalPaid}`}
          description={`${paidGroups} group${paidGroups !== 1 ? 's' : ''} settled`}
          accent="text-green-400"
        />
        <StatCard
          title="This Month Outstanding"
          value={`₹${totalOutstanding}`}
          description={`${totalOutstanding - totalPaid} remaining across groups`}
          accent="text-blue-400"
        />
      </div>

      {groups.length === 0 ? (
        <div className="bg-surface-card border border-white/10 rounded-xl p-8 text-center">
          <p className="text-text-secondary mb-4">
            You haven't joined any groups yet.
          </p>
          <Link
            to="/groups/new"
            className="inline-block text-accent hover:text-accent-hover text-sm underline underline-offset-2"
          >
            Create your first group
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Groups</h2>
              <Link
                to="/groups"
                className="text-text-secondary text-sm hover:text-text-primary"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.map((g) => {
                const p = groupPayments[g._id];
                const status = p?.current?.status;
                return (
                  <Link
                    key={g._id}
                    to={`/groups/${g._id}`}
                    className="bg-surface-card border border-white/10 rounded-xl p-4 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <PlatformLogo type={g.subscriptionType} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{g.name}</p>
                          {status && <StatusBadge status={status} />}
                        </div>
                        <p className="text-text-muted text-xs mt-0.5">
                          ₹{g.contributionPerMember}/mo · {g.memberCount} members
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {p?.current ? (
                          <p className="text-sm font-medium">
                            ₹{p.current.amount}
                          </p>
                        ) : (
                          <p className="text-text-muted text-xs">No record</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {recentTop.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="bg-surface-card border border-white/10 rounded-xl divide-y divide-white/5">
                {recentTop.map((r) => (
                  <Link
                    key={r._id}
                    to={`/groups/${r.groupId}/payments`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <PlatformLogo type={r.groupType} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.groupName}</p>
                      <p className="text-text-muted text-xs">
                        {MONTH_NAMES[r.month]} {r.year} · ₹{r.amount}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/groups/new"
                className="bg-surface-card border border-white/10 rounded-xl p-4 hover:bg-surface-hover transition-colors text-center"
              >
                <p className="text-2xl mb-1">+</p>
                <p className="text-sm text-text-secondary">Create Group</p>
              </Link>
              <Link
                to="/join"
                className="bg-surface-card border border-white/10 rounded-xl p-4 hover:bg-surface-hover transition-colors text-center"
              >
                <p className="text-2xl mb-1">🔗</p>
                <p className="text-sm text-text-secondary">Join Group</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, description, accent = '' }) {
  return (
    <div className="bg-surface-card border border-white/10 rounded-xl p-5 hover:bg-surface-hover transition-colors">
      <p className="text-text-muted text-sm font-medium">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
      <p className="text-text-secondary text-xs mt-1">{description}</p>
    </div>
  );
}
