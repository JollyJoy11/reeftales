# ReefTales

ReefTales is a full-stack travel journal app for exploring islands, planning trips, and sharing marine travel experiences.

## Live Demo

Hosted application:

```text
https://reeftales.vercel.app/
```

The hosted backend is deployed separately on Render and connected to the frontend through `VITE_API_BASE_URL`. If the hosted app is slow to load, the Render free service may be waking up after inactivity.

## Tech Stack

- Frontend: Vue 3, Vite, Pinia, Vue Router, Bootstrap
- Backend: Node.js, Express
- Database: MySQL
- Hosting: Vercel frontend, Render backend, Aiven MySQL, Cloudinary uploads

## Project Structure

```text
ReefTales/
  backend/    Express API and MySQL setup
  frontend/   Vue/Vite client app
```

## Local Setup

Use this if the hosted link is unavailable or if the app needs to be run locally for assessment.

### Prerequisites

- Node.js 20.19+ or 22.12+
- MySQL running locally
- npm

### 1. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Backend Environment

Create `backend/.env` from `backend/.env.example`.

Example local MySQL configuration:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_mysql_password
DB_NAME=reeftales_db

JWT_SECRET=change_me_to_a_long_random_secret
GEMINI_API_KEY=your_gemini_api_key

USE_CLOUDINARY=false
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The backend creates the database and tables automatically when it starts.
With `USE_CLOUDINARY=false`, uploaded files are saved locally in `backend/src/uploads/`.

### 3. Run Backend

```bash
cd backend
npm run dev
```

The API should run at:

```text
http://localhost:5000
```

### 4. Run Frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

The frontend should run at:

```text
http://localhost:5173
```

By default, the local frontend calls:

```text
http://localhost:5000/api
```

## Environment Variables

Do not commit real `.env` files. Use the example files as templates:

- `backend/.env.example`
- `frontend/.env.example`

For deployment, environment variables should be set in Vercel and Render dashboards instead of stored in GitHub.

## Notes For Assessment

- If the live link is unavailable, run the app locally using the steps above.
- Render free services may sleep after inactivity, so the first backend request can take longer.
- Uploaded files are ignored locally through `backend/src/uploads/`.
- Local uploads are not reliable on free backend hosting, so the hosted backend should use Cloudinary.
