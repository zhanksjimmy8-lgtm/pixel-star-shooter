
锘縞onst canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = 320, H = 200;
canvas.width = W; canvas.height = H;
ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const scoreUI = document.getElementById("score-ui");
const comboUI = document.getElementById("combo-ui");
const livesUI = document.getElementById("lives-ui");
const finalScore = document.getElementById("final-score");
const highScoreDisplay = document.getElementById("high-score-display");

let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playBeep(freq, dur, type, vol) {
  player = createPlayer();
  bullets = []; enemyBullets = []; enemies = []; asteroids = []; powerUps = []; particles = [];
  stars = [];
  for (var i = 0; i < 80; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, speed: 0.3 + Math.random() * 0.7,
      size: Math.random() < 0.1 ? 2 : 1, brightness: 0.4 + Math.random() * 0.6 });
  }
  score = 0; lives = 3; comboCount = 0; comboTimer = 0;
  screenShake = 0; spawnTimer = 0; asteroidTimer = 0; difficulty = 1;
  state = STATE.PLAYING;
  updateUI();
}

function startGame() { initAudio(); resetGame(); startScreen.style.display = "none"; gameOverScreen.style.display = "none"; updateUI(); }
function restartGame() { resetGame(); gameOverScreen.style.display = "none"; updateUI(); }

function updateUI() {
  scoreUI.textContent = "SCORE " + score;
  var hearts = "";
  for (var i = 0; i < Math.max(0, lives); i++) hearts += "\u2665 ";
  livesUI.textContent = hearts.trim() || "\u2620";
  if (comboCount > 1 && comboTimer > 0) { comboUI.style.display = ""; comboUI.textContent = "\u00d7" + comboCount; }
  else { comboUI.style.display = "none"; }
}

