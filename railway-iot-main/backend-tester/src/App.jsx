import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyOTP from './pages/VerifyOTP';
import RailwayGate from './pages/RailwayGate';
import Device from './pages/Device';
import IoTSimulator from './pages/IoTSimulator';
import Heartbeat from './pages/Heartbeat';
import History from './pages/History';
import Notifications from './pages/Notifications';
import TestingFlow from './pages/TestingFlow';
import Profile from './pages/Profile';
import FavouriteGates from './pages/FavouriteGates';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<VerifyOTP />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/favourite-gates" element={<FavouriteGates />} />
            <Route path="/gates" element={<RailwayGate />} />
            <Route path="/devices" element={<Device />} />
            <Route path="/simulator" element={<IoTSimulator />} />
            <Route path="/heartbeat" element={<Heartbeat />} />
            <Route path="/history" element={<History />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/testing-flow" element={<TestingFlow />} />
          </Routes>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;
