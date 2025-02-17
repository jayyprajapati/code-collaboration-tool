import { useState, useEffect } from 'react';
import PropTypes from "prop-types";

export default function CodeRunner({ socket, sessionId, code, language }) {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [input, setInput] = useState('');

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('http://localhost:3001/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, input })
      });
      
      const result = await response.json();
      if (socket && result.output) {
        socket.emit('code-executed', {
          sessionId,
          output: result.output
        });
      }

      setOutput(result.error ? `Error: ${result.error}` : result.output);
    } catch (err) {
      setOutput(`Connection error: ${err.message}`);
    }
    setIsRunning(false);
  };

  useEffect(() => {
    if (!socket) return;
  
    const handleExecutionResult = (data) => {
      setOutput(data.output);
    };
  
    socket.on("execution-result", handleExecutionResult);
    
    return () => {
      socket.off("execution-result", handleExecutionResult);
    };
  }, [socket]);

  return (
    <div className="code-runner">
      <div className="runner-controls">
        <button onClick={handleRun} disabled={isRunning}>
          {isRunning ? 'Running...' : '▶ Run Code'}
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Input (optional)"
        />
      </div>
      <pre className="output">
        {output || 'Click "Run" to see output...'}
      </pre>
    </div>
  );
}

CodeRunner.propTypes = {
  code: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  socket: PropTypes.object.isRequired,
  sessionId: PropTypes.string.isRequired,
};