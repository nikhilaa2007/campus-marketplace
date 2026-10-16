# Campus Marketplace (MERN)

Buy, sell and give away used items inside your campus.

## Run it

Prerequisites: Node 18+ and MongoDB running locally (or a MongoDB Atlas URI).

```bash
# Terminal 1: backend
cd server
cp .env.example .env     # then edit JWT_SECRET (and MONGO_URI if needed)
npm install
npm run dev

# Terminal 2: frontend
cd client
npm install
npm run dev
```

Open http://localhost:5173

While SMTP is not set up, the verification code is printed in the **server terminal**.

## Photos (Cloudinary)
Add these to `server/.env` (Cloudinary Dashboard -> Settings -> API Keys):
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
Photos upload straight from the browser to Cloudinary using a signature from `/api/uploads/signature`.
MongoDB stores only each photo's `url` and `publicId`.

## Auth flow
Register -> 6-digit code to college email -> verify -> logged in (JWT, 7 days).

## Folder structure
```
server/  config, models, controllers, routes, middleware, utils
client/  src/pages, src/components, src/context, src/api.js
```

## Next steps
1. Listings (sell / giveaway) with image upload
2. Requests and the transaction status flow (both sides confirm)
3. Dashboard (My Listings, My Requests, Transactions)
