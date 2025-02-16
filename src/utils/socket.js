import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
let socket;

export const connectSocket = () => {
  socket = io(URL, {
    withCredentials: true,
    autoConnect: false
  });
  return socket;
};

export const getSocket = () => socket;