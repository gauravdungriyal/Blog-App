# ⚡ BuzzByte - Modern Blog Web Application

BuzzByte is a full-stack, production-ready blog platform designed for speed, security, and a seamless user experience. Built with a modern tech stack, it allows users to share their stories with the world effortlessly.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg?style=for-the-badge)](https://buzzbyte.onrender.com/)

## 🚀 Features

- 🔐 **Secure Authentication**: Powerd by Supabase Auth with secure Login, Register, and Session management.
- 👤 **Dynamic Profiles**: Automatic profile creation and management for every user.
- 📝 **Full CRUD Operations**: Create, Read, Update, and Delete blogs with ease.
- 🔔 **Real-time Notifications**: Stay updated with user interactions.
- 🔍 **Global Search**: Find stories or users across the platform instantly.
- 📱 **Responsive Design**: A premium, mobile-first UI that looks stunning on all devices.
- 🛠 **Protected Routes**: Secure dashboard and blog management powered by JWT.

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (SPA Architecture)
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

## 📋 Getting Started

### 1. Prerequisites
- Node.js (v14 or higher)
- Supabase Account

### 2. Supabase Setup
1. Create a project on [Supabase](https://supabase.com/).
2. Run the queries in `schema.sql` using the Supabase SQL Editor to set up `profiles` and `blogs` tables.
3. Obtain your `URL`, `anon public` key, and `service_role` key from **Project Settings > API**.

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=development
```

### 4. Installation & Deployment
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Start production server
npm start
```

## 🔐 Default Test Credentials
The app automatically seeds a test user for quick evaluation:
- **Email**: `dungriyalgaurav08@gmail.com`
- **Password**: `kg867gjnki`

## 📁 Project Structure
- `/server`: Backend API logic, routes, and controllers.
- `/public`: Frontend assets, including shared JS modules and page-specific logic.
- `schema.sql`: Database initialization scripts.

---
Built with ❤️ by the BuzzByte Team.
