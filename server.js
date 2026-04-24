const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
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
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function initData() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const defaultUsers = {
    users: [
      { id: 'u_prof', username: 'jmcr2009', password: '$2b$10$3fs1nMZOOGzVi0tsdKuafO4MimDlnpiGApX3gyhlU0BV964042KpS', role: 'profesor', name: 'Juan Manuel Cruz' },
      { id: 'u_alum', username: 'Max :D', password: '$2b$10$.gQEuwXLU/4LeU8qyn9ojOa/X1GKCh1Yi.VxEn5rqVZDrtIQSRI7S', role: 'alumno', name: 'Maximo Rodrigo Carrillo' }
    ]
  };
  
  const defaultClasses = {
    classes: [
      { id: 'c_tc26a', name: 'Tecnología y Computación 26A', description: 'Clase de tecnología y computación', owner_id: 'u_prof', created_at: new Date().toISOString(), archived: false, code: 'TECH26' },
      { id: 'c_mat26a', name: 'Matemática 26A', description: 'Clase de matemática', owner_id: 'u_prof', created_at: new Date().toISOString(), archived: false, code: 'MATH26' }
    ]
  };

  const defaultEnrollments = {
    enrollments: [
      { class_id: 'c_tc26a', user_id: 'u_alum' },
      { class_id: 'c_mat26a', user_id: 'u_alum' }
    ]
  };

  const defaultAssignments = {
    assignments: [
      { id: 'a_tc1', class_id: 'c_tc26a', type: 'tarea', title: 'Ensayo sobre IA', description: 'Escribir un ensayo sobre Inteligencia Artificial. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', due_date: '2026-05-01', content: 'Debes investigar sobre redes neuronales y escribir al menos 2 páginas.' },
      { id: 'a_tc2', class_id: 'c_tc26a', type: 'tarea', title: 'Proyecto de Programación', description: 'Crear una calculadora en JS. Lorem ipsum dolor sit amet.', due_date: '2026-05-10', content: 'La calculadora debe soportar suma, resta, multiplicación y división.' },
      { id: 'a_tc3', class_id: 'c_tc26a', type: 'anuncio', title: 'Bienvenidos al curso', description: 'Lorem ipsum dolor sit amet, bienvenidos al curso de tecnología.', content: 'Nos vemos los martes y jueves.' },
      { id: 'a_tc4', class_id: 'c_tc26a', type: 'recurso', title: 'Documentación de JS', description: 'Enlace útil para programar.', content: 'https://developer.mozilla.org/es/docs/Web/JavaScript' },
      { id: 'a_mat1', class_id: 'c_mat26a', type: 'tarea', title: 'Guía de Ejercicios 1', description: 'Resolver ecuaciones de primer grado.', due_date: '2026-05-05', content: 'Lorem ipsum dolor sit amet, resolver 10 ejercicios.' },
      { id: 'a_mat2', class_id: 'c_mat26a', type: 'tarea', title: 'Guía de Ejercicios 2', description: 'Geometría básica.', due_date: '2026-05-15', content: 'Resolver problemas de áreas y perímetros.' },
      { id: 'a_mat3', class_id: 'c_mat26a', type: 'anuncio', title: 'Examen sorpresa', description: 'No falten la próxima semana.', content: 'Habrá examen sorpresa, estudien todo.' },
      { id: 'a_mat4', class_id: 'c_mat26a', type: 'recurso', title: 'Libro de Baldor', description: 'Referencia para álgebra.', content: 'Estudien del capítulo 1 al 5.' }
    ]
  };

  const defaultComments = {
    comments: [
      { id: 'com1', target_type: 'class', target_id: 'c_tc26a', author_id: 'u_alum', anonymous: false, content: '¡Qué buen curso!', created_at: new Date().toISOString() },
      { id: 'com2', target_type: 'class', target_id: 'c_tc26a', author_id: 'u_alum', anonymous: true, content: 'Tengo una duda con el ensayo', created_at: new Date().toISOString() },
      { id: 'com3', target_type: 'class', target_id: 'c_mat26a', author_id: 'u_prof', anonymous: false, content: 'Recuerden estudiar para el examen.', created_at: new Date().toISOString() },
      { id: 'com4', target_type: 'class', target_id: 'c_mat26a', author_id: 'u_alum', anonymous: true, content: 'Profe, ¿el examen es difícil?', created_at: new Date().toISOString() }
    ]
  };

  const defaultSubmissions = {
    submissions: []
  };

  if (!fs.existsSync(path.join(DATA_DIR, 'users.json'))) writeJson('users.json', defaultUsers);
  if (!fs.existsSync(path.join(DATA_DIR, 'classes.json'))) writeJson('classes.json', defaultClasses);
  if (!fs.existsSync(path.join(DATA_DIR, 'enrollments.json'))) writeJson('enrollments.json', defaultEnrollments);
  if (!fs.existsSync(path.join(DATA_DIR, 'assignments.json'))) writeJson('assignments.json', defaultAssignments);
  if (!fs.existsSync(path.join(DATA_DIR, 'comments.json'))) writeJson('comments.json', defaultComments);
  if (!fs.existsSync(path.join(DATA_DIR, 'submissions.json'))) writeJson('submissions.json', defaultSubmissions);
}

