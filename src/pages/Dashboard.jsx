import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleCreateSession = () => {
    // Will implement session creation logic later
    navigate('/editor/123'); // Temporary hardcoded session ID
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {currentUser?.displayName}</h1>
      <div className="session-actions">
        <button onClick={handleCreateSession}>
          Create New Session
        </button>
        <div className="join-session">
          <input type="text" placeholder="Session ID" />
          <input type="password" placeholder="Password" />
          <button>Join Session</button>
        </div>
      </div>
    </div>
  );
}