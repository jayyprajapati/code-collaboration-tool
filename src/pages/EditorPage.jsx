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
import TerminalUI from "../components/TerminalUI";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Button from "@mui/material/Button";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import Split from "react-split";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import KeyIcon from "@mui/icons-material/Key";
import CodeIcon from "@mui/icons-material/Code";
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import MoreVertIcon from '@mui/icons-material/MoreVert';


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
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef(null);
  const [isLangSelectDropdownOpen, setIsLangSelectDropdownOpen] = useState(false);
  const [toggleRoleManagerDropdown, setToggleRoleManagerDropdown] = useState(false);

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

  const langOptions = ["javascript", "python", "java"];

  function ConvertTextToTitleCase(text) {
    return text.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  const handleLanguageChange = (newLang) => {
    // Save current code if user wants to keep it
    if (code !== LANGUAGE_TEMPLATES[language] && code !== "") {
      const keepCode = confirm(
        "Changing language will reset the editor. Continue?"
      );
      if (!keepCode) return;
    }
    setIsLangSelectDropdownOpen(false);
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

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="session-details">
        <h2>{sessionId}</h2>
        <CopyToClipboard
          text={sessionId}
          onCopy={() => {
            setCopiedSessionId(true);
            setTimeout(() => setCopiedSessionId(false), 1000);
          }}
        >
          {copiedSessionId ? (
            <IconButton><CheckIcon /></IconButton>
            
          ) : (
            <Tooltip title="Copy Session ID" arrow slots={{
              transition: Zoom,
            }}>
              <IconButton>
              <CopyAllIcon />
            </IconButton>
            </Tooltip>
            
          )}

        </CopyToClipboard>
        <CopyToClipboard
          text={sessionPassword}
          onCopy={() => {
            setCopiedPass(true);
            setTimeout(() => setCopiedPass(false), 1000);
          }}
        >
          {copiedPass ? (
            <IconButton><CheckIcon /></IconButton>
          ) : (
            <Tooltip title="Copy Password" arrow slots={{
              transition: Zoom,
            }}> 
               <IconButton>
              <KeyIcon />
            </IconButton>
            </Tooltip>
           
          )}
        </CopyToClipboard>

        </div>
          
        <div className="avatar-role-manager">
          <AvatarGroup max={4}>
                    {users.map((user) => (
                      <Avatar key={user.name} alt={user.name}>
                        {user.name[0]}
                      </Avatar>
                    ))}
                    {users.length > 0 && userRole === "owner" && <>
                       <IconButton onClick={() => setToggleRoleManagerDropdown(!toggleRoleManagerDropdown)}>
                              <MoreVertIcon />
                            </IconButton>
                    </>}
                  </AvatarGroup>
        {userRole === "owner" && toggleRoleManagerDropdown && (
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
        

        {userRole === "owner" ? (
          <Button
            variant="contained"
            endIcon={<HighlightOffIcon />}
            color="error"
            onClick={() =>
              socket.emit("end-session", {
                sessionId,
                userId: currentUser.uid,
              })
            }
          >
            End
          </Button>
        ) : <Button
        variant="contained"
        endIcon={<ExitToAppIcon />}
        color="error"
        onClick={() => {
          socket.emit("leave-session", sessionId);
          navigate("/dashboard");
        }}
      >
        Leave
      </Button>}
      </div>

      <div style={{ height: "100vh" }}>
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
            <div className="editor-head">
              <div className="editor-title">
                <CodeIcon /> &nbsp; <span>Editor</span>
              </div>
              <div className="editor-file-name">Code.{language == 'javascript' ? 'js' : language == 'python' ? 'py' : 'java'}</div>
              <div className="editor-actions">
                <div className="lang-select-wrapper">
                <button className="lang-select" onClick={()=>setIsLangSelectDropdownOpen(!isLangSelectDropdownOpen)}>
                  {language.replace(/^./, char => char.toUpperCase())} <KeyboardArrowDownIcon />
                </button>
                {isLangSelectDropdownOpen && (<div className="lang-select-dropdown">
                  {langOptions.map((lang) => (
                    <div className="lang-select-option" key={lang} onClick={()=>handleLanguageChange(lang)}> <CheckIcon style={{ visibility: lang == language ? "visible" : "hidden" }}/> { ConvertTextToTitleCase(lang)}</div>
                  ))}
                </div>)}
                </div>
                
                <button
                className="run-button"
                  onClick={handleRun}
                  disabled={isRunning}
                >
                  {isRunning ? "Running..." : "Run"}
                </button>

              </div>
            </div>
            <Editor
              width="100%"
              height="calc(100% - 80px)"
              language={language}
              value={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              onMount={handleEditorMount}
              options={editorOptions}
            />
            <div className="editor-footer">
            </div>
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

      
    </div>
  );
}
