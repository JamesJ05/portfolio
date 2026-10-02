/**
 * Reads the "projects" collection from Firestore, renders cards into
 * #projectsGrid, and wires each card to open a detail modal with a
 * "Live Demo" button, on click. Read access is public (see README.md
 * security rules) — only the admin dashboard can write.
 */
(function loadProjects(){
  const grid = document.getElementById('projectsGrid');
  const loading = document.getElementById('projectsLoading');
  if (!grid) return;

  const initialLoadTimeout = window.setTimeout(() => {
    if (loading?.isConnected) loading.textContent = 'Projects are taking too long to load. Check your connection and reload.';
  }, 12000);

  db.collection('projects')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      window.clearTimeout(initialLoadTimeout);
      loading?.remove();
      grid.replaceChildren();

      if (snapshot.empty){
        grid.innerHTML = `<p class="projects-empty">No projects uploaded yet — check back soon, or log in to the admin dashboard to add the first one.</p>`;
        return;
      }

      snapshot.forEach((doc, index) => {
        const p = doc.data();
        const card = document.createElement('article');
        card.className = 'project-card';
        card.style.animationDelay = `${index * 60}ms`;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View details for ${p.title || 'this project'}`);

        const images = getProjectImages(p);
        const tags = Array.isArray(p.techStack)
          ? p.techStack.map(t => `<span>${escapeHtml(t)}</span>`).join('')
          : '';

        card.innerHTML = `
          <div class="project-thumb">
            ${images[0] ? `<img src="${escapeAttr(images[0])}" alt="${escapeAttr(p.title || 'Project screenshot')}" loading="lazy">` : '<span>// no preview</span>'}
          </div>
          <div class="project-body">
            <h3>${escapeHtml(p.title || 'Untitled project')}</h3>
            <p>${escapeHtml(p.description || '')}</p>
            <div class="project-tags">${tags}</div>
          </div>
        `;

        const openThis = () => openModal(p);
        card.addEventListener('click', openThis);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openThis(); }
        });

        grid.appendChild(card);
      });
    }, err => {
      window.clearTimeout(initialLoadTimeout);
      console.error('Failed to load projects:', err);
      if (loading) loading.textContent = `Could not load projects: ${err.message || 'database request failed.'}`;
    });

  /* ---------- Modal ---------- */
  const backdrop = document.getElementById('projectModalBackdrop');
  const modalThumb = document.getElementById('modalThumb');
  const modalGallery = document.getElementById('modalGallery');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  const modalTags = document.getElementById('modalTags');
  const modalActions = document.getElementById('modalActions');
  const modalClose = document.getElementById('modalClose');

  function openModal(p){
    const images = getProjectImages(p);
    modalThumb.innerHTML = images[0]
      ? `<img src="${escapeAttr(images[0])}" alt="${escapeAttr(p.title || '')}">`
      : '';
    modalGallery.innerHTML = images.slice(1).map((url, index) =>
      `<img src="${escapeAttr(url)}" alt="${escapeAttr(p.title || 'Project')} image ${index + 2}" loading="lazy">`
    ).join('');
    modalTitle.textContent = p.title || 'Untitled project';
    modalDescription.textContent = p.description || '';
    modalTags.innerHTML = Array.isArray(p.techStack)
      ? p.techStack.map(t => `<span>${escapeHtml(t)}</span>`).join('')
      : '';

    const actions = [];
    if (p.liveUrl){
      actions.push(`<a href="${escapeAttr(p.liveUrl)}" target="_blank" rel="noopener" class="btn btn-primary">Live demo ↗</a>`);
    }
    if (p.githubUrl){
      actions.push(`<a href="${escapeAttr(p.githubUrl)}" target="_blank" rel="noopener" class="btn btn-ghost">View code ↗</a>`);
    }
    modalActions.innerHTML = actions.join('') || '<p class="projects-empty">No public link for this one yet.</p>';

    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal(){
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) closeModal();
  });

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, m => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[m]));
  }
  function getProjectImages(project){
    const images = Array.isArray(project.imageUrls) ? project.imageUrls : [];
    return [...new Set([...images, project.imageUrl].filter(url => typeof url === 'string' && url.trim()))];
  }
  function escapeAttr(str){ return escapeHtml(str); }
})();
