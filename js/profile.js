const profileForm = document.getElementById('profileForm');
const profileStatus = document.getElementById('profileStatus');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileAvatar = document.getElementById('profileAvatar');
let currentUser = null;
let profileData = {};

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
  profileAvatar.src = 'assets/images/profile.jpg';
});

profileForm.addEventListener('submit', async event => {
  event.preventDefault();
  const displayName = document.getElementById('displayName').value.trim();
  if (!displayName) return setProfileStatus('Enter a display name.', true);
  saveProfileBtn.disabled = true;
  saveProfileBtn.textContent = 'Saving…';
  try {
    await currentUser.updateProfile({ displayName });
    await db.collection('users').doc(currentUser.uid).set({ displayName, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    profileData = { ...profileData, displayName };
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
