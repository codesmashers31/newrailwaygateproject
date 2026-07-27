# Frontend Integration Guide for React Native

This document explains exactly how to connect the React Native app to the Node.js backend.

## 1. The React Native App Flow
```text
Splash Screen
      ↓
Check AsyncStorage for Access Token
   ↙     ↘
(No)     (Yes)
  ↓        ↓
Login    Dashboard (Home)
  ↓        ↓
 OTP     Gate List
  ↓        ↓
Save     Click Gate -> View History
Tokens
```

## 2. Storing Tokens
When the user successfully hits `/api/auth/verify-otp`, the API responds with two tokens:
- `accessToken`: Used for every API call. Expires in 1 day.
- `refreshToken`: Used to get a new access token. Expires in 30 days.

**Action:** Use `AsyncStorage` or `SecureStore` to save these immediately.

## 3. Axios Interceptor Setup
You **MUST** attach the `accessToken` to the `Authorization` header of every protected request. Do not do this manually on every screen. Use an Axios Interceptor:

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({ baseURL: 'http://<YOUR_IP>:3000/api' });

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
```

## 4. Role-Based Access Control (RBAC)
The backend uses JWT payload extraction. 
- A normal passenger will have `{ role: "USER" }` encoded in their JWT.
- If you accidentally try to hit an Admin endpoint (like `POST /api/gates`) with a USER token, the API will return a `403 Forbidden` error.

## 5. Logout
Do not just clear `AsyncStorage`! You must tell the backend to invalidate the refresh token.
1. `api.post('/auth/logout', { token: refreshToken })`
2. `AsyncStorage.clear()`
3. `navigation.replace('Login')`
