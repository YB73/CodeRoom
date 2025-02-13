import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Room from './components/Room';
import Login from './components/Login';
import RoomList from './components/RoomList';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route 
            path="/login" 
            element={<Login setIsAuthenticated={setIsAuthenticated} />} 
          />
          <Route
            path="/rooms"
            element={
              isAuthenticated ? <RoomList /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/room/:roomId"
            element={
              isAuthenticated ? <Room /> : <Navigate to="/login" />
            }
          />
          <Route path="/" element={<Navigate to="/rooms" />} />
        </Routes>
      </div>
    </Router>
  );
}