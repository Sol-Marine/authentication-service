# Universal Authentication Service

A production-ready authentication service built with Node.js, Hono.js, PostgreSQL, and JWT.

## Features

- User registration
- Email verification
- Login authentication
- JWT access tokens
- JWT refresh tokens
- Refresh token rotation
- Session management
- Logout
- Logout from all devices
- Password reset flow
- Secure password hashing with bcrypt

## Tech Stack

- Node.js
- Hono.js
- PostgreSQL
- JWT
- bcrypt
- Zod
- Nodemailer

## Project Structure

```
authentication/
│
├── src/
│   │
│   ├── config/
│   │   └── database.js
│   │
│   ├── database/
│   │   ├── db.js
│   │   └── schema.sql
│   │
│   ├── models/
│   │   ├── userModel.js
│   │   ├── emailVerificationModel.js
│   │   ├── passwordResetModel.js
│   │   ├── refreshTokenModel.js
│   │   └── sessionModel.js
│   │
│   ├── routes/
│   │   └── auth.js
│   │
│   └── index.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

# Authentication Flow

## Registration

User creates an account:

```
User submits registration details

        ↓

Validate input

        ↓

Hash password using bcrypt

        ↓

Store user in PostgreSQL database

        ↓

Generate email verification token

        ↓

Verify email ownership

        ↓

Account activated
```

## Login

```
User enters email and password

        ↓

Validate credentials

        ↓

Generate JWT access token

        ↓

Generate refresh token

        ↓

Store refresh token

        ↓

Create user session

        ↓

Return authentication tokens
```

## Refresh Token Rotation

For every refresh request:

```
User sends refresh token

        ↓

Verify JWT signature

        ↓

Check refresh token in database

        ↓

Check token status

        ↓

Create new refresh token

        ↓

Save new token

        ↓

Revoke old token

        ↓

Update session

        ↓

Issue new access token
```

# Session Management

The service tracks user sessions using refresh tokens.

Each session stores:

- User ID
- Refresh token ID
- IP address
- User agent
- Last activity
- Session status

Users can:

- Logout from current device
- Logout from all devices

# API Endpoints

## Authentication Routes

| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| POST   | /auth/register        | Create new account     |
| POST   | /auth/verify-email    | Verify email address   |
| POST   | /auth/login           | Login user             |
| POST   | /auth/refresh         | Refresh access token   |
| POST   | /auth/logout          | Logout current session |
| POST   | /auth/logout-all      | Logout all sessions    |
| POST   | /auth/forgot-password | Request password reset |
| POST   | /auth/reset-password  | Reset password         |

# Database Tables

The authentication service uses PostgreSQL with the following tables:

- users
- email_verifications
- password_reset_tokens
- refresh_tokens
- sessions

# Environment Variables

Create a `.env` file:

```
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

JWT_SECRET=
JWT_REFRESH_SECRET=

PORT=
```

# Running Locally

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Server runs on:

```
http://localhost:3000
```

# Security Features

- Password hashing using bcrypt
- JWT authentication
- Refresh token rotation
- Token revocation
- Session tracking
- Logout from all devices
- Secure password reset flow

# Future Improvements

- Rate limiting
- Two-factor authentication
- OAuth login providers
- Email service integration
- Automated testing
- Deployment configuration

# Author

Noble
