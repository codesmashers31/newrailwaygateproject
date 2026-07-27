import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import RailwayGate from './models/RailwayGate.js';
import ESP32Device from './models/ESP32Device.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Seeding Database (Idempotent)...');

    // 1. Seed Default Admin User
    const existingAdmin = await User.findOne({ phone: '+919999999999' });
    if (!existingAdmin) {
      await User.create({
        name: 'System Admin',
        phone: '+919999999999',
        email: 'admin@railwayiot.local',
        role: 'ADMIN',
      });
      console.log('✅ Created Default Admin User (Phone: +919999999999)');
    } else {
      console.log('➡️ Default Admin User already exists');
    }

    // 2. Seed Railway Gates
    const gatesData = [
      { gateCode: 'GATE001', gateName: 'Tambaram Railway Gate', city: 'Chennai', lat: 12.9249, lng: 80.1100 },
      { gateCode: 'GATE002', gateName: 'Chromepet Railway Gate', city: 'Chennai', lat: 12.9516, lng: 80.1404 },
      { gateCode: 'GATE003', gateName: 'Pallavaram Railway Gate', city: 'Chennai', lat: 12.9675, lng: 80.1491 },
    ];

    const devicesData = [
      { deviceCode: 'ESP001', deviceName: 'Tambaram ESP32', mac: '00:1B:44:11:3A:B1' },
      { deviceCode: 'ESP002', deviceName: 'Chromepet ESP32', mac: '00:1B:44:11:3A:B2' },
      { deviceCode: 'ESP003', deviceName: 'Pallavaram ESP32', mac: '00:1B:44:11:3A:B3' },
    ];

    for (let i = 0; i < gatesData.length; i++) {
      const gData = gatesData[i];
      const dData = devicesData[i];

      // Check Gate
      let gate = await RailwayGate.findOne({ gateCode: gData.gateCode });
      if (!gate) {
        gate = await RailwayGate.create({
          gateCode: gData.gateCode,
          gateName: gData.gateName,
          latitude: gData.lat,
          longitude: gData.lng,
          address: `${gData.gateName} Road`,
          city: gData.city,
          state: 'Tamil Nadu',
          isActive: true,
          currentStatus: 'UNKNOWN',
          lastOpenedAt: null,
          lastClosedAt: null,
        });
        console.log(`✅ Created Gate: ${gate.gateName}`);
      } else {
        console.log(`➡️ Gate ${gate.gateCode} already exists`);
      }

      // Check Device
      let device = await ESP32Device.findOne({ deviceCode: dData.deviceCode });
      if (!device) {
        device = await ESP32Device.create({
          deviceCode: dData.deviceCode,
          deviceName: dData.deviceName,
          serialNumber: `SN-00${i+1}`,
          macAddress: dData.mac,
          firmwareVersion: 'v1.0.0',
          hardwareVersion: 'v2.0',
          onlineStatus: false,
        });
        console.log(`✅ Created Device: ${device.deviceName}`);
      } else {
        console.log(`➡️ Device ${device.deviceCode} already exists`);
      }

      // Assignment
      if (device.railwayGate?.toString() !== gate._id.toString() || gate.currentDevice?.toString() !== device._id.toString()) {
        device.railwayGate = gate._id;
        await device.save();

        gate.currentDevice = device._id;
        await gate.save();
        console.log(`🔗 Assigned ${device.deviceCode} <-> ${gate.gateCode}`);
      }
    }

    console.log('Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
