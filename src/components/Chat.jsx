import { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function Chat({ socket, sessionId, currentUser, initialMessages, onNewMessage }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
        setMessages(prev => [...prev, msg]);
        onNewMessage(msg); // Update parent state
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
                <strong>{msg.user}:</strong> {msg.message}
              </>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

Chat.propTypes = {
  socket: PropTypes.object.isRequired,
  sessionId: PropTypes.string.isRequired,
  currentUser: PropTypes.object.isRequired,
  initialMessages: PropTypes.array,
  onNewMessage: PropTypes.func.isRequired
};
