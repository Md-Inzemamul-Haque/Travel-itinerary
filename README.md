# Travel Itinerary App

A simple Travel Itinerary Management API. Users can create, view, update, delete, and share itineraries. Includes authentication, Redis caching, and email notifications.

## Setup & Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd travel-itinerary
```

```bash
npm install
```

# .env file

```bash
PORT=3000
NODE_ENV=development
MONGO_URI=<your-mongo-uri>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d
REDIS_HOST=<your-redis-host>
REDIS_PORT=<your-redis-port>
REDIS_USERNAME=<your-redis-username>
REDIS_PASSWORD=<your-redis-password>
SMTP_HOST=<your-smtp-host>
SMTP_PORT=<your-smtp-port>
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-pass>
```

Instructions for users:
Create a file named .env in the root folder of your project.
Copy the above content into it.
Replace placeholders like <your-mongo-uri> and <your-jwt-secret> with your actual values.

## Running the Project

# Run in development mode with live reload

npm run dev

# Run in production mode

npm start

## API Documentation

**Base URL:** `/api`

### Auth Routes

- **POST** `/api/auth/register` → Register a new user
- **POST** `/api/auth/login` → Login a user

### Itinerary Routes

- **POST** `/api/itineraries/create` → Create a new itinerary
- **GET** `/api/itineraries` → Get all itineraries (supports optional pagination & filtering: `?page=1&limit=10&destination=paris`)
- **GET** `/api/itineraries/:id` → Get itinerary by ID
- **PUT** `/api/itineraries/:id` → Update an itinerary
- **DELETE** `/api/itineraries/:id` → Soft delete an itinerary
- **GET** `/api/itineraries/share/:shareableId` → Get shared itinerary (no authentication required)

> You can import the Postman collection to test the API: [Postman Collection Link](https://www.postman.com/inzemam-5212612/workspace/inzemam-s-public-wokspace/collection/44474363-ece01923-fcfc-4fa3-8018-25aab45198f7?action=share&creator=44474363)
