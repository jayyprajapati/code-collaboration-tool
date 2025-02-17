import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import PropTypes from "prop-types";
import 'xterm/css/xterm.css';

export default function TerminalUI({ socket, sessionId }) {
  const terminalRef = useRef(null);
  const term = useRef();
  const fitAddon = useRef();

  useEffect(() => {
    term.current = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff'
      },
      fontSize: 14,
      cursorBlink: true
    });
    
    fitAddon.current = new FitAddon();
    term.current.loadAddon(fitAddon.current);
    term.current.open(terminalRef.current);
    fitAddon.current.fit();

    // Handle incoming output
    socket.on('terminal-output', (data) => {
      term.current.write(data);
    });

    // Send user input
    term.current.onData((data) => {
      socket.emit('terminal-input', { 
        sessionId,
        input: data 
      });
    });

    return () => {
      term.current.dispose();
      socket.off('terminal-output');
    };
  }, [socket, sessionId]);

  return <div ref={terminalRef} style={{ height: '400px', width: '100%' }} />;
}

TerminalUI.propTypes = {
  socket: PropTypes.object.isRequired,
  sessionId: PropTypes.string.isRequired,
};