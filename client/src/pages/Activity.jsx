import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import StatusBadge from '../components/payments/StatusBadge';
import ProgressBar from '../components/payments/ProgressBar';
import PlatformLogo from '../components/ui/PlatformLogo';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Activity() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: groupRes } = await api.get('/groups');
        const groupList = groupRes.data.groups || [];
        setGroups(groupList);

        const paymentResults = await Promise.all(
          groupList.map((g) =>
            api.get(`/payments/group/${g._id}`).then((r) => ({
              group: g,
              payments: r.data.data.payments || [],
            }))
          )
        );

        setAllPayments(paymentResults);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const timeline = [];
  allPayments.forEach(({ group, payments }) => {
    payments.forEach((p) => {
      if (p.memberId?._id === user?._id) {
        timeline.push({ ...p, groupName: group.name, groupType: group.subscriptionType, groupId: group._id });
      }
    });
  });

  timeline.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (b.month !== a.month) return b.month - a.month;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let totalCollected = 0;
  let totalExpected = 0;
  let verifiedCount = 0;
  let submittedCount = 0;
  let pendingCount = 0;
  let missedCount = 0;

  allPayments.forEach(({ payments }) => {
    payments.forEach((p) => {
      if (p.month === currentMonth && p.year === currentYear && p.memberId?._id === user?._id) {
        totalExpected += p.amount;
        if (p.status === 'VERIFIED') { totalCollected += p.amount; verifiedCount++; }
        else if (p.status === 'SUBMITTED') submittedCount++;
        else if (p.status === 'MISSED') missedCount++;
        else pendingCount++;
      }
    });
  });

  const currentMonthItems = timeline.filter(
    (t) => t.month === currentMonth && t.year === currentYear
  );
  const pastItems = timeline.filter(
    (t) => !(t.month === currentMonth && t.year === currentYear)
  );

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

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-text-secondary text-sm mt-1">
          Your payment overview across all groups
        </p>
      </div>

      {timeline.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted text-sm">
            No payment activity yet. Join a group to get started.
          </p>
          <Link
            to="/groups"
            className="inline-block mt-4 text-accent hover:text-accent-hover text-sm underline underline-offset-2"
          >
            Browse Groups
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <SummaryBox label="Collected" value={`₹${totalCollected}`} sub={`of ₹${totalExpected}`} accent="text-green-400" />
            <SummaryBox label="Pending" value={pendingCount} sub="awaiting action" accent="text-yellow-400" />
            <SummaryBox label="Submitted" value={submittedCount} sub="awaiting verify" accent="text-blue-400" />
            <SummaryBox label="Missed" value={missedCount} sub="overdue" accent="text-red-400" />
          </div>

          {totalExpected > 0 && (
            <div className="mb-8">
              <ProgressBar value={Math.round((totalCollected / totalExpected) * 100)} />
            </div>
          )}

          {groups.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  Groups Overview
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scrollRef.current.scrollBy({ left: -160, behavior: 'smooth' })}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-card border border-white/10 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    onClick={() => scrollRef.current.scrollBy({ left: 160, behavior: 'smooth' })}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-card border border-white/10 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-text-muted mb-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Pending</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Submitted</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Paid</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Missed</span>
              </div>
              <div className="relative">
                <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 min-w-max pr-8">
                    {groups.map((g) => {
                      const gPayments = allPayments.find((r) => r.group._id === g._id)?.payments || [];
                      const current = gPayments.find(
                        (p) => p.month === currentMonth && p.year === currentYear && p.memberId?._id === user?._id
                      );
                      const status = current?.status || 'NO_RECORD';
                      const dotColor = {
                        VERIFIED: 'bg-green-400',
                        SUBMITTED: 'bg-blue-400',
                        PENDING: 'bg-yellow-400',
                        MISSED: 'bg-red-400',
                        NO_RECORD: 'bg-white/20',
                      }[status];

                      return (
                        <Link
                          key={g._id}
                          to={`/groups/${g._id}/payments`}
                          className="bg-surface-card border border-white/10 rounded-xl p-3 w-32 shrink-0 hover:bg-surface-hover transition-colors"
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <PlatformLogo type={g.subscriptionType} size="sm" />
                            <p className="text-xs font-medium truncate">{g.name}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                            <p className="text-[11px] text-text-muted">₹{current?.amount || g.contributionPerMember}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />

            {currentMonthItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 pl-10">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                <div className="space-y-4">
                  {currentMonthItems.map((item) => (
                    <TimelineItem key={`${item.groupId}-${item.month}-${item.year}`} item={item} />
                  ))}
                </div>
              </div>
            )}

            {pastItems.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 pl-10">
                  Previous
                </h2>
                <div className="space-y-4">
                  {pastItems.map((item) => (
                    <TimelineItem key={`${item.groupId}-${item.month}-${item.year}`} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryBox({ label, value, sub, accent = '' }) {
  return (
    <div className="bg-surface-card border border-white/10 rounded-xl p-4">
      <p className="text-text-muted text-xs font-medium">{label}</p>
      <p className={`text-xl font-bold mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-text-secondary text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function TimelineItem({ item }) {
  const dotColor = {
    VERIFIED: 'bg-green-400',
    SUBMITTED: 'bg-blue-400',
    MISSED: 'bg-red-400',
    PENDING: 'bg-yellow-400',
  };

  return (
    <div className="relative pl-10">
      <div
        className={`absolute left-[11px] top-3 w-3 h-3 rounded-full border-2 border-surface ${
          dotColor[item.status] || 'bg-gray-400'
        }`}
      />

      <Link
        to={`/groups/${item.groupId}/payments`}
        className="block bg-surface-card border border-white/10 rounded-xl p-4 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{item.groupName}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-text-muted text-xs mt-0.5">
              {MONTH_NAMES[item.month]} {item.year} · ₹{item.amount}
            </p>
            {item.status === 'VERIFIED' && item.verifiedAt && (
              <p className="text-green-400 text-xs mt-1">
                Paid on {formatDate(item.submittedAt || item.verifiedAt)}
                {item.verifiedBy && ` · Verified by ${item.verifiedBy.name}`}
              </p>
            )}
            {item.status === 'SUBMITTED' && (
              <p className="text-blue-400 text-xs mt-1">
                Awaiting verification
              </p>
            )}
            {item.status === 'MISSED' && (
              <p className="text-red-400 text-xs mt-1">
                Payment missed
              </p>
            )}
            {item.status === 'PENDING' && (
              <p className="text-yellow-400 text-xs mt-1">
                Payment pending
              </p>
            )}
            {item.remarks && (
              <p className="text-text-muted text-xs mt-1 italic">
                "{item.remarks}"
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
