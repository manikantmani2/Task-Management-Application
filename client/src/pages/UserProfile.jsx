import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';

export const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/users/${id}`);
        if (mounted) setUser(res.data.user || res.data);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  if (!user) return <div className="pane">User not found.</div>;

  return (
    <div className="pane">
      <button className="ghost-button" onClick={() => navigate(-1)}>Back</button>
      <h2>{user.name}</h2>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Title:</strong> {user.title || '—'}</p>
    </div>
  );
};

export default UserProfile;
