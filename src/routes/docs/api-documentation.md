# Authentication Service API Documentation

## Base URL

```
http://localhost:3000
```

---

## Authentication

Most protected endpoints require an Access Token.

Include the token in the request header:

```
Authorization: Bearer <access_token>
```

---

## API Endpoints

The following endpoints are available:

- POST /register
- POST /verify
- POST /resend-verification
- POST /login
- POST /refresh
- POST /logout
- POST /forgot-password
- POST /reset-password
- GET /me
- PATCH /me

---

# POST /register

## Description

Creates a new user account.

---

## Request

**Method**

POST

**Endpoint**

```
/register
```

**Body**

```json
{
  "first_name": "Noble",
  "last_name": "Marine",
  "email": "Noble@example.com",
  "password": "Password123"
}
```

---

## Validation

- Email must be unique.
- Password must contain at least 8 characters.
- Password must include:
  - One uppercase letter.
  - One lowercase letter.
  - One number.

---

## Success Response

**Status Code**

```
201 Created
```

Example:

```json
{
  "success": true,
  "message": "Registration successful.",
  "verification_otp": "123456",
  "user": {
    "id": 1,
    "first_name": "Noble",
    "last_name": "Marine",
    "email": "Noble@example.com",
    "is_verified": false
  }
}
```

---

## Error Responses

### Email already exists

```
409 Conflict
```

```json
{
  "success": false,
  "message": "Email already exists."
}
```

### Invalid input

```
400 Bad Request
```

```json
{
  "success": false,
  "message": "Validation failed."
}
```

### Server error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Registration failed."
}
```

---

## Authentication Required

No.

---

# POST /verify

## Description

Verifies a user's email address using the verification OTP received after registration.

---

## Request

**Method**

POST

**Endpoint**

```
/verify
```

**Body**

```json
{
  "email": "Noble@example.com",
  "otp": "123456"
}
```

---

## Success Response

**Status Code**

```
200 OK
```

Example:

```json
{
  "success": true,
  "message": "Email verified successfully."
}
```

---

## Error Responses

### Invalid OTP

```
400 Bad Request
```

```json
{
  "success": false,
  "message": "Invalid verification code."
}
```

### OTP Expired

```
400 Bad Request
```

```json
{
  "success": false,
  "message": "Verification code has expired."
}
```

### User Not Found

```
404 Not Found
```

```json
{
  "success": false,
  "message": "User not found."
}
```

### Server Error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Verification failed."
}
```

---

## Authentication Required

No.

---

# POST /resend-verification

## Description

Generates and sends a new email verification OTP to users who have not yet verified their email address.

---

## Request

**Method**

POST

**Endpoint**

```
/resend-verification
```

**Body**

```json
{
  "email": "Noble@example.com"
}
```

---

## Success Response

**Status Code**

```
200 OK
```

Example:

```json
{
  "success": true,
  "message": "Verification code sent successfully."
}
```

---

## Error Responses

### User Not Found

```
404 Not Found
```

```json
{
  "success": false,
  "message": "User not found."
}
```

### Email Already Verified

```
400 Bad Request
```

```json
{
  "success": false,
  "message": "Email is already verified."
}
```

### Server Error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Failed to resend verification code."
}
```

---

## Authentication Required

No.

---

# POST /login

## Description

Authenticates a verified user and returns an Access Token and Refresh Token.

---

## Request

**Method**

POST

**Endpoint**

```
/login
```

**Body**

```json
{
  "email": "Noble@example.com",
  "password": "Password123"
}
```

---

## Success Response

**Status Code**

```
200 OK
```

Example:

```json
{
  "success": true,
  "message": "Login successful.",
  "access_token": "<access_token>",
  "refresh_token": "<refresh_token>"
}
```

---

## Error Responses

### Invalid Credentials

```
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

### Email Not Verified

```
403 Forbidden
```

```json
{
  "success": false,
  "message": "Please verify your email before logging in."
}
```

### User Not Found

```
404 Not Found
```

```json
{
  "success": false,
  "message": "User not found."
}
```

### Server Error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Login failed."
}
```

---

## Authentication Required

No.

---

# POST /refresh

## Description

Generates a new Access Token and Refresh Token using a valid Refresh Token.

---

## Request

**Method**

POST

**Endpoint**

```
/refresh
```

**Body**

```json
{
  "refresh_token": "<refresh_token>"
}
```

---

## Success Response

**Status Code**

```
200 OK
```

Example:

```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "access_token": "<new_access_token>",
  "refresh_token": "<new_refresh_token>"
}
```

---

## Error Responses

### Invalid Refresh Token

```
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Invalid refresh token."
}
```

### Expired Refresh Token

```
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Refresh token has expired."
}
```

### Revoked Refresh Token

```
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Refresh token has been revoked."
}
```

### Session Not Found

```
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Session is no longer active."
}
```

### Server Error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Token refresh failed."
}
```

