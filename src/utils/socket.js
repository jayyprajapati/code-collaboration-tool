import { io } from 'socket.io-client';

const URL = 'https://api.jayprajapati.me';
let socket;

export const connectSocket = () => {
  socket = io(URL, {
    withCredentials: true,
    autoConnect: false
  });
  return socket;
};

export const getSocket = () => socket;