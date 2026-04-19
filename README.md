# 🎓 Scholar SMS — Student Management System (Full Stack)

A modern full-stack **Student Management System** built using **Node.js, Express, MongoDB, and Vanilla JavaScript**.

This project allows users to **register, login, and manage student records** with secure authentication and a clean UI.

---

## 🚀 Features

### 🔐 Authentication

* User Registration
* User Login (JWT-based authentication)
* Single-page auth flow (`auth.html`)
* Protected routes (only logged-in users can access dashboard)

### 👨‍🎓 Student Management

* Add student
* View all students
* Update student details
* Delete student
* Search students by name
* Filter by grade
* Auto-grade calculation based on marks

### 📊 Dashboard

* Clean UI with glassmorphism design
* Real-time updates after CRUD operations

---

## 🛠️ Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JSON Web Tokens (JWT)

### Frontend

* HTML
* CSS
* Vanilla JavaScript (no frameworks)

---

## 📁 Project Structure

```
sms-fullstack/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── models/
│   │   ├── User.js
│   │   └── Student.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   └── .env.example
│
├── frontend/
│   ├── auth.html        ← Login + Register (single page)
│   ├── index.html       ← Dashboard
│   ├── style.css
│   ├── script.js
│   └── auth.js
│
├── screenshots/
├── README.md
└── .gitignore
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd sms-fullstack
```

---

### 2️⃣ Backend Setup

```
cd backend
npm install
```

---

### 3️⃣ Setup Environment Variables

Copy the example file:

```
cp .env.example .env
```

Update `.env`:

```
MONGO_URI=mongodb://127.0.0.1:27017/scholar_sms
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
PORT=5004
```

---

### 4️⃣ Start MongoDB

If installed locally:

```
mongod
```

OR (Homebrew users):

```
brew services start mongodb-community
```

---

### 5️⃣ Run Backend Server

```
node server.js
```

Server runs at:
👉 http://localhost:5004

---

### 6️⃣ Run Frontend

Open:

```
frontend/auth.html
```

in your browser

---

## 🔑 Default Usage Flow

1. Register a new user
2. Login with credentials
3. Access dashboard
4. Perform CRUD operations on students

---

## 🧠 Key Functional Highlights

### ✅ Auto Grade Calculation

Grades are automatically computed from marks:

* 90+ → O
* 75+ → A
* 60+ → B
* 45+ → C
* <45 → F

---

### 🔒 Protected Routes

All student routes require:

```
Authorization: Bearer <token>
```

---

## 📸 Screenshots

*Add screenshots here for better presentation*

---

## 🚫 Important Notes

* `.env` file is NOT included for security reasons
* Use `.env.example` as a template
* MongoDB must be running before starting backend

---

## 🚀 Future Improvements

* Role-based access (Admin/User)
* Pagination for student list
* Export data (CSV/PDF)
* Deployment (Render / Railway)

---

## 👨‍💻 Author

**Team**

---

## 📄 License

This project is for educational purposes.
