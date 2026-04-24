const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const JWT_SECRET = 'educative-platform-secret-2026';

// Utilidades para leer y escribir JSON
function readJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const rawData = fs.readFileSync(filePath);
  return JSON.parse(rawData);
}

function writeJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Middleware de autenticación
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.user = decoded; // { id, role, username, name }
    next();
  });
}

// =======================
// ENDPOINTS
// =======================

// 1. Registro
app.post('/api/register', async (req, res) => {
  const { username, password, name, role } = req.body;
  const data = readJson('users.json') || { users: [] };
  
  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: 'u' + Date.now(),
      username,
      password: hashedPassword,
      role: role === 'profesor' ? 'profesor' : 'alumno',
      name
    };
    
    data.users.push(newUser);
    writeJson('users.json', data);
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const data = readJson('users.json');
  
  if (!data || !data.users) return res.status(500).json({ error: 'Data error' });

  const user = data.users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  let isMatch = false;
  try {
     isMatch = await bcrypt.compare(password, user.password);
  } catch(e) {
     isMatch = (password === user.password);
  }

  if (isMatch) {
    const tokenPayload = { id: user.id, username: user.username, role: user.role, name: user.name };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: tokenPayload });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// 3. Clases
app.get('/api/classes', verifyToken, (req, res) => {
  const data = readJson('classes.json') || { classes: [] };
  res.json(data.classes || []);
});

app.post('/api/classes', verifyToken, (req, res) => {
  if (req.user.role !== 'profesor') return res.status(403).json({ error: 'Solo profesores pueden crear clases' });
  
  const { name, description } = req.body;
  const data = readJson('classes.json') || { classes: [] };
  
  const newClass = {
    id: 'c' + Date.now(),
    name,
    description,
    owner_id: req.user.id,
    created_at: new Date().toISOString(),
    archived: false
  };
  
  data.classes.push(newClass);
  writeJson('classes.json', data);
  res.status(201).json(newClass);
});

// 4. Tareas (Assignments)
app.get('/api/classes/:id/contents', verifyToken, (req, res) => {
  const classId = req.params.id;
  const data = readJson('assignments.json') || { assignments: [] };
  
  const classAssignments = data.assignments.filter(a => a.class_id === classId);
  res.json(classAssignments);
});

app.post('/api/assignments', verifyToken, (req, res) => {
  if (req.user.role !== 'profesor') return res.status(403).json({ error: 'Solo profesores pueden crear tareas' });

  const { class_id, title, description, due_date } = req.body;
  const data = readJson('assignments.json') || { assignments: [] };
  
  const newAssignment = {
    id: 'a' + Date.now(),
    class_id,
    title,
    description,
    due_date: due_date || null,
    blocked: false
  };
  
  data.assignments.push(newAssignment);
  writeJson('assignments.json', data);
  res.status(201).json(newAssignment);
});

// 5. Comentarios
app.get('/api/comments', verifyToken, (req, res) => {
  const targetId = req.query.target;
  if (!targetId) return res.status(400).json({ error: 'target query param required' });

  const commentsData = readJson('comments.json') || { comments: [] };
  const usersData = readJson('users.json') || { users: [] };
  
  const targetComments = commentsData.comments.filter(c => c.target_id === targetId);
  
  const processedComments = targetComments.map(c => {
    if (c.anonymous) {
      return {
        id: c.id,
        author: "Anónimo",
        content: c.content,
        created_at: c.created_at
      };
    } else {
      const authorUser = usersData.users.find(u => u.id === c.author_id);
      return {
        id: c.id,
        author: authorUser ? authorUser.name : "Usuario Desconocido",
        content: c.content,
        created_at: c.created_at
      };
    }
  });

  res.json(processedComments);
});

app.post('/api/comments', verifyToken, (req, res) => {
  const { target_id, target_type, content, anonymous } = req.body;
  const data = readJson('comments.json') || { comments: [] };
  
  const newComment = {
    id: 'com' + Date.now(),
    target_type,
    target_id,
    author_id: req.user.id,
    anonymous: !!anonymous,
    content,
    created_at: new Date().toISOString()
  };
  
  data.comments.push(newComment);
  writeJson('comments.json', data);
  res.status(201).json(newComment);
});

// INICIO DEL SERVIDOR - ADAPTADO PARA RENDER Y SERVIDORES EN LA NUBE
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
