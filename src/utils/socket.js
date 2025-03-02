import { io } from 'socket.io-client';

const URL = 'http://localhost:8000';
let socket;

export const connectSocket = () => {
  socket = io(URL, {
    withCredentials: true,
    autoConnect: false
  });
  return socket;
};

export const getSocket = () => socket;