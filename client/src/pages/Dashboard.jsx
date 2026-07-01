import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/ui/Avatar';

export default function Dashboard() {
  const { user } = useAuth();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Active Groups"
          value="0"
          description="Groups you're part of"
        />
        <StatCard
          title="Pending Balances"
          value="₹0"
          description="Total outstanding"
        />
        <StatCard
          title="Recent Activity"
          value="--"
          description="Latest transactions"
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">
          Quick Start
        </h2>
        <div className="bg-surface-card border border-white/10 rounded-xl p-6">
          <p className="text-text-secondary">
            Create your first group to start splitting expenses
            with friends and family.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, description }) {
  return (
    <div className="bg-surface-card border border-white/10 rounded-xl p-5 hover:bg-surface-hover transition-colors">
      <p className="text-text-muted text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-text-secondary text-xs mt-1">
        {description}
      </p>
    </div>
  );
}
