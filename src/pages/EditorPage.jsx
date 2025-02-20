import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/Loader";
import Chat from "../components/Chat";
import RoleManager from "../components/RoleManager";
import { CopyToClipboard } from "react-copy-to-clipboard";
// import CodeRunner from "../components/codeRunner";
import TerminalUI from "../components/TerminalUI";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Button from "@mui/material/Button";
import PasswordIcon from "@mui/icons-material/Password";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Split from "react-split";
import IconButton from '@mui/material/IconButton';

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
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef(null);

  const sessionPassword = location.state?.sessionPassword;

  const LANGUAGE_TEMPLATES = {
    python: "# New Python Session Started\n\n",
    javascript: "// New JavaScript Session Started\n\n",
    java: `public class code {
      public static void main(String[] args) {
          // New Java Session Started. Do not change the template. Start coding from here.
          \n
      }
  }\n`,
  };

  const handleLanguageChange = (newLang) => {
    // Save current code if user wants to keep it
    if (code !== LANGUAGE_TEMPLATES[language] && code !== "") {
      const keepCode = confirm(
        "Changing language will reset the editor. Continue?"
      );
      if (!keepCode) return;
    }

    setLanguage(newLang);
    setCode(LANGUAGE_TEMPLATES[newLang]);
  };

  // Configure editor options
  const editorOptions = {
    readOnly: userRole === "viewer",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    cursorPosition:
      language === "java" ? { lineNumber: 4, column: 8 } : undefined,
  };

  // Editor mount handler
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    // Set initial template
    editor.setValue(LANGUAGE_TEMPLATES[language]);

    // Java-specific setup
    if (language === "java") {
      const model = editor.getModel();
      model.updateOptions({ tabSize: 4 });

      // Lock class definition lines
      editor.createDecorationsCollection([
        {
          range: new monaco.Range(1, 1, 3, 1),
          options: {
            isWholeLine: true,
            className: "locked-line",
            hoverMessage: "Class structure is fixed",
          },
        },
      ]);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const codeUpdateHandler = (newCode) => {
      setCode((prev) => (prev !== newCode ? newCode : prev));
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
        userId: currentUser.uid,
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

    socket.on("session-ended", () => {
      navigate("/dashboard");
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

  const handleRun = () => {
    setIsRunning(true);
    socket.emit("run-code", {
      sessionId,
      code,
      language,
    });
  };

  useEffect(() => {
    if (!socket) return;

    // Handle real-time output
    const outputHandler = (data) => {
      if (data.sessionId === sessionId) {
        // Output will be handled by Terminal component
      }
    };

    // Handle execution completion
    const completeHandler = () => {
      setIsRunning(false);
    };

    socket.on("terminal-output", outputHandler);
    socket.on("execution-complete", completeHandler);

    return () => {
      socket.off("terminal-output", outputHandler);
      socket.off("execution-complete", completeHandler);
    };
  }, [socket, sessionId]);

  useEffect(() => {
    console.log("Socket connected?", socket?.connected);
    socket?.on("connect", () => console.log("Socket connected!"));
    socket?.on("disconnect", () => console.log("Socket disconnected"));
  }, [socket]);

  // Show loader until connection is ready
  if (!isConnected || !currentUser) {
    return <Loader />;
  }

  // function EditorComponent() {
  //   return (
  //     <Editor
  //       width="100%"
  //       language={language}
  //       value={code}
  //       onChange={handleEditorChange}
  //       theme="vs-dark"
  //       onMount={handleEditorMount}
  //       options={editorOptions}
  //     />
  //   );
  // }

  // function TerminalAndChatComponent() {
  //   return (
  //     <Split sizes={[50, 50]} direction="vertical">
  //       <TerminalUI
  //         socket={socket}
  //         sessionId={sessionId}
  //         isRunning={isRunning}
  //       />
  //       <Chat
  //         socket={socket}
  //         sessionId={sessionId}
  //         currentUser={currentUser}
  //         initialMessages={chatMessages}
  //         onNewMessage={(msg) => setChatMessages((prev) => [...prev, msg])}
  //       />
  //     </Split>
  //   );
  // }

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
          {copied ? <AssignmentTurnedInIcon /> : <IconButton><CopyAllIcon /></IconButton>}
          {/* <button className="copy-btn">
            {copied ? "✓ Copied" : "Copy ID"}
          </button> */}
        </CopyToClipboard>
        <CopyToClipboard
          text={sessionPassword}
          onCopy={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? <AssignmentTurnedInIcon /> : <IconButton><PasswordIcon /></IconButton>}

          {/* <button className="copy-btn">
            {copied ? "✓ Copied" : "Copy pwd"}
          </button> */}
        </CopyToClipboard>

        {userRole === "owner" && (
          <Button
            variant="contained"
            endIcon={<HighlightOffIcon />}
            onClick={() =>
              socket.emit("end-session", {
                sessionId,
                userId: currentUser.uid,
              })
            }
          >
            Dismiss Room
          </Button>
        )}

        <Button
          variant="contained"
          endIcon={<ExitToAppIcon />}
          onClick={() => {
            socket.emit("leave-session", sessionId);
            navigate("/dashboard");
          }}
        >
          Leave
        </Button>

        <Button
          variant="outlined"
          startIcon={<PlayCircleOutlineIcon />}
          onClick={handleRun} disabled={isRunning}
        >
          {isRunning ? "Running..." : "Run Code"}
        </Button>
        {/* <div className="connection-status">
          
          Live Connection
        </div> */}

<Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Language</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={language}
          label="Language"
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          <MenuItem value='javascript'>Javascript</MenuItem>
          <MenuItem value='python'>Python</MenuItem>
          <MenuItem value='java'>Java</MenuItem>
        </Select>
      </FormControl>
    </Box>

        {/* <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="language-selector"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select> */}
      </div>

      {/* <div className="execution-panel">
        <CodeRunner
          code={code}
          language={language}
          socket={socket}
          sessionId={sessionId}
        />
      </div> */}

      {/* <Split
        className="wrap"
        sizes={[50, 50]}
        // minSize={100}
        // expandToMin={false}
        // gutterSize={10}
        // gutterAlign="center"
        // snapOffset={30}
        // dragInterval={1}
        direction="horizontal"
      >
        <EditorComponent />
        <TerminalAndChatComponent />
      </Split> */}

<div style={{ height: '100vh' }}>
      <Split
        sizes={[50, 50]}
        minSize={100}
        expandToMin={false}
        gutterSize={10}
        gutterAlign="center"
        direction="horizontal"
        cursor="col-resize"
        className="wrap"
      >
        <div className="h-full">
        <Editor
        width="100%"
        language={language}
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={editorOptions}
      />
        </div>

        <Split
          sizes={[50, 50]}
          minSize={[100, 100]}
          expandToMin={false}
          gutterSize={10}
          direction="vertical"
          cursor="row-resize"
          className="h-full flex flex-col"
        >
          <TerminalUI
          socket={socket}
          sessionId={sessionId}
          isRunning={isRunning}
        />
        <Chat
          socket={socket}
          sessionId={sessionId}
          currentUser={currentUser}
          initialMessages={chatMessages}
          onNewMessage={(msg) => setChatMessages((prev) => [...prev, msg])}
        />
        </Split>
        </Split>
        </div>

      {/* <div className="terminal-wrapper">
        <button >
          
        </button>
      </div> */}

      {/* <div style={{ width: "800px", height: "500px" }}> 
    
    </div> */}

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
    </div>
  );
}
