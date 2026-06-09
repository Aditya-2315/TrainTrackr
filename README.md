# TrainTrackr

TrainTrackr is a full-stack fitness coaching and session management platform designed for trainers, clients, and head trainers. The platform streamlines client management, workout planning, session scheduling, trainer availability management, and progress tracking through a modern web application built with the MERN ecosystem and PostgreSQL.

## Features

### Client Features
- Client registration and authentication
- Google OAuth login
- Profile management
- View assigned trainer
- Book training sessions
- Reschedule and cancel sessions
- View session history
- Access workout plans
- Download workout plan PDFs
- Mobile-friendly Progressive Web App (PWA)

### Trainer Features
- Trainer invitation-based onboarding
- Availability management
- Weekly schedule management
- Session management
- Client management
- Workout plan assignment
- Session history tracking
- Trainer profile management

### Head Trainer Features
- Invite trainers
- Manage trainers
- Manage clients
- Assign clients to trainers
- Book sessions on behalf of clients
- Monitor platform activity
- Create and manage workout plans

### Booking System
- Availability-based scheduling
- Trainer exception handling
- Blocked dates
- Extra availability slots
- Session rescheduling
- Session cancellation
- Automatic booking validation

### Workout Plans
- Upload workout plans as PDF documents
- View workout plans directly in the application
- Download workout plans
- Trainer-created workout assignments

### Progressive Web App
- Installable on mobile and desktop
- Responsive design
- Offline-ready architecture
- Future support for workout plan caching and offline access

---

## Tech Stack

### Frontend
- React
- React Router
- Tailwind CSS
- TanStack Query (React Query)
- React Hook Form
- Zod
- Axios
- Lucide React
- Date-fns
- React Hot Toast

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Passport.js
- JWT Authentication
- Google OAuth 2.0
- Multer

### Database
- PostgreSQL

---

## User Roles

### Client
Clients can:
- Manage their profile
- View workout plans
- Book sessions
- Reschedule sessions
- Cancel sessions
- View booking history

### Trainer
Trainers can:
- Manage availability
- Manage assigned clients
- View schedules
- Create workout plans
- Track session history

### Head Trainer
Head trainers can:
- Manage trainers
- Invite trainers
- Assign clients
- Book sessions for clients
- Manage workout plans

---

## Project Structure

```text
TrainTrackr/
│
├── Frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── utils/
│   │
│   └── public/
│
├── Backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── config/
│   │
│   └── uploads/
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/traintrackr.git
cd traintrackr
```

---

### Backend Setup

```bash
cd Backend

npm install
```

Create a `.env` file:

```env
DATABASE_URL=

JWT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FRONTEND_URL=http://localhost:5173

PORT=3000
```

Run migrations:

```bash
npx prisma migrate dev
```

Start backend:

```bash
npm run dev
```

---

### Frontend Setup

```bash
cd Frontend

npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

Start frontend:

```bash
npm run dev
```

---

## Authentication

TrainTrackr supports:

- Email and password authentication
- JWT-based authorization
- Google OAuth login
- Role-based access control

Roles:

- CLIENT
- TRAINER
- HEAD_TRAINER

---

## Database Models

Core entities include:

- User
- ClientProfile
- TrainerProfile
- Booking
- TrainerAvailability
- AvailabilityException
- ClientTrainerAssignment
- WorkoutPlan
- ClientPackage
- ClientSessionAllowance
- TrainerInvitation

---

## Future Enhancements

- Push notifications
- Firebase Cloud Messaging
- Workout plan offline caching
- Session reminders
- Progress tracking dashboard
- Exercise library
- Nutrition planning
- AI-powered fitness recommendations
- Mobile application

---

## Security

- Password hashing using bcrypt
- JWT authentication
- Protected routes
- Role-based authorization
- Input validation using Zod
- Prisma ORM for database safety

---

## Deployment

### Frontend
- Vercel

### Backend
- Render

### Database
- PostgreSQL

### File Storage
Current:
- Local uploads

Planned:
- Cloudinary

---

## Author

Aditya Chaudhary

Software Developer | MERN Stack Developer | AI/ML Enthusiast

---

## License

This project is licensed under the MIT License.
