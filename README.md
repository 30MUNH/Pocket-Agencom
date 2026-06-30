# Pocket Agencom 🚀

Pocket Agencom is a modern, high-performance Monorepo containing a full-stack architecture with a React frontend and a Node.js/Express backend.

## 📂 Project Structure

```text
pocket-agencom/
├── backend/               # Node.js + Express.js API Server
│   ├── prisma/            # Database schema & migrations (Prisma ORM)
│   ├── src/               # Application source code (optional structure)
│   ├── .env.example       # Example database environment variables
│   ├── index.js           # Server entry point
│   └── package.json       # Backend dependencies
├── frontend/              # React + Vite Client
│   ├── src/               # Frontend components & state management
│   ├── index.html         # Frontend entry page
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── package.json       # Frontend dependencies
├── .gitignore             # Root gitignore rules
└── README.md              # Project documentation (this file)
```

---

## 🛠️ Tech Stack

### Frontend
- **React + Vite** – Fast, modern frontend development.
- **Tailwind CSS** – Utility-first CSS styling.
- **Zustand** – Light, fast, and intuitive state management.
- **React Router v6** – Declarative routing.
- **Lucide React** – Clean, modern UI icon pack.

### Backend
- **Node.js & Express.js** – Flexible REST API foundation.
- **Prisma ORM** – Type-safe database access with PostgreSQL.
- **PostgreSQL** – Reliable and robust relational database.

---

## 🚀 Getting Started

Follow these steps to configure and run the project locally.

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed, along with a running **PostgreSQL** database instance.

---

### 2. Backend Setup (`/backend`)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
   Create a `.env` file in the `backend/` folder based on `.env.example`:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/pocket_agencom?schema=public"
   PORT=5000
   ```
4. **Apply database schema and run migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```
5. **Start the development server**:
   ```bash
   npm run dev
   ```
   The backend will be running at `http://localhost:5000`.

---

### 3. Frontend Setup (`/frontend`)

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the Vite dev server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 📁 Monorepo Quick Commands

You can run both servers in development mode simultaneously from the root using tools like `concurrently` (optional):
```bash
# Install concurrently at the root (optional)
npm install -g concurrently

# Run both backend and frontend from root
concurrently "npm --prefix backend run dev" "npm --prefix frontend run dev"
```
