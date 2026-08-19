/**
 * Loads skill categories and certifications from Firestore into the public site.
 */
(function loadSkills() {
  const skillsGrid = document.getElementById('skillsGrid');
  const certTags = document.getElementById('certTags');
  if (!skillsGrid) return;

  const defaultCategories = [
    { title: 'Backend', items: ['Java (core focus)', 'Spring Boot', 'JPA / Hibernate', 'REST API design', 'Python / Flask'] },
    { title: 'Frontend', items: ['JavaScript / TypeScript', 'React / Vite', 'HTML5 & CSS3', 'Responsive UI'] },
    { title: 'Data & Infra', items: ['MySQL', 'Firebase / Firestore', 'Git & GitHub', 'XAMPP · Figma'] },
    { title: 'Security-minded', items: ['RBAC design', 'Authentication & authorization', 'Cisco networking fundamentals', 'Scapy / anomaly detection'] }
  ];

  const defaultCerts = [
    { name: 'Cisco CCNA', year: '2025' },
    { name: 'Cyber Threat Management', year: '2025' },
    { name: 'Industrial Cybersecurity Essentials', year: '2025' },
    { name: 'Python Essentials', year: '2026' }
  ];

  Promise.all([
    db.collection('skillCategories').orderBy('order', 'asc').get(),
    db.collection('certifications').orderBy('order', 'asc').get()
  ])
    .then(([skillsSnap, certsSnap]) => {
      const categories = skillsSnap.empty
        ? defaultCategories
        : skillsSnap.docs.map(doc => doc.data());

      const certs = certsSnap.empty
        ? defaultCerts
        : certsSnap.docs.map(doc => doc.data());

      renderSkills(categories);
      renderCerts(certs);
    })
    .catch(err => {
      console.error('Failed to load skills:', err);
      renderSkills(defaultCategories);
      renderCerts(defaultCerts);
    });

  function renderSkills(categories) {
    skillsGrid.innerHTML = '';
    categories.forEach((cat, index) => {
      const card = document.createElement('div');
      card.className = 'skill-card';
      card.style.animationDelay = `${index * 60}ms`;

      const items = Array.isArray(cat.items) ? cat.items : [];
      card.innerHTML = `
        <h3>${escapeHtml(cat.title || 'Skills')}</h3>
        <ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      `;
      skillsGrid.appendChild(card);
    });
  }

  function renderCerts(certs) {
    if (!certTags) return;
    certTags.innerHTML = certs.map(cert => {
      const label = cert.year ? `${cert.name} (${cert.year})` : cert.name;
      return `<span>${escapeHtml(label)}</span>`;
    }).join('');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }
})();
