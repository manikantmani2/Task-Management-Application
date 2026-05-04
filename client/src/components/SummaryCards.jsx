import { CalendarDays, CheckCircle2, Clock3, ListTodo } from 'lucide-react';
import { useTasks } from '../context/TaskContext.jsx';

export const SummaryCards = () => {
  const { summary } = useTasks();

  const cards = [
    { label: 'Total tasks', value: summary?.totalTasks || 0, icon: ListTodo },
    { label: 'Completed', value: summary?.completedTasks || 0, icon: CheckCircle2 },
    { label: 'Overdue', value: summary?.overdueTasks || 0, icon: Clock3 },
    { label: 'Due soon', value: summary?.dueSoonTasks || 0, icon: CalendarDays }
  ];

  return (
    <section className="summary-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className="summary-card glass-card" key={card.label}>
            <div className="summary-icon">
              <Icon size={18} />
            </div>
            <strong>{card.value}</strong>
            <span>{card.label}</span>
          </article>
        );
      })}
    </section>
  );
};