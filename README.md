 
 
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
` 
```

## Usage Guide

1. **Admin**: Register a user, then manually change role to `admin` in MongoDB (or use the seed script if provided). Login to add Astrologers.
 
## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Agora RTC React, Socket.io Client, i18next
- **Backend**: Node.js, Express, MongoDB, Socket.io

## Deployment

### Backend (Render)
1. Push code to GitHub.
2. Create a new Web Service on Render.
 
