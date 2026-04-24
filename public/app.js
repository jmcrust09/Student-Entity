// USAR URL RELATIVA PARA QUE FUNCIONE TANTO LOCAL COMO EN RENDER
const API_URL = '/api';

// State
let currentUser = null;
let currentToken = null;
let currentClassId = null;
let currentAssignment = null;

// DOM Elements
const views = {
  login: document.getElementById('view-login'),
  register: document.getElementById('view-register'),
  dashboard: document.getElementById('view-dashboard'),
  class: document.getElementById('view-class')
};

const navbar = document.getElementById('navbar');
const navUserName = document.getElementById('nav-user-name');
const btnLogout = document.getElementById('btn-logout');

// Helper para fetch con token
async function fetchWithAuth(url, options = {}) {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${currentToken}`
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    logout();
    throw new Error('No autorizado');
  }
  return response;
}

// Initial Setup
function init() {
  const savedUser = localStorage.getItem('user');
  const savedToken = localStorage.getItem('token');
  if (savedUser && savedToken) {
    currentUser = JSON.parse(savedUser);
    currentToken = savedToken;
    showDashboard();
  } else {
    showView('login');
  }
}

// Navigation
function showView(viewName) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[viewName].classList.remove('hidden');
  
  if (viewName === 'login' || viewName === 'register') {
    navbar.classList.add('hidden');
  } else {
    navbar.classList.remove('hidden');
    navUserName.textContent = `${currentUser.name} (${currentUser.role})`;
  }
}

document.getElementById('link-to-register').addEventListener('click', (e) => {
  e.preventDefault();
  showView('register');
});

document.getElementById('link-to-login').addEventListener('click', (e) => {
  e.preventDefault();
  showView('login');
});

// Auth
document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password, role })
    });
    
    if (res.ok) {
      alert('Registro exitoso. Por favor inicia sesión.');
      showView('login');
    } else {
      const data = await res.json();
      alert(data.error || 'Error al registrarse');
    }
  } catch (error) {
    console.error('Register error:', error);
  }
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      currentToken = data.token;
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('token', currentToken);
      showDashboard();
    } else {
      alert('Credenciales inválidas');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
});

function logout() {
  currentUser = null;
  currentToken = null;
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  showView('login');
}

btnLogout.addEventListener('click', logout);

// Dashboard (Classes)
async function showDashboard() {
  showView('dashboard');
  
  const btnNewClass = document.getElementById('btn-new-class');
  const btnJoinClass = document.getElementById('btn-join-class');
  
  if (currentUser.role === 'profesor') {
    btnNewClass.classList.remove('hidden');
    btnJoinClass.classList.add('hidden');
  } else {
    btnNewClass.classList.add('hidden');
    btnJoinClass.classList.remove('hidden');
  }

  // Fetch classes
  try {
    const res = await fetchWithAuth(`${API_URL}/classes`);
    const classes = await res.json();
    
    const list = document.getElementById('classes-list');
    list.innerHTML = '';
    
    classes.forEach(cls => {
      const card = document.createElement('div');
      card.className = 'card';
      let codeHtml = '';
      if (currentUser.role === 'profesor' && cls.code) {
        codeHtml = `<div class="class-code">Código: <strong>${cls.code}</strong></div>`;
      }
      card.innerHTML = `
        <h3>${cls.name}</h3>
        <p>${cls.description}</p>
        ${codeHtml}
      `;
      card.addEventListener('click', () => showClass(cls));
      list.appendChild(card);
    });
  } catch (error) {
    console.error('Fetch classes error:', error);
  }
}

document.getElementById('btn-new-class').addEventListener('click', async () => {
  const name = prompt('Nombre de la clase:');
  const description = prompt('Descripción:');
  if (name && description) {
    await fetchWithAuth(`${API_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    showDashboard();
  }
});

document.getElementById('btn-join-class').addEventListener('click', async () => {
  const code = prompt('Ingresa el código de la clase:');
  if (code) {
    try {
      const res = await fetchWithAuth(`${API_URL}/classes/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        showDashboard();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al unirse a la clase');
      }
    } catch (e) {
      console.error(e);
    }
  }
});

// Class View
async function showClass(cls) {
  currentClassId = cls.id;
  showView('class');
  document.getElementById('class-title').textContent = cls.name;
  
  const btnNewAssignment = document.getElementById('btn-new-assignment');
  if (currentUser.role === 'profesor') {
    btnNewAssignment.classList.remove('hidden');
  } else {
    btnNewAssignment.classList.add('hidden');
  }

  loadAssignments();
  loadComments();
}

document.getElementById('btn-back-dashboard').addEventListener('click', () => {
  currentClassId = null;
  showDashboard();
});

// Assignments
async function loadAssignments() {
  const res = await fetchWithAuth(`${API_URL}/classes/${currentClassId}/contents`);
  const assignments = await res.json();
  
  const list = document.getElementById('assignments-list');
  list.innerHTML = '';
  
  assignments.forEach(a => {
    const item = document.createElement('div');
    item.className = 'assignment-card ' + (a.type || 'tarea');
    
    let icon = '📝';
    if (a.type === 'anuncio') icon = '📢';
    if (a.type === 'recurso') icon = '🔗';

    item.innerHTML = `
      <div class="assignment-card-content">
        <span class="assignment-icon">${icon}</span>
        <h4 class="assignment-title">${a.title}</h4>
      </div>
    `;
    item.addEventListener('click', () => openAssignmentModal(a));
    list.appendChild(item);
  });
}

document.getElementById('btn-new-assignment').addEventListener('click', async () => {
  const typeStr = prompt('Tipo (tarea, anuncio, recurso):', 'tarea');
  const title = prompt('Título:');
  const description = prompt('Descripción corta:');
  const content = prompt('Contenido extendido:');
  
  if (title) {
    await fetchWithAuth(`${API_URL}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: currentClassId, title, description, content, type: typeStr || 'tarea' })
    });
    loadAssignments();
  }
});

