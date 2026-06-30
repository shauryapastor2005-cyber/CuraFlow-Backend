# CuraFlow Backend

CuraFlow Backend is an Express and MongoDB API for a caregiver-oriented healthcare management platform. It manages caregiver accounts, patient records, prescriptions, daily care logs, vitals, physiotherapy sessions, uploaded reports, dashboards, and AI-generated patient summaries.

The backend is organized around an MVC-style structure with route modules, controllers, Mongoose models, middleware, service modules, utilities, cron jobs, and seed scripts. It is intended for caregiver workflows where patient recovery data needs to be recorded, queried, summarized, and monitored over time.

**Backend API:** [https://url-shortener-backend-fhbx.onrender.com](https://curaflow-backend-pfrn.onrender.com](https://curaflow-backend-pfrn.onrender.com/)

> **Note:** The backend is hosted on Render's free tier. If the service has been idle, the first request may take 30–60 seconds while Render wakes up the server.

## Key Features

- JWT authentication with access and refresh tokens.
- Cookie and bearer-token based protected routes.
- Role-based authorization for admin-only caregiver management.
- Caregiver account creation, suspension, soft deletion, login, logout, token refresh, profile updates, and avatar or cover image uploads.
- Patient CRUD with caregiver ownership checks and admin access support.
- Prescription CRUD with current medicine, medicine search, timeline, and expiring medicine queries.
- Daily log CRUD with today, weekly, and missed medicine views.
- Vital CRUD with today, weekly, and analytics endpoints.
- Physiotherapy CRUD with today and weekly session views.
- Report upload, update, soft deletion, category filtering, and date-range querying.
- Dashboard endpoints for platform-level and patient-specific summaries.
- AI patient summary generation using Google Gemini.
- SMTP email support for welcome emails, AI summaries, daily reminders, and monthly summaries.
- Multer and Cloudinary file upload pipeline.
- Cron jobs for daily care reminders and monthly AI progress summaries.
- Development seed utilities for realistic patient, prescription, daily log, vital, physiotherapy, and report data.
- Postman collection and environment files for API testing.
- Dockerfile for containerized deployment.

## Technology Stack

### Backend

- Node.js
- Express 5
- ES Modules

### Database

- MongoDB
- Mongoose

### Authentication

- JSON Web Tokens
- bcrypt
- cookie-parser

### Storage

- Multer local temporary uploads
- Cloudinary

### AI

- Google Gemini via `@google/genai`

### Email

- Nodemailer
- SMTP configuration
- HTML email templates

### Scheduling

- node-cron

### Development Utilities

- dotenv
- nodemon
- Prettier
- Faker
- Newman dependency for Postman workflows

### Deployment

- Docker
- Node 24 Alpine base image

## Architecture

The application follows a modular Express architecture:

```text
Client
  |
  v
Express app
  |
  v
Route modules under /api/v1
  |
  v
Middleware
  - JWT verification
  - Role checks
  - Multer uploads
  |
  v
Controllers
  |
  v
Services and utilities
  - Gemini summary generation
  - SMTP email delivery
  - Cloudinary upload helper
  - Patient ownership verification
  - Date normalization and validation
  |
  v
Mongoose models
  |
  v
MongoDB
```

`src/app.js` configures CORS, JSON parsing, URL encoding, cookies, static files, a root health response, and all API route mounts. `src/index.js` connects to MongoDB, starts cron jobs, and starts the HTTP server.

Controllers contain request-level logic. Services handle AI summary generation and email delivery. Utilities provide reusable response, error, upload, validation, ownership, and prompt-building behavior.

## Folder Structure

```text
.
├── Dockerfile
├── README.md
├── package.json
├── package-lock.json
├── postman_collection
│   ├── CuraFlow API.postman_collection.json
│   └── Local Developement.postman_environment.json
├── public
│   └── temp
├── src
│   ├── app.js
│   ├── config
│   │   ├── gemini.js
│   │   └── mailer.js
│   ├── constants
│   │   └── index.js
│   ├── controllers
│   │   ├── dailyLog.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── patients.controller.js
│   │   ├── physiotherapy.controller.js
│   │   ├── prescription.controller.js
│   │   ├── report.controller.js
│   │   ├── summary.controller.js
│   │   ├── user.controller.js
│   │   └── vital.controller.js
│   ├── cron
│   │   ├── dailyReminer.cron.js
│   │   └── monthlySummary.cron.js
│   ├── db
│   │   └── index.js
│   ├── index.js
│   ├── middlewares
│   │   ├── auth.middleware.js
│   │   ├── multer.middleware.js
│   │   └── role.middleware.js
│   ├── models
│   │   ├── dailyLog.model.js
│   │   ├── patients.model.js
│   │   ├── physiotherapy.model.js
│   │   ├── prescription.model.js
│   │   ├── report.model.js
│   │   ├── users.model.js
│   │   └── vital.model.js
│   ├── routes
│   │   ├── dailyLog.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── patients.routes.js
│   │   ├── physiotherapy.routes.js
│   │   ├── prescription.routes.js
│   │   ├── report.routes.js
│   │   ├── summary.routes.js
│   │   ├── user.routes.js
│   │   └── vital.routes.js
│   ├── scripts
│   │   ├── profiles
│   │   │   ├── medicationBundles.js
│   │   │   ├── recoveryCurves.js
│   │   │   └── strokeProfiles.js
│   │   └── seed
│   │       ├── clearDatabase.js
│   │       ├── generatePatientProfiles.js
│   │       ├── seedAdmin.js
│   │       ├── seedCaregivers.js
│   │       ├── seedDailyLogs.js
│   │       ├── seedDatabase.js
│   │       ├── seedPatients.js
│   │       ├── seedPhysiotherapySessions.js
│   │       ├── seedPrescriptions.js
│   │       ├── seedReports.js
│   │       └── seedVitals.js
│   ├── services
│   │   ├── email.service.js
│   │   ├── gemini.service.js
│   │   └── summary.service.js
│   ├── templates
│   │   ├── dailyReminderEmail.template.js
│   │   ├── summaryEmail.template.js
│   │   └── welcomeEmail.template.js
│   └── utils
│       ├── ApiError.js
│       ├── ApiResponse.js
│       ├── asyncHandler.js
│       ├── cloudinary.js
│       ├── escapeHtml.js
│       ├── normalizeToMidnightUTC.js
│       ├── promptBuilder.js
│       ├── validateDateNotInFuture.js
│       └── verifyPatientOwnership.js
```

## Database Design

The application uses MongoDB through Mongoose. The database name is configured as `curaflow` in `src/constants/index.js`.

### Collections

- `User`
  - Stores admins and caregivers.
  - Passwords are hashed with bcrypt before save.
  - Stores the latest refresh token.
  - Supports `caregiver` and `admin` roles.
  - Indexed fields include `username`, `fullname`, and unique `username` and `email`.

- `Patient`
  - Belongs to a caregiver through `caregiver`.
  - Stores demographics, emergency contact, address, allergies, notes, profile photo, and active status.
  - Indexes `caregiver` and `isActive`.

- `Prescription`
  - Belongs to a patient.
  - Stores doctor name, medicine name, dosage, frequency, route, dates, instructions, and active status.
  - Indexed by patient.

- `DailyLog`
  - Belongs to a patient and is logged by a user.
  - Tracks medicines, physiotherapy, exercise, water intake, sleep, bowel movement, appetite, mood, and notes.
  - Normalizes dates to midnight UTC.
  - Prevents future dates.
  - Uses a unique compound index on `{ patient, date }`.

- `Vital`
  - Belongs to a patient and is recorded by a user.
  - Tracks blood pressure, heart rate, temperature, oxygen saturation, blood sugar, weight, and notes.
  - Normalizes dates to midnight UTC.
  - Prevents future dates.
  - Uses a unique compound index on `{ patient, date }`.

- `Physiotherapy`
  - Belongs to a patient and is recorded by a user.
  - Stores session date, exercises, exercise durations, completion status, pain level, difficulty, and notes.
  - Requires at least one exercise.
  - Normalizes dates to midnight UTC.
  - Prevents future dates.
  - Uses a unique compound index on `{ patient, date }`.

- `Report`
  - Belongs to a patient and is uploaded by a user.
  - Stores category, report name, Cloudinary file URL, Cloudinary public id, remarks, report date, and active status.
  - Normalizes dates to midnight UTC.
  - Prevents future dates.
  - Uses an index on `{ patient, reportDate: -1 }`.

### Query and Analytics Patterns

- Ownership is enforced with `verifyPatientOwnership`.
- Soft deletion is implemented through `isActive` on major domain models.
- Pagination is implemented on list endpoints.
- Date-range filters are implemented for logs, vitals, physiotherapy sessions, and reports.
- Vital analytics use MongoDB aggregation for averages, minimums, and maximums.
- Summary generation uses aggregation for daily logs, vitals, and physiotherapy before creating a Gemini prompt.
- Dashboard endpoints use grouped `Promise.all` queries and collection counts for dashboard metrics.

## API Overview

The API is mounted under `/api/v1`. The route files define 56 module endpoints under `/api/v1`, plus a root health response at `/`.

### Root

- `GET /` returns a basic backend-running response.

### Users

Mounted at `/api/v1/users`.

- Login, logout, refresh token, current user, password change, profile detail updates, avatar updates, and cover image updates.
- Admin-only caregiver registration, suspension, and deletion.
- Caregiver registration accepts avatar and optional cover image uploads.

### Patients

Mounted at `/api/v1/patients`.

- Patient creation, listing, search, pagination, detail fetch, update, and soft deletion.
- Patient access is scoped to the authenticated caregiver unless the requester is an admin.

### Prescriptions

Mounted at:

- `/api/v1/prescriptions`
- `/api/v1/patients/:patientId/prescriptions`

Supports prescription CRUD, paginated patient prescriptions, medicine search, current medicines, medicine timeline, and expiring medicine queries.

### Daily Logs

Mounted at:

- `/api/v1/logs`
- `/api/v1/patients/:patientId/logs`

Supports daily log CRUD, paginated logs, date ranges, today's log, weekly logs, and missed medicine history.

### Vitals

Mounted at:

- `/api/v1/vitals`
- `/api/v1/patients/:patientId/vitals`

Supports vital CRUD, paginated vitals, date ranges, today's vital, weekly vitals, and analytics over week, month, 6-month, or all-time ranges.

### Physiotherapy

Mounted at:

- `/api/v1/physiotherapy`
- `/api/v1/patients/:patientId/physiotherapy`

Supports physiotherapy CRUD, paginated patient sessions, date ranges, today's session, and weekly sessions.

### Reports

Mounted at:

- `/api/v1/reports`
- `/api/v1/patients/:patientId/reports`

Supports report upload, report replacement, soft deletion, patient report listing, category filters, and date-range filters.

### Dashboard

Mounted at:

- `/api/v1/dashboard`
- `/api/v1/patients/:patientId/dashboard`

Provides an authenticated dashboard with patient counts, today's activity counts, medicine completion state, recent patients, and recent reports. The patient dashboard returns weekly logs, current prescriptions, weekly vitals, weekly physiotherapy, and weekly reports.

### AI Summary

Mounted at `/api/v1/patients/:patientId/summary`.

Creates an AI-generated patient summary for ranges such as week, month, 6 months, and all records. The summary workflow builds analytics-backed context, generates a Gemini prompt, returns the summary, and attempts to email the caregiver.

## Authentication and Authorization

Authentication uses JWT access and refresh tokens.

- Passwords are hashed with bcrypt in the `User` model.
- Login accepts username or email plus password.
- Access tokens include user id, email, username, fullname, and role.
- Refresh tokens are stored on the user document.
- Login and refresh responses set `accessToken` and `refreshToken` cookies with `httpOnly` and `secure` options.
- Protected routes use `verifyJWT`, which accepts either an `accessToken` cookie or an `Authorization: Bearer <token>` header.
- Suspended and inactive users are blocked by auth middleware.
- `verifyRole("admin")` protects admin-only caregiver routes.
- `verifyPatientOwnership` ensures caregivers can access only their own patients. Admin users can access active patients.

Required token environment variables in source code:

- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRY`

## AI Features

AI summaries are implemented through:

- `src/services/summary.service.js`
- `src/services/gemini.service.js`
- `src/utils/promptBuilder.js`
- `src/controllers/summary.controller.js`

The workflow:

1. Verify patient access.
2. Build a date range.
3. Aggregate daily log, vital, and physiotherapy data.
4. Fetch active prescriptions and recent reports.
5. Build a constrained prompt that tells the AI not to diagnose, invent, or recommend treatment changes.
6. Generate content with Google Gemini.
7. Return the generated summary and optionally send it to the caregiver by email.

The default Gemini model is `gemini-2.5-flash` when `GEMINI_MODEL` is not set.

## File Upload Pipeline

Uploads are implemented with Multer and Cloudinary.

- Multer stores temporary files in `public/temp`.
- Cloudinary uploads use `resource_type: "auto"`.
- Temporary local files are removed after upload, including failed upload cleanup paths.
- Avatar, cover image, and report files use this pipeline.
- Report updates can replace the previous Cloudinary asset.
- Report deletion attempts to destroy the Cloudinary asset before soft-deleting the report.

## Email Module and Cron Jobs

Email delivery uses Nodemailer and SMTP configuration.

Templates:

- `welcomeEmail.template.js`
- `dailyReminderEmail.template.js`
- `summaryEmail.template.js`

Email workflows:

- Welcome email after caregiver creation.
- AI summary email after manual summary generation when a caregiver email is supplied.
- Daily reminder email when a patient's daily log has not been recorded.
- Monthly AI progress summary email for caregiver patients.

Cron jobs:

- `dailyReminer.cron.js` runs at `0 21 * * *`.
- `monthlySummary.cron.js` runs at `0 9 1 * *`.

Both cron jobs start from `src/index.js` after the database connection is established.

## Dashboard and Analytics

Dashboard functionality is implemented in `dashboard.controller.js`.

- Global dashboard returns patient totals, active patient counts, reports uploaded today, active medicine schedules, completed and pending medicine counts, vitals recorded today, physiotherapy sessions today, recent patients, and recent reports.
- Patient dashboard returns weekly logs, current prescriptions, weekly vitals, weekly physiotherapy sessions, and weekly reports.

Analytics functionality appears in:

- `vital.controller.js` for vital analytics.
- `summary.service.js` for daily log, vital, and physiotherapy analytics used in AI summaries.

Aggregation pipelines calculate values such as:

- Vital averages, minimums, and maximums.
- Medicine adherence.
- Exercise completion.
- Sleep and water intake averages.
- Physiotherapy completion percentage and average duration.

## Seeder

The project includes a master seed script at `src/scripts/seed/seedDatabase.js` and a package script:

```bash
npm run seed
```

The seeder:

1. Connects to MongoDB.
2. Clears existing data.
3. Creates an admin.
4. Creates caregivers.
5. Generates patient profiles.
6. Creates patients.
7. Creates prescriptions from medication bundles.
8. Creates daily logs from recovery curves.
9. Creates vitals.
10. Creates physiotherapy sessions.
11. Creates reports.
12. Prints a summary.
13. Disconnects from MongoDB.

Profile and recovery data live in `src/scripts/profiles`.

## Environment Variables

Create a `.env` file from `.env.sample` and fill in real values. Do not commit `.env`.

The source code references the following variables:

```env
PORT=8000
CORS_ORIGIN=http://localhost:3000

MONGODB_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

MAIL_FROM_NAME=CuraFlow
MAIL_FROM_EMAIL=your_email_address
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

Note: `src/db/index.js` uses `MONGODB_URI` and sets the MongoDB database name to `curaflow`.

## Installation

```bash
git clone https://github.com/shauryapastor2005-cyber/CuraFlow-Backend.git
cd CuraFlow-Backend
npm install
```

Create and configure `.env`:

```bash
cp .env.sample .env
```

Fill in MongoDB, JWT, Cloudinary, Gemini, SMTP, and CORS values.

## Running Locally

Development mode:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

By default, the server reads `PORT` from the environment. The sample port is `8000`.

Seed the database:

```bash
npm run seed
```

Run formatting:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

## Docker Usage

Build the image:

```bash
docker build -t curaflow-backend .
```

Run the container with an environment file:

```bash
docker run --env-file .env -p 8000:8000 curaflow-backend
```

The Dockerfile:

- Uses `node:24-alpine`.
- Installs production dependencies with `npm ci --only=production`.
- Copies the repository into `/app`.
- Exposes port `8000`.
- Starts `src/index.js`.

## Deployment

The repository includes a Dockerfile but does not include platform-specific deployment configuration such as Docker Compose, Kubernetes manifests, CI/CD workflows, or provider config files.

This API can be deployed to any Node.js-capable platform or container host that provides:

- A MongoDB connection string.
- Required JWT secrets.
- Cloudinary credentials.
- Gemini API key.
- SMTP credentials.
- A configured CORS origin.

## Testing and API Exploration

The repository includes Postman assets:

- `postman_collection/CuraFlow API.postman_collection.json`
- `postman_collection/Local Developement.postman_environment.json`

There is no `npm test` script configured in `package.json`. `newman` is present as a development dependency, so the Postman collection can be run with Newman if the environment file is configured.

Example:

```bash
npx newman run "postman_collection/CuraFlow API.postman_collection.json" \
  -e "postman_collection/Local Developement.postman_environment.json"
```

## Engineering Highlights

- Modular MVC-style Express organization.
- Mongoose models with references, indexes, validation, and soft deletion.
- JWT access and refresh token lifecycle.
- Role-based admin authorization.
- Patient ownership authorization across nested resources.
- Date normalization to midnight UTC for calendar-based healthcare records.
- Unique compound indexes for one daily log, vital record, or physiotherapy session per patient per day.
- Cloudinary upload workflow with local temporary file cleanup.
- Aggregation pipelines for analytics and AI summary context.
- Prompt constraints that prevent the AI summary workflow from inventing data or giving medical advice.
- SMTP email templates for operational caregiver communication.
- Cron-driven reminders and monthly summary delivery.
- Seed workflow for local development data.
- Dockerfile for container execution.

## Future Improvements

- Add automated unit and integration tests.
- Add centralized Express error-handling middleware if not already handled by the deployment runtime.
- Add request validation schemas.
- Add rate limiting and security headers.
- Add API version documentation.
- Add CI/CD workflows.
- Add Docker Compose for local MongoDB and API orchestration.
- Add structured logging and observability.
- Add background queues for email and AI summary jobs.
- Add Redis caching for dashboard and analytics endpoints.
