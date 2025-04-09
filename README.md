# FlowMint - Fresh Content, Seamless Control

**FlowMint** adalah Content Management System (CMS) sederhana namun powerful untuk company portal dengan fitur blogging. Proyek ini mencakup backend berbasis Node.js, frontend dengan React dan Shadcn UI, serta Docker untuk deployment yang mudah. Dirancang untuk mengelola informasi perusahaan (profil, layanan, tim) dan konten blog (artikel, kategori) dengan alur kerja yang lancar dan kontrol penuh.

---

## ✨ Features

### 🏢 Company Portal
- Kelola profil perusahaan (nama, visi, misi, logo)
- Daftar layanan perusahaan dengan deskripsi dan ikon
- Informasi tim (nama, posisi, bio, foto)

### ✍️ Blogging
- CRUD artikel (judul, konten, tanggal publikasi, kategori, gambar)
- Kategori artikel untuk organisasi konten

### 🔐 Authentication
- Registrasi dan login user dengan JWT
- Role-based access: 
  - **Admin**: full control
  - **Editor**: edit konten

### 📁 File Upload
- Dukungan upload gambar untuk artikel, tim, dll.

### 🔌 API
- RESTful endpoints untuk komunikasi frontend-backend

### 🖥️ Frontend
- UI responsif dengan komponen Shadcn UI (Card, Table, dll.)

---

## 🛠 Tech Stack

### Backend
- Node.js  
- Express.js  
- Prisma (ORM)  
- PostgreSQL  

### Frontend
- React  
- Tailwind CSS  
- Shadcn UI  

### Deployment
- Docker  
- Docker Compose  

---

## 📦 Prerequisites

Sebelum mulai, pastikan kamu punya:
- Node.js v16 atau lebih baru (disarankan v18 untuk performa optimal)  
- npm (biasanya terinstall bareng Node.js)  
- Docker dan Docker Compose  
- PostgreSQL (lokal atau hosted, misalnya Supabase atau Neon)  
- Git untuk clone repository  
- Text editor (VS Code recommended)

---

## 📁 Project Structure

flowmint/
├── backend/                # Backend source code
│   ├── prisma/             # Prisma schema dan migrasi
│   ├── uploads/            # Folder untuk file upload
│   ├── index.js            # Entry point backend
│   ├── package.json        # Dependencies backend
│   ├── .env                # Environment variables
│   └── Dockerfile          # Docker config untuk backend
├── frontend/               # Frontend source code
│   ├── src/                # React source files
│   ├── public/             # Static assets
│   ├── package.json        # Dependencies frontend
│   └── Dockerfile          # Docker config untuk frontend
├── docker-compose.yml      # Docker Compose configuration
└── README.md               # Dokumentasi proyek

## Installation
1. Clone Repository
bash

git clone https://github.com/mrsetia1/flowmint.git
cd flowmint

2. Backend Setup
Masuk ke folder backend:
bash
cd backend

## Install dependencies:
bash

npm install express prisma @prisma/client dotenv jsonwebtoken bcryptjs multer
npm install -D nodemon

Buat file .env di backend/:

DATABASE_URL="postgresql://user:password@localhost:5432/flowmint?schema=public"
PORT=5000
JWT_SECRET="your_random_secret_key_here"  # Ganti dengan string unik

## Setup Prisma:
Inisialisasi Prisma:
bash

npx prisma init

Edit prisma/schema.prisma:


datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model CompanyProfile {
  id        Int      @id @default(autoincrement())
  name      String
  vision    String
  mission   String
  logo      String?
}

model Service {
  id          Int      @id @default(autoincrement())
  title       String
  description String
  icon        String?
}

model Team {
  id       Int      @id @default(autoincrement())
  name     String
  position String
  bio      String?
  photo    String?
}

model Category {
  id       Int      @id @default(autoincrement())
  name     String
  articles Article[]
}

model Article {
  id          Int      @id @default(autoincrement())
  title       String
  content     String
  publishedAt DateTime @default(now())
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  Int
  image       String?
}

model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  password String
  role     String   // "admin" atau "editor"
}

## Migrasi database:
bash

npx prisma migrate dev --name init

