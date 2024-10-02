# Video API

This repository contains a video API that allows for uploading, trimming, merging, and sharing videos. The API is built using Node.js, Express, and Sequelize, and it includes end-to-end tests.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the API Server](#running-the-api-server)
- [Running the Test Suite](#running-the-test-suite)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [License](#license)

## Prerequisites

- Node.js (version 14.x or higher)
- npm (version 6.x or higher)

## Setup

1. Clone the repository:

    ```sh
    git clone https://github.com/yourusername/video-api.git
    cd video-api
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

3. Set up environment variables:

    Create a `.env` file in the root directory and add the following variables:

    ```env
    NODE_ENV=production
    PORT=3000
    API_TOKEN=your_api_token
    MIN_DURATION=5
    MAX_DURATION=25
    MAX_FILE_SIZE=25
    ```

4. Set up the database:

    The project uses SQLite for the database. The configuration for different environments is located in the `src/config/config.js` file.

## Running the API Server

To start the API server, run:

```sh
npm start
```

This will start the server on the port specified in the `.env` file (default is 3000).

## Running the Test Suite

The project includes end-to-end tests using Jest. To run the tests, use the following command:

```sh
npm run test:e2e
```

You can also run specific test scripts defined in the `package.json` file:

- End-to-end tests for video features:

    ```sh
    npm run test:video
    ```

- End-to-end tests for share features:

    ```sh
    npm run test:share
    ```

- All end-to-end tests:

    ```sh
    npm run test:e2e
    ```

## Project Structure

- `src/`: Contains the main source code for the API.
- `src/app.js`: Initializes the Express app and sets up middleware and routes.
- `src/server.js`: Starts the server and handles graceful shutdown.
- `src/config/`: Configuration files for the project.
- `src/controllers/`: Contains the controller logic for handling API requests.
- `src/middlewares/`: Custom middleware functions.
- `src/models/`: Sequelize models for the database.
- `src/routes/`: Defines the API routes.
- `src/tests/`: Contains end-to-end tests.

## API Endpoints

### Video Endpoints

- **Upload Video**
  - **URL:** `POST /api/videos/upload`
  - **Description:** Upload a video file.
  - **Authorization:** Bearer token required.
  - **Request:** `multipart/form-data` with a `video` file.
  - **Response:** Video metadata.

- **Trim Video**
  - **URL:** `POST /api/videos/:id/trim`
  - **Description:** Trim a video.
  - **Authorization:** Bearer token required.
  - **Request:** JSON with `startTime` and `endTime`.
  - **Response:** Trimmed video metadata.

### Share Endpoints

- **Create Share Link**
  - **URL:** `POST /api/share/:videoId`
  - **Description:** Create a share link for a video.
  - **Authorization:** Bearer token required.
  - **Request:** JSON with `expiryTime`.
  - **Response:** Share link and expiry time.

- **Access Shared Video**
  - **URL:** `GET /api/share/:shareToken`
  - **Description:** Access a shared video.
  - **Authorization:** Bearer token required.
  - **Response:** Video file.

_For comprehensive API documentation, please refer to the [Swagger UI](http://localhost:3000/api-docs)._

## Environment Variables

The following environment variables are used in the project:

- `NODE_ENV`: The environment in which the application is running (e.g., `development`, `production`).
- `PORT`: The port on which the server will run.
- `API_TOKEN`: The token used for API authentication.
- `MIN_DURATION`: The minimum duration for uploaded videos (in seconds).
- `MAX_DURATION`: The maximum duration for uploaded videos (in seconds).
- `MAX_FILE_SIZE`: The maximum file size for uploaded videos (e.g., `50MB`).

## License

This project is licensed under the MIT License.