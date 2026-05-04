import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const TaskContext = createContext(null);

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState({ todo: [], 'in-progress': [], review: [], done: [] });
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let socket;

    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const [tasksResponse, boardResponse, summaryResponse, notificationsResponse] = await Promise.all([
        api.get('/tasks'),
        api.get('/tasks/board'),
        api.get('/dashboard/summary'),
        api.get('/notifications')
      ]);

      setTasks(tasksResponse.data.tasks);
      setColumns(boardResponse.data.columns);
      setSummary(summaryResponse.data);
      setNotifications(notificationsResponse.data.notifications);

      socket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('taskflow_token')
        }
      });

      socket.on('task:created', (task) => {
        setTasks((current) => [task, ...current.filter((item) => item._id !== task._id)]);
      });

      socket.on('task:updated', (task) => {
        setTasks((current) => current.map((item) => (item._id === task._id ? task : item)));
      });

      socket.on('task:deleted', ({ id }) => {
        setTasks((current) => current.filter((task) => task._id !== id));
      });

      socket.on('notification:new', (notification) => {
        setNotifications((current) => [notification, ...current]);
      });

      socket.on('connect_error', () => {
        socket?.disconnect();
      });

      setLoading(false);
    };

    loadData().catch(() => setLoading(false));

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const refresh = async () => {
    const [tasksResponse, boardResponse, summaryResponse, notificationsResponse] = await Promise.all([
      api.get('/tasks'),
      api.get('/tasks/board'),
      api.get('/dashboard/summary'),
      api.get('/notifications')
    ]);

    setTasks(tasksResponse.data.tasks);
    setColumns(boardResponse.data.columns);
    setSummary(summaryResponse.data);
    setNotifications(notificationsResponse.data.notifications);
  };

  const value = useMemo(
    () => ({ tasks, columns, summary, notifications, loading, refresh, setTasks, setColumns }),
    [tasks, columns, summary, notifications, loading]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used inside TaskProvider');
  }
  return context;
};