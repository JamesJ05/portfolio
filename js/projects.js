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
    .onSnapshot(snapshot => {
      window.clearTimeout(initialLoadTimeout);
      loading?.remove();
      grid.replaceChildren();

      if (snapshot.empty){
        grid.innerHTML = `<p class="projects-empty">No projects uploaded yet — check back soon, or log in to the admin dashboard to add the first one.</p>`;
        return;
      }

      const docs = [...snapshot.docs].sort((a, b) => projectCreatedAt(b.data()) - projectCreatedAt(a.data()));
      docs.forEach((doc, index) => {
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

        const cover = card.querySelector('.project-thumb img');
        if (cover) {
          cover.dataset.fallback = getDriveImageFallback(images[0]);
          cover.addEventListener('error', () => {
            if (cover.dataset.fallback && cover.src !== cover.dataset.fallback) {
              cover.src = cover.dataset.fallback;
              cover.dataset.fallback = '';
            } else {
              cover.replaceWith(Object.assign(document.createElement('span'), { textContent: '// image unavailable' }));
            }
          });
        }

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
  const imageViewer = document.getElementById('imageViewer');
  const imageViewerImage = document.getElementById('imageViewerImage');
  const imageViewerCount = document.getElementById('imageViewerCount');
  const imageViewerClose = document.getElementById('imageViewerClose');
  const imageViewerPrev = document.getElementById('imageViewerPrev');
  const imageViewerNext = document.getElementById('imageViewerNext');
  let activeImages = [];
  let activeImageIndex = 0;

  function openModal(p){
    activeImages = getProjectImages(p);
    activeImageIndex = 0;
    renderProjectGallery(p.title || 'Project');
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
    closeImageViewer();
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderProjectGallery(title){
    modalThumb.replaceChildren();
    modalGallery.replaceChildren();
    if (!activeImages.length) return;

    const mainImage = document.createElement('img');
    mainImage.alt = `${title} image 1`;
    mainImage.tabIndex = 0;
    mainImage.setAttribute('role', 'button');
    mainImage.setAttribute('aria-label', 'Open full-size project image');
    mainImage.addEventListener('click', openImageViewer);
    mainImage.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openImageViewer();
      }
    });
    const previous = document.createElement('button');
    previous.className = 'modal-image-nav modal-image-prev';
    previous.type = 'button';
    previous.textContent = '‹';
    previous.setAttribute('aria-label', 'Previous project image');
    previous.addEventListener('click', () => showProjectImage(activeImageIndex - 1, title));
    const next = document.createElement('button');
    next.className = 'modal-image-nav modal-image-next';
    next.type = 'button';
    next.textContent = '›';
    next.setAttribute('aria-label', 'Next project image');
    next.addEventListener('click', () => showProjectImage(activeImageIndex + 1, title));
    const count = document.createElement('span');
    count.className = 'modal-image-count';
    count.id = 'modalImageCount';
    modalThumb.append(mainImage, previous, next, count);

    activeImages.forEach((url, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Show project image ${index + 1}`);
      button.addEventListener('click', () => showProjectImage(index, title));
      const thumb = document.createElement('img');
      thumb.alt = `${title} thumbnail ${index + 1}`;
      thumb.loading = 'lazy';
      setImageFallback(thumb, url);
      thumb.src = url;
      button.appendChild(thumb);
      modalGallery.appendChild(button);
    });
    showProjectImage(0, title);
  }

  function showProjectImage(index, title){
    if (!activeImages.length) return;
    activeImageIndex = (index + activeImages.length) % activeImages.length;
    const currentUrl = activeImages[activeImageIndex];
    const mainImage = modalThumb.querySelector('img');
    mainImage.alt = `${title} image ${activeImageIndex + 1}`;
    setImageFallback(mainImage, currentUrl);
    mainImage.src = currentUrl;
    const counter = document.getElementById('modalImageCount');
    if (counter) counter.textContent = `${activeImageIndex + 1} / ${activeImages.length}`;
    modalGallery.querySelectorAll('button').forEach((button, buttonIndex) => {
      button.setAttribute('aria-current', buttonIndex === activeImageIndex ? 'true' : 'false');
    });
    const hasMultiple = activeImages.length > 1;
    modalThumb.querySelector('.modal-image-prev').hidden = !hasMultiple;
    modalThumb.querySelector('.modal-image-next').hidden = !hasMultiple;
    if (imageViewer.classList.contains('open')) showViewerImage();
  }

  function setImageFallback(img, url){
    img.dataset.fallback = getDriveImageFallback(url);
    img.onerror = () => {
      if (img.dataset.fallback && img.src !== img.dataset.fallback) {
        img.src = img.dataset.fallback;
        img.dataset.fallback = '';
      }
    };
  }

  function openImageViewer(){
    if (!activeImages.length) return;
    imageViewer.classList.add('open');
    imageViewer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    showViewerImage();
    imageViewerClose.focus();
  }

  function showViewerImage(){
    const url = activeImages[activeImageIndex];
    imageViewerImage.alt = `${modalTitle.textContent} image ${activeImageIndex + 1}`;
    setImageFallback(imageViewerImage, url);
    imageViewerImage.src = url;
    imageViewerCount.textContent = `${activeImageIndex + 1} / ${activeImages.length}`;
    imageViewerPrev.hidden = activeImages.length < 2;
    imageViewerNext.hidden = activeImages.length < 2;
  }

  function closeImageViewer(){
    imageViewer.classList.remove('open');
    imageViewer.setAttribute('aria-hidden', 'true');
    imageViewerImage.removeAttribute('src');
  }

  function stepProjectImage(delta){
    showProjectImage(activeImageIndex + delta, modalTitle.textContent);
  }

  modalClose.addEventListener('click', closeModal);
  imageViewerClose.addEventListener('click', closeImageViewer);
  imageViewerPrev.addEventListener('click', () => stepProjectImage(-1));
  imageViewerNext.addEventListener('click', () => stepProjectImage(1));
  imageViewer.addEventListener('click', e => {
    if (e.target === imageViewer) closeImageViewer();
  });
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (imageViewer.classList.contains('open')) {
      if (e.key === 'Escape') closeImageViewer();
      if (e.key === 'ArrowRight') stepProjectImage(1);
      if (e.key === 'ArrowLeft') stepProjectImage(-1);
    } else if (e.key === 'Escape' && backdrop.classList.contains('open')) {
      closeModal();
    }
  });

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, m => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[m]));
  }
  function getProjectImages(project){
    const images = Array.isArray(project.imageUrls)
      ? project.imageUrls
      : (typeof project.imageUrls === 'string' ? project.imageUrls.split(/\r?\n/) : []);
    return [...new Set([...images, project.imageUrl]
      .filter(url => typeof url === 'string' && url.trim())
      .map(normalizeDriveImageUrl))];
  }
  function projectCreatedAt(project){
    const value = project.createdAt;
    if (value && typeof value.toMillis === 'function') return value.toMillis();
    const parsed = value ? Date.parse(value) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function normalizeDriveImageUrl(rawUrl){
    try{
      const url = new URL(rawUrl);
      if (!/(^|\.)drive\.google\.com$/i.test(url.hostname)) return url.href;
      const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
      if (!fileId) return url.href;
      const previewUrl = new URL('https://drive.google.com/thumbnail');
      previewUrl.searchParams.set('id', fileId);
      previewUrl.searchParams.set('sz', 'w1600');
      const resourceKey = url.searchParams.get('resourcekey');
      if (resourceKey) previewUrl.searchParams.set('resourcekey', resourceKey);
      return previewUrl.href;
    }catch{
      return rawUrl;
    }
  }
  function getDriveImageFallback(rawUrl){
    try{
      const url = new URL(rawUrl);
      if (url.hostname !== 'drive.google.com' && !url.hostname.endsWith('.drive.google.com')) return '';
      const pathParts = url.pathname.split('/');
      const fileIndex = pathParts.indexOf('file');
      const fileId = (fileIndex >= 0 && pathParts[fileIndex + 1] === 'd' ? pathParts[fileIndex + 2] : '') || url.searchParams.get('id');
      if (!fileId) return '';
      const fallback = new URL('https://drive.google.com/uc');
      fallback.searchParams.set('export', 'view');
      fallback.searchParams.set('id', fileId);
      const resourceKey = url.searchParams.get('resourcekey');
      if (resourceKey) fallback.searchParams.set('resourcekey', resourceKey);
      return fallback.href;
    }catch{
      return '';
    }
  }
  function escapeAttr(str){ return escapeHtml(str); }
})();
