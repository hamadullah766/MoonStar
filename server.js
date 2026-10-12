const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'users.json');

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.static('public'));

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// DB helpers
function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch(e) { return []; }
}
function writeDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')); }
  catch(e) { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 8); }
function generateReferralCode() { return 'NX' + Math.random().toString(36).substring(2, 8).toUpperCase(); }

// ============ SIGNUP ============
app.post('/api/auth/signup', (req, res) => {
  try {
    const { fullName, phone, email, password, inviteCode } = req.body;

    if (!fullName || !phone || !email || !password) {
      return res.json({ success: false, message: 'All fields are required' });
    }
    if (fullName.trim().length < 2) {
      return res.json({ success: false, message: 'Please enter a valid name' });
    }
    if (password.length < 6) {
      return res.json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@gmail.com')) {
      return res.json({ success: false, message: 'Only Gmail (@gmail.com) is accepted' });
    }

    if (!phone.startsWith('+92')) {
      return res.json({ success: false, message: 'Only Pakistani numbers (+92) are accepted' });
    }
    const phoneWithout = phone.replace('+92', '');
    if (!/^3\d{9}$/.test(phoneWithout)) {
      return res.json({ success: false, message: 'Invalid Pakistani phone number' });
    }

    const users = readDB();
    if (users.find(u => u.email === cleanEmail)) {
      return res.json({ success: false, message: 'This email is already registered. Please login.' });
    }
    if (users.find(u => u.phone === phone)) {
      return res.json({ success: false, message: 'This phone number is already registered.' });
    }

    let referredBy = null;
    if (inviteCode && inviteCode.trim() !== '') {
      const referrer = users.find(u => u.referralCode === inviteCode.trim().toUpperCase());
      if (referrer) referredBy = referrer.referralCode;
    }

    const newUser = {
      id: generateId(),
      fullName: fullName.trim(),
      phone: phone,
      email: cleanEmail,
      password: password,
      country: 'PK',
      balance: 0,
      adsCompleted: 0,
      adsToday: 0,
      earnedToday: 0,
      lastAdDate: null,
      referralCode: generateReferralCode(),
      referredBy: referredBy,
      referralCompleted: false,
      badge: { level: 'VIP 00', count: 0 },
      donationCount: 0,
      withdrawCount: 0,
      lastWithdraw: null,
      totalDonated: 0,
      isAdmin: false,
      isBlocked: false,
      photoUnlocked: false,
      profilePic: '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeDB(users);

    const { password: _, ...safe } = newUser;

    res.json({
      success: true,
      message: 'Account created! Welcome to MoonStar',
      token: 'token_' + newUser.id,
      user: safe
    });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ============ LOGIN ============
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.json({ success: false, message: 'Email and password required' });

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@gmail.com')) {
      return res.json({ success: false, message: 'Only Gmail (@gmail.com) is accepted' });
    }

    const users = readDB();
    const user = users.find(u => u.email === cleanEmail);

    if (!user) return res.json({ success: false, message: 'No account found. Please sign up.' });
    if (user.isBlocked) return res.json({ success: false, message: 'Account blocked. Contact support.' });
    if (user.password !== password) return res.json({ success: false, message: 'Incorrect password.' });

    const { password: _, ...safe } = user;

    res.json({
      success: true,
      message: 'Login successful!',
      token: 'token_' + user.id,
      user: safe
    });

  } catch (error) {
    res.json({ success: false, message: 'Server error' });
  }
});

// ============ USER UPDATE ============
app.post('/api/user/update', (req, res) => {
  try {
    const { userId, updates } = req.body;
    const users = readDB();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return res.json({ success: false, message: 'User not found' });

    const allowed = ['balance', 'adsToday', 'earnedToday', 'adsCompleted', 'badge', 'profilePic', 'photoUnlocked', 'donationCount', 'withdrawCount', 'lastWithdraw', 'totalDonated'];
    const filtered = {};
    Object.keys(updates).forEach(k => { if (allowed.includes(k)) filtered[k] = updates[k]; });

    users[idx] = { ...users[idx], ...filtered };
    writeDB(users);

    const { password: _, ...safe } = users[idx];
    res.json({ success: true, user: safe });

  } catch (error) {
    res.json({ success: false, message: 'Server error' });
  }
});

// ============ USERS API (Admin) ============
app.get('/api/users', (req, res) => {
  const users = readDB().map(({ password, ...u }) => u);
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const users = readDB();
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.json({ success: false });
  const { password, ...safe } = user;
  res.json(safe);
});

app.post('/api/users/:id/update', (req, res) => {
  const users = readDB();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.json({ success: false, message: 'User not found' });
  users[idx] = { ...users[idx], ...req.body };
  writeDB(users);
  const { password, ...safe } = users[idx];
  res.json({ success: true, user: safe });
});

app.post('/api/users/:id/block', (req, res) => {
  const users = readDB();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.json({ success: false });
  users[idx].isBlocked = !users[idx].isBlocked;
  writeDB(users);
  const { password, ...safe } = users[idx];
  res.json({ success: true, user: safe });
});

