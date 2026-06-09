/**
 * ============================================================
 *  极速逃亡 - Parkour Runner (跑酷游戏)
 *  腾讯青训营 tCamp 课程项目
 *  技术栈: HTML5 Canvas + Vanilla JS
 * ============================================================
 */

// ===================== 配置常量 =====================
const CONFIG = {
  // 画布 - 优化视口比例
  DESIGN_WIDTH: 400,
  DESIGN_HEIGHT: 750,
  VIEWPORT_FOCUS: 0.65,   // 地面线位置(65%聚焦核心游戏区)

  // 跑道
  LANE_COUNT: 3,
  LANE_WIDTH: 130,
  GROUND_Y_RATIO: 0.65,  // 统一使用 VIEWPORT_FOCUS
  GROUND_SPEED: 6,

  // 玩家 - 跳跃精准调校
  PLAYER_SIZE: 40,
  PLAYER_Y_OFFSET: 80,
  JUMP_FORCE: 14,       // 22→14 合理跳跃高度
  JUMP_GRAVITY: 0.8,    // 0.5→0.8 下降更自然
  SLIDE_DURATION: 600,
  SWIPE_THRESHOLD: 35,

  // 障碍物 - 三层高度系统
  OBSTACLE_MIN_GAP: 400,       // 最小间距(ms) 350→400
  OBSTACLE_MAX_ON_SCREEN: 3,   // 同屏最大数量 4→3
  OBSTACLE_MIN_LANE_GAP: 2,    // 连续障碍物最小跨车道数(避免同车道连出)
  OBSTACLE_TYPES: ['tier_high', 'tier_mid', 'tier_low'],  // 高/中/低三档
  OBSTACLE_HEIGHT: {
    tier_high: 75,   // 高障碍(如火车) - 必须换道
    tier_mid: 50,    // 中障碍(如路障) - 跳跃可过
    tier_low: 22,    // 低障碍(如矮栏) - 滑铲或跳跃均可过
  },

  // 道具
  COIN_VALUE: 10,
  MAGNET_DURATION: 6000,
  INVINCIBLE_DURATION: 5000,
  SPEED_BOOST_DURATION: 4000,
  DOUBLE_SCORE_DURATION: 8000,
  POWERUP_DROP_CHANCE: 0.15,

  // 难度
  INITIAL_SPEED: 5,
  MAX_SPEED: 16,
  SPEED_INCREMENT: 0.0004,

  // 分数
  SCORE_DISTANCE_MULT: 0.1,

  // 精灵表动画帧 (600x636, 实际帧位置非均匀排列)
  SPRITE_SHEET: 'assets/characters/sprites.png',
  SPRITE_FRAME_W: 120,
  SPRITE_FRAME_H: 212,
  // Frame数组: [srcX, srcY, srcW, srcH] — 经像素分析获得的精确位置
  SPRITE_RUN: [      // 第2行 (y=212): 跑动动画
    [13,  212, 57, 212],
    [85,  212, 71, 212],
    [190, 212, 48, 212],
    [264, 212, 48, 212],
    [344, 212, 58, 212],
  ],
  SPRITE_JUMP: [     // 第1行 (y=0): 跳跃动画
    [22, 0,   53, 212],
    [96, 0,   65, 212],
  ],
  SPRITE_SLIDE: [    // 第3行 (y=424): 滑铲/射击动画
    [21,  424, 60, 212],
    [98,  424, 70, 212],
  ],

  // 角色系统 - 8角色完整体系
  CHARACTERS: [
    { id: 'default',  name: '疾风',   color: '#4ecdc4', price: 0,    rarity: '普通', desc: '均衡战士，初代跑者',     attr: { speed:1.0, jump:1.0, coin:1.0, shield:0 }, skill: '无',   emoji: '🏃', bg: '曾是街头跑酷少年', style: { type: 'default', headband: '#4ecdc4', trail: '#4ecdc480' } },
    { id: 'blaze',    name: '赤焰',   color: '#ff4757', price: 300,  rarity: '稀有', desc: '火焰速度+20%',             attr: { speed:1.2, jump:1.0, coin:1.0, shield:0 }, skill: '疾跑', emoji: '🔥', bg: '火山熔岩中觉醒的跑者', style: { type: 'fire', headband: '#ff4757', trail: '#ff475780', particles: { color: '#ff6b35', count: 3 } } },
    { id: 'gold',     name: '金辉',   color: '#ffd700', price: 600,  rarity: '史诗', desc: '金币收入+40%',             attr: { speed:1.0, jump:1.0, coin:1.4, shield:0 }, skill: '聚财', emoji: '💰', bg: '古代宝藏守护者转世', style: { type: 'gold', headband: '#ffd700', trail: '#ffd70080', particles: { color: '#ffd700', count: 5 }, glow: true } },
    { id: 'shadow',   name: '暗影',   color: '#a855f7', price: 1000, rarity: '传说', desc: '跳跃+25%，开局护盾5s',    attr: { speed:1.0, jump:1.25,coin:1.0, shield:5000 }, skill: '影遁', emoji: '🌑', bg: '暗影位面的使者', style: { type: 'shadow', headband: '#a855f7', trail: '#a855f780', particles: { color: '#a855f7', count: 4 }, afterimage: true } },
    { id: 'frost',    name: '冰霜',   color: '#74b9ff', price: 800,  rarity: '史诗', desc: '滑铲时长+50%，冷却减半',   attr: { speed:0.95,jump:1.0, coin:1.1, slide:900 }, skill: '冰滑', emoji: '❄️', bg: '极地冰原的幸存者', style: { type: 'ice', headband: '#74b9ff', trail: '#74b9ff80', particles: { color: '#dfe6e9', count: 4 }, frost: true } },
    { id: 'thunder',  name: '雷霆',   color: '#fdcb6e', price: 800,  rarity: '史诗', desc: '磁铁拾取范围+50%',         attr: { speed:1.1, jump:1.0, coin:1.1, magnet:1.5 }, skill: '磁暴', emoji: '⚡', bg: '被闪电击中的科学家', style: { type: 'thunder', headband: '#fdcb6e', trail: '#fdcb6e80', particles: { color: '#ffeaa7', count: 3 }, glow: true } },
    { id: 'guardian', name: '守护',   color: '#55efc4', price: 1200, rarity: '传说', desc: '受到伤害后无敌3s',          attr: { speed:1.0, jump:1.0, coin:1.0, iFrame:3000 }, skill: '铁壁', emoji: '🛡️', bg: '古代神殿的守护灵', style: { type: 'guardian', headband: '#55efc4', trail: '#55efc480', shield: true } },
    { id: 'phantom',  name: '幻影',   color: '#dfe6e9', price: 1500, rarity: '传说', desc: '换道速度翻倍+开局双倍5s',  attr: { speed:1.05,jump:1.1, coin:1.15,boost:5000 }, skill: '幻象', emoji: '👻', bg: '时空裂隙中的旅人', style: { type: 'phantom', headband: '#dfe6e9', trail: '#dfe6e980', afterimage: true, particles: { color: '#dfe6e9', count: 6 } } },
  ],
  CHASER_IMG: 'assets/characters/chaser.jpg',
  CHASER_BACK_IMG: 'assets/characters/chaser_back.png',

  // 游戏模式
  GAME_MODES: [
    { id: 'endless', name: '无尽模式', icon: '♾️', desc: '一直跑下去，挑战最高分！', timeLimit: 0 },
    { id: 'challenge', name: '限时挑战', icon: '⏱️', desc: '60秒内尽可能多得高分', timeLimit: 60 },
    { id: 'rush', name: '金币冲刺', icon: '🪙', desc: '45秒内收集最多金币', timeLimit: 45 },
  ],

  // 随机事件
  RANDOM_EVENTS: [
    { id: 'coin_rain', name: '金币雨', desc: '天降大量金币!', duration: 3000, icon: '🪙' },
    { id: 'slow_mo', name: '时间减速', desc: '世界变慢了...', duration: 4000, icon: '🐌' },
    { id: 'obstacle_storm', name: '障碍风暴', desc: '小心!大量障碍来袭', duration: 5000, icon: '🌪️' },
  ],

  // 商店物品 - 扩充品类与稀有度
  SHOP_ITEMS: [
    // 消耗品
    { id: 'magnet_pack', name: '磁铁', icon: '🧲', desc: '自动吸取金币', price: 150, type: 'consumable', category: '消耗品', rarity: '普通' },
    { id: 'shield_pack', name: '护盾', icon: '🛡️', desc: '暂时无敌', price: 200, type: 'consumable', category: '消耗品', rarity: '稀有' },
    { id: 'speed_pack', name: '加速鞋', icon: '⚡', desc: '速度翻倍', price: 250, type: 'consumable', category: '消耗品', rarity: '史诗' },
    { id: 'revive', name: '复活卡', icon: '💫', desc: '死亡后复活', price: 500, type: 'consumable', category: '消耗品', rarity: '传说' },
    // 增益道具
    { id: 'double_pack', name: '双倍卡', icon: 'x2', desc: '分数翻倍', price: 300, type: 'consumable', category: '增益', rarity: '史诗' },
    { id: 'headstart', name: '领跑器', icon: '🚀', desc: '开局领先1000m', price: 400, type: 'consumable', category: '增益', rarity: '稀有' },
  ],
};

