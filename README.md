# TravelMate

A full-stack MERN travel and tourism application.

## Features
- JWT authentication with bcrypt
- User and admin roles
- Destinations
- Travel packages
- Package search
- Booking creation/cancellation
- Admin booking status management
- Reviews API
- React Context API
- Protected routes
- Responsive UI

## 1. MongoDB
Install MongoDB locally or create a MongoDB Atlas database.

## 2. Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```
Linux/macOS:
```bash
cp .env.example .env
```
Edit `.env` and set `MONGO_URI` and `JWT_SECRET`.

## 3. Frontend
Open another terminal:
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## 4. Create an admin
Register a normal account first. In MongoDB, change that user's `role` from `user` to `admin`. Then log in again.

## 5. Add initial data
Use the admin API with Postman:
POST `/api/destinations`
```json
{
  "name":"Munnar",
  "country":"India",
  "description":"Green hills, tea plantations and cool mountain weather.",
  "image":"https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80",
  "bestTime":"September to May",
  "featured":true
}
```

Then create a package using the destination `_id`:
POST `/api/packages`
```json
{
  "title":"Munnar Escape",
  "destination":"DESTINATION_ID",
  "description":"A relaxing hill-station trip with sightseeing and nature experiences.",
  "duration":3,
  "price":7999,
  "image":"https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80",
  "inclusions":["Hotel","Breakfast","Sightseeing"]
}
```

## API base
`http://localhost:5000/api`

Frontend:
`http://localhost:5173`

## Production
Build the frontend with `npm run build` and deploy the `frontend/dist` folder to a static host. Deploy the backend separately and set `VITE_API_URL` to your production API URL.
