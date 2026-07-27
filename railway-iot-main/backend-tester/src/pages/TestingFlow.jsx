import React, { useState } from 'react';
import axios from 'axios';

const TestingFlow = () => {
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const baseApi = axios.create({ baseURL: 'http://localhost:3000/api' });

  const updateResult = (testName, status) => {
    setResults(prev => ({ ...prev, [testName]: status }));
  };

  const runIntegrationSuite = async () => {
    setIsRunning(true);
    setResults({}); // Reset

    let adminJwt = '';
    let userJwt = '';
    let gateId = '';
    let deviceId = '';
    let deviceCode = `ESP-TEST-${Math.floor(Math.random() * 1000)}`;
    let gateCode = `GATE-TEST-${Math.floor(Math.random() * 1000)}`;

    try {
      // ---------------------------------------------------------
      // PHASE 1: ADMIN SETUP
      // ---------------------------------------------------------
      updateResult('adminLogin', '⏳ Running');
      const adminLoginRes = await baseApi.post('/auth/login', { phone: '+919999999999' });
      const adminOtp = adminLoginRes.data.data.otp;
      const adminVerifyRes = await baseApi.post('/auth/verify-otp', { phone: '+919999999999', otp: adminOtp });
      adminJwt = adminVerifyRes.data.data.accessToken;
      updateResult('adminLogin', '✅ PASS');

      updateResult('createGate', '⏳ Running');
      const gateRes = await baseApi.post('/gates', {
        gateCode, gateName: "Auto Test Gate", latitude: 12.0, longitude: 80.0
      }, { headers: { Authorization: `Bearer ${adminJwt}` } });
      gateId = gateRes.data.data._id;
      updateResult('createGate', '✅ PASS');

      updateResult('createDevice', '⏳ Running');
      const deviceRes = await baseApi.post('/devices', {
        deviceCode, deviceName: "Auto Test ESP", serialNumber: "SN-AUTO", macAddress: "00:00:00", firmwareVersion: "v1", hardwareVersion: "v1"
      }, { headers: { Authorization: `Bearer ${adminJwt}` } });
      deviceId = deviceRes.data.data._id;
      updateResult('createDevice', '✅ PASS');

      updateResult('assignDevice', '⏳ Running');
      await baseApi.put(`/gates/${gateId}/assign-device`, { deviceId }, { headers: { Authorization: `Bearer ${adminJwt}` } });
      updateResult('assignDevice', '✅ PASS');

      // ---------------------------------------------------------
      // PHASE 2: USER SETUP
      // ---------------------------------------------------------
      updateResult('userLogin', '⏳ Running');
      const userPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      await baseApi.post('/auth/register', { name: "Test User", phone: userPhone });
      const userLoginRes = await baseApi.post('/auth/login', { phone: userPhone });
      const userOtp = userLoginRes.data.data.otp;
      const userVerifyRes = await baseApi.post('/auth/verify-otp', { phone: userPhone, otp: userOtp });
      userJwt = userVerifyRes.data.data.accessToken;
      updateResult('userLogin', '✅ PASS');

      // ---------------------------------------------------------
      // PHASE 3: RBAC ENFORCEMENT
      // ---------------------------------------------------------
      updateResult('rbacGate', '⏳ Running');
      try {
        await baseApi.post('/gates', { gateCode: "FAIL" }, { headers: { Authorization: `Bearer ${userJwt}` } });
        updateResult('rbacGate', '❌ FAIL (Did not get 403)');
      } catch (err) {
        if (err.response?.status === 403) updateResult('rbacGate', '✅ PASS (403 Forbidden)');
        else updateResult('rbacGate', `❌ FAIL (Got ${err.response?.status})`);
      }

      updateResult('rbacDevice', '⏳ Running');
      try {
        await baseApi.post('/devices', { deviceCode: "FAIL" }, { headers: { Authorization: `Bearer ${userJwt}` } });
        updateResult('rbacDevice', '❌ FAIL (Did not get 403)');
      } catch (err) {
        if (err.response?.status === 403) updateResult('rbacDevice', '✅ PASS (403 Forbidden)');
        else updateResult('rbacDevice', `❌ FAIL (Got ${err.response?.status})`);
      }

      // ---------------------------------------------------------
      // PHASE 4: IOT SIMULATION (No JWT)
      // ---------------------------------------------------------
      updateResult('iotStatus', '⏳ Running');
      await baseApi.post('/iot/status', {
        deviceCode, status: "OPEN", sensorType: "REED_SWITCH", source: "HTTP", eventTime: new Date().toISOString()
      });
      updateResult('iotStatus', '✅ PASS');

      updateResult('iotHeartbeat', '⏳ Running');
      await baseApi.post('/iot/heartbeat', {
        deviceCode, rssi: -50, freeHeap: 200000, uptimeSeconds: 100
      });
      updateResult('iotHeartbeat', '✅ PASS');

      // ---------------------------------------------------------
      // PHASE 5: HISTORY VERIFICATION
      // ---------------------------------------------------------
      updateResult('historyCheck', '⏳ Running');
      const historyRes = await baseApi.get(`/gates/${gateId}/history`, { headers: { Authorization: `Bearer ${userJwt}` } });
      if (historyRes.data.data.length > 0 && historyRes.data.data[0].status === 'OPEN') {
        updateResult('historyCheck', '✅ PASS (Found OPEN event)');
      } else {
        updateResult('historyCheck', '❌ FAIL (Event not found)');
      }

    } catch (error) {
      console.error(error);
      alert("A critical error halted the test suite. Check console.");
    } finally {
      setIsRunning(false);
    }
  };

  const TestRow = ({ label, name }) => (
    <div className="flex justify-between items-center border-b py-3">
      <span className="font-semibold text-gray-700">{label}</span>
      <span className="font-mono font-bold text-sm">
        {results[name] || <span className="text-gray-400">Pending</span>}
      </span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
      <div className="bg-slate-800 p-6 text-white text-center">
        <h1 className="text-2xl font-bold mb-2">Automated Integration Suite</h1>
        <p className="text-slate-300 text-sm">Stateful, End-to-End API Verification</p>
      </div>

      <div className="p-6">
        <button 
          onClick={runIntegrationSuite} 
          disabled={isRunning}
          className={`w-full py-4 rounded-lg font-bold text-lg text-white transition mb-8 shadow-md ${isRunning ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
        >
          {isRunning ? 'Executing Test Suite...' : '🚀 RUN FULL INTEGRATION TEST'}
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2 border-b pb-1">1. Admin Setup & Memory</h2>
            <TestRow label="Login Admin & Save JWT" name="adminLogin" />
            <TestRow label="Create Temporary Gate" name="createGate" />
            <TestRow label="Create Temporary Device" name="createDevice" />
            <TestRow label="Assign Device to Gate" name="assignDevice" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2 border-b pb-1">2. User Setup & Memory</h2>
            <TestRow label="Register & Login User (Save JWT)" name="userLogin" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2 border-b pb-1">3. RBAC Enforcement</h2>
            <TestRow label="Attempt Gate Creation (USER JWT)" name="rbacGate" />
            <TestRow label="Attempt Device Creation (USER JWT)" name="rbacDevice" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2 border-b pb-1">4. IoT Hardware Simulation</h2>
            <TestRow label="Send Status (OPEN)" name="iotStatus" />
            <TestRow label="Send Heartbeat" name="iotHeartbeat" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2 border-b pb-1">5. Data Retrieval</h2>
            <TestRow label="Fetch & Verify Gate History" name="historyCheck" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingFlow;
