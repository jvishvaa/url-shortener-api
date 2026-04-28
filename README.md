# url-shortener-api

A production-ready URL shortener built with Node.js, PostgreSQL, and Redis.
Inspired by Bitly — supports short link generation, fast redirects, click analytics, and rate limiting.

## Features

- `POST /shorten` — generate a short URL
- `GET /:slug` — redirect to original URL
- `GET /stats/:slug` — view click analytics
- Redis caching for sub-millisecond redirects
- Sliding window rate limiting (10 req/min per IP)
- Click tracking (referrer, user agent, timestamp)
- Fully containerized with Docker Compose

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Containerization | Docker Compose |

## Getting Started

**Prerequisites:** Docker Desktop installed and running.

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/url-shortener.git
cd url-shortener

# Start everything
docker compose up --build
```

Server runs at `http://localhost:3000`

## API Reference

### Shorten a URL
```bash
POST /shorten
Content-Type: application/json

{ "long_url": "https://www.youtube.com" }
```

Response:
```json
{
  "slug": "aB3xK9mQ",
  "short_url": "http://localhost:3000/aB3xK9mQ",
  "long_url": "https://www.youtube.com"
}
```

### Redirect
```bash
GET /:slug
# Redirects to original URL with 302
```

### Get Stats
```bash
GET /stats/:slug
```

Response:
```json
{
  "slug": "aB3xK9mQ",
  "long_url": "https://www.youtube.com",
  "total_clicks": 42,
  "clicks_by_referrer": [
    { "referrer": "twitter.com", "count": "28" },
    { "referrer": "google.com", "count": "14" }
  ],
  "clicks_by_date": [
    { "date": "2026-04-28", "count": "42" }
  ]
}
```

## Architecture

```
Client
  │
  ▼
Express Server
  │
  ├── POST /shorten ──────────────────► PostgreSQL (write)
  │                                         │
  │                                     prime cache
  │                                         │
  │                                         ▼
  └── GET /:slug ──► Redis (cache hit) ◄── Redis
                          │
                     cache miss
                          │
                          ▼
                     PostgreSQL (read)
                          │
                    record click (background)
```

## Design Decisions

**Why Redis for caching?**
Redirects are the hot path. Redis serves lookups in ~0.5ms vs ~10ms for PostgreSQL. Most short links get clicked repeatedly so cache hit rate is high.

**Why sliding window rate limiting?**
Fixed window allows 2x the limit at window boundaries. Sliding window is accurate and fair — always checks the true last 60 seconds.

**Why separate clicks table?**
Click data grows extremely fast. Keeping it separate means that growth never affects the performance of the `urls` table which handles critical redirect lookups.

**Why 302 not 301?**
301 is cached permanently by browsers — clicks would bypass your server entirely and analytics would break.

**Why parameterized queries ($1, $2)?**
Prevents SQL injection — user input is always treated as data, never as SQL code.

## Project Structure

```
src/
├── routes/
│   ├── shorten.js    # POST /shorten
│   ├── redirect.js   # GET /:slug
│   └── stats.js      # GET /stats/:slug
├── db/
│   ├── postgres.js   # PostgreSQL connection pool
│   └── redis.js      # Redis client
├── middleware/
│   └── rateLimiter.js # Sliding window rate limiter
└── index.js          # Entry point
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | — |
| `BASE_URL` | Base URL for short links | http://localhost:3000 |

Copy `.env.example` to `.env` for local development outside Docker.
