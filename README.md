# AstroWeb - MERN Stack Astrology Platform

## Features
- **Roles**: Admin, Astrologer, Client
- **Authentication**: JWT-based auth
- **Multi-language**: English and Tamil support
- **Real-time Video Calls**: Integrated with Agora and Socket.io
- **Wallet System**: Add money, deduct balance per minute during calls
- **Dashboards**: Dedicated dashboards for each role

## Setup Instructions

### Prerequisites
- Node.js
- MongoDB (running locally or cloud URI)

### Installation

1. **Clone the repository** (if applicable) or navigate to the project folder.

2. **Server Setup**
   ```bash
   cd server
   npm install
   # Create .env file if missing (see below)
   npm run dev
   ```

3. **Client Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Environment Variables (`server/.env`)
```env
PORT=9001
MONGO_URI=mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/astroweb
JWT_SECRET=your_jwt_secret_key_here
AGORA_APP_ID=196be66ba9ab4172921c1e7f7e948879
```

## Usage Guide

1. **Admin**: Register a user, then manually change role to `admin` in MongoDB (or use the seed script if provided). Login to add Astrologers.
2. **Astrologer**: Login with credentials provided by Admin. Go online/offline, update profile.
3. **Client**: Register/Login. Add money to wallet. Select an online Astrologer and start a video call.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Agora RTC React, Socket.io Client, i18next
- **Backend**: Node.js, Express, MongoDB, Socket.io

## Deployment

### Backend (Render)
1. Push code to GitHub.
2. Create a new Web Service on Render.
3. Connect your repository.
4. Set `Root Directory` to `server`.
5. Set `Build Command` to `npm install`.
6. Set `Start Command` to `npm start`.
7. Add Environment Variables from `.env` (MONGO_URI, JWT_SECRET, etc.).

### Frontend (Vercel)
1. Push code to GitHub.
2. Create a new Project on Vercel.
3. Connect your repository.
4. Set `Root Directory` to `client`.
5. Vercel should auto-detect Vite.
6. Deploy.