// ===================== 本地存储 =====================
const Storage = {
  get(key, def = 0) {
    try { const v = localStorage.getItem('runner_' + key); return v !== null ? JSON.parse(v) : def; }
    catch (e) { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('runner_' + key, JSON.stringify(val)); } catch (e) {}
  },
  getCoins() { return this.get('coins', 0); },
  addCoins(n) { this.set('coins', this.getCoins() + n); },
  getHighScore() { return this.get('highScore', 0); },
  setHighScore(s) { if (s > this.getHighScore()) this.set('highScore', s); },
  getSelectedChar() { return this.get('selectedChar', 'default'); },
  setSelectedChar(id) { this.set('selectedChar', id); },
  unlockChar(id) {
    const chars = this.get('unlockedChars', ['default']);
    if (!chars.includes(id)) { chars.push(id); this.set('unlockedChars', chars); }
  },
  isCharUnlocked(id) { return this.get('unlockedChars', ['default']).includes(id); },
  getLeaderboard() { return this.get('leaderboard', []); },
  addScore(score) {
    const board = this.getLeaderboard();
    board.push({ score, date: new Date().toLocaleDateString() });
    board.sort((a, b) => b.score - a.score);
    this.set('leaderboard', board.slice(0, 10));
  },
  getItemCount(id) { return this.get('item_' + id, 0); },
  setItemCount(id, n) { this.set('item_' + id, n); },
  addItem(id, n = 1) { this.setItemCount(id, this.getItemCount(id) + n); },
  useItem(id) { const c = this.getItemCount(id); if (c > 0) { this.setItemCount(id, c - 1); return true; } return false; },
  getSettings() { return this.get('settings', { bgm: true, sfx: true, quality: 'medium', sensitivity: 3 }); },
  setSettings(s) { this.set('settings', s); },
  resetAll() { ['coins','highScore','selectedChar','unlockedChars','leaderboard','item_magnet_pack','item_shield_pack','item_speed_pack','item_revive'].forEach(k => { try { localStorage.removeItem('runner_' + k); } catch(e) {} }); },
};

