# Quick API Reference - AstroWeb

## Total APIs: 34 REST Endpoints + 17 Socket Events

## Authentication APIs (4)
- POST   `/api/auth/register` - Register new user
- POST   `/api/auth/login` - User login
- GET    `/api/auth/me` - Get current user (Auth)
- POST   `/api/auth/logout` - User logout

## OTP APIs (2)
- POST   `/api/otp/send` - Send OTP
- POST   `/api/otp/verify` - Verify OTP

## Admin APIs (16)
- POST   `/api/admin/astrologer` - Add astrologer (Admin)
- DELETE `/api/admin/astrologer/:id` - Remove astrologer (Admin)
- GET    `/api/admin/astrologers` - Get all astrologers
- POST   `/api/admin/horoscope` - Add horoscope (Admin)
- GET    `/api/admin/horoscopes` - Get horoscopes
- DELETE `/api/admin/horoscope/:id` - Delete horoscope (Admin)
- GET    `/api/admin/stats` - Dashboard stats (Admin)
- GET    `/api/admin/settings` - Get settings (Admin)
- POST   `/api/admin/settings` - Update settings (Admin)
- GET    `/api/admin/offers` - Get offers (Admin)
- POST   `/api/admin/offers` - Add offer (Admin)
- DELETE `/api/admin/offers/:id` - Delete offer (Admin)
- GET    `/api/admin/banners` - Get banners (Admin)
- POST   `/api/admin/banners` - Add banner (Admin)
- DELETE `/api/admin/banners/:id` - Delete banner (Admin)
- GET    `/api/admin/recent-logins` - Recent logins (Admin)

## Astrologer APIs (3)
- PUT    `/api/astrologer/status` - Toggle status (Astrologer)
- PUT    `/api/astrologer/profile` - Update profile (Astrologer)
- GET    `/api/astrologer/profile` - Get profile (Astrologer)

## Call APIs (2)
- POST   `/api/call/initiate` - Start call (Auth)
- POST   `/api/call/end` - End call (Auth)

## Public APIs (1)
- GET    `/api/public/astrologers` - Public astrologer list

## Wallet APIs (2)
- POST   `/api/wallet/add` - Add money (Auth)
- GET    `/api/wallet/balance` - Get balance (Auth)

## Summary by Method
- GET: 11 (32.4%)
- POST: 18 (52.9%)
- PUT: 2 (5.9%)
- DELETE: 6 (17.6%)
- PATCH: 0 (0%)
