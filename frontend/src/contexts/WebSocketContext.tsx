import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type EventHandler = (data: any) => void;

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (event: string, handler: EventHandler) => () => void;
  lastEvent: { event: string; data: any } | null;
}

const WebSocketContext = createContext<WebSocketContextType>({} as WebSocketContextType);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ event: string; data: any } | null>(null);
  const listenersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: any;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/events/`;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);
          const { event, data } = payload;
          setLastEvent({ event, data });

          const handlers = listenersRef.current.get(event);
          if (handlers) {
            handlers.forEach((h) => h(data));
          }
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Try reconnecting after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const subscribe = (event: string, handler: EventHandler) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);

    return () => {
      listenersRef.current.get(event)?.delete(handler);
    };
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe, lastEvent }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
