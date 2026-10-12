// MoonStar Auto Sync System
async function syncUserFromServer() {
  try {
    var stored = localStorage.getItem('user');
    if (!stored) return null;
    var localUser = JSON.parse(stored);
    if (!localUser.id) return null;
    var res = await fetch('/api/users/' + localUser.id);
    var serverUser = await res.json();
    if (serverUser && serverUser.id) {
      localStorage.setItem('user', JSON.stringify(serverUser));
      return serverUser;
    }
    return localUser;
  } catch(e) { return JSON.parse(localStorage.getItem('user') || '{}'); }
}
async function saveUserToServer(updates) {
  try {
    var stored = localStorage.getItem('user');
    if (!stored) return false;
    var user = JSON.parse(stored);
    if (!user.id) return false;
    var newUser = Object.assign({}, user, updates);
    localStorage.setItem('user', JSON.stringify(newUser));
    var res = await fetch('/api/users/' + user.id + '/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return await res.json();
  } catch(e) { return false; }
}
