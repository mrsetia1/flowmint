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