function drawPixelShip(x, y, w, h, color, accent) {
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2 + 2, y - 2, w - 4, h - 6);
  ctx.fillRect(x - 1, y - h / 2 - 2, 3, 5);
  ctx.fillStyle = accent;
  ctx.fillRect(x - 1, y - 3, 3, 3);
  ctx.fillStyle = "#ff6600";
  ctx.fillRect(x - 2, y + h / 2 - 3, 2, 3);
  ctx.fillRect(x + 1, y + h / 2 - 3, 2, 3);
  if (player.shieldTimer > 0) {
    ctx.strokeStyle = "rgba(68,204,255,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}
function drawEnemyBasic(x, y) {
  ctx.fillStyle = "#ff4444"; ctx.fillRect(x - 6, y - 5, 12, 10); ctx.fillRect(x - 3, y - 7, 6, 4);
  ctx.fillStyle = "#ff8888"; ctx.fillRect(x - 1, y - 4, 3, 3);
  ctx.fillStyle = "#aa2222"; ctx.fillRect(x - 3, y + 3, 3, 2); ctx.fillRect(x + 1, y + 3, 3, 2);
}
function drawEnemyFast(x, y) {
  ctx.fillStyle = "#ffaa00"; ctx.fillRect(x - 4, y - 4, 8, 6);
  ctx.fillRect(x - 5, y - 2, 2, 3); ctx.fillRect(x + 3, y - 2, 2, 3);
  ctx.fillStyle = "#ffcc44"; ctx.fillRect(x - 1, y - 5, 2, 2);
}
function drawEnemyTank(x, y) {
  ctx.fillStyle = "#9944aa"; ctx.fillRect(x - 9, y - 7, 18, 14); ctx.fillRect(x - 6, y - 9, 12, 4);
  ctx.fillStyle = "#bb66cc"; ctx.fillRect(x - 3, y - 6, 6, 4);
  ctx.fillRect(x - 7, y + 3, 4, 3); ctx.fillRect(x + 3, y + 3, 4, 3);
}
function drawEnemySniper(x, y) {
  ctx.fillStyle = "#44aaff"; ctx.fillRect(x - 5, y - 8, 10, 16); ctx.fillRect(x - 2, y - 10, 4, 4);
  ctx.fillStyle = "#88ccff"; ctx.fillRect(x - 1, y - 7, 2, 12);
}
function drawAsteroid(x, y, w, h, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = "#665544"; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = "#887766"; ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
  ctx.fillStyle = "#554433"; ctx.fillRect(-1, -1, 3, 3);
  ctx.restore();
}
function drawPowerUp(x, y, type) {
  var px = Math.floor(x), py = Math.floor(y);
  var bob = Math.sin(frameCount * 0.15) * 1;
  var by = py + bob;
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(px - 6, by - 6, 12, 12);
  var color;
  switch (type) {
    case "weapon": color = "#ff8800"; break;
    case "rapid": color = "#00ff88"; break;
    case "shield": color = "#00aaff"; break;
    case "life": color = "#ff4488"; break;
    default: color = "#fff";
  }
  ctx.fillStyle = color; ctx.fillRect(px - 4, by - 4, 8, 8);
  ctx.fillStyle = "#fff";
  switch (type) {
    case "weapon": ctx.fillRect(px, by - 2, 1, 4); ctx.fillRect(px - 2, by + 1, 5, 1); break;
    case "rapid": ctx.fillRect(px - 1, by - 2, 2, 2); ctx.fillRect(px - 1, by + 1, 2, 2); break;
    case "shield": ctx.fillRect(px - 2, by - 1, 4, 2); ctx.fillRect(px - 1, by - 2, 2, 1); break;
    case "life": ctx.fillRect(px - 1, by - 1, 2, 2); ctx.fillRect(px - 2, by - 2, 1, 1); ctx.fillRect(px + 1, by - 2, 1, 1); break;
  }
}

function rectsCollide(a, b) {
  return a.x - a.w / 2 < b.x + b.w / 2 && a.x + a.w / 2 > b.x - b.w / 2 &&
         a.y - a.h / 2 < b.y + b.h / 2 && a.y + a.h / 2 > b.y - b.h / 2;
}
function update() {
  if (state !== STATE.PLAYING) return;
  frameCount++;
  difficulty = 1 + Math.floor(frameCount / 3000);
  screenShake *= 0.85;

  player.dx = 0; player.dy = 0;
  if (keys["TouchActive"]) {
    var tdx = touchTargetX - player.x, tdy = touchTargetY - player.y;
    var tdist = Math.sqrt(tdx * tdx + tdy * tdy);
    if (tdist > 1) { var ts = Math.min(tdist * 0.8, 4); player.dx = (tdx / tdist) * ts; player.dy = (tdy / tdist) * ts; }
  }
  if (keys["ArrowLeft"] || keys["a"]) player.dx = -1;
  if (keys["ArrowRight"] || keys["d"]) player.dx = 1;
  if (keys["ArrowUp"] || keys["w"]) player.dy = -1;
  if (keys["ArrowDown"] || keys["s"]) player.dy = 1;
  if (player.dx !== 0 && player.dy !== 0) { player.dx *= 0.7; player.dy *= 0.7; }
  player.x += player.dx * player.speed;
  player.y += player.dy * player.speed;
  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(H - player.h / 2, player.y));

  if (player.invincible > 0) player.invincible--;
  if (player.shieldTimer > 0) player.shieldTimer--;
  player.flashTimer++;

  var shooting = keys[" "] || mouseDown || touchShooting;
  if (shooting && player.fireTimer <= 0) {
    var rate = player.shieldTimer > 0 ? Math.max(4, Math.floor(player.fireRate / 3)) : player.fireRate;
    player.fireTimer = rate;
    sfxShoot();
    switch (player.weaponLevel) {
      case 1: bullets.push(createBullet(player.x + 8, player.y)); break;
      case 2:
        bullets.push(createBullet(player.x + 8, player.y - 3));
        bullets.push(createBullet(player.x + 8, player.y + 3)); break;
      case 3:
        bullets.push(createBullet(player.x + 8, player.y));
        bullets.push(createBullet(player.x + 8, player.y - 4, -0.5));
        bullets.push(createBullet(player.x + 8, player.y + 4, 0.5)); break;
      case 4:
        bullets.push(createBullet(player.x + 8, player.y));
        bullets.push(createBullet(player.x + 8, player.y - 5, -1));
        bullets.push(createBullet(player.x + 8, player.y + 5, 1)); break;
    }
  }
  player.fireTimer--;

  for (var bi = 0; bi < bullets.length; bi++) { bullets[bi].x += bullets[bi].dx; bullets[bi].y += bullets[bi].dy; }
  bullets = bullets.filter(function(b) { return b.x < W + 10; });
  for (var ebi = 0; ebi < enemyBullets.length; ebi++) { enemyBullets[ebi].x += enemyBullets[ebi].dx; enemyBullets[ebi].y += enemyBullets[ebi].dy; }
  enemyBullets = enemyBullets.filter(function(b) { return b.x > -10 && b.y > -10 && b.y < H + 10; });

  for (var ei = 0; ei < enemies.length; ei++) {
    var e = enemies[ei]; e.x += e.dx;
    if (e.fireTimer !== undefined) e.fireTimer--;
    if (e.flashTimer > 0) e.flashTimer--;
    if (e.fireRate > 0 && e.fireTimer <= 0) {
      e.fireTimer = e.fireRate;
      enemyBullets.push(createEnemyBullet(e.x - 8, e.y));
    }
  }
  enemies = enemies.filter(function(e) { return e.x > -30 && e.alive; });

  for (var ai = 0; ai < asteroids.length; ai++) { asteroids[ai].x += asteroids[ai].dx; asteroids[ai].y += asteroids[ai].dy; asteroids[ai].rot += asteroids[ai].rotSpeed; }
  asteroids = asteroids.filter(function(a) { return a.x > -30 && a.alive; });

  for (var pi = 0; pi < powerUps.length; pi++) { powerUps[pi].x += powerUps[pi].dx; powerUps[pi].life--; }
  powerUps = powerUps.filter(function(p) { return p.x > -20 && p.life > 0 && p.alive; });

  for (var pti = 0; pti < particles.length; pti++) { particles[pti].x += particles[pti].dx; particles[pti].y += particles[pti].dy; particles[pti].life--; }
  particles = particles.filter(function(p) { return p.life > 0; });

  for (var si = 0; si < stars.length; si++) { stars[si].x -= stars[si].speed; if (stars[si].x < -2) { stars[si].x = W + 2; stars[si].y = Math.random() * H; } }

  if (comboTimer > 0) { comboTimer--; if (comboTimer <= 0) comboCount = 0; }

  spawnTimer++;
  var spawnInterval = Math.max(10, 35 - difficulty * 3);
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    if (difficulty >= 5 && Math.random() < 0.3) { enemies.push(createEnemy("basic")); }
    var r = Math.random();
    if (r < 0.5) enemies.push(createEnemy("basic"));
    else if (r < 0.75) enemies.push(createEnemy("fast"));
    else if (r < 0.9) enemies.push(createEnemy("tank"));
    else enemies.push(createEnemy("sniper"));
  }

  asteroidTimer++;
  if (asteroidTimer >= Math.max(12, 45 - difficulty * 4)) {
    asteroidTimer = 0; asteroids.push(createAsteroid());
  }

  for (var bbi = 0; bbi < bullets.length; bbi++) {
    var bl = bullets[bbi];
    for (var eni = 0; eni < enemies.length; eni++) {
      var en = enemies[eni];
      if (!en.alive) continue;
      if (rectsCollide(bl, { x: en.x, y: en.y, w: en.w, h: en.h })) {
        bl.x = 999; en.hp--; en.flashTimer = 4; sfxHit();
        if (en.hp <= 0) {
          en.alive = false; comboCount++; comboTimer = 120;
          score += en.score * comboCount; sfxExplode();
          screenShake = Math.min(screenShake + 3, 8);
          particles = particles.concat(createParticle(en.x, en.y, "#ff6666", 12));
          if (Math.random() < 0.15 || (en.type === "tank" && Math.random() < 0.5)) {
            powerUps.push(createPowerUp(en.x, en.y));
          }
        }
        break;
      }
    }
  }

  for (var bai = 0; bai < bullets.length; bai++) {
    var bLa = bullets[bai];
    for (var asi = 0; asi < asteroids.length; asi++) {
      var ast = asteroids[asi];
      if (!ast.alive) continue;
      if (rectsCollide(bLa, { x: ast.x, y: ast.y, w: ast.w, h: ast.h })) {
        bLa.x = 999; ast.hp--; sfxHit();
        if (ast.hp <= 0) {
          ast.alive = false; score += 50;
          particles = particles.concat(createParticle(ast.x, ast.y, "#886644", 8));
        }
        break;
      }
    }
  }

  if (player.invincible <= 0) {
    var hit = false;
    for (var pei = 0; pei < enemies.length; pei++) {
      var pe = enemies[pei];
      if (!pe.alive) continue;
      if (rectsCollide(player, { x: pe.x, y: pe.y, w: pe.w, h: pe.h })) {
        pe.alive = false; hit = true;
        particles = particles.concat(createParticle(pe.x, pe.y, "#ff4444", 16)); break;
      }
    }
    if (!hit) for (var pai = 0; pai < asteroids.length; pai++) {
      var pa = asteroids[pai];
      if (!pa.alive) continue;
      if (rectsCollide(player, { x: pa.x, y: pa.y, w: pa.w, h: pa.h })) {
        pa.alive = false; hit = true;
        particles = particles.concat(createParticle(pa.x, pa.y, "#886644", 10)); break;
      }
    }
    if (!hit) for (var pbi = 0; pbi < enemyBullets.length; pbi++) {
      var pb = enemyBullets[pbi];
      if (rectsCollide(player, { x: pb.x, y: pb.y, w: 4, h: 4 })) {
        pb.x = 999; hit = true; break;
      }
    }
    if (hit) {
      if (player.shieldTimer > 0) {
        player.shieldTimer = 0; screenShake = 2; sfxHit(); player.invincible = 30;
      } else {
        lives--; comboCount = 0; comboTimer = 0;
        screenShake = 10; sfxDie();
        particles = particles.concat(createParticle(player.x, player.y, "#ffffff", 20));
        if (lives <= 0) { gameOver(); }
        else { player.invincible = 90; player.weaponLevel = Math.max(1, player.weaponLevel - 1); }
      }
    }
  }

  for (var ppi = 0; ppi < powerUps.length; ppi++) {
    var pp = powerUps[ppi];
    if (!pp.alive) continue;
    if (rectsCollide(player, { x: pp.x, y: pp.y, w: pp.w, h: pp.h })) {
      pp.alive = false; sfxPowerUp();
      switch (pp.type) {
        case "weapon": player.weaponLevel = Math.min(player.weaponLevel + 1, 4); break;
        case "rapid": player.fireRate = Math.max(4, player.fireRate - 2);
                      player.shieldTimer = Math.max(player.shieldTimer, 180); break;
        case "shield": player.shieldTimer = 300; break;
        case "life": lives = Math.min(lives + 1, 5); break;
      }
    }
  }
  updateUI();
}