// ===================== 音效系统 (Web Audio API 程序化生成) =====================
const Audio = {
  ctx: null,
  bgmOn: true,
  sfxOn: true,
  bgmNode: null,
  bgmGain: null,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.bgmOn = Storage.getSettings().bgm;
      this.sfxOn = Storage.getSettings().sfx;
    } catch (e) { /* no audio */ }
  },

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  playTone(freq, duration, type = 'square', volume = 0.08) {
    if (!this.ctx || !this.sfxOn) return;
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  sfxJump() { this.playTone(600, 0.12, 'square', 0.06); setTimeout(() => this.playTone(900, 0.1, 'square', 0.05), 60); },
  sfxSlide() { this.playTone(200, 0.2, 'sawtooth', 0.05); },
  sfxCoin() { this.playTone(1200, 0.08, 'sine', 0.07); setTimeout(() => this.playTone(1600, 0.1, 'sine', 0.06), 50); },
  sfxHit() { this.playTone(100, 0.3, 'sawtooth', 0.1); this.playTone(60, 0.5, 'triangle', 0.12); },
  sfxPowerUp() {
    [400, 600, 800, 1000].forEach((f, i) => setTimeout(() => this.playTone(f, 0.1, 'square', 0.06), i * 60));
  },
  sfxSelect() { this.playTone(800, 0.06, 'sine', 0.06); },

  startBGM() {
    if (!this.ctx || !this.bgmOn || this.bgmNode) return;
    this.ensureContext();
    // 简单的低音节拍循环
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.03;
    this.bgmGain.connect(this.ctx.destination);
    this._bgmBeat();
  },

  _bgmBeat() {
    if (!this.bgmOn || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 110 + Math.random() * 20;
    g.gain.setValueAtTime(0.04, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
    this.bgmNode = setTimeout(() => this._bgmBeat(), 400);
  },

  stopBGM() {
    if (this.bgmNode) { clearTimeout(this.bgmNode); this.bgmNode = null; }
  },

  toggleBGM(on) { this.bgmOn = on; if (!on) this.stopBGM(); },
  toggleSFX(on) { this.sfxOn = on; },
};

// ===================== 游戏状态机 =====================
const GameState = {
  MENU: 'menu',
  CHARACTER_SELECT: 'character',
  SHOP: 'shop',
  LEADERBOARD: 'leaderboard',
  SETTINGS: 'settings',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
};

// ===================== 输入处理 =====================
const Input = {
  keys: {},
  touchStart: null,
  touchEnd: null,
  sensitivity: 3,

  init() {
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });

    // 使用 document 级触摸监听，避免 HUD 覆盖层拦截事件
    document.addEventListener('touchstart', e => {
      if (Game.state !== GameState.PLAYING) return;
      const t = e.touches[0];
      this.touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
    }, { passive: true });
    document.addEventListener('touchend', e => {
      if (Game.state !== GameState.PLAYING) return;
      const t = e.changedTouches[0];
      this.touchEnd = { x: t.clientX, y: t.clientY, time: Date.now() };
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      if (Game.state !== GameState.PLAYING) return;
      e.preventDefault();
    }, { passive: false });
  },

  getSwipe() {
    if (!this.touchStart || !this.touchEnd) return null;
    const dx = this.touchEnd.x - this.touchStart.x;
    const dy = this.touchEnd.y - this.touchStart.y;
    const dt = this.touchEnd.time - this.touchStart.time;
    const threshold = 60 - (this.sensitivity - 1) * 10; // 灵敏度越高，阈值越低
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
    if (dt > 500) return null;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    else return dy > 0 ? 'down' : 'up';
  },

  clearSwipe() { this.touchStart = null; this.touchEnd = null; },

  // 键盘方向
  left() { return this.keys['ArrowLeft'] || this.keys['KeyA']; },
  right() { return this.keys['ArrowRight'] || this.keys['KeyD']; },
  up() { return this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']; },
  down() { return this.keys['ArrowDown'] || this.keys['KeyS']; },

  consumeKey(code) { this.keys[code] = false; },
};

// ===================== 精灵系统 (带角色特效) =====================
const SpriteSystem = {
  sheet: null,
  loaded: false,

  init() {
    this.sheet = new Image();
    this.sheet.onload = () => { this.loaded = true; };
    this.sheet.src = CONFIG.SPRITE_SHEET;
  },

  // 渲染带角色风格的基础精灵
  drawCharacter(ctx, player, style) {
    if (!this.loaded || !this.sheet) return false;
    const scale = Game.scale;
    const x = player.x;
    const y = player.y;
    const w = player.width * scale;
    const h = player.height * scale;

    let frames, frameIdx;
    if (player.isJumping) { frames = CONFIG.SPRITE_JUMP; frameIdx = player.animFrame % frames.length; }
    else if (player.isSliding) { frames = CONFIG.SPRITE_SLIDE; frameIdx = player.animFrame % frames.length; }
    else { frames = CONFIG.SPRITE_RUN; frameIdx = player.animFrame % frames.length; }

    if (player.isInvincible && Math.floor(Date.now() / 80) % 2 === 0) ctx.globalAlpha = 0.5;

    const f = frames[frameIdx % frames.length];
    const fw = CONFIG.SPRITE_FRAME_W;
    const fh = CONFIG.SPRITE_FRAME_H;

    // 残影效果 (暗影/幻影)
    if (style && style.afterimage && style._lastPositions) {
      ctx.globalAlpha = 0.15;
      style._lastPositions.forEach((pos, i) => {
        ctx.drawImage(this.sheet, f[0], f[1], f[2], f[3], pos.x - w / 2, pos.y - h, w, h);
      });
      ctx.globalAlpha = player.isInvincible && Math.floor(Date.now() / 80) % 2 === 0 ? 0.5 : 1;

      if (!style._lastPositions) style._lastPositions = [];
      style._lastPositions.push({ x, y });
      if (style._lastPositions.length > 3) style._lastPositions.shift();
    }

    // 护盾光环
    if (style && style.shield && !player.isInvincible) {
      ctx.strokeStyle = style.headband + '60';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(x, y - h * 0.5, w * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 绘制主精灵
    const off = SpriteSystem._getOffscreen();
    const oc = off.getContext('2d');
    off.width = fw; off.height = fh;
    oc.clearRect(0, 0, fw, fh);
    oc.drawImage(this.sheet, f[0], f[1], f[2], f[3], 0, 0, fw, fh);

    // 颜色叠加
    if (style && style.headband) {
      oc.globalCompositeOperation = 'source-atop';
      oc.fillStyle = style.headband;
      oc.fillRect(0, 0, fw, fh);
      oc.globalCompositeOperation = 'destination-atop';
      oc.drawImage(this.sheet, f[0], f[1], f[2], f[3], 0, 0, fw, fh);
      oc.globalCompositeOperation = 'source-over';
    }

    // 冰霜效果: 叠加蓝色高光
    if (style && style.frost) {
      oc.globalCompositeOperation = 'lighter';
      const frostGrad = oc.createLinearGradient(0, 0, 0, fh);
      frostGrad.addColorStop(0, 'rgba(180,220,255,0.3)');
      frostGrad.addColorStop(1, 'rgba(180,220,255,0)');
      oc.fillStyle = frostGrad;
      oc.fillRect(0, 0, fw, fh);
      oc.globalCompositeOperation = 'source-over';
    }

    ctx.drawImage(off, x - w / 2, y - h, w, h);

    // 发光效果 (黄金/雷霆)
    if (style && style.glow) {
      ctx.shadowColor = style.headband;
      ctx.shadowBlur = 15 * scale;
      ctx.drawImage(off, x - w / 2, y - h, w, h);
      ctx.shadowBlur = 0;
    }

    // 粒子特效
    if (style && style.particles && Math.random() < 0.3) {
      const px = x + (Math.random() - 0.5) * w * 0.3;
      const py = y - h + Math.random() * h * 0.5;
      Particles.emit(px, py, style.particles.count || 2, style.particles.color, 1);
    }

    // 运动拖尾
    if (style && style.trail && !player.isSliding) {
      ctx.fillStyle = style.trail;
      ctx.fillRect(x - 2 * scale, y - h * 0.8, 4 * scale, 3 * scale);
    }

    ctx.globalAlpha = 1;
    return true;
  },

  _offscreen: null,
  _getOffscreen() {
    if (!this._offscreen) this._offscreen = document.createElement('canvas');
    return this._offscreen;
  },
};

const ImageLoader = {
  images: {},
  loaded: false,
  loadCount: 0,
  totalCount: 0,

  preload() {
    this.loaded = false;
    this.loadCount = 0;
    const toLoad = [];
    // 追击者图
    if (CONFIG.CHASER_IMG) toLoad.push({ key: 'chaser', path: CONFIG.CHASER_IMG });
    if (CONFIG.CHASER_BACK_IMG) toLoad.push({ key: 'chaser_back', path: CONFIG.CHASER_BACK_IMG });

    if (toLoad.length === 0) { this.loaded = true; return; }
    this.totalCount = toLoad.length;
    toLoad.forEach(({ key, path }) => {
      const img = new Image();
      img.onload = () => { this.loadCount++; if (this.loadCount >= this.totalCount) this.loaded = true; };
      img.onerror = () => { this.loadCount++; if (this.loadCount >= this.totalCount) this.loaded = true; };
      img.src = path;
      this.images[key] = img;
    });
  },

  get(key) { return this.images[key]; },
};

const Player = {
  x: 0, y: 0,
  lane: 1,
  width: 50, height: 80,
  vy: 0,
  isJumping: false,
  isSliding: false,
  slideTimer: 0,
  isInvincible: false,
  invincibleTimer: 0,
  animFrame: 0,
  animTimer: 0,
  charId: 'default',
  charColor: null,
  charAttr: null,
  charStyle: null,

  init() {
    this.lane = 1;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.vy = 0;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.charId = Storage.getSelectedChar();
    const ch = CONFIG.CHARACTERS.find(c => c.id === this.charId);
    this.charColor = ch ? ch.color : null;
    this.charAttr = ch ? ch.attr : { speed: 1.0, jump: 1.0, coin: 1.0 };
    this.charStyle = ch ? ch.style : null;
    this._setPos();
  },

  _setPos() {
    const scale = Game.scale;
    const laneCenterX = Game._cssW / 2 + (this.lane - 1) * CONFIG.LANE_WIDTH * scale;
    this.x = laneCenterX;
    this.y = Game._cssH * CONFIG.GROUND_Y_RATIO - CONFIG.PLAYER_Y_OFFSET * scale;
  },

  update(dt) {
    if (this.isInvincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }
    if (this.isJumping) {
      this.vy += CONFIG.JUMP_GRAVITY * dt * 0.06;
      this.y += this.vy * Game.scale * dt * 0.06;
      const groundY = Game._cssH * CONFIG.GROUND_Y_RATIO - CONFIG.PLAYER_Y_OFFSET * Game.scale;
      if (this.y >= groundY) { this.y = groundY; this.isJumping = false; this.vy = 0; }
    } else { this._setPos(); }
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) { this.isSliding = false; this.height = 80; }
    }
    this.animTimer += dt;
    const frameSpeed = this.isJumping ? 200 : 80;
    if (this.animTimer > frameSpeed) { this.animTimer = 0; this.animFrame++; }
  },

  jump() { if (!this.isJumping && !this.isSliding) { this.isJumping = true; this.vy = -CONFIG.JUMP_FORCE * (this.charAttr ? this.charAttr.jump : 1.0); Audio.sfxJump(); } },
  slide() { if (!this.isJumping && !this.isSliding) { this.isSliding = true; this.slideTimer = CONFIG.SLIDE_DURATION; this.height = 50; Audio.sfxSlide(); } },
  moveLeft() { if (this.lane > 0) { this.lane--; this._setPos(); } },
  moveRight() { if (this.lane < 2) { this.lane++; this._setPos(); } },
  moveCenter() { this.lane = 1; this._setPos(); },  // S键直达中间道

  draw(ctx) {
    const done = SpriteSystem.drawCharacter(ctx, this, this.charStyle);
    if (!done) {
      const scale = Game.scale;
      ctx.fillStyle = this.charColor || '#4ecdc4';
      const bh = this.isSliding ? 40 * scale : 70 * scale;
      ctx.fillRect(this.x - 20 * scale, this.y - bh, 40 * scale, bh);
    }
  },

  getHitbox() {
    const scale = Game.scale;
    const h = this.isSliding ? 40 * scale : 65 * scale;
    const w = 35 * scale;
    return { x: this.x - w / 2, y: this.y - h + 5 * scale, w, h };
  },
};

// ===================== 世界系统（障碍物、地面、背景） =====================
const World = {
  obstacles: [],
  coins: [],
  powerups: [],
  groundOffset: 0,
  bgOffset: 0,
  buildings: [],
  curSpeed: CONFIG.INITIAL_SPEED,
  spawnTimer: 0,
  coinSpawnTimer: 0,
  difficultyLevel: 1,

  init() {
    this.obstacles = [];
    this.coins = [];
    this.powerups = [];
    this.groundOffset = 0;
    this.bgOffset = 0;
    this.curSpeed = CONFIG.INITIAL_SPEED;
    this.spawnTimer = 0;
    this.coinSpawnTimer = 0;
    this.difficultyLevel = 1;
    this._generateBuildings();
  },

  _generateBuildings() {
    this.buildings = [];
    for (let i = 0; i < 8; i++) {
      this.buildings.push({
        x: Math.random() * Game._cssW,
        w: 40 + Math.random() * 80,
        h: 80 + Math.random() * 200,
        color: `hsl(${240 + Math.random() * 40}, 10%, ${15 + Math.random() * 15}%)`,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
  },

  update(dt) {
    const scale = Game.scale;
    this.groundOffset += this.curSpeed * scale * dt * 0.06;
    if (this.groundOffset > 40 * scale) this.groundOffset -= 40 * scale;

    // 移动障碍物
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.curSpeed * scale * dt * 0.06;
      if (obs.y > Game._cssH + 100) this.obstacles.splice(i, 1);
    }

    // 移动金币
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.y += this.curSpeed * scale * dt * 0.06;
      coin.animTimer = (coin.animTimer || 0) + dt;
      if (coin.magnetized) {
        const dx = Player.x - coin.x;
        const dy = Player.y - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) { coin.x += (dx / dist) * 3 * scale * dt * 0.06; coin.y += (dy / dist) * 3 * scale * dt * 0.06; }
      }
      if (coin.y > Game._cssH + 50) this.coins.splice(i, 1);
    }

    // 移动道具
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.y += this.curSpeed * scale * dt * 0.06;
      if (pu.y > Game._cssH + 50) this.powerups.splice(i, 1);
    }

    // 生成障碍物
    this.spawnTimer += dt;
    const minGap = Math.max(CONFIG.OBSTACLE_MIN_GAP - this.difficultyLevel * 10, 120);
    if (this.spawnTimer > minGap) {
      this.spawnTimer = 0;
      this._spawnObstacle();
    }

    // 生成金币
    this.coinSpawnTimer += dt;
    if (this.coinSpawnTimer > 300) {
      this.coinSpawnTimer = 0;
      this._spawnCoins();
    }

    // 难度递增
    this.curSpeed = Math.min(CONFIG.INITIAL_SPEED + Game.score * CONFIG.SPEED_INCREMENT, CONFIG.MAX_SPEED);
    this.difficultyLevel = Math.floor(Game.score / 500) + 1;
  },

  _spawnObstacle() {
    if (this.obstacles.length >= CONFIG.OBSTACLE_MAX_ON_SCREEN) return;

    const scale = Game.scale;
    const laneCenter = Game._cssW / 2;
    const laneWidth = CONFIG.LANE_WIDTH * scale;
    const types = CONFIG.OBSTACLE_TYPES;
    const tier = types[Math.floor(Math.random() * types.length)];

    // 智能车道选择: 避免连续同车道
    const lastObs = this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1] : null;
    let lane;
    if (lastObs && tier !== 'tier_high') {
      // 确保与前一个不在同一车道
      lane = (lastObs.lane + 1 + Math.floor(Math.random() * (CONFIG.LANE_COUNT - 1))) % CONFIG.LANE_COUNT;
    } else {
      lane = Math.floor(Math.random() * CONFIG.LANE_COUNT);
    }

    const baseH = CONFIG.OBSTACLE_HEIGHT[tier] * scale;
    let x, w, h = baseH;

    if (tier === 'tier_high') {
      // 火车: 占2车道
      const fromLeft = Math.random() < 0.5;
      x = fromLeft ? laneCenter - laneWidth * 0.25 : laneCenter + laneWidth * 0.25;
      w = laneWidth * 1.5;
      h = 70 * scale;
      lane = fromLeft ? 0 : 2; // 标记偏左/右
    } else if (tier === 'tier_mid') {
      x = laneCenter + (lane - 1) * laneWidth;
      w = laneWidth * 0.55;
      h = 48 * scale;
    } else {
      // tier_low: 矮障碍
      x = laneCenter + (lane - 1) * laneWidth;
      w = laneWidth * 0.5;
      h = 22 * scale;
    }

    // 严格间距校验
    const minSpacing = 250 * scale;
    const tooClose = this.obstacles.some(obs => Math.abs(obs.y - (-h)) < minSpacing);
    if (tooClose && this.obstacles.length > 0) return;

    this.obstacles.push({ tier, x, y: -h, w, h, lane, alpha: 1 });
  },

  _spawnCoins() {
    const scale = Game.scale;
    const laneCenter = Game._cssW / 2;
    const laneWidth = CONFIG.LANE_WIDTH * scale;
    const lane = Math.floor(Math.random() * 3);
    const x = laneCenter + (lane - 1) * laneWidth;
    const count = 3 + Math.floor(Math.random() * 5);

    for (let i = 0; i < count; i++) {
      this.coins.push({
        x,
        y: -(i * 45 * scale) - 100,
        animTimer: Math.random() * Math.PI * 2,
        collected: false,
        magnetized: false,
      });
    }

    // 概率生成道具
    if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
      const types = ['magnet', 'invincible', 'speed', 'double'];
      const putype = types[Math.floor(Math.random() * types.length)];
      this.powerups.push({
        type: putype,
        x,
        y: -(count * 45 * scale) - 120,
        w: 30 * scale,
        h: 30 * scale,
      });
    }
  },

  draw(ctx) {
    const scale = Game.scale;
    const gw = Game._cssW;
    const gh = Game._cssH;

    // --- 天空渐变 (提亮) ---
    const grad = ctx.createLinearGradient(0, 0, 0, gh);
    grad.addColorStop(0, '#1a1a50');
    grad.addColorStop(0.3, '#2a1a60');
    grad.addColorStop(0.55, '#3a2878');
    grad.addColorStop(0.7, '#1e2d50');
    grad.addColorStop(1, '#0d1525');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, gw, gh);

    // 上帝之光效果
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rayCount = 5;
    for (let i = 0; i < rayCount; i++) {
      const rx = (gw * 0.2) + (i / (rayCount - 1)) * (gw * 0.6);
      const ry = gh * 0.15;
      const gradR = ctx.createLinearGradient(rx, ry, rx + gw * 0.3, ry + gh * 0.5);
      gradR.addColorStop(0, 'rgba(120,100,255,0.06)');
      gradR.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradR;
      ctx.beginPath();
      ctx.moveTo(rx - gw * 0.15, ry);
      ctx.lineTo(rx + gw * 0.45, ry + gh * 0.6);
      ctx.lineTo(rx - gw * 0.45, ry + gh * 0.6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // --- 星星 ---
    ctx.fillStyle = '#fff';
    const seed = Math.floor(Game.score / 1000);
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 137 + seed * 73) % gw);
      const sy = ((i * 251 + seed * 47) % (gh * 0.5));
      const sr = 0.5 + (i % 3) * 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 远景建筑 ---
    for (const b of this.buildings) {
      let bx = b.x;
      bx -= b.speed * this.curSpeed * scale * 0.06 * 0.3;
      if (bx < -b.w) bx = gw;
      b.x = bx;
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, gh * CONFIG.GROUND_Y_RATIO - b.h, b.w, b.h);
    }

    // --- 地面 ---
    const groundY = gh * CONFIG.GROUND_Y_RATIO;
    ctx.fillStyle = '#34495e';   // 更亮的地面
    ctx.fillRect(0, groundY, gw, gh - groundY);

    // 地面纹理线
    ctx.strokeStyle = '#3d566e';
    ctx.lineWidth = 2 * scale;
    const lineSpacing = 40 * scale;
    const offset = this.groundOffset % lineSpacing;
    for (let x = -offset; x < gw + offset; x += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 20 * scale, gh);
      ctx.stroke();
    }

    // --- 跑道 ---
    const laneCenter = gw / 2;
    const laneWidth = CONFIG.LANE_WIDTH * scale;
    for (let i = 0; i < 3; i++) {
      const lx = laneCenter + (i - 1) * laneWidth;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(lx - laneWidth / 2, groundY, laneWidth, gh - groundY);
    }

    // 跑道分隔线
    ctx.setLineDash([8 * scale, 16 * scale]);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';  // 0.2→0.3
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(laneCenter - laneWidth / 2, groundY);
    ctx.lineTo(laneCenter - laneWidth / 2, gh);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(laneCenter + laneWidth / 2, groundY);
    ctx.lineTo(laneCenter + laneWidth / 2, gh);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- 障碍物 (三层高度系统 + 视觉提示) ---
    for (const obs of this.obstacles) {
      const bx = obs.x - obs.w / 2;
      const by = obs.y - obs.h;

      if (obs.tier === 'tier_high') {
        // 高障碍 - 火车(必须换道)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(bx, by, obs.w, obs.h);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(bx + obs.w * 0.7, by, obs.w * 0.3, obs.h);
        // 窗户 + 警告条纹
        ctx.fillStyle = '#ffd700';
        for (let wx = bx + 10 * scale; wx < bx + obs.w * 0.65; wx += 22 * scale) {
          ctx.fillRect(wx, by + 8 * scale, 14 * scale, 16 * scale);
        }
        // ⛔ 不可跳指示
        ctx.fillStyle = '#fff';
        ctx.font = `${10 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🚫换道', obs.x, by - 4 * scale);
      } else if (obs.tier === 'tier_mid') {
        // 中障碍 - 路障(跳跃可过)
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(bx + 3 * scale, by, obs.w - 6 * scale, obs.h * 0.6);
        ctx.fillRect(bx, by + obs.h * 0.55, obs.w, obs.h * 0.25);
        // 条纹
        ctx.fillStyle = '#fff';
        for (let sy = 0; sy < 2; sy++) {
          ctx.fillRect(bx + 5 * scale, by + sy * 10 * scale, obs.w - 10 * scale, 3 * scale);
        }
        // ⬆ 跳跃提示
        ctx.fillStyle = '#fff';
        ctx.font = `${10 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('⬆跳', obs.x, by - 4 * scale);
      } else {
        // 低障碍 - 矮栏(可跳或滑铲)
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(bx, by, obs.w, obs.h);
        // 顶部横线
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(bx, by, obs.w, 4 * scale);
        // ↙ 滑铲或跳指示
        ctx.fillStyle = '#fff';
        ctx.font = `${10 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('↙滑/跳', obs.x, by - 4 * scale);
      }

      // 脚下阴影提示
      const shadowY = Game._cssH * CONFIG.GROUND_Y_RATIO;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(bx + 2 * scale, shadowY - 3 * scale, obs.w - 4 * scale, 3 * scale);
    }

    // --- 金币 ---
    for (const coin of this.coins) {
      if (coin.collected) continue;
      const bounce = Math.sin(coin.animTimer * 0.005) * 3 * scale;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y + bounce, 12 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y + bounce, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('$', coin.x - 5 * scale, coin.y + bounce + 5 * scale);
    }

    // --- 道具 ---
    for (const pu of this.powerups) {
      ctx.fillStyle = this._powerupColor(pu.type);
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, pu.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `${16 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this._powerupIcon(pu.type), pu.x, pu.y + 6 * scale);
    }
  },

  _powerupColor(type) {
    switch (type) { case 'magnet': return '#3498db'; case 'invincible': return '#e74c3c'; case 'speed': return '#2ecc71'; case 'double': return '#f39c12'; default: return '#fff'; }
  },

  _powerupIcon(type) {
    switch (type) { case 'magnet': return '🧲'; case 'invincible': return '🛡️'; case 'speed': return '⚡'; case 'double': return 'x2'; default: return '?'; }
  },
};

