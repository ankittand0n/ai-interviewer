# Technical Interview System

A Next.js application for conducting automated technical interviews using AI.

## Getting Started

### Local Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker Setup

#### Prerequisites
- Docker
- Docker Compose

#### Environment Setup
1. Create a `.env` file in the root directory with the following variables:
```env
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development # or production
TARGET=deps # Use 'deps' for development, 'runner' for production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Development with Docker
```bash
# Build and start the development container
docker compose up --build

# Stop the containers
docker compose down
```

#### Production Deployment
```bash
# Set environment to production
export NODE_ENV=production
export TARGET=runner

# Build and start the production container
docker compose up --build -d

# View logs
docker compose logs -f

# Stop the containers
docker compose down
```

### Project Structure

The application uses:
- Next.js 15.3 with TypeScript
- OpenAI API for conducting interviews
- shadcn/ui components
- JSON file-based data storage

## Features

- Technical interview conducting with AI
- Job and candidate management
- 45-minute interview timer
- State preservation during interviews
- Requirements management for job positions

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Deployment

The application can be deployed using:
1. Docker (recommended)
2. [Vercel Platform](https://vercel.com/new)
3. Any platform supporting Node.js
