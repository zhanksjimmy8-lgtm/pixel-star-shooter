// ── Supabase Auth ──
var supabase;

function initSupabase() {
  var config = window.SUPABASE_CONFIG;
  if (!config || config.url.indexOf("YOUR_PROJECT") >= 0) return;
  supabase = window.supabase.createClient(config.url, config.anonKey);
  checkSession();
}

function checkSession() {
  supabase.auth.getSession().then(function(res) {
    if (res.data && res.data.session) {
      onLoggedIn(res.data.session.user);
    }
  });
}

function onLoggedIn(user) {
  var el = document.getElementById("auth-status");
  if (el) el.textContent = (user.user_metadata && user.user_metadata.username) || user.email || "PLAYER";
  document.getElementById("auth-panel").style.display = "none";
}

// ── Register ──
function doRegister() {
  var email = document.getElementById("auth-email").value.trim();
  var pw = document.getElementById("auth-pw").value.trim();
  var uname = document.getElementById("auth-username").value.trim();
  if (!email || !pw || !uname) { showAuthMsg("请填写所有字段"); return; }
  if (pw.length < 6) { showAuthMsg("密码至少6位"); return; }

  supabase.auth.signUp({
    email: email,
    password: pw,
    options: { data: { username: uname } }
  }).then(function(res) {
    if (res.error) { showAuthMsg(res.error.message); return; }
    if (res.data.user && res.data.session) {
      onLoggedIn(res.data.user);
    } else {
      showAuthMsg("注册成功！请查收验证邮件后登录。");
    }
  });
}

// ── Login ──
function doLogin() {
  var email = document.getElementById("auth-email").value.trim();
  var pw = document.getElementById("auth-pw").value.trim();
  if (!email || !pw) { showAuthMsg("请填写邮箱和密码"); return; }

  supabase.auth.signInWithPassword({ email: email, password: pw }).then(function(res) {
    if (res.error) { showAuthMsg(res.error.message); return; }
    onLoggedIn(res.data.user);
  });
}

// ── Logout ──
function doLogout() {
  supabase.auth.signOut().then(function() {
    document.getElementById("auth-status").textContent = "";
    document.getElementById("auth-username").value = "";
  });
}

// ── UI ──
function showAuthMsg(msg) {
  var el = document.getElementById("auth-msg");
  if (el) { el.textContent = msg; el.style.display = "block"; }
}

function toggleAuth() {
  var panel = document.getElementById("auth-panel");
  if (!panel) return;
  panel.style.display = panel.style.display === "flex" ? "none" : "flex";
  var tabLogin = document.getElementById("tab-login");
  if (tabLogin) switchAuthTab("login");
}

function switchAuthTab(tab) {
  document.getElementById("tab-login").style.borderBottom = tab === "login" ? "2px solid #00e5ff" : "2px solid transparent";
  document.getElementById("tab-register").style.borderBottom = tab === "register" ? "2px solid #00e5ff" : "2px solid transparent";
  document.getElementById("auth-msg").style.display = "none";
  document.getElementById("auth-username-row").style.display = tab === "register" ? "block" : "none";
  document.getElementById("auth-submit").textContent = tab === "login" ? "登录" : "注册";
  document.getElementById("auth-submit").onclick = tab === "login" ? doLogin : doRegister;
}

// ── Leaderboard helpers ──
function getCurrentUsername() {
  return document.getElementById("auth-status").textContent || null;
}

function getCurrentUserId() {
  if (!supabase) return null;
  return supabase.auth.getSession().then ? null : null;
}

initSupabase();
