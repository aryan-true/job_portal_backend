# Job Portal Backend API

A secure, role-based REST API built for a **Job Portal Platform** using Node.js, Express.js, MongoDB (Mongoose), JWT, and httpOnly cookies.

Designed according to the **Backend Development Mini Project** specification.

---

## Technical Features & Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js (v5)
- **Database**: MongoDB & Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with `httpOnly` cookies (`AccessToken`) & `Bearer` header support
- **Password Security**: `bcryptjs` password hashing with schema-level password sanitization (`toJSON` transform)
- **Validation & Security**:
  - Schema-level validations (email format, enum constraints, string lengths)
  - Role-based authorization middleware (`allowedRoles`)
  - Duplicate application prevention via unique compound MongoDB index (`job` + `jobSeeker`)
  - Strict resource ownership enforcement (Employers manage only their own jobs and job applications)
- **Testing**: Automated integration test suite + Postman Collection (`JobPortal.postman_collection.json`)

---

## User Roles & Responsibilities

1. **Job Seeker (`jobseeker`)**:
   - Register & Login
   - Maintain and update profile (skills, experience, education)
   - Browse open job opportunities with optional filtering
   - Apply for suitable job postings
   - Track application statuses (`pending`, `reviewed`, `accepted`, `rejected`)
   - Logout

2. **Employer (`employer`)**:
   - Register & Login
   - Create and manage job postings (`open`, `closed`, `paused`)
   - View, update, or delete own job postings
   - Review job applications received for owned job postings
   - Update application statuses for applicants
   - Logout

3. **Admin (`admin`)**:
   - Register & Login
   - Manage platform users (view all, view by ID, update role/status, delete user)
   - Manage platform job postings (view all, remove inappropriate/invalid postings)
   - Review platform application overview data
   - Logout

---

## Setup & Running Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` (or remote MongoDB URI)

### 2. Environment Variables (.env)
Create or verify the `.env` file in the root directory:

```env
PORT=3000
DB_URL=mongodb://localhost:27017/jobportal
JWT_SECRET=job-seeker-project-1
NODE_ENV=development
```

### 3. Installation & Server Execution

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or start in development mode
npm run dev
```

The server will start listening at `http://localhost:3000`.

---

## API Endpoints Overview

### 1. Job Seeker APIs (`/s-api`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/s-api/register` | Public | Register a new Job Seeker account |
| `POST` | `/s-api/login` | Public | Login and receive `httpOnly` cookie / JWT token |
| `GET` | `/s-api/profile` | `jobseeker` | View logged-in Job Seeker profile |
| `GET` | `/s-api/view-profile/:id` | `jobseeker` | View Job Seeker profile by ID (ownership checked) |
| `PUT` | `/s-api/profile` | `jobseeker` | Update logged-in Job Seeker profile |
| `GET` | `/s-api/view-jobs` | `jobseeker` | Browse all available open jobs |
| `GET` | `/s-api/view-jobs/:id` | `jobseeker` | View specific job details by ID |
| `POST` | `/s-api/apply/:jobId` | `jobseeker` | Apply for an open job posting |
| `GET` | `/s-api/view-applications` | `jobseeker` | View all submitted applications with status |
| `GET` | `/s-api/view-applications/:id` | `jobseeker` | View single application status details |
| `POST` | `/s-api/logout` | `jobseeker` | Logout and clear authentication cookie |

### 2. Employer APIs (`/e-api`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/e-api/register` | Public | Register a new Employer account |
| `POST` | `/e-api/login` | Public | Login and receive `httpOnly` cookie / JWT token |
| `POST` | `/e-api/create-job` | `employer` | Create a new job posting |
| `GET` | `/e-api/view-jobs` | `employer` | View jobs posted by logged-in Employer |
| `GET` | `/e-api/view-jobs/:id` | `employer` | View a specific job posting owned by Employer |
| `PUT` | `/e-api/update-job/:id` | `employer` | Update a job posting owned by Employer |
| `PUT` | `/e-api/update-status/:id` | `employer` | Update job status (`open`, `closed`, `paused`) |
| `DELETE` | `/e-api/delete-job/:id` | `employer` | Delete a job posting owned by Employer |
| `GET` | `/e-api/view-applications` | `employer` | View applications received for Employer's jobs |
| `PUT` | `/e-api/update-application-status/:id` | `employer` | Update application status (`pending`, `reviewed`, `accepted`, `rejected`) |
| `POST` | `/e-api/logout` | `employer` | Logout and clear authentication cookie |

### 3. Admin APIs (`/a-api`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/a-api/register` | Public | Register an Admin account |
| `POST` | `/a-api/login` | Public | Admin login |
| `GET` | `/a-api/view-users` | `admin` | View all registered platform users |
| `GET` | `/a-api/view-user/:id` | `admin` | View user details by ID |
| `PUT` | `/a-api/update-status/:id` | `admin` | Update user status or role |
| `DELETE` | `/a-api/delete-user/:id` | `admin` | Delete a user from platform |
| `GET` | `/a-api/view-jobs` | `admin` | View all job postings across platform |
| `GET` | `/a-api/view-job/:id` | `admin` | View job posting details by ID |
| `DELETE` | `/a-api/delete-job/:id` | `admin` | Delete inappropriate or invalid job posting |
| `GET` | `/a-api/view-applications` | `admin` | Review platform applications overview data |
| `POST` | `/a-api/logout` | `admin` | Admin logout |

---

## Postman Testing Guide

1. Open **Postman**.
2. Click **Import** and select `JobPortal.postman_collection.json`.
3. The collection includes pre-configured tests and scripts:
   - When you execute `Login Job Seeker`, `Login Employer`, or `Login Admin`, the returned JWT token is automatically saved to the collection variable `seekerToken`, `employerToken`, or `adminToken`.
   - When an Employer creates a job, `jobId` is saved automatically for subsequent job/application requests.
   - When a Job Seeker applies for a job, `applicationId` is saved automatically.
4. Execute the requests sequentially or run the full collection via **Postman Collection Runner**.

### Automated Integration Test Runner
You can also run the full end-to-end integration test suite programmatically:

```bash
node scratch/test-suite.js
```
