(function loadPosts() {
  const grid = document.getElementById('postsGrid');
  const loading = document.getElementById('postsLoading');
  if (!grid || typeof db === 'undefined') return;

  const timeout = window.setTimeout(() => {
    if (loading?.isConnected) loading.textContent = 'The newsroom is taking longer than expected to load.';
  }, 12000);

  db.collection('posts').get()
    .then(snapshot => {
      window.clearTimeout(timeout);
      grid.replaceChildren();
      if (snapshot.empty) {
        grid.appendChild(renderEmptyState());
        return;
      }

      const posts = [...snapshot.docs]
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => createdAt(b) - createdAt(a));

      const featured = renderPost(posts[0], true);
      grid.appendChild(featured);
      if (posts.length > 1) {
        const more = document.createElement('div');
        more.className = 'posts-more';
        posts.slice(1).forEach(post => more.appendChild(renderPost(post, false)));
        grid.appendChild(more);
      }
    })
    .catch(error => {
      window.clearTimeout(timeout);
      console.error('Could not load updates:', error);
      const message = document.createElement('p');
      message.className = 'posts-load-error';
      message.textContent = 'The newsroom is temporarily unavailable. Please check back shortly.';
      grid.replaceChildren(message);
    });

  function renderPost(post, featured) {
    const card = document.createElement('article');
    card.className = `post-card ${featured ? 'post-featured' : 'post-compact'}`;

    const media = document.createElement('div');
    media.className = 'post-media';
    if (typeof post.imageUrl === 'string' && post.imageUrl.trim()) {
      const image = document.createElement('img');
      const imageLink = document.createElement('a');
      imageLink.className = 'post-image-link';
      imageLink.href = post.imageUrl.trim();
      imageLink.target = '_blank';
      imageLink.rel = 'noopener noreferrer';
      imageLink.setAttribute('aria-label', `Open the full image for ${post.title || 'this update'} in a new tab`);
      image.alt = post.title ? `${post.title} — news photo` : 'News update photo';
      image.loading = featured ? 'eager' : 'lazy';
      const hint = document.createElement('span');
      hint.className = 'post-image-hint';
      hint.textContent = 'View full image ↗';
      image.onerror = () => {
        const fallbackUrl = image.dataset.fallback;
        if (fallbackUrl && image.src !== fallbackUrl) {
          image.dataset.fallback = '';
          image.src = fallbackUrl;
        } else {
          media.classList.add('post-media-unavailable');
          imageLink.remove();
        }
      };
      setImageSource(image, post.imageUrl);
      imageLink.append(image, hint);
      media.appendChild(imageLink);
    } else {
      media.classList.add('post-media-placeholder');
    }

    const body = document.createElement('div');
    body.className = 'post-card-body';
    const meta = document.createElement('div');
    meta.className = 'post-meta';
    const label = document.createElement('span');
    label.className = 'post-label';
    label.textContent = featured ? 'LATEST UPDATE' : 'FIELD NOTE';
    meta.appendChild(label);

    const date = document.createElement('time');
    const timestamp = post.createdAt?.toDate?.();
    if (timestamp) {
      date.dateTime = timestamp.toISOString();
      date.textContent = new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      }).format(timestamp);
    }
    meta.appendChild(date);

    const title = document.createElement('h3');
    title.textContent = post.title || 'Untitled update';
    const content = document.createElement('p');
    content.className = 'post-card-content';
    content.textContent = post.content || '';
    body.append(meta, title, content);

    if ((post.content || '').length > (featured ? 300 : 180)) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'post-read-more';
      toggle.textContent = 'Read full update';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => {
        const expanded = card.classList.toggle('is-expanded');
        toggle.textContent = expanded ? 'Show less' : 'Read full update';
        toggle.setAttribute('aria-expanded', String(expanded));
      });
      body.appendChild(toggle);
    }

    card.append(media, body);
    return card;
  }

  function renderEmptyState() {
    const empty = document.createElement('div');
    empty.className = 'posts-empty-state';
    const kicker = document.createElement('span');
    kicker.className = 'posts-empty-kicker';
    kicker.textContent = 'THE NEWSROOM';
    const title = document.createElement('h3');
    title.textContent = 'The next story is taking shape.';
    const description = document.createElement('p');
    description.textContent = 'New milestones, projects, and notes from my journey will be featured here.';
    empty.append(kicker, title, description);
    return empty;
  }

  function createdAt(post) {
    const value = post?.createdAt;
    if (value && typeof value.toMillis === 'function') return value.toMillis();
    const parsed = value ? Date.parse(value) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function setImageSource(image, rawUrl) {
    const urls = normalizeImageUrls(rawUrl);
    image.dataset.fallback = urls[1] || '';
    image.src = urls[0];
  }

  function normalizeImageUrls(rawUrl) {
    try {
      const url = new URL(rawUrl);
      if (!/(^|\.)drive\.google\.com$/i.test(url.hostname)) return [url.href];
      const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
      if (!fileId) return [url.href];
      const thumbnail = new URL('https://drive.google.com/thumbnail');
      thumbnail.searchParams.set('id', fileId);
      thumbnail.searchParams.set('sz', 'w1600');
      const fallback = new URL('https://drive.google.com/uc');
      fallback.searchParams.set('export', 'view');
      fallback.searchParams.set('id', fileId);
      const resourceKey = url.searchParams.get('resourcekey');
      if (resourceKey) {
        thumbnail.searchParams.set('resourcekey', resourceKey);
        fallback.searchParams.set('resourcekey', resourceKey);
      }
      return [thumbnail.href, fallback.href];
    } catch {
      return [rawUrl];
    }
  }
})();