// ============ WITHDRAWALS API ============
app.get('/api/withdrawals', (req, res) => res.json(readJSON('withdrawals.json')));

app.post('/api/withdrawals', (req, res) => {
  const list = readJSON('withdrawals.json');
  const newItem = { id: generateId(), ...req.body, status: 'pending', createdAt: new Date().toISOString() };
  list.push(newItem);
  writeJSON('withdrawals.json', list);
  res.json({ success: true, withdrawal: newItem });
});

app.post('/api/withdrawals/:id/update', (req, res) => {
  const list = readJSON('withdrawals.json');
  const idx = list.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.json({ success: false });
  list[idx] = { ...list[idx], ...req.body };
  writeJSON('withdrawals.json', list);

  // If rejected, refund balance
  if (req.body.status === 'rejected') {
    const users = readDB();
    const uIdx = users.findIndex(u => u.id === list[idx].userId);
    if (uIdx !== -1) {
      users[uIdx].balance = (users[uIdx].balance || 0) + list[idx].amount;
      writeDB(users);
    }
  }
  res.json({ success: true, withdrawal: list[idx] });
});

// ============ DONATIONS API ============
app.get('/api/donations', (req, res) => res.json(readJSON('donations.json')));

app.post('/api/donations', (req, res) => {
  const list = readJSON('donations.json');
  const newItem = { id: generateId(), ...req.body, status: 'pending', createdAt: new Date().toISOString() };
  list.push(newItem);
  writeJSON('donations.json', list);
  res.json({ success: true, donation: newItem });
});

app.post('/api/donations/:id/update', (req, res) => {
  const list = readJSON('donations.json');
  const idx = list.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.json({ success: false });
  list[idx] = { ...list[idx], ...req.body };
  writeJSON('donations.json', list);

  // If verified, update user's badge
  if (req.body.status === 'verified') {
    const users = readDB();
    const uIdx = users.findIndex(u => u.id === list[idx].userId);
    if (uIdx !== -1) {
      const c = (users[uIdx].donationCount || 0) + 1;
      users[uIdx].donationCount = c;
      const lv = [{n:'Bronze',r:5},{n:'Silver',r:10},{n:'Gold',r:20},{n:'Platinum',r:30},{n:'Diamond',r:50},{n:'Elite',r:100},{n:'Legend',r:200}];
      let nl = 'VIP 00';
      lv.forEach(x => { if (c >= x.r) nl = x.n; });
      users[uIdx].badge = { level: nl, count: c };
      writeDB(users);
    }
  }
  res.json({ success: true, donation: list[idx] });
});

// ============ PHOTOS API ============
app.get('/api/photos', (req, res) => res.json(readJSON('photos.json')));

app.post('/api/photos', (req, res) => {
  const list = readJSON('photos.json');
  const newItem = { id: generateId(), ...req.body, status: 'pending', createdAt: new Date().toISOString() };
  list.push(newItem);
  writeJSON('photos.json', list);
  res.json({ success: true, photo: newItem });
});

app.post('/api/photos/:id/update', (req, res) => {
  const list = readJSON('photos.json');
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.json({ success: false });
  list[idx] = { ...list[idx], ...req.body };
  writeJSON('photos.json', list);

  // If approved, unlock user's photo
  if (req.body.status === 'approved') {
    const users = readDB();
    const uIdx = users.findIndex(u => u.id === list[idx].userId);
    if (uIdx !== -1) {
      users[uIdx].photoUnlocked = true;
      writeDB(users);
    }
  }
  res.json({ success: true, photo: list[idx] });
});

// ============ PAGES ============
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/ads', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ads.html')));
app.get('/refer', (req, res) => res.sendFile(path.join(__dirname, 'public', 'refer.html')));
app.get('/withdraw', (req, res) => res.sendFile(path.join(__dirname, 'public', 'withdraw.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));
app.get('/change-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'change-password.html')));
app.get('/vip', (req, res) => res.sendFile(path.join(__dirname, 'public', 'vip.html')));
app.get('/donate', (req, res) => res.sendFile(path.join(__dirname, 'public', 'donate.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));


// ============ CHANGE PASSWORD ============
// ============ CHANGE PASSWORD ============
app.post('/api/users/:id/change-password', (req, res) => {
  try {
    const { newPassword } = req.body;
    const users = readDB();
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) {
      return res.json({ success: false, message: 'User not found' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.json({ success: false, message: 'Password must be at least 6 characters' });
    }
    users[idx].password = newPassword;
    writeDB(users);
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch(e) {
    res.json({ success: false, message: e.message });
  }
});

app.get('/api/test', (req, res) => res.json({ success: true, message: 'MoonStar API' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log('===========================================');
  console.log('  MoonStar Server Started');
  console.log('  URL: http://localhost:' + PORT);
  console.log('  API: Ready');
  console.log('===========================================');
});
