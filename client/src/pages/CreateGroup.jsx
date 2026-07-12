import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const subscriptionTypes = [
  'netflix', 'spotify', 'youtube', 'jiohotstar',
  'hbo', 'amazon', 'apple', 'other',
];

const displayNames = {
  netflix: 'Netflix',
  spotify: 'Spotify',
  youtube: 'YouTube',
  jiohotstar: 'Jio Hotstar',
  hbo: 'HBO',
  amazon: 'Amazon Prime',
  apple: 'Apple TV',
  other: 'Other',
};

export default function CreateGroup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    subscriptionType: 'netflix',
    monthlyCost: '',
    contributionPerMember: '',
    maxMembers: '',
    dueDay: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/groups', {
        ...form,
        monthlyCost: Number(form.monthlyCost),
        contributionPerMember: Number(form.contributionPerMember),
        maxMembers: Number(form.maxMembers),
        dueDay: Number(form.dueDay),
      });
      navigate('/groups');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Make sure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to create group');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create Group</h1>
        <p className="text-text-secondary text-sm mt-1">
          Set up a new subscription sharing group.
        </p>
      </div>

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
          label="Group Name"
          name="name"
          placeholder="e.g. Netflix Crew"
          value={form.name}
          onChange={handleChange}
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Subscription Type
          </label>
          <select
            name="subscriptionType"
            value={form.subscriptionType}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-surface-light border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            {subscriptionTypes.map((t) => (
              <option key={t} value={t}>
                {displayNames[t]}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Description (optional)"
          name="description"
          placeholder="Who is this group for?"
          value={form.description}
          onChange={handleChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Monthly Cost (₹)"
            name="monthlyCost"
            type="number"
            placeholder="799"
            value={form.monthlyCost}
            onChange={handleChange}
            required
            min="0"
          />
          <Input
            label="Contribution/Member (₹)"
            name="contributionPerMember"
            type="number"
            placeholder="200"
            value={form.contributionPerMember}
            onChange={handleChange}
            required
            min="0"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Max Members"
            name="maxMembers"
            type="number"
            placeholder="4"
            value={form.maxMembers}
            onChange={handleChange}
            required
            min="1"
            max="100"
          />
          <Input
            label="Due Day (1-28)"
            name="dueDay"
            type="number"
            placeholder="5"
            value={form.dueDay}
            onChange={handleChange}
            required
            min="1"
            max="28"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={submitting}
        >
          Create Group
        </Button>
      </form>
    </div>
  );
}
