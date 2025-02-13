import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import CodeEditor from './CodeEditor';
import VideoChat from './VideoChat';

export default function Room() {
  const [code, setCode] = useState('');
  const ws = useRef(null);
  const { roomId } = useParams();

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8080/ws/${roomId}`);
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'code') {
        setCode(message.content);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomId]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'code',
        content: newCode
      }));
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 h-full">
        <VideoChat roomId={roomId} />
      </div>
      <div className="w-1/2 h-full">
        <CodeEditor code={code} onChange={handleCodeChange} />
      </div>
    </div>
  );
}