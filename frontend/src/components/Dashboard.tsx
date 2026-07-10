import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DailyCount {
  day: string;
  parsed: number;
  failed: number;
}

interface StatusSlice {
  name: string;
  value: number;
}

const DAILY_COUNTS: DailyCount[] = [
  { day: 'Mon', parsed: 42, failed: 3 },
  { day: 'Tue', parsed: 58, failed: 5 },
  { day: 'Wed', parsed: 71, failed: 2 },
  { day: 'Thu', parsed: 64, failed: 6 },
  { day: 'Fri', parsed: 90, failed: 4 },
  { day: 'Sat', parsed: 33, failed: 1 },
  { day: 'Sun', parsed: 21, failed: 0 },
];

const STATUS_BREAKDOWN: StatusSlice[] = [
  { name: 'Completed', value: 379 },
  { name: 'Queued', value: 24 },
  { name: 'Failed', value: 21 },
];

const STATUS_COLORS = ['#2f9e44', '#f59f00', '#e03131'];

export function Dashboard() {
  const totalParsed = DAILY_COUNTS.reduce((sum, d) => sum + d.parsed, 0);
  const totalFailed = DAILY_COUNTS.reduce((sum, d) => sum + d.failed, 0);

  return (
    <div className="dashboard">
      <section className="stat-row">
        <StatCard label="Parsed this week" value={totalParsed} />
        <StatCard label="Failed this week" value={totalFailed} />
        <StatCard label="In queue" value={STATUS_BREAKDOWN[1]?.value ?? 0} />
      </section>

      <section className="chart-grid">
        <div className="chart-card">
          <h2>per day</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={DAILY_COUNTS}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="parsed" name="Parsed" fill="#4263eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" name="Failed" fill="#e03131" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>breakdown</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={STATUS_BREAKDOWN}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {STATUS_BREAKDOWN.map((slice, index) => (
                  <Cell key={slice.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
