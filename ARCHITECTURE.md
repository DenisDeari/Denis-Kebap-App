# Project Architecture

## Overview
This is a comprehensive Next.js web application for "Denis Kebap", managing orders, locations, and menus. It is designed with a clear separation between the view layer (Frontend) and the data management layer.

## Structure

### Frontend (View Layer)
- **Framework**: Next.js 14+ (App Router).
- **Styling**: Tailwind CSS.
- **Components**: located in `/components`, built as functional React components.
- **Routing**: File-based routing in `/app` directory including Admin (`/app/admin`) and Customer facing pages.

### Data Layer ("Backend")
- **Abstraction**: The application uses a unified Data Access Object (DAO) pattern implemented in `/lib/storage.ts`.
- **Current Adapter**: The data layer is currently configured to use a **Local Persistence Adapter** (`localStorage`). This mimics a database by persisting state in the browser, allowing for offline-capable demos and zero-latency interactions.
- **API**: The `/app/api` directory is reserved for server-side endpoints when moving to a remote database.

### Key Logic Modules
- **Order Management**: `hooks/useOrders.ts` acts as the controller for order lifecycles.
- **Time/Slots**: `lib/timeSlots.ts` handles complex business logic for opening times and slot availability.
- **Types**: Shared TypeScript interfaces in `types/index.ts` ensure type safety across the stack.

## Note on "Backend"
While a remote server backend (Node/Postgres) is not currently connected, the `lib/storage.ts` module effectively serves as the backend logic, handling CRUD operations, data validation, and event dispatching. The application is architected to allow swapping this module for a real API client without refactoring the UI components.