// ===================== 碰撞检测 (简化版: 跳跃=免疫中低障碍) =====================
const Collision = {
  rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  checkObstacles() {
    if (Player.isInvincible) return null;
    const pb = Player.getHitbox();
    const scale = Game.scale;

    for (const obs of World.obstacles) {
      // 跳跃中 → 只被tier_high伤害, tier_mid/tier_low完全免疫
      if (Player.isJumping && obs.tier !== 'tier_high') continue;

      // 滑铲中 → tier_low完全免疫, tier_mid可能碰撞
      if (Player.isSliding && obs.tier === 'tier_low') continue;

      const ob = { x: obs.x - obs.w / 2, y: obs.y - obs.h, w: obs.w, h: obs.h };

      if (!this.rectsOverlap(pb, ob)) continue;

      // tier_high(火车): 一击必杀
      if (obs.tier === 'tier_high') return { tier: 'high' };
      // tier_mid/tier_low: 两击系统
      return { tier: obs.tier };
    }
    return null;
  },

  checkCoins() {
    const pb = Player.getHitbox();
    let collected = 0;
    for (const coin of World.coins) {
      if (coin.collected) continue;
      const cb = { x: coin.x - 14 * Game.scale, y: coin.y - 14 * Game.scale, w: 28 * Game.scale, h: 28 * Game.scale };
      if (this.rectsOverlap(pb, cb)) {
        coin.collected = true;
        collected++;
      }
    }
    return collected;
  },

  checkPowerups() {
    const pb = Player.getHitbox();
    for (const pu of World.powerups) {
      const pub = { x: pu.x - pu.w / 2, y: pu.y - pu.h / 2, w: pu.w, h: pu.h };
      if (this.rectsOverlap(pb, pub)) {
        return pu;
      }
    }
    return null;
  },
};