function draw() {
  ctx.fillStyle = "#0a0a14"; ctx.fillRect(0, 0, W, H);
  var sx = Math.sin(screenShake * 0.8) * screenShake * 0.4;
  var sy = Math.cos(screenShake * 0.6) * screenShake * 0.4;
  ctx.save(); ctx.translate(sx, sy);

  for (var si = 0; si < stars.length; si++) {
    var s = stars[si];
    ctx.fillStyle = "rgba(255,255,255," + s.brightness + ")";
    ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
  }

  for (var ppi = 0; ppi < powerUps.length; ppi++) { var pp = powerUps[ppi]; if (pp.alive) drawPowerUp(pp.x, pp.y, pp.type); }

  for (var ai = 0; ai < asteroids.length; ai++) { var a = asteroids[ai]; if (a.alive) drawAsteroid(a.x, a.y, a.w, a.h, a.rot); }

  ctx.fillStyle = "#ff6666";
  for (var ebi = 0; ebi < enemyBullets.length; ebi++) { var eb = enemyBullets[ebi]; ctx.fillRect(eb.x - 1, eb.y - 1, 3, 3); }

  ctx.fillStyle = "#00ffff";
  for (var bi = 0; bi < bullets.length; bi++) { var b = bullets[bi]; ctx.fillRect(b.x, b.y - 1, b.w, b.h); }

  for (var ei = 0; ei < enemies.length; ei++) {
    var e = enemies[ei];
    if (!e.alive) continue;
    if (e.flashTimer > 0) ctx.globalAlpha = 0.5 + Math.sin(e.flashTimer) * 0.5;
    switch (e.type) {
      case "basic": drawEnemyBasic(e.x, e.y); break;
      case "fast": drawEnemyFast(e.x, e.y); break;
      case "tank": drawEnemyTank(e.x, e.y); break;
      case "sniper": drawEnemySniper(e.x, e.y); break;
    }
    ctx.globalAlpha = 1;
  }

  if (player.invincible <= 0 || player.flashTimer % 6 < 3) {
    drawPixelShip(player.x, player.y, player.w, player.h,
      player.shieldTimer > 0 ? "#44ccff" : "#44ff88",
      player.shieldTimer > 0 ? "#88eeff" : "#88ffaa");
    // shield rendered in drawPixelShip
  }

  for (var pti = 0; pti < particles.length; pti++) {
    var p = particles[pti];
    var alpha = p.life / p.maxLife;
    if (p.color.charAt(0) === "#") {
      var rr = parseInt(p.color.slice(1, 3), 16);
      var gg = parseInt(p.color.slice(3, 5), 16);
      var bb = parseInt(p.color.slice(5, 7), 16);
      ctx.fillStyle = "rgba(" + rr + "," + gg + "," + bb + "," + alpha + ")";
    }
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
  }
  ctx.restore();

  if (state === STATE.PAUSED) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; ctx.font = "bold 20px Courier New"; ctx.textAlign = "center";
    ctx.fillText("PAUSED", W / 2, H / 2 - 4);
    ctx.font = "10px Courier New"; ctx.fillText("Press P", W / 2, H / 2 + 14);
    ctx.textAlign = "start";
  }

  if (state === STATE.MENU) {
    for (var si = 0; si < stars.length; si++) {
      var s = stars[si]; s.x -= s.speed * 0.5;
      if (s.x < -2) { s.x = W + 2; s.y = Math.random() * H; }
      ctx.fillStyle = "rgba(255,255,255," + (s.brightness * 0.4) + ")";
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    }
  }
}

