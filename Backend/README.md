# Threat Website Backend API

This is the backend API for the Threat Website project. The API provides functionality for user authentication, community forums, educational resources, and a public directory of flagged malicious websites.

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Express Validator
- Helmet, Morgan, and CORS for security and logging

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/threat-website
   JWT_SECRET=your_secret_key
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

| Method | Endpoint              | Description                              | Access      |
|--------|------------------------|------------------------------------------|-------------|
| POST   | /api/auth/register     | Register a new user                      | Public      |
| POST   | /api/auth/login        | Login user & get token                   | Public      |
| POST   | /api/auth/register-admin | Register a new admin (admin only)        | Admin       |
| GET    | /api/auth/profile      | Get current user profile                 | Private     |
| PUT    | /api/auth/profile      | Update user profile                      | Private     |

### Community Hub

| Method | Endpoint                                 | Description                         | Access      |
|--------|------------------------------------------|-------------------------------------|-------------|
| GET    | /api/community                           | Get all forum posts with filters    | Public      |
| POST   | /api/community                           | Create a new forum post             | Private     |
| GET    | /api/community/categories                | Get all forum categories            | Public      |
| GET    | /api/community/:id                       | Get forum post by ID                | Public      |
| PUT    | /api/community/:id                       | Update forum post                   | Private     |
| DELETE | /api/community/:id                       | Delete forum post                   | Private     |
| POST   | /api/community/:id/comments              | Add comment to forum post           | Private     |
| DELETE | /api/community/:id/comments/:commentId   | Delete comment                      | Private     |
| PUT    | /api/community/:id/like                  | Like or unlike forum post           | Private     |
| PUT    | /api/community/:id/comments/:commentId/like | Like or unlike comment           | Private     |

### Educational Resources

| Method | Endpoint                                | Description                        | Access      |
|--------|-----------------------------------------|-----------------------------------|-------------|
| GET    | /api/education                          | Get all educational resources     | Public      |
| POST   | /api/education                          | Create new educational resource   | Private     |
| GET    | /api/education/categories               | Get all resource categories       | Public      |
| GET    | /api/education/resource-types           | Get all resource types            | Public      |
| GET    | /api/education/:id                      | Get resource by ID                | Public      |
| PUT    | /api/education/:id                      | Update resource                   | Private     |
| DELETE | /api/education/:id                      | Delete resource                   | Private     |
| POST   | /api/education/:id/ratings              | Add rating to resource            | Private     |
| DELETE | /api/education/:id/ratings/:ratingId    | Delete rating                     | Private     |

### Public Directory (Flagged Websites)

| Method | Endpoint                              | Description                       | Access      |
|--------|---------------------------------------|-----------------------------------|-------------|
| GET    | /api/directory                        | Get all flagged websites         | Public      |
| POST   | /api/directory                        | Submit a new flagged website     | Private     |
| GET    | /api/directory/categories             | Get all website categories       | Public      |
| GET    | /api/directory/severity-levels        | Get severity levels              | Public      |
| GET    | /api/directory/:id                    | Get flagged website by ID        | Public/Private |
| PUT    | /api/directory/:id                    | Update flagged website           | Private     |
| DELETE | /api/directory/:id                    | Delete flagged website           | Private     |
| POST   | /api/directory/:id/report             | Add report to flagged website    | Private     |

### Admin

| Method | Endpoint                              | Description                        | Access      |
|--------|---------------------------------------|------------------------------------|-------------|
| GET    | /api/admin/pending-websites           | Get pending website submissions    | Admin       |
| PUT    | /api/admin/approve-website/:id        | Approve a flagged website          | Admin       |
| PUT    | /api/admin/reject-website/:id         | Reject a flagged website           | Admin       |
| GET    | /api/admin/dashboard-stats            | Get admin dashboard statistics     | Admin       |

## Authentication

The API uses JWT (JSON Web Token) authentication. To access protected routes, include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Request and Response Examples

### User Registration

**Request:**
```json
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
Status: 201 Created
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Create Forum Post

**Request:**
```json
POST /api/community
Content-Type: application/json
Authorization: Bearer <your_jwt_token>

{
  "title": "New Phishing Campaign Targeting Banks",
  "content": "There's a new phishing campaign targeting major banks...",
  "category": "phishing",
  "tags": ["banking", "email", "phishing"]
}
```

**Response:**
```json
Status: 201 Created
{
  "_id": "60d21b4667d0d8992e610c86",
  "title": "New Phishing Campaign Targeting Banks",
  "content": "There's a new phishing campaign targeting major banks...",
  "category": "phishing",
  "tags": ["banking", "email", "phishing"],
  "author": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "profilePicture": ""
  },
  "createdAt": "2023-06-22T14:30:00.000Z",
  "updatedAt": "2023-06-22T14:30:00.000Z",
  "likes": [],
  "comments": [],
  "views": 0
}
```

## Error Handling

The API returns standard HTTP status codes along with JSON responses:

- 200: OK - Request succeeded
- 201: Created - Resource created successfully
- 400: Bad Request - Invalid input data
- 401: Unauthorized - Authentication required
- 403: Forbidden - Access denied
- 404: Not Found - Resource not found
- 500: Internal Server Error - Server-side error

Error responses follow this structure:

```json
{
  "status": "fail",
  "message": "Specific error message"
}
```
