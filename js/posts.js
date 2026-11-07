(function loadPosts() {
  const grid = document.getElementById('postsGrid');
  const loading = document.getElementById('postsLoading');
  if (!grid || !window.db) return;

  const timeout = window.setTimeout(() => {
    if (loading?.isConnected) loading.textContent = 'Updates are taking too long to load. Please try again later.';
  }, 12000);

  db.collection('posts').get()
    .then(snapshot => {
      window.clearTimeout(timeout);
      grid.replaceChildren();
      if (snapshot.empty) {
        const empty = document.createElement('div');
        empty.className = 'posts-empty-state';
        const kicker = document.createElement('span');
        kicker.className = 'posts-empty-kicker';
        kicker.textContent = 'NEWSROOM';
        const title = document.createElement('h3');
        title.textContent = 'The next update is on its way.';
        const description = document.createElement('p');
        description.textContent = 'New milestones, announcements, and recent work will appear here.';
        empty.append(kicker, title, description);
        grid.appendChild(empty);
        return;
      }
      [...snapshot.docs].sort((a, b) => createdAt(b.data()) - createdAt(a.data())).forEach(doc => {
        const post = doc.data();
        const card = document.createElement('article');
        card.className = 'post-card';
        if (typeof post.imageUrl === 'string' && post.imageUrl.startsWith('https://')) {
          const image = document.createElement('img');
          image.src = post.imageUrl;
          image.alt = post.title ? `${post.title} image` : 'Update image';
          image.loading = 'lazy';
          image.onerror = () => image.remove();
          card.appendChild(image);
        }
        const body = document.createElement('div');
        body.className = 'post-card-body';
        const date = document.createElement('time');
        const timestamp = post.createdAt?.toDate?.();
        if (timestamp) {
          date.dateTime = timestamp.toISOString();
          date.textContent = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(timestamp);
        }
        const title = document.createElement('h3');
        title.textContent = post.title || 'Update';
        const content = document.createElement('p');
        content.textContent = post.content || '';
        body.append(date, title, content);
        card.appendChild(body);
        grid.appendChild(card);
      });
    })
    .catch(error => {
      window.clearTimeout(timeout);
      console.error('Could not load updates:', error);
      grid.classList.add('posts-load-error');
      grid.textContent = 'Updates are temporarily unavailable. Please check back soon.';
    });

  function createdAt(post) {
    const value = post?.createdAt;
    if (value && typeof value.toMillis === 'function') return value.toMillis();
    const parsed = value ? Date.parse(value) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }
})();
