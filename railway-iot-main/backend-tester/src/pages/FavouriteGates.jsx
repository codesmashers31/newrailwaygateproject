import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/Card';

const FavouriteGates = () => {
  const [reqState, setReqState] = useState({});
  const [gates, setGates] = useState([]);
  const [favourites, setFavourites] = useState([]);

  useEffect(() => {
    fetchFavourites();
    fetchAllGates();
  }, []);

  const fetchFavourites = async () => {
    const startTime = Date.now();
    try {
      const res = await api.get('/users/favourite-gates');
      setFavourites(res.data.data.map(g => g._id) || []);
      setReqState({ status: res.status, time: Date.now() - startTime, response: res.data });
    } catch (error) {
      setReqState({ status: error.response?.status || 500, time: Date.now() - startTime, response: error.response?.data });
    }
  };

  const fetchAllGates = async () => {
    try {
      const res = await api.get('/gates');
      setGates(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleFavourite = async (gateId) => {
    const isFav = favourites.includes(gateId);
    let newFavs = [];
    if (isFav) {
      newFavs = favourites.filter(id => id !== gateId);
    } else {
      newFavs = [...favourites, gateId];
    }
    setFavourites(newFavs);

    const startTime = Date.now();
    try {
      const res = await api.put('/users/favourite-gates', { gates: newFavs });
      setReqState({ status: res.status, time: Date.now() - startTime, request: { gates: newFavs }, response: res.data });
      toast.success(isFav ? 'Removed from favourites' : 'Added to favourites');
    } catch (error) {
      setReqState({ status: error.response?.status || 500, time: Date.now() - startTime, request: { gates: newFavs }, response: error.response?.data });
      toast.error('Failed to update favourites');
      fetchFavourites(); // revert state
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Card title="Favourite Gates" method="PUT" endpoint="/users/favourite-gates" {...reqState}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gates.map(gate => {
            const isFav = favourites.includes(gate._id);
            return (
              <div key={gate._id} className="border p-4 rounded flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold">{gate.gateName}</h3>
                  <p className="text-xs text-gray-500">{gate.gateCode}</p>
                </div>
                <button 
                  onClick={() => toggleFavourite(gate._id)}
                  className={`px-3 py-1 rounded text-sm font-bold text-white transition ${isFav ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {isFav ? 'Remove' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default FavouriteGates;