Buat index.js di backend/:
javascript

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// Middleware autentikasi
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Register
app.post('/api/register', async (req, res) => {
  const { email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, role: role || 'editor' },
  });
  res.json({ message: 'User registered', user: { id: user.id, email: user.email, role: user.role } });
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// CRUD Articles
app.get('/api/articles', async (req, res) => {
  const articles = await prisma.article.findMany({ include: { category: true } });
  res.json(articles);
});

app.post('/api/articles', authMiddleware, async (req, res) => {
  const { title, content, categoryId, image } = req.body;
  const article = await prisma.article.create({
    data: { title, content, categoryId: parseInt(categoryId), image },
  });
  res.json(article);
});

// Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

Update package.json:
json

"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}

Jalankan:
bash

npm run dev

## FRONTEND
3. Frontend Setup
Masuk ke folder frontend:
bash

cd frontend

Buat proyek React:
bash

npx create-react-app .

Install dependencies tambahan:
bash

npm install axios tailwindcss postcss autoprefixer

Setup Tailwind:
Init Tailwind:
bash

npx tailwindcss init -p

Edit tailwind.config.js:
javascript

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};

Edit src/index.css:
css

@tailwind base;
@tailwind components;
@tailwind utilities;

Contoh komponen di src/App.js:
jsx

import axios from 'axios';
import { useEffect, useState } from 'react';

function App() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/articles')
      .then(res => setArticles(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">FlowMint - Fresh Content, Seamless Control</h1>
      <div className="grid gap-4">
        {articles.map(article => (
          <div key={article.id} className="p-4 border rounded shadow">
            <h2 className="text-xl font-semibold">{article.title}</h2>
            <p>{article.content}</p>
            <span className="text-sm text-gray-500">{article.category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;


Jalankan:
bash


npm start

## DOCKER
4. Docker Setup
Buat backend/Dockerfile:
dockerfile


FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

Buat frontend/Dockerfile:
dockerfile

FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]

Buat docker-compose.yml di root:
yaml

version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: flowmint
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: "postgresql://user:password@db:5432/flowmint?schema=public"
      PORT: 5000
      JWT_SECRET: "your_random_secret_key_here"
    ports:
      - "5000:5000"
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:

  Jalankan:
bash

docker-compose up --build

## API Endpoints
Authentication
POST /api/register  
Body: { "email": "user@example.com", "password": "pass123", "role": "admin" }  

Response: { "message": "User registered", "user": { "id": 1, "email": "...", "role": "..." } }

POST /api/login  
Body: { "email": "user@example.com", "password": "pass123" }  

Response: { "token": "jwt_token_here" }

Articles
GET /api/articles - Ambil semua artikel  
Response: [{ "id": 1, "title": "...", "content": "...", "category": { "name": "..." } }]

POST /api/articles - Buat artikel (protected)  
Headers: Authorization: Bearer <token>  

Body: { "title": "New Article", "content": "Content here", "categoryId": 1, "image": "/uploads/..." }

PUT /api/articles/:id - Update artikel (protected)  

DELETE /api/articles/:id - Hapus artikel (protected)

Upload
POST /api/upload - Upload file  
Form-data: file (gambar/file)  

Response: { "filePath": "/uploads/filename" }

Usage Example
Register admin:

bash

curl -X POST http://localhost:5000/api/register -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123","role":"admin"}'

Login:
bash

curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123"}'
Buat artikel:
bash

curl -X POST http://localhost:5000/api/articles -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"title":"First Post","content":"Hello world","categoryId":1,"image":"/uploads/example.jpg"}'
Buka http://localhost:3000 untuk lihat artikel di frontend.

## Troubleshooting
Database Connection Error: Pastikan PostgreSQL jalan dan DATABASE_URL di .env benar.  

CORS Issue: Tambah cors di backend (npm install cors, app.use(cors())).  

Docker Fails: Cek log (docker-compose logs) dan pastikan port 5432, 5000, 3000 nggak bentrok.

## Contributing
Fork repository ini.  

Buat branch baru: git checkout -b feature/nama-fitur.  

Commit perubahan: git commit -m "Add nama-fitur".  

Push ke branch: git push origin feature/nama-fitur.  

Buat Pull Request di GitHub.

## License
Licensed under the MIT License (LICENSE).

