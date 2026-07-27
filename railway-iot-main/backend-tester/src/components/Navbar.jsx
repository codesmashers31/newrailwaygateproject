import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getUserRole, isAuthenticated } from '../utils/auth';
import api from '../api/axios';

const Navbar = () => {
  const role = getUserRole();
  const isAuth = isAuthenticated();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { token: refreshToken });
      }
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  };

  return (
    <nav className="bg-slate-800 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center">
        
        {/* Logo Area */}
        <div className="font-bold text-xl text-blue-400 flex items-center gap-2">
          Backend Tester 
          {role && <span className={`text-xs px-2 py-1 rounded text-white ${role === 'ADMIN' ? 'bg-red-500' : 'bg-green-500'}`}>{role}</span>}
        </div>

        {/* Links Area */}
        <div className="flex flex-wrap gap-2 items-center">
          {!isAuth && (
            <>
              <NavLink to="/register" className="px-3 py-1 rounded text-sm text-slate-300 hover:text-white">Register</NavLink>
              <NavLink to="/login" className="px-3 py-1 rounded text-sm text-slate-300 hover:text-white">Login</NavLink>
              <NavLink to="/verify" className="px-3 py-1 rounded text-sm text-slate-300 hover:text-white">OTP</NavLink>
            </>
          )}

          {isAuth && (
            <>
              <NavLink to="/" className={({isActive}) => `px-3 py-1 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>Dashboard</NavLink>
              <NavLink to="/profile" className={({isActive}) => `px-3 py-1 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>Profile</NavLink>
              
              {role === 'ADMIN' && (
                <div className="border-l border-slate-600 pl-2 ml-1 flex gap-2">
                  <NavLink to="/gates" className={({isActive}) => `px-3 py-1 rounded text-sm ${isActive ? 'bg-red-600' : 'text-red-300 hover:bg-slate-700'}`}>Gates</NavLink>
                  <NavLink to="/devices" className={({isActive}) => `px-3 py-1 rounded text-sm ${isActive ? 'bg-red-600' : 'text-red-300 hover:bg-slate-700'}`}>Devices</NavLink>
                  <NavLink to="/simulator" className={({isActive}) => `px-3 py-1 rounded text-sm ${isActive ? 'bg-red-600' : 'text-red-300 hover:bg-slate-700'}`}>Simulator</NavLink>
                  <NavLink to="/heartbeat" className={({isActive}) => `px-3 py-1 rounded text-sm ${isActive ? 'bg-red-600' : 'text-red-300 hover:bg-slate-700'}`}>Heartbeat</NavLink>
                </div>
              )}

              {role === 'USER' && (
                <NavLink to="/favourite-gates" className={({isActive}) => `px-3 py-1 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>Favourite Gates</NavLink>
              )}

              <div className="border-l border-slate-600 pl-2 ml-1 flex gap-2">
                <NavLink to="/history" className={({isActive}) => `px-3 py-1 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>History</NavLink>
                <NavLink to="/notifications" className={({isActive}) => `px-3 py-1 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>Notifications</NavLink>
              </div>

              {role === 'ADMIN' && (
                <NavLink to="/testing-flow" className={({isActive}) => `px-3 py-1 rounded text-sm font-bold ml-2 ${isActive ? 'bg-yellow-500 text-black' : 'bg-yellow-600 text-white hover:bg-yellow-500'}`}>
                  Run Checklist
                </NavLink>
              )}

              <button onClick={handleLogout} className="ml-4 px-3 py-1 rounded text-sm bg-red-500 hover:bg-red-600 text-white">
                Logout
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;

