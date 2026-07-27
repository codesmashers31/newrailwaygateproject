# Authentication & Security Flow

We use a password-less OTP flow powered by JSON Web Tokens (JWT).

## The Flow
1. **Request OTP:** User inputs phone number `->` `POST /api/auth/login`
2. **OTP Generation:** Backend generates a 6-digit random number, saves it to the `OTP` collection (expires in 60 seconds), and sends an SMS (mocked in development).
3. **Verify OTP:** User inputs the code `->` `POST /api/auth/verify-otp`.
4. **Token Generation:** Backend verifies the code and generates TWO tokens:
   - `accessToken`: An encoded JWT string containing `{ id, role }`. Expires in 24 hours. Used for all API requests.
   - `refreshToken`: A secure hex string saved to the `RefreshToken` collection. Expires in 30 days.

## Token Expiration (The Refresh Flow)
When the `accessToken` expires, the React Native app will receive a `401 Unauthorized` error.
The app should **silently** catch this error, and send the `refreshToken` to `POST /api/auth/refresh`.
If valid, the backend issues a brand new `accessToken`, and the app retries the original request. The user never notices!