// Modal Logic
const modal = document.getElementById('assignment-modal');
const btnCloseModal = document.getElementById('btn-close-modal');

btnCloseModal.addEventListener('click', () => {
  modal.classList.add('hidden');
  currentAssignment = null;
});

async function openAssignmentModal(assignment) {
  currentAssignment = assignment;
  document.getElementById('modal-type-badge').textContent = (assignment.type || 'tarea').toUpperCase();
  document.getElementById('modal-title').textContent = assignment.title;
  document.getElementById('modal-description').textContent = assignment.description;
  document.getElementById('modal-content-area').innerHTML = `<p>${assignment.content || 'Sin contenido extra'}</p>`;
  
  const submissionSection = document.getElementById('submission-section');
  const teacherSection = document.getElementById('teacher-submissions-section');
  
  submissionSection.classList.add('hidden');
  teacherSection.classList.add('hidden');
  document.getElementById('submission-status').classList.add('hidden');
  document.getElementById('submission-content').value = '';

  if (assignment.type === 'tarea' || !assignment.type) {
    if (currentUser.role === 'alumno') {
      submissionSection.classList.remove('hidden');
      await loadStudentSubmission();
    } else {
      teacherSection.classList.remove('hidden');
      await loadTeacherSubmissions();
    }
  }
  
  modal.classList.remove('hidden');
}

async function loadStudentSubmission() {
  try {
    const res = await fetchWithAuth(`${API_URL}/assignments/${currentAssignment.id}/submissions`);
    const subs = await res.json();
    if (subs.length > 0) {
      const sub = subs[0];
      document.getElementById('submission-content').value = sub.content;
      const statusDiv = document.getElementById('submission-status');
      statusDiv.textContent = 'Entrega guardada: ' + new Date(sub.updated_at || sub.created_at).toLocaleString();
      statusDiv.classList.remove('hidden');
    }
  } catch(e) { console.error(e); }
}

async function loadTeacherSubmissions() {
  try {
    const res = await fetchWithAuth(`${API_URL}/assignments/${currentAssignment.id}/submissions`);
    const subs = await res.json();
    const list = document.getElementById('teacher-submissions-list');
    list.innerHTML = '';
    if (subs.length === 0) {
      list.innerHTML = '<p class="text-muted">Aún no hay entregas.</p>';
    } else {
      subs.forEach(s => {
        const div = document.createElement('div');
        div.className = 'submission-item';
        div.innerHTML = `
          <strong>Usuario ID: ${s.user_id}</strong>
          <p>${s.content}</p>
          <small>${new Date(s.updated_at || s.created_at).toLocaleString()}</small>
        `;
        list.appendChild(div);
      });
    }
  } catch(e) { console.error(e); }
}

document.getElementById('form-submit-assignment').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('submission-content').value;
  try {
    const res = await fetchWithAuth(`${API_URL}/assignments/${currentAssignment.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (res.ok) {
      await loadStudentSubmission();
      alert('Entrega enviada exitosamente');
    }
  } catch(e) { console.error(e); }
});

// Comments
async function loadComments() {
  const res = await fetchWithAuth(`${API_URL}/comments?target=${currentClassId}`);
  const comments = await res.json();
  
  const list = document.getElementById('comments-list');
  list.innerHTML = '';
  
  comments.forEach(c => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    const isAnonymous = c.author === 'Anónimo';
    item.innerHTML = `
      <div class="comment-author ${isAnonymous ? 'anonymous' : ''}">${c.author}</div>
      <div class="comment-text">${c.content}</div>
    `;
    list.appendChild(item);
  });
}

document.getElementById('form-comment').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('comment-content').value;
  const anonymous = document.getElementById('comment-anonymous').checked;

  await fetchWithAuth(`${API_URL}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      target_id: currentClassId, 
      target_type: 'class',
      content,
      anonymous
    })
  });

  document.getElementById('comment-content').value = '';
  document.getElementById('comment-anonymous').checked = false;
  loadComments();
});

// Start app
init();
