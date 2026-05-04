import { BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTasks } from '../context/TaskContext.jsx';

const colors = ['#f97316', '#f59e0b', '#10b981', '#3b82f6'];

export const AnalyticsPanel = () => {
  const { summary } = useTasks();

  const statusData = (summary?.statusCounts || []).map((item) => ({ name: item._id, value: item.count }));
  const priorityData = (summary?.priorityCounts || []).map((item) => ({ name: item._id, value: item.count }));

  return (
    <section className="analytics-grid">
      <article className="glass-card">
        <h3>Work status</h3>
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.65)" />
              <YAxis stroke="rgba(255,255,255,0.65)" />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="glass-card">
        <h3>Priority mix</h3>
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={55}>
                {priorityData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
};