// ===================== 道具效果管理 =====================
const PowerUpEffects = {
  magnet: { active: false, timer: 0 },
  invincible: { active: false, timer: 0 },
  speed: { active: false, timer: 0 },
  double: { active: false, timer: 0 },

  activate(type) {
    this[type].active = true;
    switch (type) {
      case 'magnet': this[type].timer = CONFIG.MAGNET_DURATION; break;
      case 'invincible': this[type].timer = CONFIG.INVINCIBLE_DURATION; Player.isInvincible = true; Player.invincibleTimer = CONFIG.INVINCIBLE_DURATION; break;
      case 'speed': this[type].timer = CONFIG.SPEED_BOOST_DURATION; break;
      case 'double': this[type].timer = CONFIG.DOUBLE_SCORE_DURATION; break;
    }
    Audio.sfxPowerUp();
  },

  update(dt) {
    for (const key of ['magnet', 'invincible', 'speed', 'double']) {
      if (this[key].active) {
        this[key].timer -= dt;
        if (this[key].timer <= 0) {
          this[key].active = false;
          if (key === 'invincible') { Player.isInvincible = false; Player.invincibleTimer = 0; }
        }
      }
    }
    // 磁铁效果
    if (this.magnet.active) {
      for (const coin of World.coins) coin.magnetized = true;
    }
  },

  getSpeedMultiplier() { return this.speed.active ? 1.5 : 1.0; },

  getScoreMultiplier() { return this.double.active ? 2 : 1; },

  getActiveList() {
    const list = [];
    if (this.magnet.active) list.push({ icon: '🧲', name: '磁铁', time: Math.ceil(this.magnet.timer / 1000) });
    if (this.invincible.active) list.push({ icon: '🛡️', name: '无敌', time: Math.ceil(this.invincible.timer / 1000) });
    if (this.speed.active) list.push({ icon: '⚡', name: '加速', time: Math.ceil(this.speed.timer / 1000) });
    if (this.double.active) list.push({ icon: 'x2', name: '双倍', time: Math.ceil(this.double.timer / 1000) });
    return list;
  },

  reset() {
    for (const key of ['magnet', 'invincible', 'speed', 'double']) {
      this[key].active = false;
      this[key].timer = 0;
    }
  },
};

// ===================== 粒子特效 =====================
const Particles = {
  particles: [],

  emit(x, y, count, color, spread = 2) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * spread * 2,
        vy: (Math.random() - 0.5) * spread * 2 - 2,
        life: 400 + Math.random() * 400,
        maxLife: 400 + Math.random() * 400,
        color,
        size: 1 + Math.random() * 3,
      });
    }
  },

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      p.vy += 0.05;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  },

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * Game.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

