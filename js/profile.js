const profileForm = document.getElementById('profileForm');
const profileStatus = document.getElementById('profileStatus');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileAvatar = document.getElementById('profileAvatar');
const avatarInput = document.getElementById('avatarInput');
const useDefaultAvatarBtn = document.getElementById('useDefaultAvatarBtn');
const DEFAULT_AVATAR = 'https://api.dicebear.com/10.x/bottts-neutral/svg?seed=portfolio-default&backgroundColor=0f1730';
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
  setProfileAvatar(profileData.photoURL);
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
    if (pendingPhotoURL) update.photoURL = pendingPhotoURL;
    if (resetAvatar) update.photoURL = firebase.firestore.FieldValue.delete();

    await currentUser.updateProfile({ displayName, ...(resetAvatar ? { photoURL: null } : {}) });
    await db.collection('users').doc(currentUser.uid).set(update, { merge: true });
    profileData = { ...profileData, displayName, ...(pendingPhotoURL ? { photoURL: pendingPhotoURL } : {}) };
    if (resetAvatar) delete profileData.photoURL;
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
    saveProfileBtn.textContent = 'Save profile';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());

function setProfileStatus(message, isError = false) {
  profileStatus.textContent = message;
  profileStatus.className = `form-status ${isError ? 'err' : 'ok'}`;
}

function setProfileAvatar(photoURL) {
  profileAvatar.src = photoURL || DEFAULT_AVATAR;
  profileAvatar.alt = photoURL ? 'Profile photo' : 'Default profile avatar';
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
