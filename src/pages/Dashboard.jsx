import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useState } from "react";
import { generateSessionId, generateStrongPassword } from "../utils/session";
import { verifySession, createNewSession } from "../api";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  // const [sessionId, setSessionId] = useState("");
  const [password, setPassword] = useState("");
  const [useCustomPass, setUseCustomPass] = useState(false);
  const [joinData, setJoinData] = useState({ id: "", pass: "" });

  const handleCreateSession = async () => {
    const newSessionId = generateSessionId();
    const finalPassword = password || generateStrongPassword();

    try {
      const { valid, error } = await createNewSession(newSessionId, finalPassword, currentUser.uid);

      if (valid) {
        navigate(`/editor/${newSessionId}`, { 
          state: { 
            sessionPassword: finalPassword,
            isOwner: true
          } 
        });
      } else {
        alert(error || "Could not start a new session. Please try again later!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to verify session. Please try again.");
    }

    // if (response.ok) {
    //   navigate(`/editor/${newSessionId}`);
    // }
  };

  const handleJoinSession = async () => {
    if (!joinData.id || !joinData.pass) {
      alert("Please enter both session ID and password");
      return;
    }

    try {
      const { valid, error } = await verifySession(joinData.id, joinData.pass);

      if (valid) {
        navigate(`/editor/${joinData.id}`, {
          state: { 
            sessionPassword: joinData.pass,
            isOwner: false
          } 
        });
      } else {
        alert(error || "Invalid session credentials");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to verify session. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard">
      <button onClick={handleLogout} className="logout-button">
        Log Out
      </button>
      <h1>Welcome, {currentUser?.displayName}</h1>
      <div className="session-actions">
        <div className="dashboard">
          <div className="session-create">
            <h3>Create New Session</h3>
            <div className="password-options">
              <label>
                <input
                  type="checkbox"
                  checked={useCustomPass}
                  onChange={(e) => setUseCustomPass(e.target.checked)}
                />
                Use Custom Password
              </label>

              {useCustomPass && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter custom password"
                />
              )}
            </div>
            <button onClick={handleCreateSession}>Create Session</button>
          </div>

          <div className="session-join">
            <h3>Join Existing Session</h3>
            <input
              type="text"
              value={joinData.id}
              onChange={(e) =>
                setJoinData((p) => ({ ...p, id: e.target.value }))
              }
              placeholder="Session ID"
            />
            <input
              type="password"
              value={joinData.pass}
              onChange={(e) =>
                setJoinData((p) => ({ ...p, pass: e.target.value }))
              }
              placeholder="Session Password"
            />
            <button onClick={handleJoinSession}>Join Session</button>
          </div>
        </div>
      </div>
    </div>
  );
}
