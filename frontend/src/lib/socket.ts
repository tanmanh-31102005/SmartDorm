'use client';
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, { transports: ['websocket', 'polling'], reconnection: true });
  }
  return socket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setConnected(s.connected);

    return () => {
      s.off('connect');
      s.off('disconnect');
    };
  }, []);

  return { socket: socketRef.current, connected };
}
