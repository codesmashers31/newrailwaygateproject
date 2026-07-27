import axios from 'axios';
import { Platform } from 'react-native';
import { cookieManager } from '../utils/cookieManager';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

// Create base Axios client.
const apiClient = axios.create({
  baseURL: getBaseUrl(), 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor to automatically inject JWT access token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await cookieManager.getCookie('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to toggle mock API behavior for local testing
const USE_MOCKS = false;

// Keep track of the active OTP session code in memory for verification
let sessionOtp = '123456';

if (USE_MOCKS) {
  apiClient.interceptors.request.use(async (config) => {
    // Simulate network delay (800ms) to show spinner/loading states
    await new Promise((resolve) => setTimeout(resolve, 800));

    const url = config.url || '';
    
    // 1. Send OTP Endpoint
    if (url.includes('/api/auth/send-otp')) {
      const { input, type } = config.data;
      
      // Perform validation check simulator
      if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
        throw {
          response: {
            status: 400,
            data: { message: 'Invalid email address format.' },
          },
        };
      }
      
      if (type === 'mobile' && input.replace(/\D/g, '').length < 10) {
        throw {
          response: {
            status: 400,
            data: { message: 'Mobile number must be at least 10 digits.' },
          },
        };
      }

      // Generate dynamic OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionOtp = generatedOtp;

      console.log(`[MOCK GATEWAY] OTP sent to ${input}: ${generatedOtp}`);

      // Hijack HTTP request with Axios adapter
      config.adapter = async () => {
        return {
          data: {
            success: true,
            message: `OTP sent successfully to ${type === 'email' ? 'email' : 'phone'}.`,
            testOtp: generatedOtp, // Included in response payload for easy client testing
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      };
    }

    // 2. Verify OTP Endpoint
    if (url.includes('/api/auth/verify-otp')) {
      const { input, otp } = config.data;

      config.adapter = async () => {
        // Accept generated OTP or master fallback '123456' for easy developer testing
        if (otp === sessionOtp || otp === '123456') {
          const mockToken = `jwt-gateview-token-${Math.random().toString(36).substr(2)}`;
          
          return {
            data: {
              success: true,
              token: mockToken,
              user: {
                name: 'Rahul Sharma',
                email: input.includes('@') ? input : 'rahul.sharma@example.com',
                phone: !input.includes('@') ? input : '+91 98765 43210',
              },
            },
            status: 200,
            statusText: 'OK',
            headers: {
              'Set-Cookie': `token=${mockToken}; Max-Age=604800; HttpOnly; Secure; SameSite=Strict`,
            },
            config,
          };
        } else {
          throw {
            response: {
              status: 400,
              data: { message: 'Invalid 6-digit verification code. Please try again.' },
            },
          };
        }
      };
    }

    // 3. Validate Token Endpoint
    if (url.includes('/api/auth/validate-token')) {
      const authHeader = config.headers['Authorization'];
      config.adapter = async () => {
        if (authHeader && authHeader.includes('jwt-gateview-token')) {
          return {
            data: {
              valid: true,
              user: {
                name: 'Rahul Sharma',
                email: 'rahul.sharma@example.com',
                phone: '+91 98765 43210',
              },
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          };
        } else {
          throw {
            response: {
              status: 401,
              data: { message: 'Session token has expired or is invalid.' },
            },
          };
        }
      };
    }

    return config;
  }, (error) => {
    return Promise.reject(error);
  });
}

export default apiClient;
