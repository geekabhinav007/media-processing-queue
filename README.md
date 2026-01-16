# Media Processing Queue

Backend service for submitting media processing jobs, tracking progress, and retrieving results. Built with NestJS, TypeORM, PostgreSQL, Redis, and BullMQ. Swagger documentation is exposed at http://localhost:3000/api/v1/docs once the API boots.

## Prerequisites
- Node.js 20+
- npm 10+
- Docker and Docker Compose
- Redis and PostgreSQL URLs available via environment variables if running without Docker

## Environment Variables

| Name | Description | Example |
| --- | --- | --- |
| DATABASE_URL | PostgreSQL connection string | postgres://postgres:postgres@localhost:5432/media_queue |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| BULL_QUEUE_NAME | BullMQ queue name shared by API and worker | media-processing |
| PORT | API port (optional) | 3000 |
| DB_SYNCHRONIZE | TypeORM schema sync flag (development only) | false |
| DB_LOGGING | Enables SQL logging | false |

Copy `.env.example` to `.env` and adjust as needed before starting services.

## Running the Stack with Docker
1. Ensure `.env` is configured.
2. Start the infrastructure and API: `docker compose up --build`.
3. Once containers start, the API listens on http://localhost:3000 and Swagger is at http://localhost:3000/api/v1/docs.
4. The worker can run either inside Docker (if configured in the compose file) or manually with `npm run start:worker` from the host; ensure it has access to the same `.env` values.

## Running Locally without Docker
```bash
npm install

# start API
npm run start:dev

# start worker in a second terminal
npm run start:worker:dev
```

Verify health at http://localhost:3000/api/v1/health. Swagger UI is available at http://localhost:3000/api/v1/docs.

## Automated Tests
```bash
npm run test:watch
```



## Design Decisions & Trade-offs
- **Simulated worker pipeline:** The worker in fakes processing stages with delays to demonstrate progress tracking. Real processing would swap this logic for actual media tooling.
- **Swagger-first DTOs:** DTO classes use `@ApiProperty` metadata so the documented schemas stay in sync with validation rules.
- **TypeORM migrations:** Schema updates are managed via migrations, avoiding schema drift between environments.

## What I Would Improve with More Time
- Add authentication and request quotas to protect job submission endpoints.
- Introduce structured logging.
- Implement callback delivery or webhooks to notify clients when processing completes.
- Replace simulated worker with actual media transcoding pipeline and pluggable processors per file type.

## Bonus Challenges Attempted
- None of the optional bonus challenges have been implemented yet.