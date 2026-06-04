# ReefTales

ReefTales is a full-stack island discovery and travel journal app focused on marine experiences, trip planning, community journals, and reef species exploration.

## Live Demo

Hosted application:

```text
https://reeftales.vercel.app/
```

The frontend is hosted on Vercel. The backend is hosted on Render and may take a short time to wake up on the first request if it has been inactive.

## Tech Stack

- Frontend: Vue 3, Vite, Pinia, Vue Router, Bootstrap
- Backend: Node.js, Express
- Database: MySQL
- Media storage: Cloudinary for hosted uploads
- Hosting: Vercel frontend, Render backend, Aiven MySQL

## Project Structure

```text
ReefTales/
  backend/    Express API, MySQL schema, seed data, upload routes
  frontend/   Vue/Vite client app
```

## Local Setup

Use these steps if the hosted link is unavailable or if the app needs to be run locally for assessment.

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

Example local configuration:

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

The backend creates the database, tables, and seed data automatically when it starts. With `USE_CLOUDINARY=false`, uploads are saved locally in `backend/src/uploads/`.

### 3. Run Backend

```bash
cd backend
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

### 4. Run Frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

By default, the local frontend calls:

```text
http://localhost:5000/api
```

## Deployment Environment Variables

Do not commit real `.env` files. Set deployment variables in the hosting dashboards.

Render backend:

```env
DB_HOST=your_aiven_host
DB_PORT=your_aiven_port
DB_USER=avnadmin
DB_PASSWORD=your_aiven_password
DB_NAME=defaultdb
JWT_SECRET=change_me_to_a_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Vercel frontend:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com/api
```

## Seed Images

Seed image metadata is committed in:

```text
backend/src/database/seedIslandImages.generated.json
backend/src/database/seedSpeciesImages.generated.json
```

The seeded islands, species, demo journal covers, and demo journal media use those Cloudinary URLs, so the ignored `backend/seed-images/` folder is not required to run or assess the project. Image source and license notes are listed in [IMAGE_CREDITS.md](IMAGE_CREDITS.md).

To regenerate species seed images from Wikimedia Commons and upload them to Cloudinary:

```bash
cd backend
npm run upload:species-images
```

This command requires Cloudinary credentials in local `backend/.env`.

To regenerate island seed images from local downloaded files, place images in `backend/seed-images/islands/` using filenames such as `maldives.jpg`, `bora-bora.jpg`, and `fiji.jpg`, then run:

```bash
cd backend
npm run upload:island-images
```

The `backend/seed-images/` folder is ignored by Git because it is only temporary local input for uploading/regenerating Cloudinary seed image metadata.

## Notes For Assessment

- If the live link is unavailable, run the app locally using the steps above.
- Render free services may sleep after inactivity, so the first hosted request can take longer.
- Uploaded files are ignored locally through `backend/src/uploads/`.
- Hosted uploads should use Cloudinary because free backend filesystems are not persistent.
