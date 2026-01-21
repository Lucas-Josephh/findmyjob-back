# FindMyJob Backend

A Node.js Express backend for the FindMyJob application.

## Installation

1. Clone the repository or navigate to the project directory.
2. Run `npm install` to install dependencies.

## Running the Application

- For development: `npm run dev` (requires nodemon)
- For production: `npm start`

The server will start on port 3000 by default, or use the PORT environment variable.

## API Endpoints

- `GET /` - Welcome message
- `GET /api/jobs` - Get list of jobs (placeholder)

## Project Structure

- `server.js` - Main entry point
- `package.json` - Dependencies and scripts

## Troubleshooting

- Ensure Node.js is installed (version 14+ recommended).
- If port 3000 is in use, set PORT environment variable to a different port.