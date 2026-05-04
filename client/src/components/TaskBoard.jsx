import { DndContext, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { Filter, Pencil, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import api from '../api/client.js';
import { useTasks } from '../context/TaskContext.jsx';
import { TaskModal } from './TaskModal.jsx';
import { useNavigate } from 'react-router-dom';

const columns = [
  { id: 'todo', title: 'Todo' },
  { id: 'in-progress', title: 'In progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' }
];

export const TaskCard = ({ task, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  const navigate = useNavigate();

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx('task-card', isDragging && 'task-card-dragging')}
      {...attributes}
      {...listeners}
    >
      <div className="task-card-header">
        <span className={clsx('priority-tag', task.priority)}>{task.priority}</span>
        <div className="task-card-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={`Edit ${task.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(task);
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            className="icon-button danger"
            type="button"
            aria-label={`Delete ${task.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <button className="task-card-body" type="button" onClick={() => onEdit(task)}>
        <h4 onClick={(e) => { e.stopPropagation(); navigate(`/task/${task._id}`); }}>{task.title}</h4>
        <p>{task.description || 'No description provided.'}</p>
      </button>

      <div className="task-meta">
        <span
          className={task.assignee ? 'link-like' : ''}
          onClick={(e) => {
            e.stopPropagation();
            if (task.assignee?._id) navigate(`/user/${task.assignee._id}`);
          }}
        >
          {task.assignee?.name || 'Unassigned'}
        </span>
        <span>{task.dueDate ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }) : 'No due date'}</span>
        {task.project && (
          <span className="project-link" onClick={(e) => { e.stopPropagation(); navigate(`/project/${encodeURIComponent(task.project)}`); }}>
            {task.project}
          </span>
        )}
      </div>
    </article>
  );
};

const BoardColumn = ({ column, tasks, onEdit, onDelete }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section ref={setNodeRef} className={clsx('board-column', isOver && 'board-column-over')}>
      <header>
        <h3>{column.title}</h3>
        <span>{tasks.length}</span>
      </header>
      <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
        <div className="board-stack">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
};

export const TaskBoard = () => {
  const { columns: boardColumns, tasks, refresh } = useTasks();
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalMode, setModalMode] = useState('edit');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filteredBoardColumns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return columns.reduce((acc, column) => {
      const list = (boardColumns[column.id] || []).filter((task) => {
        const matchesQuery =
          !normalizedQuery ||
          [task.title, task.description, task.status, task.priority, task.assignee?.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedQuery));
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchesQuery && matchesPriority;
      });

      acc[column.id] = list;
      return acc;
    }, {});
  }, [boardColumns, priorityFilter, query]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((task) => task._id === active.id);
    if (!activeTask) return;

    const targetColumn = columns.find((column) => column.id === over.id);
    const targetTask = tasks.find((task) => task._id === over.id);
    const newStatus = targetColumn?.id || targetTask?.status || activeTask.status;
    const position = targetTask ? targetTask.position : activeTask.position;

    await api.patch(`/tasks/${activeTask._id}`, {
      status: newStatus,
      position
    });

    await refresh();
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setModalMode('edit');
  };

  const openDeleteModal = (task) => {
    setSelectedTask(task);
    setModalMode('delete');
  };

  return (
    <>
      <div className="board-toolbar glass-card">
        <label className="board-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks, status, priority, assignee" />
        </label>

        <div className="board-filters">
          <Filter size={16} />
          {['all', 'low', 'medium', 'high', 'urgent'].map((priority) => (
            <button key={priority} className={clsx('filter-chip', priorityFilter === priority && 'active')} type="button" onClick={() => setPriorityFilter(priority)}>
              {priority}
            </button>
          ))}
          {(query || priorityFilter !== 'all') && (
            <button
              className="filter-chip clear"
              type="button"
              onClick={() => {
                setQuery('');
                setPriorityFilter('all');
              }}
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="board-grid">
          {columns.map((column) => {
            const columnTasks = filteredBoardColumns[column.id] || [];
            return <BoardColumn key={column.id} column={column} tasks={columnTasks} onEdit={openEditModal} onDelete={openDeleteModal} />;
          })}
        </div>
      </DndContext>

      {selectedTask && <TaskModal task={selectedTask} mode={modalMode} onClose={() => setSelectedTask(null)} />}
    </>
  );
};