---

## Authentication Required

No.

---

# POST /logout

## Description

Logs out the authenticated user by revoking the current Refresh Token and deactivating the active session.

---

## Request

**Method**

POST

**Endpoint**

```
/logout
```

**Headers**

```
Authorization: Bearer <access_token>
```

**Body**

```json
{
  "refresh_token": "<refresh_token>"
}
```

---

## Success Response

**Status Code**

```
200 OK
```

Example:

```json
{
  "success": true,
  "message": "Logout successful."
}
```

---

## Error Responses

### Unauthorized

```
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Unauthorized."
}
```

### Invalid Refresh Token

```
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Invalid refresh token."
}
```

### Session Not Found

```
404 Not Found
```

```json
{
  "success": false,
  "message": "Active session not found."
}
```

### Server Error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Logout failed."
}
```

---

## Authentication Required

Yes.

---

# POST /forgot-password

## Description

Generates a password reset token and sends it to the user's registered email address.

---

## Request

**Method**

POST

**Endpoint**

```
/forgot-password
```

**Body**

```json
{
  "email": "Noble@example.com"
}
```

---

## Success Response

**Status Code**

```
200 OK
```

Example:

```json
{
  "success": true,
  "message": "Password reset instructions sent successfully."
}
```

---

## Error Responses

### User Not Found

```
404 Not Found
```

```json
{
  "success": false,
  "message": "User not found."
}
```

### Email Not Verified

```
403 Forbidden
```

```json
{
  "success": false,
  "message": "Please verify your email before resetting your password."
}
```

### Server Error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Failed to process password reset request."
}
```

---

## Authentication Required

No.

---

# POST /reset-password

## Description

Resets the user's password using a valid password reset token.

---

## Request

**Method**

POST

**Endpoint**

```
/reset-password
```

**Body**

```json
{
  "email": "Noble@example.com",
  "token": "123456",
  "new_password": "NewPassword123"
}
```

---

## Success Response

**Status Code**

```
200 OK
```

Example:

```json
{
  "success": true,
  "message": "Password reset successful."
}
```

---

## Error Responses

### Invalid Reset Token

```
400 Bad Request
```

```json
{
  "success": false,
  "message": "Invalid reset token."
}
```

### Expired Reset Token

```
400 Bad Request
```

```json
{
  "success": false,
  "message": "Reset token has expired."
}
```

### User Not Found

```
404 Not Found
```

```json
{
  "success": false,
  "message": "User not found."
}
```

### Validation Failed

```
400 Bad Request
```

```json
{
  "success": false,
  "message": "Validation failed."
}
```

### Server Error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Password reset failed."
}
```

---

## Authentication Required

No.

---

# GET /me

## Description

Returns the profile information of the currently authenticated user.

---

## Request

**Method**

GET

**Endpoint**

```
/me
```

**Headers**

```
Authorization: Bearer <access_token>
```

---

## Success Response

**Status Code**

```
200 OK
```

Example:

```json
{
  "success": true,
  "user": {
    "id": 1,
    "first_name": "Noble",
    "last_name": "Marine",
    "email": "Noble@example.com",
    "is_verified": true,
    "created_at": "2026-07-30T12:34:56.789Z"
  }
}
```

---

## Error Responses

### Unauthorized

```
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Unauthorized."
}
```

### User Not Found

```
404 Not Found
```

```json
{
  "success": false,
  "message": "User not found."
}
```

### Server Error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Failed to retrieve profile."
}
```

---

## Authentication Required

Yes.

---

# PATCH /me

## Description

Updates the profile information of the currently authenticated user.

Only the user's first name and last name can be updated.

---

## Request

**Method**

PATCH

**Endpoint**

```
/me
```

**Headers**

```
Authorization: Bearer <access_token>
```

**Body**

```json
{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

---

## Success Response

**Status Code**

```
200 OK
```

Example:

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "user": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "john@example.com",
    "is_verified": true
  }
}
```

---

## Error Responses

### Unauthorized

```
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Unauthorized."
}
```

### Validation Failed

```
400 Bad Request
```

```json
{
  "success": false,
  "message": "Validation failed."
}
```

### User Not Found

```
404 Not Found
```

```json
{
  "success": false,
  "message": "User not found."
}
```

### Server Error

```
500 Internal Server Error
```

```json
{
  "success": false,
  "message": "Failed to update profile."
}
```

---

## Authentication Required

Yes.
