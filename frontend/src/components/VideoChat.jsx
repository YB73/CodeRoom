import React, { useRef, useEffect } from 'react';

export default function VideoChat({ roomId }) {
  const localVideo = useRef();
  const remoteVideo = useRef();
  const peerConnection = useRef();

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }
        
        peerConnection.current = new RTCPeerConnection();
        
        stream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, stream);
        });

        peerConnection.current.ontrack = (event) => {
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = event.streams[0];
          }
        };
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    startVideo();

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [roomId]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <video ref={localVideo} autoPlay muted className="w-full" />
      <video ref={remoteVideo} autoPlay className="w-full" />
    </div>
  );
}