# Build and Beyond

Build and Beyond is a comprehensive web platform that connects customers with construction companies and specialized workers (Architects and Interior Designers). It supports tendering, bidding, worker hiring, secure chat, and project management with real-time updates.

## 🚀 Features

- **Customer Tendering**: Customers can post construction projects and design requests
- **Company Bidding**: Construction companies can bid on projects
- **Worker Hiring**: Direct hiring of Architects and Interior Designers
- **Secure Chat**: Real-time messaging between users after deals are accepted
- **Project Management**: Project updates with milestone tracking and photo uploads
- **Admin Dashboard**: Complete user and project moderation system
- **Reviews & Ratings**: Users can review and rate services

## 🛠️ Technology Stack

- **Database**: MongoDB
- **Backend**: Node.js, Express.js, Socket.io
- **Frontend**: React, Vite, Redux Toolkit
- **Authentication**: JWT
- **File Upload**: Multer

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16+ recommended)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)
- **nodemon** (optional, for backend development)

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kadiamyeshwanth/FDFED-React-App.git
cd FDFED-React-App
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 3. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

## 🚀 Running the Application

### Running the Backend

From the `backend/` directory:

**Option 1: Using nodemon (recommended for development)**
```bash
nodemon app.js
```

**Option 2: Using node**
```bash
node app.js
```

The backend server will start on `http://localhost:4000`

### Running the Frontend

From the `frontend/` directory:

```bash
npm run dev
```

The frontend development server will start on `http://localhost:5173`

Open your browser and navigate to `http://localhost:5173` to view the application.

## 🏗️ Building for Production

### Frontend Production Build

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `frontend/dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

## 📁 Project Structure

```
FDFED-React-App/
├── backend/
│   ├── app.js                 # Main application entry point
│   ├── config/                # Configuration files (DB, constants)
│   ├── controllers/           # Route controllers
│   ├── middlewares/           # Authentication & upload middlewares
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   └── utils/                 # Helper utilities
│
└── frontend/
    ├── src/
    │   ├── components/        # Reusable components
    │   ├── context/           # React context providers
    │   ├── Pages/             # Page components (Admin, Customer, Company, Worker)
    │   └── store/             # Redux store and slices
    ├── index.html
    └── vite.config.js
```

## 🔑 User Roles

The platform supports four user roles:

1. **Admin**: Platform moderation and oversight
2. **Customer**: Post projects and hire workers
3. **Company**: Bid on construction projects
4. **Worker**: Apply for jobs (Architects/Interior Designers)

## 🌐 API Endpoints

The backend provides RESTful API endpoints for:
- Authentication (`/api/auth`)
- Customer operations (`/api/customer`)
- Company operations (`/api/company`)
- Worker operations (`/api/worker`)
- Admin operations (`/api/admin`)
- Chat functionality (`/api/chat`)
- Reviews and ratings (`/api/reviews`)

## 🔧 Configuration

### Frontend API Configuration

Update the API base URL in the frontend if needed. The default configuration connects to `http://localhost:4000`.

### Database Migration

If you have existing data, run the migration script for milestone fields:

```bash
cd backend
node migrations/addMilestoneFields.js
```

## ⚠️ Important Notes

- Ensure MongoDB is running before starting the backend server
- Make sure both backend and frontend are running simultaneously for full functionality
- The chat feature requires Socket.io connection between frontend and backend
- File uploads require proper Cloudinary configuration in the backend `.env` file

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Team

- **Lead**: Krishnakumar S — smkrishnakumar1506@gmail.com
- **Member**: Sai Manideep Putchanutala — isaimanideep.p@gmail.com
- **Member**: K Prudhvi Sai Ram — prudhvi16321@gmail.com
- **Member**: Yeshwanth K — kadiamyeshwanth@gmail.com
- **Member**: Polu Avinash Reddy — avinashreddypolu27@gmail.com

## 📝 License

This project is open source and available for educational purposes.

---

**Happy Building! 🏗️**
