# StreamTube (MERN YouTube Clone)

StreamTube ek YouTube-like web app hai jisme **React (frontend)** + **Express (backend)** + **MongoDB** use hota hai. UI “StreamTube” dark theme me designed hai.

---

## Features

- **Authentication**
  - Register, Login, Logout
  - JWT + protected routes
  - Profile update (name, bio) + avatar upload
- **Videos**
  - Video + thumbnail upload (multer local storage)
  - Edit + delete (owner only)
  - Video streaming + view count increment
  - Like/Dislike toggling
- **Comments**
  - Add / fetch comments per video
  - Update / delete comments (comment owner only)
- **Subscriptions**
  - Subscribe / Unsubscribe to channels
  - Subscribed channels list (Subscriptions page)
  - Subscribe button state based on current user
- **Channel pages**
  - Channel profile + channel videos
  - Channel page me “Commented videos” section (videos where that channel owner ne comments kiye)

---

## Tech Stack

- Frontend: `React`, `React Router`, `Axios`, `Vite`
- Backend: `Node.js`, `Express`, `Mongoose`, `JWT`, `bcryptjs` (`User` model)
- File Upload: `multer` (local `backend/src/uploads`)
- Styling: `frontend/src/styles.css` (StreamTube theme)

---

## Ports / Base URLs

- Backend API: `http://localhost:5000/api`
- Backend static uploads: `http://localhost:5000/uploads/...`
- Frontend dev server:
  - Usually `http://localhost:5173`
  - Agar `5173` busy ho to Vite `5174` (ya next available) use karega

---

## Project Structure (High Level)

Repository me 2 main folders hain:

- `backend/`
  - `src/models/` (User, Video, Comment, Subscription)
  - `src/controllers/` (auth, videos, comments, subscriptions, user)
  - `src/routes/` (REST endpoints)
  - `src/middleware/` (auth protect, validation handler, upload)
  - `src/seeds/seed.js` (demo data)
- `frontend/`
  - `src/pages/` (Home, Video Player, Auth, Upload, Channel, You, Subscriptions, Liked)
  - `src/components/` (Navbar, Sidebar, VideoCard, CommentSection, modals, skeletons)
  - `src/api/` (Axios API wrappers)
  - `src/context/` (AuthContext, ThemeContext)
  - `src/utils/` (media url resolver)

---

## Setup & Run (Local Development)

### 1) MongoDB

MongoDB ko **127.0.0.1:27017** par chalna chahiye.

`backend/.env` me recommended local URI:

```env
MONGO_URI=mongodb://127.0.0.1:27017/youtube_clone
```

> Important: demo seed/testing ke waqt data wipe hota hai. Data wipe avoid karne ke liye `npm run seed:clear` mat run karein.

### 2) Backend

PowerShell (backend folder):

```powershell
cd "c:\Users\msn\OneDrive\Desktop\New folder\backend"
npm install
npm run dev
```

Backend server: `http://localhost:5000`

### 3) Frontend

PowerShell (frontend folder):

```powershell
cd "c:\Users\msn\OneDrive\Desktop\New folder\frontend"
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173` (agar available)
- warna `http://localhost:5174`

---

## Environment Variables

Backend: `backend/.env`

Example: `backend/.env.example`

Common local setup:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/youtube_clone
JWT_SECRET=streamtube_super_secret_key_change_me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ENABLE_CLOUDINARY=false
```

---

## Seed Data (Optional)

- Demo users/videos/comments/subscriptions add karne ke liye:

```powershell
cd backend
npm run seed
```

- **Caution:** demo clean karne ke liye:

```powershell
npm run seed:clear
```

`seed` / `seed:clear` database ko modify/delete karta hai. Isliye apna personal data safe rakhne ke liye only use karein jab zarurat ho.

---

## API Endpoints (Backend)

### Auth (`/api/auth`)

- `POST /register` (register)
- `POST /login` (login)
- `POST /logout` (protected)
- `GET /me` (protected, current user)

### Videos (`/api/videos`)

- `GET /` (optional `?q=keyword` search)
- `GET /liked` (protected)
- `GET /my` (protected)
- `GET /subscriptions/feed` (protected)
- `GET /channel/:channelId`
- `GET /:id` (video detail)
- `POST /` (protected, upload video + thumbnail)
- `PATCH /:id` (protected, edit owner)
- `DELETE /:id` (protected, delete owner)
- `PATCH /:id/views` (increment views)
- `PATCH /:id/like` (protected)
- `PATCH /:id/dislike` (protected)

Search behavior:
- keyword search **whole word/exact-style** match ke jaisa hai (arbitrary substring match avoid).

### Users (`/api/users`)

- `GET /:id` (channel profile)
- `PATCH /profile` (protected, name/bio)
- `PATCH /profile/avatar` (protected, avatar upload)

### Comments (`/api/comments`)

- `GET /video/:videoId` (comments list)
- `POST /` (protected, add comment)
- `PATCH /:id` (protected, update)
- `DELETE /:id` (protected, delete)
- `GET /user/:userId/videos` (commented videos list for a user/channel owner)

### Subscriptions (`/api/subscriptions`)

- `POST /:channelId/toggle` (protected)
- `GET /:channelId/status` (protected, subscribed or not)
- `GET /` (protected, my subscribed channels)

---

## Media Handling

- Video/thumbnail/user avatars local ho rahe hain:
  - backend upload dir: `backend/src/uploads`
  - frontend `resolveMediaUrl()` local URLs ko `http://localhost:5000` ke saath resolve karta hai.

---

## Troubleshooting

### 1) `ECONNREFUSED 127.0.0.1:27017`

- MongoDB running nahi hai ya port mismatch hai.
- Check: `localhost:27017`

### 2) Login kaam nahi karta

- Account database me exist karta hai ya nahi check karein.
- Seed ke demo credentials use kar rahe hain to remember karein `seed/seed:clear` data wipe kar deta hai.

### 3) “Reload/restart pe data ud jata”

- Data wipe usually tab hota hai jab:
  - `seed:clear` chal jaye
  - MongoDB different `dbPath` se restart ho
- Best practice:
  - MongoDB ko consistent data directory (same `dbPath`) se run karein
  - Seed ko accidental run na karein

MongoDB stable local setup (recommended):
- Aap ne local persistent folder use kiya hua hai: `C:\MongoData\db`
- Custom config file: `C:\MongoData\mongod-custom.cfg`
- MongoDB run command:
  ```powershell
  & "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --config "C:\MongoData\mongod-custom.cfg" --bind_ip 127.0.0.1
  ```

---

## Next Improvements (Optional)

- Video recommendations (similarity based on likes/comments)
- Better pagination for feeds/comments
- Rate limiting + stricter validation