initData();

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
  const enrollmentsData = readJson('enrollments.json') || { enrollments: [] };
  
  if (req.user.role === 'profesor') {
    const teacherClasses = data.classes.filter(c => c.owner_id === req.user.id);
    res.json(teacherClasses);
  } else {
    const userEnrollments = enrollmentsData.enrollments.filter(e => e.user_id === req.user.id);
    const enrolledClassIds = userEnrollments.map(e => e.class_id);
    const studentClasses = data.classes.filter(c => enrolledClassIds.includes(c.id));
    
    // Ocultar código para alumnos
    const safeClasses = studentClasses.map(c => {
      const { code, ...rest } = c;
      return rest;
    });
    res.json(safeClasses);
  }
});

app.post('/api/classes', verifyToken, (req, res) => {
  if (req.user.role !== 'profesor') return res.status(403).json({ error: 'Solo profesores pueden crear clases' });
  
  const { name, description } = req.body;
  const data = readJson('classes.json') || { classes: [] };
  
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const newClass = {
    id: 'c' + Date.now(),
    name,
    description,
    owner_id: req.user.id,
    created_at: new Date().toISOString(),
    archived: false,
    code
  };
  
  data.classes.push(newClass);
  writeJson('classes.json', data);
  res.status(201).json(newClass);
});

app.post('/api/classes/join', verifyToken, (req, res) => {
  if (req.user.role !== 'alumno') return res.status(403).json({ error: 'Solo alumnos pueden unirse a clases' });
  
  const { code } = req.body;
  const classesData = readJson('classes.json') || { classes: [] };
  const enrollmentsData = readJson('enrollments.json') || { enrollments: [] };
  
  const foundClass = classesData.classes.find(c => c.code === code);
  if (!foundClass) return res.status(404).json({ error: 'Código de clase inválido' });
  
  const alreadyEnrolled = enrollmentsData.enrollments.find(e => e.class_id === foundClass.id && e.user_id === req.user.id);
  if (alreadyEnrolled) return res.status(400).json({ error: 'Ya estás inscrito en esta clase' });
  
  enrollmentsData.enrollments.push({
    class_id: foundClass.id,
    user_id: req.user.id
  });
  
  writeJson('enrollments.json', enrollmentsData);
  const { code: _c, ...safeClass } = foundClass;
  res.json({ message: 'Inscrito exitosamente', class: safeClass });
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

  const { class_id, title, description, due_date, type, content } = req.body;
  const data = readJson('assignments.json') || { assignments: [] };
  
  const newAssignment = {
    id: 'a' + Date.now(),
    class_id,
    title,
    description,
    type: type || 'tarea',
    content: content || '',
    due_date: due_date || null,
    blocked: false
  };
  
  data.assignments.push(newAssignment);
  writeJson('assignments.json', data);
  res.status(201).json(newAssignment);
});

// Entregas (Submissions)
app.post('/api/assignments/:id/submit', verifyToken, (req, res) => {
  if (req.user.role !== 'alumno') return res.status(403).json({ error: 'Solo alumnos pueden enviar tareas' });
  
  const assignmentId = req.params.id;
  const { content } = req.body;
  const data = readJson('submissions.json') || { submissions: [] };
  
  let submission = data.submissions.find(s => s.assignment_id === assignmentId && s.user_id === req.user.id);
  
  if (submission) {
    submission.content = content;
    submission.updated_at = new Date().toISOString();
  } else {
    submission = {
      id: 'sub' + Date.now(),
      assignment_id: assignmentId,
      user_id: req.user.id,
      content,
      created_at: new Date().toISOString()
    };
    data.submissions.push(submission);
  }
  
  writeJson('submissions.json', data);
  res.json(submission);
});

app.get('/api/assignments/:id/submissions', verifyToken, (req, res) => {
  const assignmentId = req.params.id;
  const data = readJson('submissions.json') || { submissions: [] };
  
  if (req.user.role === 'profesor') {
    const subs = data.submissions.filter(s => s.assignment_id === assignmentId);
    res.json(subs);
  } else {
    const sub = data.submissions.find(s => s.assignment_id === assignmentId && s.user_id === req.user.id);
    res.json(sub ? [sub] : []);
  }
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
