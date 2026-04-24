// USAR URL RELATIVA PARA QUE FUNCIONE TANTO LOCAL COMO EN RENDER
const API_URL = '/api';

// State
let currentUser = null;
let currentToken = null;
let currentClassId = null;

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
  
  // Show/hide create class button
  const btnNewClass = document.getElementById('btn-new-class');
  if (currentUser.role === 'profesor') {
    btnNewClass.classList.remove('hidden');
  } else {
    btnNewClass.classList.add('hidden');
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
      card.innerHTML = `
        <h3>${cls.name}</h3>
        <p>${cls.description}</p>
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
    item.className = 'list-item';
    item.innerHTML = `
      <h4>${a.title}</h4>
      <p style="color: var(--text-secondary); margin-top: 0.5rem; font-size: 0.9rem;">${a.description}</p>
    `;
    list.appendChild(item);
  });
}

document.getElementById('btn-new-assignment').addEventListener('click', async () => {
  const title = prompt('Título de la tarea:');
  const description = prompt('Descripción:');
  if (title) {
    await fetchWithAuth(`${API_URL}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: currentClassId, title, description })
    });
    loadAssignments();
  }
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
