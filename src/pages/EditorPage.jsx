import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/Loader";
import Chat from "../components/Chat";
import RoleManager from "../components/RoleManager";
import { CopyToClipboard } from "react-copy-to-clipboard";

export default function EditorPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const { currentUser } = useAuth();


  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState("editor");
  const [chatMessages, setChatMessages] = useState([]);
  const [copied, setCopied] = useState(false);

  const sessionPassword = location.state?.sessionPassword;

  useEffect(() => {
    if (!socket) return;
  
    const codeUpdateHandler = (newCode) => {
      setCode(prev => prev !== newCode ? newCode : prev);
    };
  
    socket.on("code-update", codeUpdateHandler);
  
    return () => {
      socket.off("code-update", codeUpdateHandler);
    };
  }, [socket]);

  // Handle session join and initial data load
  useEffect(() => {
    if (!isConnected || !socket || !currentUser) return;

    const handleJoinSession = () => {
      socket.emit("join-session", {
        sessionId,
        user: currentUser.displayName,
        password: sessionPassword,
        userId: currentUser.uid
      });

      socket.on("session-data", ({ code: initialCode, chat, role }) => {
        setCode(initialCode);
        setUserRole(role);
        setChatMessages(chat || []); // Initialize chat messages
      });

      // socket.on("user-list", (userList) => {
      //   setUsers(userList);
      // });

      socket.on("role-updated", ({ user, newRole }) => {
        if (user === currentUser.displayName) {
          setUserRole(newRole);
        }
        setUsers((prev) =>
          prev.map((u) => (u.name === user ? { ...u, role: newRole } : u))
        );
      });
    };

    handleJoinSession();

    return () => {
      socket.off("session-data");
      // socket.off("user-list");
      socket.off("role-updated");
    };
  }, [isConnected, socket, sessionId, currentUser, sessionPassword]);

  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdate = (newCode) => {
      // Update only if different from current code
      if (newCode !== code) {
        setCode(newCode);
      }
    };

    socket.on("code-update", handleCodeUpdate);

    return () => {
      socket.off("code-update", handleCodeUpdate);
    };
  }, [socket, code]);

  useEffect(() => {
    if (!socket) return;

    const handleUserList = (users) => {
      setUsers(users.filter((u) => u.name !== currentUser.displayName));
    };

    socket.on("user-list", handleUserList);
    

    return () => {
      socket.off("user-list", handleUserList);
    };
  }, [socket, currentUser]);

  useEffect(() => {
    if (!socket) return;

    socket.on("user-left", ({ user, message }) => {
      setUsers((prev) => prev.filter((u) => u.name !== user));
      setChatMessages((prev) => [
        ...prev,
        {
          type: "system",
          message: message,
        },
      ]);
    });

    socket.on('session-ended', () => {
      navigate('/dashboard');
    });

    return () => {
      socket.off("user-left");
    };
  }, [socket, navigate]);

  // Handle code changes with debounce
  const handleEditorChange = (value) => {
    setCode(value);
    if (socket?.connected) {
      socket.emit("code-change", {
        sessionId,
        code: value,
      });
    }
  };

  // Show loader until connection is ready
  if (!isConnected || !currentUser) {
    return <Loader />;
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>Session: {sessionId}</h2>
        <CopyToClipboard
          text={sessionId}
          onCopy={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <button className="copy-btn">
            {copied ? "✓ Copied" : "Copy ID"}
          </button>
        </CopyToClipboard>
        <CopyToClipboard
          text={sessionPassword}
          onCopy={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <button className="copy-btn">
            {copied ? "✓ Copied" : "Copy pwd"}
          </button>
        </CopyToClipboard>

        {userRole === "owner" && (
          <button
            className="end-session-btn"
            onClick={() => socket.emit("end-session", { 
              sessionId, 
              userId: currentUser.uid 
            })}
          >
            End Session
          </button>
        )}
        <button
          className="leave-session-btn"
          onClick={() => {
            socket.emit("leave-session", sessionId);
            navigate("/dashboard");
          }}
        >
          Leave Session
        </button>
        <div className="connection-status">
          <span className="status-indicator connected"></span>
          Live Connection
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="language-selector"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
      </div>

      <Editor
        height="80vh"
        language={language}
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          readOnly: userRole === "viewer",
        }}
      />

      {userRole === "owner" && (
        <RoleManager
          users={users}
          onRoleChange={(user, role) => {
            socket.emit("change-role", {
              sessionId,
              targetUser: user,
              newRole: role,
            });
          }}
        />
      )}

      <Chat
        socket={socket}
        sessionId={sessionId}
        currentUser={currentUser}
        initialMessages={chatMessages}
        onNewMessage={(msg) => setChatMessages((prev) => [...prev, msg])}
      />
    </div>
  );
}