function gameOver() {
  state = STATE.GAMEOVER;
  if (score > highScore) { highScore = score; localStorage.setItem("pxsh_hs", String(highScore)); }
  finalScore.textContent = "SCORE " + score;
  highScoreDisplay.textContent = "HIGH " + highScore;
  gameOverScreen.style.display = "flex"; updateUI();
}

// ── Supabase Leaderboard ──
function saveScoreSupabase(s) {
  if (!supabase) { saveScoreLocal(s); return; }
  var uname = getCurrentUsername();
  if (!uname) { saveScoreLocal(s); return; }
  supabase.auth.getSession().then(function(res) {
    if (!res.data.session) { saveScoreLocal(s); return; }
    var userId = res.data.session.user.id;
    // Insert score, on conflict keep higher score per user
    supabase
      .from("scores")
      .upsert({
        user_id: userId,
        username: uname,
        score: s,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })
      .then(function() {})
      .catch(function() { saveScoreLocal(s); });
  }).catch(function() { saveScoreLocal(s); });
}

function saveScoreLocal(s) {
  var today = new Date().toISOString().slice(0, 10);
  var data = JSON.parse(localStorage.getItem("pxsh_lb") || "[]");
  data.push({ score: s, date: today, time: new Date().toISOString() });
  data.sort(function(a, b) { return b.score - a.score; });
  data = data.slice(0, 100);
  localStorage.setItem("pxsh_lb", JSON.stringify(data));
}

