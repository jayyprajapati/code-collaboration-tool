import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function Chat({ socket, sessionId, currentUser, messages, onNewMessage }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
        setMessages(prev => [...prev, msg]);
      };

    socket.on("chat-message", handleNewMessage);

    return () => {
      socket.off("chat-message", handleNewMessage);
    };
  }, [socket, onNewMessage]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("send-chat-message", {
        sessionId,
        message: message.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName,
      });
      onNewMessage({ type: "user", message: message.trim(), user: currentUser.displayName });
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${
              msg.type === "system" ? "system-message" : ""
            }`}
          >
            {msg.type === "system" ? (
              <em>{msg.message}</em>
            ) : (
              <>
              <div  className={`user-message ${msg.user == currentUser.displayName ? "message-sender" : ""}`}>
                <div>
                  <AccountCircleIcon  color="disabled"/>
                </div>
              <div className="message-text">
              <div className="message-sender-name">{msg.user}</div>
              <div className={`message-content ${msg.user == currentUser.displayName ? "message-sender-content" : ""}`}>{msg.message}</div>
              </div>
              </div>
              
              
                {/* <strong>{msg.user}:</strong> {msg.message} */}
              </>
            )}
          </div>
        ))}
      </div>

        <div className="send-chat-input">
          <Paper
                component="form"
                onSubmit={sendMessage}
                sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
              >
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  value={message}
                  placeholder="Send a message..."
                  onChange={(e) => setMessage(e.target.value)}
                  inputProps={{ 'aria-label': 'Send a message' }}
                />
                <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                <IconButton color="primary" sx={{ p: '10px' }} aria-label="send message" type="submit">
                  <SendIcon />
                </IconButton>
              </Paper>
        </div>
      

      {/* <form onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form> */}
    </div>
  );
}

Chat.propTypes = {
  socket: PropTypes.object.isRequired,
  sessionId: PropTypes.string.isRequired,
  currentUser: PropTypes.object.isRequired,
  messages: PropTypes.array.isRequired,
  onNewMessage: PropTypes.func.isRequired
};