// ===================== UI 管理 =====================
const UI = {
  updateHUD() {
    document.getElementById('hudScore').textContent = Math.floor(Game.score);
    document.getElementById('hudCoins').textContent = Game.gameCoins;
    // 限时模式倒计时
    const timerEl = document.getElementById('hudTimer');
    if (timerEl) {
      if (Game.modeTimeLeft > 0) {
        timerEl.style.display = 'block';
        timerEl.textContent = '⏱ ' + Math.ceil(Game.modeTimeLeft) + 's';
        timerEl.style.color = Game.modeTimeLeft < 10 ? '#ff4757' : '#fff';
      } else {
        timerEl.style.display = 'none';
      }
    }
    // 随机事件提示
    const evtEl = document.getElementById('hudEvent');
    if (evtEl) {
      if (Game.eventActive) {
        evtEl.style.display = 'block';
        evtEl.textContent = Game.eventActive.icon + ' ' + Game.eventActive.name + ' ' + Math.ceil(Game.eventTimer/1000) + 's';
      } else {
        evtEl.style.display = 'none';
      }
    }

    const list = PowerUpEffects.getActiveList();
    const container = document.getElementById('hudPowerups');
    container.innerHTML = list.map(p => `<div class="powerup-indicator">${p.icon} ${p.time}s</div>`).join('');
  },

  // 一次性渲染道具快捷栏(不在循环中调用)
  renderQuickItemsOnce() {
    const bar = document.getElementById('hudQuickItems');
    if (!bar || bar.dataset.rendered === 'true') return; // 已渲染则跳过
    bar.dataset.rendered = 'true';

    const items = [
      { id: 'magnet_pack', icon: '🧲', label: '磁铁', effect: 'magnet' },
      { id: 'shield_pack', icon: '🛡️', label: '护盾', effect: 'invincible' },
      { id: 'speed_pack', icon: '⚡', label: '加速', effect: 'speed' },
      { id: 'double_pack', icon: 'x2', label: '双倍', effect: 'double' },
      { id: 'headstart', icon: '🚀', label: '领跑', effect: 'headstart' },
      { id: 'revive', icon: '💫', label: '复活', effect: 'revive' },
    ];

    bar.innerHTML = items.map(item => {
      const count = Storage.getItemCount(item.id);
      return `<button class="quick-item-btn" data-id="${item.id}" data-effect="${item.effect}">
        <span class="q-icon">${item.icon}</span>
        <span class="q-label">${item.label}</span>
        <span class="quick-item-count" data-count-id="${item.id}">${count}</span>
      </button>`;
    }).join('');

    // 全局委托事件
    bar.onclick = function(e) {
      const btn = e.target.closest('.quick-item-btn');
      if (!btn) return;
      e.preventDefault();
      const id = btn.dataset.id;
      const effect = btn.dataset.effect;
      UI._doUseQuickItem(id, effect);
    };
  },

  // 仅更新数量(不重建DOM)
  updateQuickItemCounts() {
    const items = ['magnet_pack', 'shield_pack', 'speed_pack', 'double_pack', 'headstart', 'revive'];
    const pendingRevive = Storage.get('pending_revive', false);
    items.forEach(id => {
      const el = document.querySelector(`[data-count-id="${id}"]`);
      if (!el) return;
      if (id === 'revive' && pendingRevive) {
        el.textContent = '✓';
        el.style.color = '#4ecdc4';
      } else {
        el.textContent = Storage.getItemCount(id);
        el.style.color = '';
      }
    });
    // 更新按钮禁用状态
    document.querySelectorAll('.quick-item-btn').forEach(btn => {
      const effect = btn.dataset.effect;
      const id = btn.dataset.id;
      const active = (effect === 'magnet' && PowerUpEffects.magnet.active) ||
                     (effect === 'invincible' && PowerUpEffects.invincible.active) ||
                     (effect === 'speed' && PowerUpEffects.speed.active) ||
                     (effect === 'double' && PowerUpEffects.double.active);
      const count = Storage.getItemCount(id);
      // revive特殊处理: 标记了就显示绿色
      if (id === 'revive' && pendingRevive) {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        btn.style.borderColor = '#4ecdc4';
        return;
      }
      btn.style.borderColor = '';
      btn.style.opacity = (count > 0 && !active) ? '1' : '0.3';
      btn.style.pointerEvents = (count > 0 && !active) ? 'auto' : 'none';
    });
  },

  // 实际道具使用逻辑
  _doUseQuickItem(itemId, effect) {
    if (effect === 'revive') {
      const c = Storage.getItemCount('revive');
      if (c <= 0) return;
      // 只标记, 不扣数量(死亡时由gameOver统一处理)
      Storage.set('pending_revive', true);
      Audio.sfxPowerUp();
      this.updateQuickItemCounts();
      return;
    }
    if (effect === 'headstart') {
      if (!Storage.useItem('headstart')) return;
      Game.score += 1000;
      Audio.sfxPowerUp();
      this.updateQuickItemCounts();
      return;
    }
    if (!Storage.useItem(itemId)) return;
    if (effect === 'double') {
      PowerUpEffects.activate('double');
    } else {
      PowerUpEffects.activate(effect);
    }
    Audio.sfxPowerUp();
    this.updateQuickItemCounts();
  },

  // 公开入口
  useQuickItem(itemId, effect) {
    this._doUseQuickItem(itemId, effect);
  },

  updateMenuHighScore() {
    document.getElementById('menuHighScore').textContent = Storage.getHighScore();
  },

  updateCoinDisplays() {
    const coins = Storage.getCoins();
    const el1 = document.getElementById('charCoinDisplay');
    const el2 = document.getElementById('shopCoinDisplay');
    if (el1) el1.textContent = coins;
    if (el2) el2.textContent = coins;
  },

  showGameOver() {
    const score = Math.floor(Game.score);
    const dist = Math.floor(score * 10);
    const coins = Game.gameCoins;
    const isNewRecord = score > Storage.getHighScore();

    document.getElementById('finalDistance').textContent = dist + 'm';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coins;
    document.getElementById('finalHighScore').textContent = Math.max(score, Storage.getHighScore());
    document.getElementById('newRecordRow').style.display = isNewRecord ? 'flex' : 'none';

    Game.showScreen('gameOverScreen');
  },

  renderCharacterGrid() {
    const grid = document.getElementById('characterGrid');
    const selected = Storage.getSelectedChar();
    grid.innerHTML = CONFIG.CHARACTERS.map(c => {
      const unlocked = Storage.isCharUnlocked(c.id);
      const cls = c.id === selected ? 'selected' : '';
      const lockCls = !unlocked ? 'locked' : '';
      return `<div class="character-card ${cls} ${lockCls}" onclick="UI.selectCharacter('${c.id}')">
        <div class="character-preview" style="background:linear-gradient(135deg,${c.color}33,${c.color}11);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:44px;width:80px;height:90px;margin:0 auto 8px;position:relative;">
          <span>${c.emoji}</span>
          ${c.style && c.style.glow ? '<div style="position:absolute;top:0;left:0;right:0;bottom:0;border-radius:12px;box-shadow:inset 0 0 20px ' + c.color + '44;"></div>' : ''}
        </div>
        <div class="character-rarity" style="color:${c.rarity === '传说' ? '#ffd700' : c.rarity === '史诗' ? '#a855f7' : c.rarity === '稀有' ? '#4ecdc4' : '#888'};font-size:10px;margin-bottom:2px;">${c.rarity}</div>
        <div class="character-name">${c.name}</div>
        <div class="character-desc" style="color:#888;font-size:10px;">${c.skill} · ${c.desc}</div>
        ${!unlocked ? `<div class="character-price">🪙 ${c.price}</div>` : '<div class="character-price" style="color:#4ecdc4;">已拥有</div>'}
      </div>`;
    }).join('');
  },

  selectCharacter(id) {
    const char = CONFIG.CHARACTERS.find(c => c.id === id);
    if (!char) return;
    if (!Storage.isCharUnlocked(id)) {
      if (Storage.getCoins() >= char.price) {
        Storage.addCoins(-char.price);
        Storage.unlockChar(id);
        Storage.setSelectedChar(id);
        Audio.sfxCoin();
        this.renderCharacterGrid();
        this.updateCoinDisplays();
      }
      return;
    }
    Storage.setSelectedChar(id);
    Audio.sfxSelect();
    this.renderCharacterGrid();
  },

  renderShopItems() {
    const shop = document.getElementById('shopItems');
    const coins = Storage.getCoins();
    const categories = [...new Set(CONFIG.SHOP_ITEMS.map(i => i.category))];

    shop.innerHTML = categories.map(cat => {
      const items = CONFIG.SHOP_ITEMS.filter(i => i.category === cat);
      return `<div class="shop-category">
        <h3 class="shop-cat-title">${cat}</h3>
        <div class="shop-cat-grid">
          ${items.map(item => {
            const owned = Storage.getItemCount(item.id);
            const rarityColor = item.rarity === '传说' ? '#ffd700' : item.rarity === '史诗' ? '#a855f7' : item.rarity === '稀有' ? '#4ecdc4' : '#888';
            return `<div class="shop-card" style="border-color:${rarityColor}33;">
              <div class="item-rarity" style="color:${rarityColor}">${item.rarity}</div>
              <div class="item-icon">${item.icon}</div>
              <div class="item-name">${item.name}</div>
              <div class="item-desc">${item.desc} <span style="color:${rarityColor}">×${owned}</span></div>
              <div class="item-price">🪙 ${item.price}</div>
              <button class="item-buy" ${coins < item.price ? 'disabled' : ''} onclick="UI.buyItem('${item.id}', ${item.price})">${owned > 0 ? '补充' : '购买'}</button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');
  },

  buyItem(id, price) {
    if (Storage.getCoins() >= price) {
      Storage.addCoins(-price);
      Storage.addItem(id, 3);
      Audio.sfxCoin();
      this.renderShopItems();
      this.updateCoinDisplays();
    }
  },

  renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    const board = Storage.getLeaderboard();
    const tab = Storage.get('lbTab', 'all');

    // 筛选时间范围
    const now = new Date();
    let filtered = [...board];
    if (tab === 'week') filtered = board.filter(e => (now - new Date(e.date)) / 86400000 <= 7);
    if (tab === 'today') filtered = board.filter(e => e.date === now.toLocaleDateString());

    const tabs = [
      { id: 'all', label: '总榜' }, { id: 'week', label: '周榜' }, { id: 'today', label: '今日' }
    ];

    let html = `<div class="lb-tabs">${tabs.map(t =>
      `<button class="lb-tab ${tab===t.id?'active':''}" onclick="UI._switchLbTab('${t.id}')">${t.label}</button>`
    ).join('')}</div>`;

    if (filtered.length === 0) {
      html += '<div style="color:#888;text-align:center;padding:30px;">🎮 暂无记录</div>';
    } else {
      const best = filtered[0]?.score || 0;
      html += `<div style="text-align:center;padding:8px;color:#ffd700;font-size:16px;">🏆 最高: ${best}</div>`;

      filtered.forEach((entry, i) => {
        const icons = ['🥇','🥈','🥉'];
        const rank = i < 3 ? icons[i] : (i + 1);
        const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal';
        html += `<div class="leaderboard-item">
          <div class="leaderboard-rank ${cls}">${rank}</div>
          <div class="leaderboard-score">${entry.score}</div>
          <div class="leaderboard-date">${entry.date}</div>
        </div>`;
      });
    }

    list.innerHTML = html;
    Storage.set('prevHighScore', board[0] ? board[0].score : 0);
  },

  _switchLbTab(tab) {
    Storage.set('lbTab', tab);
    this.renderLeaderboard();
  },

  renderModeSelect() {
    // 在主菜单下方显示模式选择
    const container = document.getElementById('modeButtons');
    if (!container) return;
    container.innerHTML = CONFIG.GAME_MODES.map(m =>
      `<button class="btn btn-mode" onclick="Game.startGame('${m.id}')">
        <span class="mode-icon">${m.icon}</span>
        <span class="mode-name">${m.name}</span>
        <span class="mode-desc">${m.desc}</span>
      </button>`
    ).join('');
  },
};

// ===================== 设置管理 =====================
const Settings = {
  load() {
    const s = Storage.getSettings();
    document.getElementById('bgmToggle').checked = s.bgm;
    document.getElementById('sfxToggle').checked = s.sfx;
    document.getElementById('qualitySelect').value = s.quality;
    document.getElementById('sensitivitySlider').value = s.sensitivity;
    Input.sensitivity = s.sensitivity;
    Audio.toggleBGM(s.bgm);
    Audio.toggleSFX(s.sfx);
  },

  toggleBGM() {
    const on = document.getElementById('bgmToggle').checked;
    Audio.toggleBGM(on);
    this._save();
  },

  toggleSFX() {
    const on = document.getElementById('sfxToggle').checked;
    Audio.toggleSFX(on);
    this._save();
  },

  changeQuality(val) {
    this._save();
  },

  changeSensitivity(val) {
    Input.sensitivity = parseInt(val);
    this._save();
  },

  _save() {
    Storage.setSettings({
      bgm: document.getElementById('bgmToggle').checked,
      sfx: document.getElementById('sfxToggle').checked,
      quality: document.getElementById('qualitySelect').value,
      sensitivity: parseInt(document.getElementById('sensitivitySlider').value),
    });
  },

  resetAll() {
    if (confirm('确定要重置所有数据吗？(包括金币、分数、角色等)')) {
      Storage.resetAll();
      // 重新给初始解锁
      Storage.unlockChar('default');
      Storage.setSelectedChar('default');
      UI.renderCharacterGrid();
      UI.renderShopItems();
      UI.updateCoinDisplays();
      UI.updateMenuHighScore();
      UI.renderLeaderboard();
      alert('数据已重置!');
    }
  },
};

// ===================== 追击者系统 (二击机制) =====================
const Chaser = {
  active: false,
  x: 0, y: 0,
  lane: 1,
  animFrame: 0,
  animTimer: 0,
  targetX: 0,
  alpha: 1,

  spawn() {
    this.active = true;
    this.lane = Player.lane;
    this.x = Player.x - 60 * Game.scale; // 从后方出现
    this.y = Player.y;
    this.animFrame = 0;
    this.animTimer = 0;
    this.alpha = 1;
  },

  despawn() {
    this.active = false;
    this.alpha = 0;
  },

  update(dt) {
    if (!this.active) return;

    // 复制跑酷者动作
    const scale = Game.scale;
    const laneCenterX = Game._cssW / 2 + (Player.lane - 1) * CONFIG.LANE_WIDTH * scale;
    this.targetX = laneCenterX;

    // 追击者紧跟跑酷者后方
    const chaseDistance = 70 * scale;
    const behindX = this.targetX - chaseDistance;

    // 平滑追到后方位置
    this.x += (behindX - this.x) * 0.15;

    // 复制Y坐标(跳跃+滑铲)
    if (Player.isJumping) {
      this.y += (Player.y - this.y) * 0.3;
    } else {
      this.y += (Player.y - this.y) * 0.15;
    }

    this.animTimer += dt;
    if (this.animTimer > 80) { this.animTimer = 0; this.animFrame++; }
  },

  draw(ctx) {
    if (!this.active) return;

    const scale = Game.scale;
    const drawW = 45 * scale;
    const drawH = 70 * scale;

    // 追击者用红色调
    ctx.globalAlpha = Math.min(1, this.alpha);

    // 简单红色轮廓绘制
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fillRect(this.x - drawW / 2, this.y - drawH, drawW, drawH);

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x - 8 * scale, this.y - drawH + 10 * scale, 6 * scale, 6 * scale);
    ctx.fillRect(this.x + 2 * scale, this.y - drawH + 10 * scale, 6 * scale, 6 * scale);
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x - 6 * scale, this.y - drawH + 12 * scale, 3 * scale, 3 * scale);
    ctx.fillRect(this.x + 4 * scale, this.y - drawH + 12 * scale, 3 * scale, 3 * scale);

    // 警戒线纹理
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([4 * scale, 4 * scale]);
    ctx.beginPath();
    ctx.moveTo(this.x - drawW * 0.8, this.y - drawH + 2 * scale);
    ctx.lineTo(this.x + drawW * 0.8, this.y - drawH + 2 * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalAlpha = 1;
  },
};

