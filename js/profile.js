const profileForm = document.getElementById('profileForm');
const profileStatus = document.getElementById('profileStatus');
const saveProfileBtn = document.getElementById('saveProfileBtn');
let profileAvatar = document.getElementById('profileAvatar');
const avatarInput = document.getElementById('avatarInput');
const useDefaultAvatarBtn = document.getElementById('useDefaultAvatarBtn');
const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_LENGTH = 100000;
let currentUser = null;
let profileData = {};
let pendingPhotoURL = null;
let resetAvatar = false;

auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.replace('login.html');
    return;
  }
  currentUser = user;
  const snapshot = await db.collection('users').doc(user.uid).get();
  profileData = snapshot.data() || {};
  const name = profileData.displayName || user.displayName || profileData.username || 'My profile';
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileUsername').textContent = profileData.username ? `@${profileData.username}` : user.email;
  document.getElementById('username').value = profileData.username || '';
  document.getElementById('displayName').value = name;
  // Legacy profile photos are treated as the default. A photo is only shown
  // after the user explicitly uploads one from this profile page.
  setProfileAvatar(profileData.hasCustomAvatar ? profileData.photoURL : null);
});

avatarInput?.addEventListener('change', async () => {
  const [file] = avatarInput.files;
  if (!file) return;

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX_SOURCE_BYTES) {
    avatarInput.value = '';
    return setProfileStatus('Choose a JPG, PNG, or WebP image smaller than 5 MB.', true);
  }

  try {
    pendingPhotoURL = await compressAvatar(file);
    resetAvatar = false;
    setProfileAvatar(pendingPhotoURL);
    setProfileStatus('Photo ready. Select Save profile to apply it.');
  } catch (error) {
    console.error(error);
    avatarInput.value = '';
    pendingPhotoURL = null;
    setProfileStatus('Could not process that image. Try another photo.', true);
  }
});

useDefaultAvatarBtn?.addEventListener('click', () => {
  pendingPhotoURL = null;
  resetAvatar = true;
  avatarInput.value = '';
  setProfileAvatar();
  setProfileStatus('Default avatar selected. Select Save profile to apply it.');
});

profileForm.addEventListener('submit', async event => {
  event.preventDefault();
  const displayName = document.getElementById('displayName').value.trim();
  if (!displayName) return setProfileStatus('Enter a display name.', true);
  saveProfileBtn.disabled = true;
  saveProfileBtn.textContent = 'Saving…';
  try {
    const update = { displayName, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    if (pendingPhotoURL) {
      update.photoURL = pendingPhotoURL;
      update.hasCustomAvatar = true;
    }
    if (resetAvatar) {
      update.photoURL = firebase.firestore.FieldValue.delete();
      update.hasCustomAvatar = firebase.firestore.FieldValue.delete();
    }

    await currentUser.updateProfile({ displayName, ...(resetAvatar ? { photoURL: null } : {}) });
    await db.collection('users').doc(currentUser.uid).set(update, { merge: true });
    profileData = { ...profileData, displayName, ...(pendingPhotoURL ? { photoURL: pendingPhotoURL, hasCustomAvatar: true } : {}) };
    if (resetAvatar) {
      delete profileData.photoURL;
      delete profileData.hasCustomAvatar;
    }
    pendingPhotoURL = null;
    resetAvatar = false;
    avatarInput.value = '';
    document.getElementById('profileName').textContent = displayName;
    setProfileStatus('Profile saved.');
  } catch (error) {
    console.error(error);
    setProfileStatus(error.message || 'Could not save your profile.', true);
  } finally {
    saveProfileBtn.disabled = false;
    saveProfileBtn.textContent = 'Save changes';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());

function setProfileStatus(message, isError = false) {
  profileStatus.textContent = message;
  profileStatus.className = `form-status ${isError ? 'err' : 'ok'}`;
}

function setProfileAvatar(photoURL) {
  if (photoURL) {
    if (profileAvatar.tagName !== 'IMG') {
      const image = document.createElement('img');
      image.id = 'profileAvatar';
      image.className = 'profile-avatar';
      image.alt = 'Profile photo';
      profileAvatar.replaceWith(image);
      profileAvatar = image;
    }
    profileAvatar.src = photoURL;
    return;
  }

  if (profileAvatar.tagName === 'IMG') {
    const fallback = document.createElement('div');
    fallback.id = 'profileAvatar';
    fallback.className = 'profile-avatar profile-avatar-icon';
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', 'Default profile avatar');
    fallback.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 1 0 8Zm0 2c-4.1 0-7 2-7 4.5V20h14v-1.5c0-2.5-2.9-4.5-7-4.5Z"/></svg>';
    profileAvatar.replaceWith(fallback);
    profileAvatar = fallback;
  }
}

async function compressAvatar(file) {
  const objectURL = URL.createObjectURL(file);
  const source = await loadImage(objectURL);
  try {
    for (const size of [256, 192, 128]) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      const sourceSize = Math.min(source.naturalWidth, source.naturalHeight);
      const sourceX = (source.naturalWidth - sourceSize) / 2;
      const sourceY = (source.naturalHeight - sourceSize) / 2;
      context.drawImage(source, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

      for (const quality of [0.82, 0.7, 0.58]) {
        const dataURL = canvas.toDataURL('image/jpeg', quality);
        if (dataURL.length <= MAX_AVATAR_LENGTH) return dataURL;
      }
    }
  } finally {
    URL.revokeObjectURL(objectURL);
  }
  throw new Error('Image is too large after compression.');
}

function loadImage(sourceURL) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = sourceURL;
  });
}
