# Vessel Emissions Visualization

A web application for visualizing vessel emissions data, built with Next.js, Express, and PostgreSQL.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- npm package manager

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vessel_emissions_vis
   ```

2. Create environment files:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and adjust the values if needed.

3. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```

   This will start:
   - Frontend on http://localhost:3003
   - Backend API on http://localhost:3002
   - PostgreSQL database on port 5433

## Development

### Local Development

1. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

2. Start the development servers:
   ```bash
   # Frontend (in frontend directory)
   npm run dev

   # Backend (in backend directory)
   npm run dev
   ```

### Database Management

The application uses PostgreSQL with Prisma ORM. Database migrations are automatically applied when the backend container starts.

To manually run migrations:
```bash
cd backend
npm run prisma migrate dev
```

To seed the database:
```bash
npm run prisma db seed
```

## Project Structure

```
vessel_emissions_vis/
├── frontend/           # Next.js frontend application
├── backend/           # Express backend API
├── data/             # Data files and utilities
├── docker-compose.yml # Docker Compose configuration
└── .env.example      # Environment variables template
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (postgresql://postgres:postgres@db:5432/vessel_emissions)
- `PORT`: Backend server port (default: 3002)
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend (http://localhost:3002)
- `POSTGRES_USER`: PostgreSQL username (default: postgres)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: postgres)
- `POSTGRES_DB`: PostgreSQL database name (default: vessel_emissions)
- `POSTGRES_PORT`: PostgreSQL port (default: 5433)

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

[Your License Here] 