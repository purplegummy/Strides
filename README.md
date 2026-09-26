# Strides

**A mobile-first, gamified real-world exploration platform built with Next.js, TypeScript, PostgreSQL, Prisma, tRPC, and Mapbox.**

Strides turns physical exploration into an interactive game. As users move through the real world, they uncover areas of a fog-covered map, discover location-based pins, track exploration progress, and interact with places discovered by other users.

The project combines geospatial data, persistent user state, authentication, and interactive mapping into a single full-stack application.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** tRPC, Next.js server routes
- **Database:** PostgreSQL, Prisma ORM
- **Authentication:** Better Auth
- **Maps & Geospatial:** Mapbox
- **Data Fetching / State:** React Query
- **Validation:** Zod

## Features

- Interactive Mapbox-powered exploration map
- Fog-of-war style discovery system
- Persistent exploration progress tied to user accounts
- Location-based points of interest and map markers
- Authentication and user-specific data
- Database-backed exploration and discovery state
- Mobile-first responsive interface
- Full-stack type safety with TypeScript and tRPC

## Technical Highlights

- Designed a full-stack architecture connecting a Next.js frontend with PostgreSQL through Prisma and tRPC
- Built geospatial exploration mechanics that translate real-world movement into persistent map progress
- Implemented authenticated user state so exploration data can be stored and restored across sessions
- Integrated Mapbox for interactive maps, geographic data, and location-based UI
- Used schema validation and typed API procedures to keep data consistent between the frontend and backend

## Local Development

Clone the repository:

```bash
git clone https://github.com/purplegummy/Strides.git
cd Strides
```

Install dependencies:

```bash
npm install
```

Create an environment file using the provided example:

```bash
cp .env.example .env
```

Configure the required environment variables, then initialize the database and run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## About

Strides was built as a team project exploring how everyday movement can be turned into a more interactive and rewarding experience. Instead of treating a map as something users simply view, the application is designed so that real-world exploration actively changes the user's experience.

The project involved work across geospatial interfaces, relational databases, authentication, API design, and persistent user state.
