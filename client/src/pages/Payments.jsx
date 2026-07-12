import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import paymentService from '../api/paymentService';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import StatusBadge from '../components/payments/StatusBadge';
import ProgressBar from '../components/payments/ProgressBar';
import ConfirmDialog from '../components/payments/ConfirmDialog';
import { PaymentCardSkeleton, TableRowSkeleton } from '../components/payments/Skeleton';
import EmptyState from '../components/payments/EmptyState';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}

export default function Payments() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('CURRENT');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [groupRes, dashRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        paymentService.getDashboard(groupId),
      ]);
      setGroup(groupRes.data.data.group);
      setDashboard(dashRes);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [groupId]);

  const isOwner = group?.role === 'OWNER';
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const filteredPayments = useMemo(() => {
    if (!dashboard) return [];
    let list = dashboard.payments || [];

    if (filter === 'CURRENT') {
      list = list.filter((p) => p.month === currentMonth && p.year === currentYear);
    } else if (filter === 'PREVIOUS') {
      list = list.filter((p) => !(p.month === currentMonth && p.year === currentYear));
    }

    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.memberId?.name?.toLowerCase().includes(q) ||
          p.memberId?.email?.toLowerCase().includes(q) ||
          `${p.month}-${p.year}`.includes(q)
      );
    }

    return list;
  }, [dashboard, filter, statusFilter, searchQuery, currentMonth, currentYear]);

  const handleOwnerAction = async (action, paymentId, payload = {}) => {
    setActionLoading(true);
    try {
      if (action === 'verify') {
        await paymentService.verifyPayment(paymentId, payload.remarks);
        showToast('Payment verified');
      } else if (action === 'reject') {
        await paymentService.rejectPayment(paymentId, payload.remarks);
        showToast('Submission rejected');
      } else if (action === 'update') {
        await paymentService.updatePayment(paymentId, payload);
        showToast('Payment updated');
      }
      setConfirmAction(null);
      setEditingPayment(null);
      const dashRes = await paymentService.getDashboard(groupId);
      setDashboard(dashRes);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (paymentId) => {
    setActionLoading(true);
    try {
      await paymentService.submitPayment(paymentId);
      showToast('Payment submitted');
      const dashRes = await paymentService.getDashboard(groupId);
      setDashboard(dashRes);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <PaymentCardSkeleton />
        <div className="space-y-3">
          <TableRowSkeleton cols={5} />
          <TableRowSkeleton cols={5} />
          <TableRowSkeleton cols={5} />
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { stats, history } = dashboard;
  const currentPayment = (dashboard.payments || []).find(
    (p) => p.month === currentMonth && p.year === currentYear
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-accent text-black px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <button
        onClick={() => navigate(`/groups/${groupId}`)}
        className="text-text-secondary text-sm hover:text-text-primary mb-4"
      >
        &larr; Back to Group
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-text-secondary text-sm mt-1">
          {group?.name} &middot; {MONTH_NAMES[currentMonth]} {currentYear}
        </p>
      </div>

      {isOwner ? (
        <OwnerView
          stats={stats}
          history={history}
          payments={filteredPayments}
          filter={filter}
          setFilter={setFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          editingPayment={editingPayment}
          setEditingPayment={setEditingPayment}
          editForm={editForm}
          setEditForm={setEditForm}
          confirmAction={confirmAction}
          setConfirmAction={setConfirmAction}
          onAction={handleOwnerAction}
          actionLoading={actionLoading}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      ) : (
        <MemberView
          currentPayment={currentPayment}
          history={history}
          stats={stats}
          onSubmit={handleSubmit}
          actionLoading={actionLoading}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          variant={confirmAction.variant || 'danger'}
          loading={actionLoading}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function MemberView({ currentPayment, history, stats, onSubmit, actionLoading, currentMonth, currentYear }) {
  return (
    <div className="space-y-6">
      <div className="bg-surface-card border border-white/10 rounded-xl p-6">
        {currentPayment ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Current Month</h2>
              <StatusBadge status={currentPayment.status} size="md" />
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold">₹{currentPayment.amount}</span>
              <span className="text-text-muted text-sm">/month</span>
            </div>
            <p className="text-text-secondary text-sm mb-1">
              Due by {formatDate(currentPayment.dueDate)}
            </p>
            {currentPayment.status === 'SUBMITTED' && currentPayment.submittedAt && (
              <p className="text-blue-400 text-sm mb-4">
                Submitted on {formatDate(currentPayment.submittedAt)}
              </p>
            )}
            {currentPayment.status === 'VERIFIED' && currentPayment.verifiedBy && (
              <p className="text-green-400 text-sm mb-4">
                Verified by {currentPayment.verifiedBy.name}
              </p>
            )}
            {currentPayment.status === 'PENDING' && (
              <Button
                className="w-full mt-4"
                onClick={() => onSubmit(currentPayment._id)}
                loading={actionLoading}
              >
                I&apos;ve Paid
              </Button>
            )}
            {currentPayment.status === 'SUBMITTED' && (
              <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-sm text-blue-400">
                Waiting for the group owner to verify your payment.
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No payment record"
            description="Payment records for this month have not been created yet."
          />
        )}
      </div>

      {stats && (
        <div className="bg-surface-card border border-white/10 rounded-xl p-6">
          <ProgressBar
            value={stats.totalExpected > 0 ? (stats.collected / stats.totalExpected) * 100 : 0}
          />
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Collected: <span className="text-text-primary font-medium">₹{stats.collected}</span> / ₹{stats.totalExpected}
            </span>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-4">Payment History</h2>
        {history.length === 0 ? (
          <EmptyState title="No history" description="Payment history will appear here." />
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <HistoryEntry key={`${entry.year}-${entry.month}`} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryEntry({ entry }) {
  const payment = entry.payments?.[0];
  if (!payment) return null;

  const statusIcon = {
    VERIFIED: '✅',
    MISSED: '❌',
    SUBMITTED: '🟡',
    PENDING: '⏳',
  };

  return (
    <div className="bg-surface-card border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">
            {statusIcon[payment.status] || ''} {MONTH_NAMES[entry.month]} {entry.year}
          </p>
          {payment.status === 'VERIFIED' && payment.verifiedBy && (
            <p className="text-text-muted text-xs mt-1">
              Verified by {payment.verifiedBy.name}
              {payment.verifiedAt && ` on ${formatDate(payment.verifiedAt)}`}
            </p>
          )}
          {payment.status === 'SUBMITTED' && payment.submittedAt && (
            <p className="text-blue-400 text-xs mt-1">
              Submitted on {formatDate(payment.submittedAt)}
            </p>
          )}
          {payment.status === 'MISSED' && (
            <p className="text-red-400 text-xs mt-1">Payment missed</p>
          )}
        </div>
        <StatusBadge status={payment.status} />
      </div>
    </div>
  );
}

function OwnerView({
  stats,
  history,
  payments,
  filter,
  setFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  editingPayment,
  setEditingPayment,
  editForm,
  setEditForm,
  confirmAction,
  setConfirmAction,
  onAction,
  actionLoading,
  currentMonth,
  currentYear,
}) {
  const [remarkPaymentId, setRemarkPaymentId] = useState(null);
  const [remarkText, setRemarkText] = useState('');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Collected" value={`₹${stats.collected}`} sub={`of ₹${stats.totalExpected}`} />
        <StatBox label="Paid" value={stats.paidCount} sub={`${stats.totalMembers} members`} />
        <StatBox label="Submitted" value={stats.submittedCount} sub="Awaiting verify" />
        <StatBox label="Missed" value={stats.missedCount} sub="Overdue" />
      </div>

      <ProgressBar
        value={stats.totalExpected > 0 ? (stats.collected / stats.totalExpected) * 100 : 0}
      />

      <div className="bg-surface-card border border-white/10 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by member name or month..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="CURRENT">Current Month</option>
            <option value="PREVIOUS">Previous Months</option>
            <option value="ALL">All Months</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="VERIFIED">Verified</option>
            <option value="MISSED">Missed</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-card border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-text-secondary text-left">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <PaymentRow
                    key={p._id}
                    payment={p}
                    editingPayment={editingPayment}
                    setEditingPayment={setEditingPayment}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onAction={onAction}
                    actionLoading={actionLoading}
                    setConfirmAction={setConfirmAction}
                    remarkPaymentId={remarkPaymentId}
                    setRemarkPaymentId={setRemarkPaymentId}
                    remarkText={remarkText}
                    setRemarkText={setRemarkText}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-4">Monthly History</h2>
        {history.length === 0 ? (
          <EmptyState title="No history" description="Payment history will appear here." />
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <MonthHistoryCard key={`${entry.year}-${entry.month}`} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }) {
  return (
    <div className="bg-surface-card border border-white/10 rounded-xl p-4">
      <p className="text-text-muted text-xs font-medium">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
      {sub && <p className="text-text-secondary text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function PaymentRow({
  payment: p,
  editingPayment,
  setEditingPayment,
  editForm,
  setEditForm,
  onAction,
  actionLoading,
  setConfirmAction,
  remarkPaymentId,
  setRemarkPaymentId,
  remarkText,
  setRemarkText,
}) {
  const isEditing = editingPayment === p._id;
  const isRemarkOpen = remarkPaymentId === p._id;

  return (
    <tr className="border-b border-white/5 hover:bg-surface-hover transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
            {p.memberId?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-sm">{p.memberId?.name || 'Unknown'}</p>
            <p className="text-text-muted text-xs">{p.memberId?.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">{MONTH_NAMES[p.month]} {p.year}</td>
      <td className="px-4 py-3 text-sm font-medium">₹{p.amount}</td>
      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(p.dueDate)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {p.status === 'SUBMITTED' && (
            <>
              <button
                onClick={() =>
                  setConfirmAction({
                    title: 'Verify Payment',
                    message: `Verify ${p.memberId?.name}'s payment of ₹${p.amount}?`,
                    confirmLabel: 'Verify',
                    variant: 'primary',
                    onConfirm: () => onAction('verify', p._id),
                  })
                }
                className="text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-green-500/10"
              >
                Approve
              </button>
              <button
                onClick={() =>
                  setConfirmAction({
                    title: 'Reject Submission',
                    message: `Reject ${p.memberId?.name}'s payment submission?`,
                    confirmLabel: 'Reject',
                    variant: 'danger',
                    onConfirm: () => onAction('reject', p._id),
                  })
                }
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10"
              >
                Reject
              </button>
            </>
          )}
          {p.status === 'PENDING' && (
            <button
              onClick={() =>
                setConfirmAction({
                  title: 'Mark as Paid',
                  message: `Mark ${p.memberId?.name}'s payment as verified?`,
                  confirmLabel: 'Mark Paid',
                  variant: 'primary',
                  onConfirm: () => onAction('verify', p._id),
                })
              }
              className="text-xs text-accent hover:text-accent-hover px-2 py-1 rounded hover:bg-accent/10"
            >
              Mark Paid
            </button>
          )}
          {p.status === 'VERIFIED' && (
            <button
              onClick={() =>
                setConfirmAction({
                  title: 'Reset Payment',
                  message: `Set ${p.memberId?.name}'s payment back to pending?`,
                  confirmLabel: 'Reset',
                  variant: 'danger',
                  onConfirm: () =>
                    onAction('update', p._id, { status: 'PENDING' }),
                })
              }
              className="text-xs text-yellow-400 hover:text-yellow-300 px-2 py-1 rounded hover:bg-yellow-500/10"
            >
              Reset
            </button>
          )}
          {p.status === 'MISSED' && (
            <button
              onClick={() =>
                setConfirmAction({
                  title: 'Mark as Paid',
                  message: `Mark ${p.memberId?.name}'s missed payment as verified?`,
                  confirmLabel: 'Mark Paid',
                  variant: 'primary',
                  onConfirm: () => onAction('verify', p._id),
                })
              }
              className="text-xs text-accent hover:text-accent-hover px-2 py-1 rounded hover:bg-accent/10"
            >
              Mark Paid
            </button>
          )}
          <button
            onClick={() => {
              setEditingPayment(isEditing ? null : p._id);
              setEditForm({ amount: p.amount, remarks: p.remarks || '' });
            }}
            className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-white/5"
          >
            Edit
          </button>
        </div>
        {isEditing && (
          <div className="mt-2 p-3 bg-surface-light rounded-lg">
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className="w-24 px-2 py-1 bg-surface-card border border-white/10 rounded text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Amount"
              />
              <input
                type="text"
                value={editForm.remarks}
                onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))}
                className="flex-1 px-2 py-1 bg-surface-card border border-white/10 rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Remarks"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAction('update', p._id, editForm)}
                loading={actionLoading}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingPayment(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        {isRemarkOpen && (
          <div className="mt-2 p-3 bg-surface-light rounded-lg">
            <textarea
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              className="w-full px-2 py-1 bg-surface-card border border-white/10 rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              rows={2}
              placeholder="Add a remark..."
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={() => {
                  onAction('update', p._id, { remarks: remarkText });
                  setRemarkPaymentId(null);
                  setRemarkText('');
                }}
                loading={actionLoading}
              >
                Save Remark
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setRemarkPaymentId(null);
                  setRemarkText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

function MonthHistoryCard({ entry }) {
  const verified = entry.payments.filter((p) => p.status === 'VERIFIED').length;
  const submitted = entry.payments.filter((p) => p.status === 'SUBMITTED').length;
  const pending = entry.payments.filter((p) => p.status === 'PENDING').length;
  const missed = entry.payments.filter((p) => p.status === 'MISSED').length;
  const total = entry.payments.length;
  const collected = entry.payments
    .filter((p) => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + p.amount, 0);
  const expected = entry.payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="bg-surface-card border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">{MONTH_NAMES[entry.month]} {entry.year}</h3>
        <span className="text-sm text-text-secondary">
          ₹{collected} / ₹{expected}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
        {verified > 0 && <span className="text-green-400">✅ {verified} verified</span>}
        {submitted > 0 && <span className="text-blue-400">🔵 {submitted} submitted</span>}
        {pending > 0 && <span className="text-yellow-400">⏳ {pending} pending</span>}
        {missed > 0 && <span className="text-red-400">❌ {missed} missed</span>}
        <span className="text-text-muted">{total} total</span>
      </div>
    </div>
  );
}
