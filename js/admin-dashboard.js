const storage = firebase.storage ? firebase.storage() : null;

const whoami = document.getElementById('whoami');
const logoutBtn = document.getElementById('logoutBtn');

/* ---------- Tab switching ---------- */
document.querySelectorAll('.dash-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.panel).classList.add('active');
  });
});

/* ---------- Auth guard ---------- */
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = '../login.html';
    return;
  }
  try {
    const profile = await db.collection('users').doc(user.uid).get();
    const username = profile.data()?.username;
    whoami.textContent = username
      ? `logged in as @${username}`
      : `logged in as ${user.email}`;
  } catch {
    whoami.textContent = `logged in as ${user.email}`;
  }
  loadAdminProjects();
  loadSkillCategories();
  loadCertifications();
});

logoutBtn.addEventListener('click', () => auth.signOut());

/* =========================================================
   PROJECTS
========================================================= */
const form = document.getElementById('projectForm');
const dashStatus = document.getElementById('dashStatus');
const saveBtn = document.getElementById('saveBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');
const imgPreview = document.getElementById('imgPreview');
const adminList = document.getElementById('adminList');

const editId = document.getElementById('editId');
const pTitle = document.getElementById('pTitle');
const pDescription = document.getElementById('pDescription');
const pTech = document.getElementById('pTech');
const pGithub = document.getElementById('pGithub');
const pLive = document.getElementById('pLive');
const pImageFile = document.getElementById('pImageFile');

let currentImageUrl = '';

pImageFile.addEventListener('change', () => {
  const file = pImageFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    imgPreview.src = e.target.result;
    imgPreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';
  setStatus(dashStatus, '');

  try {
    let imageUrl = currentImageUrl;
    const file = pImageFile.files[0];

    if (file) {
      if (!storage) throw new Error('Firebase Storage script not loaded.');
      const path = `project-images/${Date.now()}-${file.name}`;
      const ref = storage.ref().child(path);
      await ref.put(file);
      imageUrl = await ref.getDownloadURL();
    }

    const data = {
      title: pTitle.value.trim(),
      description: pDescription.value.trim(),
      techStack: pTech.value.split(',').map(t => t.trim()).filter(Boolean),
      githubUrl: pGithub.value.trim(),
      liveUrl: pLive.value.trim(),
      imageUrl: imageUrl || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (editId.value) {
      await db.collection('projects').doc(editId.value).update(data);
      setStatus(dashStatus, 'Project updated.', false);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('projects').add(data);
      setStatus(dashStatus, 'Project added.', false);
    }

    resetProjectForm();
    loadAdminProjects();
  } catch (err) {
    console.error(err);
    setStatus(dashStatus, err.message || 'Something went wrong saving that project.', true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save project';
  }
});

cancelEditBtn.addEventListener('click', resetProjectForm);

function resetProjectForm() {
  form.reset();
  editId.value = '';
  currentImageUrl = '';
  imgPreview.style.display = 'none';
  formTitle.textContent = 'Add a project';
  cancelEditBtn.hidden = true;
}

function loadAdminProjects() {
  db.collection('projects').orderBy('createdAt', 'desc').get()
    .then(snapshot => {
      adminList.innerHTML = '';
      if (snapshot.empty) {
        adminList.innerHTML = '<p class="projects-empty">No projects yet — add your first one.</p>';
        return;
      }
      snapshot.forEach(doc => {
        const p = doc.data();
        const row = document.createElement('div');
        row.className = 'admin-row';
        row.innerHTML = `
          <div class="thumb">${p.imageUrl ? `<img src="${p.imageUrl}" alt="">` : ''}</div>
          <div class="meta">
            <h3>${escapeHtml(p.title || 'Untitled')}</h3>
            <p>${escapeHtml((p.techStack || []).join(', '))}</p>
          </div>
          <div class="row-actions">
            <button data-action="edit">Edit</button>
            <button data-action="delete" class="danger">Delete</button>
          </div>
        `;
        row.querySelector('[data-action="edit"]').addEventListener('click', () => fillFormForEdit(doc.id, p));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProject(doc.id));
        adminList.appendChild(row);
      });
    })
    .catch(err => {
      console.error(err);
      adminList.innerHTML = '<p class="projects-empty">Could not load projects.</p>';
    });
}

function fillFormForEdit(id, p) {
  editId.value = id;
  pTitle.value = p.title || '';
  pDescription.value = p.description || '';
  pTech.value = (p.techStack || []).join(', ');
  pGithub.value = p.githubUrl || '';
  pLive.value = p.liveUrl || '';
  currentImageUrl = p.imageUrl || '';
  if (currentImageUrl) {
    imgPreview.src = currentImageUrl;
    imgPreview.style.display = 'block';
  } else {
    imgPreview.style.display = 'none';
  }
  formTitle.textContent = 'Edit project';
  cancelEditBtn.hidden = false;
  document.querySelector('[data-panel="projects"]').click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProject(id) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  db.collection('projects').doc(id).delete()
    .then(() => loadAdminProjects())
    .catch(err => alert('Could not delete: ' + err.message));
}

/* =========================================================
   SKILLS
========================================================= */
const skillForm = document.getElementById('skillForm');
const skillStatus = document.getElementById('skillStatus');
const saveSkillBtn = document.getElementById('saveSkillBtn');
const cancelSkillEditBtn = document.getElementById('cancelSkillEditBtn');
const skillFormTitle = document.getElementById('skillFormTitle');
const skillList = document.getElementById('skillList');
const seedSkillsBtn = document.getElementById('seedSkillsBtn');

const skillEditId = document.getElementById('skillEditId');
const skillTitle = document.getElementById('skillTitle');
const skillItems = document.getElementById('skillItems');
const skillOrder = document.getElementById('skillOrder');

const DEFAULT_SKILLS = [
  { title: 'Backend', items: ['Java (core focus)', 'Spring Boot', 'JPA / Hibernate', 'REST API design', 'Python / Flask'], order: 0 },
  { title: 'Frontend', items: ['JavaScript / TypeScript', 'React / Vite', 'HTML5 & CSS3', 'Responsive UI'], order: 1 },
  { title: 'Data & Infra', items: ['MySQL', 'Firebase / Firestore', 'Git & GitHub', 'XAMPP · Figma'], order: 2 },
  { title: 'Security-minded', items: ['RBAC design', 'Authentication & authorization', 'Cisco networking fundamentals', 'Scapy / anomaly detection'], order: 3 }
];

function parseItems(raw) {
  return raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
}

skillForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveSkillBtn.disabled = true;
  saveSkillBtn.textContent = 'Saving…';
  setStatus(skillStatus, '');

  const data = {
    title: skillTitle.value.trim(),
    items: parseItems(skillItems.value),
    order: parseInt(skillOrder.value, 10) || 0,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (skillEditId.value) {
      await db.collection('skillCategories').doc(skillEditId.value).update(data);
      setStatus(skillStatus, 'Category updated.', false);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('skillCategories').add(data);
      setStatus(skillStatus, 'Category added.', false);
    }
    resetSkillForm();
    loadSkillCategories();
  } catch (err) {
    setStatus(skillStatus, err.message, true);
  } finally {
    saveSkillBtn.disabled = false;
    saveSkillBtn.textContent = 'Save category';
  }
});

