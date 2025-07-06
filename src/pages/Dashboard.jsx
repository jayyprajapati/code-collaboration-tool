import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
import CircularProgress from "@mui/material/CircularProgress";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [createSessionConfig, setCreateSessionConfig] = useState({
    useCustomPass: false,
    password: "",
  });
  const [joinData, setJoinData] = useState({ id: "", pass: "" });
  const [alert, setAlert] = useState(null);

  const handleCreateSession = async () => {
    setCreatingRoom(true);
    const newSessionId = generateSessionId();
    const finalPassword = createSessionConfig.useCustomPass
      ? createSessionConfig.password
      : generateStrongPassword();

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
          severity: "warning",
          title: "Warning",
          message: error || "Could not start a new session. Please try again later!",
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({
        severity: "error",
        title: "Error",
        message: "Failed to create session. Please try again.",
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinData.id || !joinData.pass) {
      setAlert({
        severity: "warning",
        title: "Warning",
        message: "Please enter both session ID and password",
      });
      return;
    }

    setJoiningRoom(true);

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
          severity: "warning",
          title: "Warning",
          message: error || "Invalid session credentials",
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({
        severity: "error",
        title: "Error",
        message: "Failed to verify session. Please try again.",
      });
    } finally {
      setJoiningRoom(false);
    }
  };

  return (
    <div className="dashboard">
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
                    checked={createSessionConfig.useCustomPass}
                    onChange={(e) =>
                      setCreateSessionConfig((prev) => ({
                        ...prev,
                        useCustomPass: e.target.checked,
                      }))
                    }
                    disabled={creatingRoom}
                  />
                }
                label="Custom Password"
              />

              {createSessionConfig.useCustomPass && (
                <TextField
                  id="outlined-basic"
                  label="Set Password"
                  size="small"
                  onChange={(e) =>
                    setCreateSessionConfig((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  value={createSessionConfig.password}
                  variant="outlined"
                  disabled={creatingRoom}
                />
              )}

              <Button
                variant="contained"
                onClick={handleCreateSession}
                size="small"
                disabled={creatingRoom}
                startIcon={creatingRoom ? <CircularProgress size={20} /> : null}
              >
                {creatingRoom ? "Creating..." : "Create Room"}
              </Button>
            </div>
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
                disabled={joiningRoom}
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
                disabled={joiningRoom}
              />
              <Button
                variant="outlined"
                onClick={handleJoinSession}
                size="small"
                disabled={joiningRoom}
                startIcon={joiningRoom ? <CircularProgress size={20} /> : null}
              >
                {joiningRoom ? "Joining..." : "Join Room"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

