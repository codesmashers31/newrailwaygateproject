# Deployment Guide

How to move this backend from `localhost` to the internet.

## 1. Database (MongoDB Atlas)
1. Go to mongodb.com and create a free cluster.
2. Under "Network Access", add `0.0.0.0/0` to allow connections from anywhere.
3. Under "Database Access", create a new database user and password.
4. Click "Connect" and get your Connection String.

## 2. Hosting (Render / Heroku / DigitalOcean)
We recommend **Render.com** for free/cheap Node.js hosting.
1. Connect your GitHub repository to Render.
2. Select "Web Service" -> Node.js.
3. Set the Root Directory to `railway-iot-main/server` when deploying this repository root (or `server` when deploying `railway-iot-main`).
4. Build Command: `npm ci`
5. Start Command: `npm start` (runs `node server.js`)

## 3. Environment Variables (Critical)
In your hosting provider's dashboard, you MUST add these variables:
- `NODE_ENV=production`
- `MONGO_URI=<Your Atlas Connection String>`
- `JWT_SECRET=<Generate a random secure 64 char string>`
- `ACCESS_TOKEN_EXPIRE=1d`
- `MAIL_SERVICE`, `MAIL_USER`, and `MAIL_PASS` when OTP email delivery is enabled
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` when Google sign-in is enabled

## 4. Service Checks
After deployment, replace `<service>` with your Render service subdomain and verify:
```text
GET https://<service>.onrender.com/
GET https://<service>.onrender.com/api/health
```

## 5. First Time Production Seeding
Before using the API in production, you need the Admin account. 
You can trigger this by running the seed script against your production database locally ONE time:
```bash
# In your local terminal
set MONGO_URI=<Production Atlas String>
npm run seed
```
This will inject the Admin account into the live cloud database.
