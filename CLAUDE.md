# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Start the development server:
```bash
deno task start
```

This runs the app with required permissions (`--allow-net --allow-env`) and loads environment variables from `.env` file.

## Architecture Overview

This is a Deno-based REST API built with the Hono web framework, using PostgreSQL with Drizzle ORM for data persistence. The application provides social media post analytics with JWT-based authentication.

### Tech Stack
- **Runtime**: Deno
- **Web Framework**: Hono 4.8+ (refer to https://hono.dev/llms-full.txt for documentation)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with HMAC-SHA256 signing

### Project Structure
```
src/
├── drizzle/           # Database layer
│   ├── db.ts         # Database connection setup
│   ├── schema.ts     # Database schema definitions
│   └── migrations/   # Database migrations
├── login/            # Authentication routes
├── post/             # Post management routes
├── stats/            # Analytics and statistics routes
└── utils/            # Shared utilities
    ├── auth-middleware.ts  # JWT authentication middleware
    └── jwt.ts             # JWT token utilities
```

### Database Schema
- **posts**: Social media posts with metrics (reactions, comments, shares, video views)
- **users**: User accounts with email/password authentication

### Authentication Flow
- Public routes: `/` (health check), `/login` (authentication)
- Protected routes: All `/posts/*` and `/stats/*` routes require JWT token via `Authorization: Bearer <token>` header
- JWT tokens expire after 24 hours
- Auth middleware validates tokens and extracts user info to context

### API Endpoints
- `POST /login` - User authentication, returns JWT token
- `GET /posts/latest` - Recent 10 posts (protected)
- `GET /posts` - Paginated posts with search/filtering (protected)
- `GET /stats` - Overall post statistics (protected)
- `GET /stats/search-stats` - Statistics filtered by search term (protected)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `JWT_SECRET`: Secret key for JWT signing (defaults to "supersecret")

### Development Guidelines
- Keep code simple, refactor only when needed
- Use the existing Drizzle patterns for database queries
- Follow the established route structure with separate files per feature
- All new protected routes must use the `authMiddleware`
- Password comparison is currently plain text (consider hashing for production)