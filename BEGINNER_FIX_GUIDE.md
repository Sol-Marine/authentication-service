# 🎓 Junior Developer Guide: Mastering & Fixing the Authentication Service

Welcome to the backend engineering fix guide for the **Universal Authentication Service**! Building an authentication service using **Hono.js**, **PostgreSQL**, **JWTs**, and **Sessions** is a fantastic project. Authentication touches core backend concepts: SQL schema design, HTTP standards, hashing, security, cryptography, and clean architecture.

Bugs like missing SQL tables or unhandled routes happen to **every developer** when learning. This guide will explain **why** these issues happen, **what backend concept** they relate to, and **how to fix them step-by-step**.

---

## 📋 The PR Checklist (Check off items as you fix them!)

- [ ] **Task 1**: Fix database schema mismatches & missing tables in `src/database/schema.sql`
- [ ] **Task 2**: Create `.env` file & delete redundant `src/config/database.js`
- [ ] **Task 3**: Fix logic bugs in `GET /auth/me` and implement `DELETE /auth/me`
- [ ] **Task 4**: Upgrade OTP generation to use `crypto.randomInt` & remove OTPs from JSON responses
- [ ] **Task 5**: Add request payload validation using `zod`
- [ ] **Task 6**: Enable security headers & CORS in `src/index.js`
- [ ] **Task 7**: Refactor monolithic `src/routes/auth.js` into Controllers and Services

---

## Step 1: Database Schemas & Relational Integrity 🗄️

### 💡 The Backend Concept
A **database schema** is the blueprint for your application data. If code tries to query a SQL table or column that does not exist in your database, PostgreSQL will throw a runtime error and crash the request.

### 🔨 What to Fix

#### 1. Table Name Mismatch
* **Problem**: In `schema.sql`, your table is named `verification_tokens`, but `src/models/emailVerificationModel.js` runs queries on `email_verification_tokens`.
* **Fix**: In `schema.sql`, rename the table definition to `email_verification_tokens`.

#### 2. Missing Tables
* **Problem**: `password_reset_tokens` and `sessions` are queried in your model files, but are missing from `schema.sql`.
* **Fix**: Add table definitions for both tables in `schema.sql`.

#### 3. Missing Column
* **Problem**: `userModel.js` runs `UPDATE users SET is_active = false`, but `is_active` is missing from `schema.sql`.
* **Fix**: Add `is_active BOOLEAN DEFAULT TRUE` to the `users` table.

#### 4. Clean up DB Connections
* **Problem**: You have two database connection files: `src/config/database.js` (with hardcoded passwords) and `src/database/db.js` (using `.env`).
* **Fix**: Delete `src/config/database.js` and import `pool` exclusively from `src/database/db.js`.

### 📝 Corrected `schema.sql` Reference Code
Copy and replace the contents of `src/database/schema.sql` with this complete schema:

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    refresh_token_id INTEGER NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(refresh_token_id) REFERENCES refresh_tokens(id) ON DELETE CASCADE
);
```

---

## Step 2: Environment Variables (`.env`) 🔐

### 💡 The Backend Concept
Never hardcode sensitive passwords, database credentials, or secret keys in your source code! If committed to GitHub, secret keys can be stolen. Always load them from environment variables via a `.env` file.

### 🔨 What to Fix
Create a file named `.env` in the root project folder:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=auth_service
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password

JWT_SECRET=super_secret_access_key_change_me
JWT_REFRESH_SECRET=super_secret_refresh_key_change_me

PORT=3000
```

> **Tip**: Make sure `.env` is listed in your `.gitignore` file so it is never pushed to public repositories!

---

## Step 3: Fixing Endpoint Bugs 🛠️

### 💡 The Backend Concept
HTTP route handlers should execute business logic reliably and return a clean HTTP response with an appropriate status code (`200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`).

### 🔨 What to Fix

#### 1. Fix `GET /auth/me` (Profile Lookup)
In `src/routes/auth.js` around line 1028:
```javascript
// ❌ BEFORE (Returns stale decoded JWT payload):
const currentUser = await findUserById(user.id);
return c.json({ success: true, user });

// ✅ AFTER (Returns fresh user profile from DB):
const currentUser = await findUserById(user.id);
return c.json({ success: true, user: currentUser });
```

#### 2. Implement `DELETE /auth/me` (Account Deactivation)
In `src/routes/auth.js` around line 1099, the `try` block is currently empty.
```javascript
// ✅ IMPLEMENTATION:
auth.delete("/me", authMiddleware, async (c) => {
  try {
    const user = c.get("user");

    // Deactivate user account
    await deactivateUser(user.id);

    // Revoke all tokens & sessions for safety
    await revokeAllRefreshTokens(user.id);
    await deactivateAllSessions(user.id);

    return c.json({
      success: true,
      message: "Account deactivated successfully.",
    });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to delete account." }, 500);
  }
});
```

---

## Step 4: Security Best Practices 🛡️

### 1. Cryptographically Secure OTP Generation
* **Concept**: `Math.random()` is pseudo-random and predictable for security tokens.
* **Fix**: Use Node.js built-in `crypto` module:
  ```javascript
  import crypto from "node:crypto";

  // Generate secure 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  ```

2. **Remove OTP Leaks in API Responses**:
   - In `/auth/register`, `/auth/resend-verification`, and `/auth/forgot-password`, remove `verification_otp` and `reset_otp` from `c.json(...)`.
   - Send them via email (e.g., using `nodemailer`) instead of returning them in API responses.

3. **Input Validation with Zod**:
   - You already have `zod` installed in `package.json`!
   - Define schema objects to validate input automatically:
     ```javascript
     import { z } from "zod";

     const registerSchema = z.object({
       first_name: z.string().min(1, "First name is required"),
       last_name: z.string().min(1, "Last name is required"),
       email: z.string().email("Invalid email format"),
       password: z.string().min(8, "Password must be at least 8 characters"),
     });
     ```

4. **Security Headers & CORS**:
   - In `src/index.js`, add standard security middleware:
     ```javascript
     import { cors } from "hono/cors";
     import { secureHeaders } from "hono/secure-headers";

     app.use("*", cors());
     app.use("*", secureHeaders());
     ```

---

## Step 5: Clean Code Architecture 📐

### 💡 The Backend Concept
When code grows large (like `auth.js` with 1,100+ lines), it becomes hard to debug and maintain. Follow the **Controller-Service-Model Pattern**:

```
src/
├── controllers/    # Parses HTTP request, calls service, returns HTTP response
├── services/       # Contains business logic (password hashing, token generation)
├── models/         # Interacts directly with database SQL queries
├── validators/     # Zod validation schemas
├── middleware/     # Auth and error middleware
└── index.js        # Server initialization
```
