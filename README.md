# SplitShare

A full-stack web application for splitting subscription costs among groups. Users can create groups, invite members, track payments, and manage shared subscriptions with integrated payment processing.

## Tech Stack

**Frontend**

- React 18 with Vite
- React Router v6
- Tailwind CSS
- Axios
- Firebase (Cloud Messaging for push notifications)

**Backend**

- Node.js with Express
- MongoDB with Mongoose
- JWT authentication with bcryptjs
- Razorpay SDK (payments and payouts)
- Firebase Admin SDK (push notifications)
- Multer (file uploads)

**Deployment**

- Netlify (static frontend + serverless functions)
- Serverless HTTP adapter for Express

## Features

- User registration and login with JWT-based authentication
- Create and manage subscription-sharing groups (Netflix, Spotify, YouTube, JioHotstar, HBO, Amazon, Apple, etc.)
- Invite members via unique invite codes
- Automatic monthly contribution calculation based on group cost and member count
- Payment tracking with status workflow: Pending, Submitted, Verified, Missed
- Integrated Razorpay payment gateway with UPI support
- Owner payout processing
- Push notifications via Firebase Cloud Messaging
- Activity feed for group events
- User profile and settings management
- Responsive UI

## Project Structure

```
SplitShare/
  client/                # React frontend
    src/
      api/               # API client and helpers
      components/        # Reusable UI components
      contexts/          # React context (auth)
      hooks/             # Custom hooks
      pages/             # Route-level page components
      firebase.js        # Firebase client initialization
  server/                # Express backend
    config/              # DB, Razorpay, Firebase config
    controllers/         # Route handlers
    middleware/          # Auth, error handling
    models/              # Mongoose schemas
    routes/              # Express route definitions
    services/            # Business logic
    utils/               # Helper utilities
    seed.js              # Database seed script
  netlify/
    functions/           # Netlify serverless function entry
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Razorpay account (for payment integration)
- Firebase project (for push notifications)

### Installation

```bash
git clone https://github.com/<your-username>/SplitShare.git
cd SplitShare
npm run install:all
```

### Environment Variables

Create `.env` files in both `server/` and `client/` directories.

**server/.env**

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/splitsync
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

**client/.env**

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development

Run the frontend and backend concurrently:

```bash
npm run dev
```

Or run them individually:

```bash
npm run dev:server   # Express on port 5000
npm run dev:client   # Vite dev server
```

### Seed Database

```bash
cd server
npm run seed
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| POST   | /api/auth/register     | Register a new user      |
| POST   | /api/auth/login        | Login                    |
| GET    | /api/groups            | List groups              |
| POST   | /api/groups            | Create a group           |
| GET    | /api/groups/:id        | Get group details        |
| POST   | /api/groups/:id/join   | Join group via invite    |
| GET    | /api/groups/:id/payments | View group payments    |
| POST   | /api/payments          | Submit payment           |
| POST   | /api/webhooks          | Razorpay webhook handler |
| GET    | /api/user/profile      | Get current user profile |
| GET    | /api/notifications     | Get notifications        |
| GET    | /api/health            | Health check             |

## License

This project is private and not publicly licensed.
