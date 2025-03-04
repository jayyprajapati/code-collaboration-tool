import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useState } from "react";
import { generateSessionId, generateStrongPassword } from "../utils/session";
import { verifySession, createNewSession } from "../api";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  // const [sessionId, setSessionId] = useState("");
  const [password, setPassword] = useState("");
  const [useCustomPass, setUseCustomPass] = useState(false);
  const [joinData, setJoinData] = useState({ id: "", pass: "" });
  const [alert, setAlert] = useState(null);

  const handleCreateSession = async () => {
    const newSessionId = generateSessionId();
    const finalPassword = password || generateStrongPassword();

    try {
      const { valid, error } = await createNewSession(
        newSessionId,
        finalPassword,
        currentUser.uid
      );

      if (valid) {
        navigate(`/editor/${newSessionId}`, {
          state: {
            sessionPassword: finalPassword,
            isOwner: true,
          },
        });
      } else {
        setAlert({
          severity: 'warning',
          title: 'Warning',
          message: `${error || 'Please enter both session ID and password'}`
        })
        // <Alert severity="error">
        //   <AlertTitle>Error</AlertTitle>
        //   {error || "Could not start a new session. Please try again later!"}
        // </Alert>;
      }
    } catch (err) {
      console.error(err);
      setAlert({
        severity: 'warning',
          title: 'Warning',
          message: 'Failed to verify session. Please try again.'
      })
      // <Alert severity="error">
      //   <AlertTitle>Error</AlertTitle>
      //   Failed to verify session. Please try again.
      // </Alert>;
    }

    // if (response.ok) {
    //   navigate(`/editor/${newSessionId}`);
    // }
  };

  const handleJoinSession = async () => {
    if (!joinData.id || !joinData.pass) {
      setAlert({
        severity: 'warning',
        title: 'Warning',
        message: 'Please enter both session ID and password'
      })
      // <Alert severity="warning">
      //   <AlertTitle>Warning</AlertTitle>
      //   Please enter both session ID and password
      // </Alert>;
      return;
    }

    try {
      const { valid, error } = await verifySession(joinData.id, joinData.pass);

      if (valid) {
        navigate(`/editor/${joinData.id}`, {
          state: {
            sessionPassword: joinData.pass,
            isOwner: false,
          },
        });
      } else {
        setAlert({
          severity: 'warning',
          title: 'Warning',
          message: `${error || 'Invalid session credentials'}`
        })
        // <Alert severity="error">
        //   <AlertTitle>Error</AlertTitle>
        //   {error || "Invalid session credentials"}
        // </Alert>;
      }
    } catch (err) {
      console.error(err);
      setAlert({
        severity: 'warning',
        title: 'Warning',
        message: 'Failed to verify session. Please try again.'
      })
      // <Alert severity="error">
      //   <AlertTitle>Error</AlertTitle>
      //   Failed to verify session. Please try again.
      // </Alert>;
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
      {alert && (
        <Alert 
          severity={alert.severity} 
          onClose={() => setAlert(null)}
          sx={{ mb: 2 }}
        >
          <AlertTitle>{alert.title}</AlertTitle>
          {alert.message}
        </Alert>
      )}
      <h1>Welcome, {currentUser?.displayName}</h1>
      <div className="session-actions">
        <div className="">
          <div className="session-create">
            <h3>Create New Room</h3>
            <div className="password-options">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useCustomPass}
                    onChange={(e) => setUseCustomPass(e.target.checked)}
                  />
                }
                label="Custom Password"
              />

              {useCustomPass && (
                <TextField
                  id="outlined-basic"
                  label="Set Password"
                  size="small"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  variant="outlined"
                />
              )}

              <Button
                variant="contained"
                onClick={handleCreateSession}
                size="small"
              >
                Create Room
              </Button>
            </div>
            {/* <button onClick={handleCreateSession}>Create Session</button> */}
          </div>

          <Divider>
            <Chip label="OR" size="small" />
          </Divider>

          <div className="session-join">
            <h3>Join Existing Room</h3>

            <div className="join-session-container">
              <TextField
                id="outlined-basic"
                label="Session ID"
                size="small"
                onChange={(e) =>
                  setJoinData((p) => ({ ...p, id: e.target.value }))
                }
                value={joinData.id}
                variant="outlined"
              />
              <TextField
                id="outlined-basic"
                label="Password"
                size="small"
                onChange={(e) =>
                  setJoinData((p) => ({ ...p, pass: e.target.value }))
                }
                value={joinData.pass}
                variant="outlined"
              />
              <Button
                variant="outlined"
                onClick={handleJoinSession}
                size="small"
              >
                Join Room
              </Button>
            </div>

            {/* <div className="input-container">
            <input
              type="text"
              className="input"
              value={joinData.id}
              onChange={(e) =>
                setJoinData((p) => ({ ...p, id: e.target.value }))
              }
              placeholder="Session ID"
            />
            <label className="label">Session ID</label>
            <div className="underline"></div>
            </div> */}

            {/* <div className="input-container">
            <input
              type="password"
              className="input"
              value={joinData.pass}
              onChange={(e) =>
                setJoinData((p) => ({ ...p, pass: e.target.value }))
              }
              placeholder="Session Password"
            />
            <label className="label">Password</label>
            <div className="underline"></div>
            </div> */}

            {/* <button onClick={handleJoinSession}>Join Session</button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