cancelSkillEditBtn.addEventListener('click', resetSkillForm);

seedSkillsBtn.addEventListener('click', async () => {
  if (!confirm('Add default skill categories? Existing categories will remain.')) return;
  seedSkillsBtn.disabled = true;
  try {
    const batch = db.batch();
    DEFAULT_SKILLS.forEach(cat => {
      const ref = db.collection('skillCategories').doc();
      batch.set(ref, {
        ...cat,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    loadSkillCategories();
    setStatus(skillStatus, 'Default skills seeded.', false);
  } catch (err) {
    setStatus(skillStatus, err.message, true);
  } finally {
    seedSkillsBtn.disabled = false;
  }
});

function resetSkillForm() {
  skillForm.reset();
  skillEditId.value = '';
  skillOrder.value = '0';
  skillFormTitle.textContent = 'Add skill category';
  cancelSkillEditBtn.hidden = true;
}

function loadSkillCategories() {
  db.collection('skillCategories').orderBy('order', 'asc').get()
    .then(snapshot => {
      skillList.innerHTML = '';
      if (snapshot.empty) {
        skillList.innerHTML = '<p class="projects-empty">No categories yet — add one or seed defaults.</p>';
        return;
      }
      snapshot.forEach(doc => {
        const s = doc.data();
        const row = document.createElement('div');
        row.className = 'admin-row';
        row.innerHTML = `
          <div class="meta">
            <h3>${escapeHtml(s.title || 'Untitled')}</h3>
            <p>${escapeHtml((s.items || []).join(', '))}</p>
          </div>
          <div class="row-actions">
            <button data-action="edit">Edit</button>
            <button data-action="delete" class="danger">Delete</button>
          </div>
        `;
        row.querySelector('[data-action="edit"]').addEventListener('click', () => fillSkillForm(doc.id, s));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteSkill(doc.id));
        skillList.appendChild(row);
      });
    })
    .catch(err => {
      skillList.innerHTML = '<p class="projects-empty">Could not load skills.</p>';
      console.error(err);
    });
}

function fillSkillForm(id, s) {
  skillEditId.value = id;
  skillTitle.value = s.title || '';
  skillItems.value = (s.items || []).join('\n');
  skillOrder.value = s.order ?? 0;
  skillFormTitle.textContent = 'Edit skill category';
  cancelSkillEditBtn.hidden = false;
  document.querySelector('[data-panel="skills"]').click();
}

function deleteSkill(id) {
  if (!confirm('Delete this skill category?')) return;
  db.collection('skillCategories').doc(id).delete().then(() => loadSkillCategories());
}

/* =========================================================
   CERTIFICATIONS
========================================================= */
const certForm = document.getElementById('certForm');
const certStatus = document.getElementById('certStatus');
const saveCertBtn = document.getElementById('saveCertBtn');
const cancelCertEditBtn = document.getElementById('cancelCertEditBtn');
const certFormTitle = document.getElementById('certFormTitle');
const certList = document.getElementById('certList');
const seedCertsBtn = document.getElementById('seedCertsBtn');

const certEditId = document.getElementById('certEditId');
const certName = document.getElementById('certName');
const certYear = document.getElementById('certYear');
const certOrder = document.getElementById('certOrder');

const DEFAULT_CERTS = [
  { name: 'Cisco CCNA', year: '2025', order: 0 },
  { name: 'Cyber Threat Management', year: '2025', order: 1 },
  { name: 'Industrial Cybersecurity Essentials', year: '2025', order: 2 },
  { name: 'Python Essentials', year: '2026', order: 3 }
];

certForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveCertBtn.disabled = true;
  saveCertBtn.textContent = 'Saving…';
  setStatus(certStatus, '');

  const data = {
    name: certName.value.trim(),
    year: certYear.value.trim(),
    order: parseInt(certOrder.value, 10) || 0,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (certEditId.value) {
      await db.collection('certifications').doc(certEditId.value).update(data);
      setStatus(certStatus, 'Certification updated.', false);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('certifications').add(data);
      setStatus(certStatus, 'Certification added.', false);
    }
    resetCertForm();
    loadCertifications();
  } catch (err) {
    setStatus(certStatus, err.message, true);
  } finally {
    saveCertBtn.disabled = false;
    saveCertBtn.textContent = 'Save certification';
  }
});

cancelCertEditBtn.addEventListener('click', resetCertForm);

seedCertsBtn.addEventListener('click', async () => {
  if (!confirm('Add default certifications? Existing entries will remain.')) return;
  seedCertsBtn.disabled = true;
  try {
    const batch = db.batch();
    DEFAULT_CERTS.forEach(cert => {
      const ref = db.collection('certifications').doc();
      batch.set(ref, {
        ...cert,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    loadCertifications();
    setStatus(certStatus, 'Default certifications seeded.', false);
  } catch (err) {
    setStatus(certStatus, err.message, true);
  } finally {
    seedCertsBtn.disabled = false;
  }
});

function resetCertForm() {
  certForm.reset();
  certEditId.value = '';
  certOrder.value = '0';
  certFormTitle.textContent = 'Add certification';
  cancelCertEditBtn.hidden = true;
}

function loadCertifications() {
  db.collection('certifications').orderBy('order', 'asc').get()
    .then(snapshot => {
      certList.innerHTML = '';
      if (snapshot.empty) {
        certList.innerHTML = '<p class="projects-empty">No certifications yet — add one or seed defaults.</p>';
        return;
      }
      snapshot.forEach(doc => {
        const c = doc.data();
        const row = document.createElement('div');
        row.className = 'admin-row';
        row.innerHTML = `
          <div class="meta">
            <h3>${escapeHtml(c.name || 'Untitled')}</h3>
            <p>${escapeHtml(c.year || '')}</p>
          </div>
          <div class="row-actions">
            <button data-action="edit">Edit</button>
            <button data-action="delete" class="danger">Delete</button>
          </div>
        `;
        row.querySelector('[data-action="edit"]').addEventListener('click', () => fillCertForm(doc.id, c));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteCert(doc.id));
        certList.appendChild(row);
      });
    })
    .catch(err => {
      certList.innerHTML = '<p class="projects-empty">Could not load certifications.</p>';
      console.error(err);
    });
}

function fillCertForm(id, c) {
  certEditId.value = id;
  certName.value = c.name || '';
  certYear.value = c.year || '';
  certOrder.value = c.order ?? 0;
  certFormTitle.textContent = 'Edit certification';
  cancelCertEditBtn.hidden = false;
  document.querySelector('[data-panel="certs"]').click();
}

function deleteCert(id) {
  if (!confirm('Delete this certification?')) return;
  db.collection('certifications').doc(id).delete().then(() => loadCertifications());
}

/* ---------- Helpers ---------- */
function setStatus(el, msg, isError) {
  el.textContent = msg;
  el.className = 'form-status ' + (isError ? 'err' : isError === false ? 'ok' : '');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
