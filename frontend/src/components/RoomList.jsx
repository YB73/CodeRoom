import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName }),
      });
      
      if (response.ok) {
        setNewRoomName('');
        fetchRooms();
      }
    } catch (err) {
      console.error('Error creating room:', err);
    }
  };

  return (
    <div className="max-w-4xl p-8 mx-auto">
      <h1 className="mb-8 text-3xl font-bold">Coding Rooms</h1>
      
      <form onSubmit={createRoom} className="mb-8">
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="New Room Name"
          className="p-2 mr-4 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Create Room
        </button>
      </form>
      
      <div className="grid grid-cols-3 gap-4">
        {rooms.map(room => (
          <div
            key={room.id}
            onClick={() => navigate(`/room/${room.id}`)}
            className="p-4 bg-white rounded shadow cursor-pointer hover:shadow-md"
          >
            <h3 className="text-xl font-semibold">{room.name}</h3>
            <p className="text-gray-500">
              Created: {new Date(room.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}