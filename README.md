# vibe-code-testing

Minimal investment planner with a Vue 3 + TypeScript frontend and a Kotlin (Ktor) backend.

## Development

1. Start the Kotlin API server (serves `/api/assumptions`):
   ```bash
   cd backend
   ./gradlew run
   ```
2. Start the Vue frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend proxies `/api` requests to the backend during development.