function renderLB() {
  var list = document.getElementById("lb-list");
  if (!list) return;
  list.innerHTML = '<div class="lb-empty">加载中...</div>';

  if (!supabase) {
    renderLBLocal();
    return;
  }

  supabase
    .from("scores")
    .select("username, score")
    .order("score", { ascending: false })
    .limit(50)
    .then(function(res) {
      if (res.error || !res.data || res.data.length === 0) {
        renderLBLocal();
        return;
      }
      list.innerHTML = "";
      var seen = {};
      for (var i = 0; i < res.data.length; i++) {
        var item = res.data[i];
        // Deduplicate by username, keep highest score
        if (seen[item.username]) continue;
        seen[item.username] = true;
        var rank = list.children.length + 1;
        var medal = rank === 1 ? "\uD83E\uDD47" : rank === 2 ? "\uD83E\uDD48" : rank === 3 ? "\uD83E\uDD49" : "";
        var rankStr = rank === 1 ? "1ST" : rank === 2 ? "2ND" : rank === 3 ? "3RD" : rank;
        list.innerHTML += '<div class="lb-row"><span class="lb-rank">' + medal + ' ' + rankStr + '</span><span class="lb-name">' + escapeHtml(item.username) + '</span><span class="lb-score">' + item.score + '</span></div>';
      }
    })
    .catch(function() { renderLBLocal(); });
}

