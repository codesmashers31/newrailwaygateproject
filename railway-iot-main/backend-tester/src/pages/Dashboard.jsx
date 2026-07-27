import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { getUserRole } from '../utils/auth';

const Dashboard = () => {
  const [stats, setStats] = useState({
    favouriteCount: 0,
    unreadCount: 0,
    loading: true
  });
  const role = getUserRole();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const favRes = await api.get('/users/profile');
      const favCount = favRes.data.data?.favouriteGates?.length || 0;

      const notifRes = await api.get('/notifications/unread-count');
      const unreadCount = notifRes.data.data?.count || 0;

      setStats({ favouriteCount: favCount, unreadCount, loading: false });
    } catch (err) {
      console.error(err);
      setStats({ favouriteCount: 'Error', unreadCount: 'Error', loading: false });
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Account Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Role Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Current Role</p>
          <div className="text-2xl font-bold">
            <span className={`px-2 py-1 rounded text-white ${role === 'ADMIN' ? 'bg-red-500' : role === 'USER' ? 'bg-green-500' : 'bg-gray-500'}`}>
              {role || 'NONE'}
            </span>
          </div>
        </div>

        {/* Tokens Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-500">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Auth Tokens</p>
          <div className="text-sm font-mono mt-2">
            <div>Access: {localStorage.getItem('accessToken') ? '✅' : '❌'}</div>
            <div>Refresh: {localStorage.getItem('refreshToken') ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* Favourites Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-pink-500">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Favourite Gates</p>
          <div className="text-3xl font-bold text-slate-800">
            {stats.loading ? '...' : stats.favouriteCount}
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-500">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Unread Alerts</p>
          <div className="text-3xl font-bold text-slate-800">
            {stats.loading ? '...' : stats.unreadCount}
          </div>
        </div>

      </div>

      <div className="bg-slate-100 p-6 rounded-lg border text-sm text-slate-700">
        <h3 className="font-bold mb-2">Welcome to the Backend Tester!</h3>
        <p className="mb-2">This UI acts exactly like your mobile frontend or admin panel would, using your authenticated JSON Web Token.</p>
        <ul className="list-disc ml-6 space-y-1">
          {role === 'ADMIN' && <li>You are logged in as an <b>Admin</b>. You have full access to hardware provisioning tools in the top navigation.</li>}
          {role === 'USER' && <li>You are logged in as a <b>Normal User</b>. You can only view status, manage your profile, and receive notifications. Admin tools are completely hidden and API blocked.</li>}
        </ul>
      </div>

    </div>
  );
};

export default Dashboard;