// ===================== 主游戏类 =====================
const Game = {
  canvas: null,
  ctx: null,
  scale: 1,
  state: GameState.MENU,
  score: 0,
  gameCoins: 0,
  totalCoins: 0,
  lastTime: 0,
  animFrameId: null,
  isDead: false,
  gameMode: 'endless',    // 当前游戏模式
  modeTimeLeft: 0,        // 限时模式剩余时间
  modeTimer: 0,           // 模式计时器
  eventActive: null,      // 当前随机事件
  eventTimer: 0,          // 事件剩余时间

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this._resize();
    window.addEventListener('resize', () => this._resize());
    // 移动端visualViewport变化（地址栏显隐、键盘弹出）
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this._resize());
    }
    Input.init();
    Audio.init();
    SpriteSystem.init();
    ImageLoader.preload();
    Settings.load();
    UI.updateMenuHighScore();
    UI.updateCoinDisplays();
    this.lastTime = performance.now();
    this.showScreen('menuScreen');
    this._loop(performance.now());
  },

  _resize() {
    // 移动端使用 visualViewport 获取更准确的可视区域
    const vv = window.visualViewport;
    const w = vv ? vv.width : window.innerWidth;
    const h = vv ? vv.height : window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scale = Math.min(w / CONFIG.DESIGN_WIDTH, h / CONFIG.DESIGN_HEIGHT);
    // CSS逻辑像素（setTransform后，绘制坐标应使用CSS像素！）
    this._cssW = w;
    this._cssH = h;
  },

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');

    if (screenId === 'characterScreen') { UI.renderCharacterGrid(); UI.updateCoinDisplays(); }
    if (screenId === 'shopScreen') { UI.renderShopItems(); UI.updateCoinDisplays(); }
    if (screenId === 'leaderboardScreen') UI.renderLeaderboard();
    if (screenId === 'settingsScreen') Settings.load();
    if (screenId === 'menuScreen') { UI.updateMenuHighScore(); UI.renderModeSelect(); }
    if (screenId === 'modeScreen') UI.renderModeSelect();

    const map = {
      menuScreen: GameState.MENU, characterScreen: GameState.CHARACTER_SELECT,
      shopScreen: GameState.SHOP, leaderboardScreen: GameState.LEADERBOARD,
      settingsScreen: GameState.SETTINGS, hudScreen: GameState.PLAYING,
      pauseScreen: GameState.PAUSED, gameOverScreen: GameState.GAME_OVER,
    };
    this.state = map[screenId] || this.state;

    // Canvas 始终显示，不再切换 display:none（移动端兼容）
    document.getElementById('gameCanvas').style.display = 'block';

    if (screenId === 'hudScreen') {
      const bar = document.getElementById('hudQuickItems');
      if (bar) bar.dataset.rendered = '';
      UI.renderQuickItemsOnce();
    }
    if (screenId === 'menuScreen') {
      const bar = document.getElementById('hudQuickItems');
      if (bar) bar.dataset.rendered = '';
    }
  },

  startGame(modeId) {
    this.gameMode = modeId || 'endless';
    const mode = CONFIG.GAME_MODES.find(m => m.id === this.gameMode);
    this.modeTimeLeft = mode ? mode.timeLimit : 0;
    this.modeTimer = 0;
    this.eventActive = null;
    this.eventTimer = 0;
    this.isDead = false;
    this.score = 0;
    this.gameCoins = 0;
    this._hitOnce = false;
    this._hitTimer = 0;
    Chaser.despawn();
    Storage.set('pending_revive', false);

    // 强制重新计算Canvas尺寸（移动端关键修复）
    this._resize();

    Player.init();
    World.init();
    Particles.particles = [];
    PowerUpEffects.reset();

    // 角色特殊能力初始化
    if (Player.charAttr) {
      if (Player.charAttr.shield > 0) {
        Player.isInvincible = true;
        Player.invincibleTimer = Player.charAttr.shield;
      }
      if (Player.charAttr.boost > 0) {
        PowerUpEffects.activate('double');
        PowerUpEffects.double.timer = Player.charAttr.boost;
      }
      if (Player.charAttr.slide) {
        CONFIG.SLIDE_DURATION = Player.charAttr.slide;
      }
    }

    this.showScreen('hudScreen');
    Audio.startBGM();
  },

  pauseGame() {
    if (this.state !== GameState.PLAYING) return;
    this.showScreen('pauseScreen');
    Audio.stopBGM();
  },

  resumeGame() {
    this.showScreen('hudScreen');
    Audio.startBGM();
  },

  restartGame() {
    this.startGame(this.gameMode);
  },

  quitToMenu() {
    Audio.stopBGM();
    this.showScreen('menuScreen');
    UI.updateMenuHighScore();
    UI.updateCoinDisplays();
  },

  gameOver() {
    if (this.isDead) return;

    // 复活卡检测
    if (Storage.get('pending_revive', false)) {
      Storage.set('pending_revive', false);
      if (Storage.useItem('revive')) {
        // 复活!
        this._hitOnce = false;
        this._hitTimer = 0;
        Chaser.despawn();
        this.isDead = false;
        Player.isInvincible = true;
        Player.invincibleTimer = 2000;
        Player.isJumping = false;
        Player.isSliding = false;
        Player.vy = 0;
        Player._setPos();
        World.obstacles = World.obstacles.filter(obs => obs.y < Game._cssH * 0.3);
        UI.updateQuickItemCounts(); // 更新复活卡数量
        return;
      }
    }

    this.isDead = true;
    Audio.stopBGM();
    Audio.sfxHit();
    Storage.addCoins(this.gameCoins);
    Storage.setHighScore(Math.floor(this.score));
    Storage.addScore(Math.floor(this.score));

    const px = Player.x;
    const py = Player.y;
    Particles.emit(px, py, 30, '#ff6b35', 3);
    Particles.emit(px, py, 15, '#ffd700', 2);

    UI.showGameOver();
  },

  _handleInput() {
    if (this.state !== GameState.PLAYING) return;

    // 输入缓冲: 缓存最近的方向指令
    if (!this._inputBuffer) this._inputBuffer = { lane: null, action: null, timer: 0 };

    // 键盘方向: ←→ 换道, ↑ 跳跃, ↓/S 中间道, W 跳跃(备用)
    const leftPressed = Input.keys['ArrowLeft'] || Input.keys['KeyA'];
    const rightPressed = Input.keys['ArrowRight'] || Input.keys['KeyD'];
    const jumpPressed = Input.keys['ArrowUp'] || Input.keys['KeyW'] || Input.keys['Space'];
    const slideOrCenter = Input.keys['ArrowDown'] || Input.keys['KeyS'];

    if (leftPressed) this._inputBuffer.lane = 'left';
    else if (rightPressed) this._inputBuffer.lane = 'right';
    else if (slideOrCenter) this._inputBuffer.lane = 'center';  // S/↓ → 中间道

    if (jumpPressed) this._inputBuffer.action = 'jump';
    else if (slideOrCenter && !jumpPressed) this._inputBuffer.action = 'slide';  // ↓ 也是滑铲(如果不在换道)

    // 触控
    const swipe = Input.getSwipe();
    if (swipe) {
      switch (swipe) {
        case 'left': this._inputBuffer.lane = 'left'; break;
        case 'right': this._inputBuffer.lane = 'right'; break;
        case 'up': this._inputBuffer.action = 'jump'; break;
        case 'down': this._inputBuffer.action = 'slide'; break;
      }
      Input.clearSwipe();
    }

    // 执行缓冲指令(带衰减时间，防止感觉迟钝)
    this._inputBuffer.timer += 16; // ~60fps
    const bufferWindow = 100; // 100ms缓冲窗口

    if (this._inputBuffer.lane && this._inputBuffer.timer < bufferWindow) {
      if (this._inputBuffer.lane === 'left') Player.moveLeft();
      else if (this._inputBuffer.lane === 'right') Player.moveRight();
      else if (this._inputBuffer.lane === 'center') Player.moveCenter();
      this._inputBuffer.lane = null;
    }
    if (this._inputBuffer.action && this._inputBuffer.timer < bufferWindow) {
      if (this._inputBuffer.action === 'jump') Player.jump();
      else Player.slide();
      this._inputBuffer.action = null;
    }
    if (this._inputBuffer.timer > bufferWindow) {
      this._inputBuffer.lane = null;
      this._inputBuffer.action = null;
      this._inputBuffer.timer = 0;
    }
  },

  _loop(timestamp) {
    this.animFrameId = requestAnimationFrame(t => this._loop(t));

    const dt = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;

    this._handleInput();

    if (this.state === GameState.PLAYING) {
      // 更新
      Player.update(dt);
      World.update(dt);
      PowerUpEffects.update(dt);
      Particles.update(dt);

      // 应用速度倍率 (道具+角色属性)
      const charSpeedMult = Player.charAttr ? Player.charAttr.speed : 1.0;
      World.curSpeed = Math.min(
        (CONFIG.INITIAL_SPEED + this.score * CONFIG.SPEED_INCREMENT) * PowerUpEffects.getSpeedMultiplier() * charSpeedMult,
        CONFIG.MAX_SPEED * PowerUpEffects.getSpeedMultiplier()
      );

      // 分数
      this.score += World.curSpeed * CONFIG.SCORE_DISTANCE_MULT * dt * 0.06 * PowerUpEffects.getScoreMultiplier();

      // 限时模式倒计时
      if (this.modeTimeLeft > 0) {
        this.modeTimer += dt;
        this.modeTimeLeft -= dt / 1000;
        if (this.modeTimeLeft <= 0) {
          this.modeTimeLeft = 0;
          this.gameOver();
        }
      }

      // 随机事件系统
      if (!this.eventActive && Math.random() < 0.0003 * dt) {
        const evt = CONFIG.RANDOM_EVENTS[Math.floor(Math.random() * CONFIG.RANDOM_EVENTS.length)];
        this.eventActive = evt;
        this.eventTimer = evt.duration;
        if (evt.id === 'coin_rain') {
          for (let lane = 0; lane < 3; lane++) {
            const lx = Game._cssW / 2 + (lane - 1) * CONFIG.LANE_WIDTH * Game.scale;
            for (let i = 0; i < 5; i++) {
              World.coins.push({ x: lx, y: -(i * 30 * Game.scale) - 50, animTimer: Math.random() * 10, collected: false, magnetized: false });
            }
          }
        }
        if (evt.id === 'slow_mo') { World.curSpeed *= 0.5; }
      }
      if (this.eventActive) {
        this.eventTimer -= dt;
        if (this.eventTimer <= 0) this.eventActive = null;
      }

      // 碰撞检测 - 两击系统
      const hit = Collision.checkObstacles();
      if (hit) {
        if (hit.tier === 'high') {
          // 高障碍(火车)一击必杀
          this.gameOver();
        } else {
          // 中/低障碍: 第一次撞击生成追击者, 第二次死亡
          if (!this._hitOnce) {
            this._hitOnce = true;
            this._hitTimer = 3000;
            Chaser.spawn();
            Audio.sfxHit();
            Particles.emit(Player.x, Player.y, 10, '#fff', 2);
          } else {
            // 守护角色受伤后无敌(铁壁技能)
            if (Player.charAttr && Player.charAttr.iFrame) {
              Player.isInvincible = true;
              Player.invincibleTimer = Player.charAttr.iFrame;
              Chaser.despawn();
              this._hitOnce = false;
              return;
            }
            this.gameOver();
          }
        }
      }

      // 追击者更新
      if (this._hitOnce) {
        this._hitTimer -= dt;
        Chaser.update(dt);
        if (this._hitTimer <= 0) {
          this._hitOnce = false;
          Chaser.despawn();
        }
      }

      // 金币碰撞
      const coins = Collision.checkCoins();
      if (coins > 0) {
        this.gameCoins += Math.floor(coins * CONFIG.COIN_VALUE * (Player.charAttr ? Player.charAttr.coin : 1.0));
        Audio.sfxCoin();
        for (const coin of World.coins) {
          if (coin.collected) Particles.emit(coin.x, coin.y, 5, '#ffd700', 1);
        }
      }

      // 道具碰撞
      const pu = Collision.checkPowerups();
      if (pu) {
        PowerUpEffects.activate(pu.type);
        World.powerups = World.powerups.filter(p => p !== pu);
        Particles.emit(pu.x, pu.y, 15, '#fff', 2);
      }

      // 更新HUD
      UI.updateHUD();
      // 道具状态变化时才更新(被动道具pickup会增加计数)
      if (Math.floor(timestamp / 1000) !== Math.floor((timestamp - dt) / 1000)) {
        UI.updateQuickItemCounts();
      }
    }

    // 渲染 - 使用CSS尺寸清屏
    const cw = this._cssW;
    const ch = this._cssH;
    this.ctx.clearRect(0, 0, cw, ch);
    if (this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.GAME_OVER) {
      World.draw(this.ctx);
      Player.draw(this.ctx);
      Chaser.draw(this.ctx);
      Particles.draw(this.ctx);
    }
  },
};

// ===================== 启动 =====================
window.addEventListener('DOMContentLoaded', () => Game.init());

// 首次交互时解锁音频
document.addEventListener('click', () => Audio.ensureContext(), { once: true });
document.addEventListener('touchstart', () => Audio.ensureContext(), { once: true });