function renderLBLocal() {
  var today = new Date().toISOString().slice(0, 10);
  var data = JSON.parse(localStorage.getItem("pxsh_lb") || "[]");
  var todayList = data.filter(function(d) { return d.date === today; }).slice(0, 10);
  var list = document.getElementById("lb-list");
  if (!list) return;
  list.innerHTML = "";
  if (todayList.length === 0) {
    list.innerHTML = '<div class="lb-empty">还没有记录</div>';
    return;
  }
  for (var i = 0; i < todayList.length; i++) {
    var item = todayList[i];
    var rank = i === 0 ? "1ST" : i === 1 ? "2ND" : i === 2 ? "3RD" : (i + 1);
    var medal = i === 0 ? "\uD83E\uDD47" : i === 1 ? "\uD83E\uDD48" : i === 2 ? "\uD83E\uDD49" : "";
    list.innerHTML += '<div class="lb-row"><span class="lb-rank">' + medal + ' ' + rank + '</span><span class="lb-score">' + item.score + '</span></div>';
  }
}

function toggleLB() {
  var panel = document.getElementById("lb-panel");
  if (!panel) return;
  if (panel.style.display === "flex") { panel.style.display = "none"; return; }
  renderLB();
  panel.style.display = "flex";
}

function escapeHtml(s) {
  var d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }

stars = [];
for (var i = 0; i < 80; i++) {
  stars.push({ x: Math.random() * W, y: Math.random() * H, speed: 0.3 + Math.random() * 0.7,
    size: Math.random() < 0.1 ? 2 : 1, brightness: 0.4 + Math.random() * 0.6 });
}
player = createPlayer();
bullets = []; enemyBullets = []; enemies = []; asteroids = []; powerUps = []; particles = [];
score = 0; lives = 3;
highScoreDisplay.textContent = "HIGH " + highScore;
updateUI();
gameLoop();








