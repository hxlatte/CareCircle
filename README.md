# CareCircle - Elder Care Platform

CareCircle is a comprehensive, AI-powered platform designed to help families care for their elderly loved ones. It provides tools for medication management, daily task tracking, AI health assistance, and real-time communication between seniors and family members.

## 🌟 Key Features

- **Multi-lingual Support**: Full support for English, Telugu, Hindi, and Marathi.
- **Voice Features**: Voice-to-text input for tasks and messages, and voice spelling for medicine names.
- **AI Health Assistant**: Integrated Llama-3 AI to answer health queries and provide medicine guidance.
- **Medical History**: Secure storage and management of medical records and doctor visits.
- **Real-time Reminders**: Automated notifications for medicines and daily tasks.
- **Family Dashboard**: Dedicated interface for family members to monitor and manage care.

## 🚀 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB (Atlas or In-Memory)
- **AI**: Groq (Llama-3)
- **Voice**: Web Speech API

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account (or use the built-in in-memory fallback)
- Groq API Key (for the AI assistant)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/elder-care.git
cd elder-care
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder based on `.env.example`:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key
PORT=5000
```
Start the backend:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../my-app
npm install
```
Create a `.env` file in the `my-app` folder based on `.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
```
Start the frontend:
```bash
npm run dev
```

## 🌍 Language Support
To add or modify translations, edit the JSON files in `my-app/src/translations/`:
- `en.json` (English)
- `te.json` (Telugu)
- `hi.json` (Hindi)
- `mr.json` (Marathi)

## 📄 License
This project is licensed under the MIT License.
