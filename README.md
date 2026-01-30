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

## Production build (optional)

1. Build the frontend bundle:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Copy the built assets into the backend resources:
   ```bash
   rm -rf ../backend/src/main/resources/public
   cp -R dist ../backend/src/main/resources/public
   ```
3. Run the backend (serves both API + frontend):
   ```bash
   cd ../backend
   ./gradlew run
   ```
