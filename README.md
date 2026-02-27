# Modern Blog Web Application

A full-stack, production-ready blog platform built with Node.js, Express, and Supabase.

## 🚀 Features
- 🔐 **Supabase Auth**: Secure Login, Register, and Session management.
- 👤 **Profiles**: Automatic profile creation for users.
- 📝 **CRUD Operations**: Create, Read, Update, and Delete blogs.
- 📱 **Responsive Design**: Modern UI that works on all devices.
- 🛠 **Protected Routes**: Dashboard and blog creation secured by JWT.

## 🛠 Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (SPA architecture).
- **Backend**: Node.js, Express.js.
- **Database**: Supabase (PostgreSQL).
- **Authentication**: Supabase Auth.

## 📋 Setup Instructions

### 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com/).
2. Go to the **SQL Editor** and run the queries provided in `schema.sql` to create the `profiles` and `blogs` tables.
3. Go to **Project Settings > API** and get your `URL`, `anon public` key, and `service_role` key.

### 2. Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=development
```

### 3. Installation
```bash
npm install
```

### 4. Running the App
```bash
# Run in development mode (with nodemon)
npm run dev

# Run in production mode
npm start
```

## 👤 Default User (Automatic Seed)
The application will automatically attempt to seed a default user on startup if the `SUPABASE_SERVICE_ROLE_KEY` is provided.
- **Email**: dungriyalgaurav08@gmail.com
- **Password**: kg867gjnki

## 📁 Project Structure
- `/server`: Express.js backend logic.
- `/public`: Frontend assets (HTML, CSS, JS).
- `schema.sql`: Database schema.
- `.env.example`: Template for environment variables.
