// TRON LEGACY - Light Cycle Battle
// Ultra-polished 2 Player competitive arcade game

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: {
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

// Game state
let p1 = { x: 0, y: 0, dir: 0, trail: [], alive: true, speed: 2, ghost: 0, slow: 0, trailLife: 90, exploded: false, speedBoost: 0, shield: false, nearMisses: 0, maxSpeed: 2, currentSpeed: 2 };
let p2 = { x: 0, y: 0, dir: 0, trail: [], alive: true, speed: 2, ghost: 0, slow: 0, trailLife: 90, exploded: false, speedBoost: 0, shield: false, nearMisses: 0, maxSpeed: 2, currentSpeed: 2 };
let scores = { p1: 0, p2: 0 };
let round = 1;
let gameState = 'start';
let graphics;
let texts = {};
let obstacles = [];
let powerups = [];
let speedPoints = [];
let level = 1;
let gridSize = 4;
let frameCount = 0;
let particles = [];
let scanlines = [];
let glowEffects = [];
let backgroundParticles = [];
let countdownValue = 0;
let musicOsc1 = null;
let musicOsc2 = null;
let musicGain = null;
let musicPlaying = false;
let highScore = 0;
let totalGames = 0;

// Directions: 0=right, 1=down, 2=left, 3=up
const dirs = [[1,0], [0,1], [-1,0], [0,-1]];

// Power-up types with enhanced visuals (MAGENTA instead of green)
const pwrTypes = [
  { n: 'SPEED', c: 0xffff00, c2: 0xffaa00, good: true },
  { n: 'GHOST', c: 0xff00ff, c2: 0xaa00aa, good: true }, // Changed to MAGENTA
  { n: 'SLOW', c: 0xff0088, c2: 0xaa0055, good: true }, // Pink
  { n: 'TRAIL+', c: 0x00ffaa, c2: 0x00aa88, good: true },
  { n: 'SHIELD', c: 0x00ddff, c2: 0x0088ff, good: true },
  { n: 'MINE', c: 0xff0000, c2: 0xaa0000, good: false }
];

// Bike color options
const vehicleTypes = [
  { n: 'CYAN', color: 0x00ffff, spd: 2, trail: 90 },
  { n: 'RED', color: 0xff0000, spd: 2, trail: 90 },
  { n: 'MAGENTA', color: 0xff00ff, spd: 2, trail: 90 },
  { n: 'ORANGE', color: 0xff8800, spd: 2, trail: 90 },
  { n: 'GREEN', color: 0x00ff00, spd: 2, trail: 90 },
  { n: 'PINK', color: 0xff0088, spd: 2, trail: 90 },
  { n: 'YELLOW', color: 0xffff00, spd: 2, trail: 90 },
  { n: 'BLUE', color: 0x0088ff, spd: 2, trail: 90 }
];

// Vehicle selection
let p1Vehicle = 0; // CYAN
let p2Vehicle = 1; // RED

// Demo bikes for selection screen
let demoBikes = [];

function create() {
  const scene = this;
  graphics = this.add.graphics();

  // Create background particle field
  for (let i = 0; i < 50; i++) {
    backgroundParticles.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.3,
      size: Math.random() * 2
    });
  }

  // Create scanline effect
  for (let i = 0; i < 30; i++) {
    scanlines.push({
      y: Math.random() * 600,
      speed: 0.5 + Math.random() * 1,
      alpha: 0.05 + Math.random() * 0.1
    });
  }

  // Title with glow - MASSIVE GRID STYLE
  texts.titleGlow = this.add.graphics().setAlpha(0);
  texts.title = this.add.graphics().setAlpha(0);

  // Draw TRON title in grid style
  drawTRONTitle(texts.titleGlow, 400.5, 180.5, 8, 0.2); // Glow layer - very subtle
  drawTRONTitle(texts.title, 400, 180, 8, 1); // Main layer

  // Carousel text below "PRESS SPACE" (rotating tips)
  texts.carousel = this.add.text(400, 530, '', {
    fontSize: '18px',
    fontFamily: 'Courier New, monospace',
    color: '#00ffff',
    stroke: '#000000',
    strokeThickness: 3,
    fontStyle: 'bold',
    align: 'center'
  }).setOrigin(0.5).setAlpha(0);

  // Controls - Simple and clean
  texts.inst1 = this.add.text(400, 370, 'P1: WASD    |    P2: ARROWS', {
    fontSize: '26px',
    fontFamily: 'Courier New, monospace',
    color: '#00ffff',
    stroke: '#000000',
    strokeThickness: 5,
    fontStyle: 'bold',
    letterSpacing: 2
  }).setOrigin(0.5).setAlpha(0);

  texts.start = this.add.text(400, 480, 'PRESS  SPACE', {
    fontSize: '36px',
    fontFamily: 'Courier New, monospace',
    color: '#ffff00',
    stroke: '#000000',
    strokeThickness: 5,
    fontStyle: 'bold',
    letterSpacing: 8,
    align: 'center'
  }).setOrigin(0.5).setAlpha(0);


  // Score display in center (at same height as velocities)
  texts.roundInfo = this.add.text(400, 10, '0 - 0', {
    fontSize: '24px',
    fontFamily: 'Courier New, monospace',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    fontStyle: 'bold',
    letterSpacing: 2
  }).setOrigin(0.5, 0).setVisible(false);

  // NEW: Speed indicators (km/h)
  texts.p1Speed = this.add.text(180, 10, '', {
    fontSize: '20px',
    fontFamily: 'Courier New, monospace',
    color: '#00ffff',
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0, 0).setVisible(false);

  texts.p2Speed = this.add.text(620, 10, '', {
    fontSize: '20px',
    fontFamily: 'Courier New, monospace',
    color: '#ff8800',
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(1, 0).setVisible(false);

  // NEW: Status indicators for power-ups
  texts.p1Status = this.add.text(50, 45, '', {
    fontSize: '14px',
    fontFamily: 'Courier New, monospace',
    color: '#00ffff',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0);

  texts.p2Status = this.add.text(750, 45, '', {
    fontSize: '14px',
    fontFamily: 'Courier New, monospace',
    color: '#ff8800',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(1, 0);

  // Vehicle selection UI
  texts.vehicleTitle = this.add.text(400, 120, 'SELECT BIKE COLOR', {
    fontSize: '40px',
    fontFamily: 'Courier New, monospace',
    color: '#ffff00',
    stroke: '#000000',
    strokeThickness: 5,
    letterSpacing: 3,
    fontStyle: 'bold'
  }).setOrigin(0.5).setVisible(false);

  texts.p1VehicleLabel = this.add.text(200, 220, 'PLAYER 1', {
    fontSize: '28px',
    fontFamily: 'Courier New, monospace',
    color: '#00ffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
    fontStyle: 'bold'
  }).setOrigin(0.5).setVisible(false);

  texts.p2VehicleLabel = this.add.text(600, 220, 'PLAYER 2', {
    fontSize: '28px',
    fontFamily: 'Courier New, monospace',
    color: '#ff8800',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
    fontStyle: 'bold'
  }).setOrigin(0.5).setVisible(false);

  texts.p1VehicleChoice = this.add.text(200, 350, '', {
    fontSize: '48px',
    fontFamily: 'Courier New, monospace',
    color: '#00ffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
    fontStyle: 'bold'
  }).setOrigin(0.5).setVisible(false);

  texts.p2VehicleChoice = this.add.text(600, 350, '', {
    fontSize: '48px',
    fontFamily: 'Courier New, monospace',
    color: '#ff8800',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
    fontStyle: 'bold'
  }).setOrigin(0.5).setVisible(false);

  texts.vehicleStart = this.add.text(400, 480, '▶ PRESS SPACE TO START ◀', {
    fontSize: '24px',
    fontFamily: 'Courier New, monospace',
    color: '#ffff00', // Changed to YELLOW
    stroke: '#000000',
    strokeThickness: 4,
    letterSpacing: 2
  }).setOrigin(0.5).setVisible(false);

  // Animate intro with stagger
  scene.tweens.add({
    targets: texts.titleGlow,
    alpha: 0.3,
    duration: 1000,
    yoyo: true,
    repeat: -1
  });

  scene.tweens.add({
    targets: [texts.title, texts.inst1, texts.start],
    alpha: 1,
    duration: 800,
    delay: scene.tweens.stagger(120),
    ease: 'Power2'
  });

  scene.tweens.add({
    targets: texts.titleGlow,
    alpha: 0.5,
    duration: 600,
    delay: 200
  });

  // Grid title doesn't need glitch effect - it's already pixelated!

  // Blinking start text with pulse
  scene.tweens.add({
    targets: texts.start,
    alpha: 0.4,
    scale: 0.95,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Keyboard
  this.input.keyboard.on('keydown', (e) => {
    if (gameState === 'vehicleSelect') {
      // P1 vehicle selection
      if (e.key === 'w') {
        p1Vehicle = (p1Vehicle - 1 + vehicleTypes.length) % vehicleTypes.length;
        updateVehicleUI();
      } else if (e.key === 's') {
        p1Vehicle = (p1Vehicle + 1) % vehicleTypes.length;
        updateVehicleUI();
      }
      // P2 vehicle selection
      if (e.key === 'ArrowUp') {
        p2Vehicle = (p2Vehicle - 1 + vehicleTypes.length) % vehicleTypes.length;
        updateVehicleUI();
      } else if (e.key === 'ArrowDown') {
        p2Vehicle = (p2Vehicle + 1) % vehicleTypes.length;
        updateVehicleUI();
      }
      // Start game
      if (e.key === ' ') {
        startRound(scene);
      }
    } else if (gameState === 'start' && e.key === ' ') {
      gameState = 'vehicleSelect';
      showVehicleSelect(scene);
      playTone(scene, 660, 0.1);
    } else if (gameState === 'roundEnd' && e.key === ' ') {
      if (scores.p1 < 3 && scores.p2 < 3) {
        startRound(scene);
      } else {
        gameState = 'start';
        scores = { p1: 0, p2: 0 };
        round = 1;
        level = 1;
        p1Vehicle = 0; // CYAN
        p2Vehicle = 1; // RED
        updateUI();
        showStartScreen(scene);
      }
    } else if (gameState === 'playing') {
      // P1 controls
      if (e.key === 'w' && p1.dir !== 1) { p1.dir = 3; createTurnEffect(p1); }
      else if (e.key === 's' && p1.dir !== 3) { p1.dir = 1; createTurnEffect(p1); }
      else if (e.key === 'a' && p1.dir !== 0) { p1.dir = 2; createTurnEffect(p1); }
      else if (e.key === 'd' && p1.dir !== 2) { p1.dir = 0; createTurnEffect(p1); }

      // P2 controls
      if (e.key === 'ArrowUp' && p2.dir !== 1) { p2.dir = 3; createTurnEffect(p2); }
      else if (e.key === 'ArrowDown' && p2.dir !== 3) { p2.dir = 1; createTurnEffect(p2); }
      else if (e.key === 'ArrowLeft' && p2.dir !== 0) { p2.dir = 2; createTurnEffect(p2); }
      else if (e.key === 'ArrowRight' && p2.dir !== 2) { p2.dir = 0; createTurnEffect(p2); }
    }
  });

  updateUI();
  showStartScreen(this);
  playTone(this, 440, 0.1);

  // Start TRON Legacy style background music
  startBackgroundMusic(this);
}

function createTurnEffect(bike) {
  const color = bike === p1 ? 0x00ffff : 0xff8800;

  // MAIN BURST - Radial particles
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x: bike.x,
      y: bike.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 25 + Math.random() * 10,
      alpha: 0.9,
      color: color,
      size: 2 + Math.random() * 2
    });
  }

  // SPARKS - Fast bright particles
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x: bike.x,
      y: bike.y,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      life: 15,
      alpha: 1,
      color: 0xffffff,
      size: 1
    });
  }

  // GLOW EFFECT at turn point
  glowEffects.push({
    x: bike.x,
    y: bike.y,
    radius: 8,
    life: 20,
    alpha: 0.8,
    color: color
  });
}

function startRound(scene) {
  gameState = 'countdown';
  round++;
  countdownValue = 3;

  // Hide start screen and vehicle selection
  if (texts.title) texts.title.setVisible(false);
  if (texts.titleGlow) texts.titleGlow.setVisible(false);
  if (texts.subtitle) texts.subtitle.setVisible(false);
  if (texts.carousel) texts.carousel.setVisible(false);
  if (texts.inst1) texts.inst1.setVisible(false);
  if (texts.start) texts.start.setVisible(false);
  if (texts.vehicleTitle) texts.vehicleTitle.setVisible(false);
  if (texts.p1VehicleLabel) texts.p1VehicleLabel.setVisible(false);
  if (texts.p2VehicleLabel) texts.p2VehicleLabel.setVisible(false);
  if (texts.p1VehicleChoice) texts.p1VehicleChoice.setVisible(false);
  if (texts.p2VehicleChoice) texts.p2VehicleChoice.setVisible(false);
  if (texts.vehicleStart) texts.vehicleStart.setVisible(false);

  // Reset players with selected vehicle stats
  const v1 = vehicleTypes[p1Vehicle];
  const v2 = vehicleTypes[p2Vehicle];
  p1 = { x: 120, y: 300, dir: 0, trail: [], alive: true, speed: v1.spd, ghost: 0, slow: 0, trailLife: v1.trail, vehicle: p1Vehicle, color: v1.color, exploded: false, speedBoost: 0, shield: false, nearMisses: 0, maxSpeed: v1.spd, currentSpeed: v1.spd };
  p2 = { x: 680, y: 300, dir: 2, trail: [], alive: true, speed: v2.spd, ghost: 0, slow: 0, trailLife: v2.trail, vehicle: p2Vehicle, color: v2.color, exploded: false, speedBoost: 0, shield: false, nearMisses: 0, maxSpeed: v2.spd, currentSpeed: v2.spd };

  p1.trail.push({ x: p1.x, y: p1.y, life: p1.trailLife });
  p2.trail.push({ x: p2.x, y: p2.y, life: p2.trailLife });

  // Generate obstacles
  obstacles = [];
  level = Math.floor((round - 1) / 2) + 1;
  if (level > 5) level = 5;
  generateObstacles(level);

  powerups = [];
  speedPoints = [];
  particles = [];
  glowEffects = [];
  frameCount = 0;

  // Generate speed points
  for (let i = 0; i < 15; i++) {
    spawnSpeedPoint();
  }

  updateUI();

  // NEW: EPIC COUNTDOWN with GRID STYLE
  let countdownGraphics = scene.add.graphics();

  const doCountdown = () => {
    if (countdownValue > 0) {
      countdownGraphics.clear();

      // Draw grid-style number
      drawGridNumber(countdownGraphics, countdownValue, 400, 300, 120);

      // Fade in animation
      countdownGraphics.setAlpha(0);
      scene.tweens.add({
        targets: countdownGraphics,
        alpha: 1,
        scale: { from: 2, to: 1 },
        duration: 400,
        ease: 'Back.easeOut'
      });

      scene.tweens.add({
        targets: countdownGraphics,
        alpha: 0,
        duration: 300,
        delay: 400
      });

      // Screen flash
      const flash = scene.add.graphics();
      flash.fillStyle(0x00ffff, 0.3);
      flash.fillRect(0, 0, 800, 600);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 400,
        onComplete: () => flash.destroy()
      });

      playTone(scene, 800 + countdownValue * 200, 0.15);
      countdownValue--;

      setTimeout(doCountdown, 800);
    } else {
      // GO!
      countdownGraphics.clear();

      // Draw "GO" in grid style
      drawGridGO(countdownGraphics, 400, 300, 80);

      // Fade in GO first
      countdownGraphics.setAlpha(0);
      scene.tweens.add({
        targets: countdownGraphics,
        alpha: 1,
        scale: { from: 2, to: 1 },
        duration: 300,
        ease: 'Back.easeOut'
      });

      // Then fade out and spin
      scene.tweens.add({
        targets: countdownGraphics,
        scale: { from: 1, to: 0 },
        alpha: { from: 1, to: 0 },
        rotation: Math.PI * 2,
        duration: 600,
        delay: 400,
        ease: 'Back.easeIn',
        onComplete: () => {
          countdownGraphics.destroy();
          gameState = 'playing';
          // Show speed indicators and score
          texts.p1Speed.setVisible(true);
          texts.p2Speed.setVisible(true);
          texts.roundInfo.setVisible(true);
          // Switch to aggressive battle music
          playBattleMusic();
        }
      });

      // Massive screen shake
      scene.cameras.main.shake(400, 0.015);

      // MEGA Explosion of particles
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        particles.push({
          x: 400,
          y: 300,
          vx: Math.cos(angle) * 6,
          vy: Math.sin(angle) * 6,
          life: 30,
          alpha: 1,
          color: [0x00ffff, 0xff8800, 0xffff00][i % 3],
          size: 3
        });
      }

      // Secondary wave
      for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        particles.push({
          x: 400,
          y: 300,
          vx: Math.cos(angle) * 10,
          vy: Math.sin(angle) * 10,
          life: 40,
          alpha: 0.8,
          color: 0xffffff,
          size: 2
        });
      }

      // Spiral particles
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 4;
        const speed = 4 + i * 0.2;
        particles.push({
          x: 400,
          y: 300,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 35,
          alpha: 1,
          color: [0x00ffff, 0xff00ff, 0xffff00][i % 3],
          size: 2
        });
      }

      playTone(scene, 1200, 0.2);
    }
  };

  setTimeout(doCountdown, 500);
}

function generateObstacles(lvl) {
  if (lvl >= 2) {
    for (let i = 0; i < 60; i += gridSize) {
      obstacles.push({ x: 370 + i, y: 270, glow: Math.random() });
      obstacles.push({ x: 370 + i, y: 330, glow: Math.random() });
      obstacles.push({ x: 370, y: 270 + i, glow: Math.random() });
      obstacles.push({ x: 430, y: 270 + i, glow: Math.random() });
    }
  }

  if (lvl >= 3) {
    for (let i = 0; i < 30; i += gridSize) {
      obstacles.push({ x: 60 + i, y: 80 + i, glow: Math.random() });
      obstacles.push({ x: 740 - i, y: 80 + i, glow: Math.random() });
      obstacles.push({ x: 60 + i, y: 520 - i, glow: Math.random() });
      obstacles.push({ x: 740 - i, y: 520 - i, glow: Math.random() });
    }
  }

  if (lvl >= 4) {
    for (let i = 0; i < 15; i++) {
      obstacles.push({
        x: Math.floor(150 + Math.random() * 500 / gridSize) * gridSize,
        y: Math.floor(100 + Math.random() * 400 / gridSize) * gridSize,
        glow: Math.random()
      });
    }
  }
}

function update(time, delta) {
  frameCount++;

  // Update background particles
  for (let bp of backgroundParticles) {
    bp.x += bp.vx;
    bp.y += bp.vy;
    if (bp.x < 0) bp.x = 800;
    if (bp.x > 800) bp.x = 0;
    if (bp.y < 0) bp.y = 600;
    if (bp.y > 600) bp.y = 0;
  }

  // Update scanlines
  for (let sl of scanlines) {
    sl.y += sl.speed;
    if (sl.y > 600) sl.y = 0;
  }

  // Update demo bikes in vehicle select screen
  if (gameState === 'vehicleSelect' && demoBikes.length > 0) {
    if (frameCount % 3 === 0) {
      for (let db of demoBikes) {
        // Move bikes
        db.x += dirs[db.dir][0] * gridSize * db.speed;
        db.y += dirs[db.dir][1] * gridSize * db.speed;

        // Wrap around
        if (db.x < 50) db.x = 750;
        if (db.x > 750) db.x = 50;
        if (db.y < 50) db.y = 550;
        if (db.y > 550) db.y = 50;

        // Add trail
        db.trail.push({ x: db.x, y: db.y, life: 40, alpha: 0.3 });
        if (db.trail.length > 80) db.trail.shift();

        // Age trails
        db.trail.forEach(t => t.life--);
        db.trail = db.trail.filter(t => t.life > 0);

        // Random direction change
        if (Math.random() < 0.02) {
          db.dir = (db.dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
        }
      }
    }
  }

  if (gameState === 'playing') {
    ageTrails();

    // NEW: Update status indicators (fixed timer calculation)
    const updatesPerSecond = 60 / 4; // Game updates every 4 frames at 60 FPS = 15 updates/sec
    let p1txt = '';
    let p2txt = '';
    if (p1.shield) p1txt += '🛡 SHIELD  ';
    if (p1.ghost > 0) p1txt += '◆ GHOST ' + Math.ceil(p1.ghost/updatesPerSecond) + 's  ';
    if (p1.slow > 0) p1txt += '⚡ SLOWED ' + Math.ceil(p1.slow/updatesPerSecond) + 's  ';
    if (p1.speedBoost > 0) p1txt += '▶▶ FAST ' + Math.ceil(p1.speedBoost/updatesPerSecond) + 's  ';
    texts.p1Status.setText(p1txt);

    if (p2.shield) p2txt += '🛡 SHIELD  ';
    if (p2.ghost > 0) p2txt += '◆ GHOST ' + Math.ceil(p2.ghost/updatesPerSecond) + 's  ';
    if (p2.slow > 0) p2txt += '⚡ SLOWED ' + Math.ceil(p2.slow/updatesPerSecond) + 's  ';
    if (p2.speedBoost > 0) p2txt += '▶▶ FAST ' + Math.ceil(p2.speedBoost/updatesPerSecond) + 's  ';
    texts.p2Status.setText(p2txt);

    // NEW: Update speed indicators with animation
    const p1Speed = Math.round((p1.slow > 0 ? 1 : p1.speed) * 80);
    const p2Speed = Math.round((p2.slow > 0 ? 1 : p2.speed) * 80);
    texts.p1Speed.setText(p1Speed + ' km/h');
    texts.p2Speed.setText(p2Speed + ' km/h');

    // Keep original player colors
    const p1HexColor = '#' + (p1.color || 0x00ffff).toString(16).padStart(6, '0');
    const p2HexColor = '#' + (p2.color || 0xff8800).toString(16).padStart(6, '0');
    texts.p1Speed.setColor(p1HexColor);
    texts.p2Speed.setColor(p2HexColor);

    if (frameCount % 4 === 0) {
      moveBike(p1);
      moveBike(p2);
      checkCollisions();
      checkPowerups(p1);
      checkPowerups(p2);
      checkSpeedPoints(p1);
      checkSpeedPoints(p2);

      // Check if someone filled their speed bar (wins at speed 5.0)
      if (p1.currentSpeed >= 5.0 && p1.alive) {
        p2.alive = false;
      } else if (p2.currentSpeed >= 5.0 && p2.alive) {
        p1.alive = false;
      }

      if (frameCount % 300 === 0 && powerups.length < 3) {
        spawnPowerup();
      }
    }

    // Create trail particles
    if (frameCount % 8 === 0) {
      if (p1.alive) createTrailParticle(p1, p1.color || 0x00ffff);
      if (p2.alive) createTrailParticle(p2, p2.color || 0xff8800);
    }

    updatePowerups();

    if (!p1.alive || !p2.alive) {
      endRound();
    }
  }

  // Update particles - ALWAYS update, not just during 'playing' state
  particles = particles.filter(p => {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;
    p.alpha = p.life / 30;
    // Remove particles that are out of bounds or dead
    return p.life > 0 && p.x >= 0 && p.x <= 800 && p.y >= 0 && p.y <= 600;
  });

  // Update glow effects - ALWAYS update
  glowEffects = glowEffects.filter(g => {
    g.life--;
    g.radius += 1;
    g.alpha = g.life / 30;
    return g.life > 0;
  });

  drawGame();
}

function createTrailParticle(bike, color) {
  // Normal trail particles
  particles.push({
    x: bike.x + (Math.random() - 0.5) * 6,
    y: bike.y + (Math.random() - 0.5) * 6,
    vx: (Math.random() - 0.5) * 1,
    vy: (Math.random() - 0.5) * 1,
    life: 25,
    alpha: 0.7,
    color: color,
    size: 1 + Math.random()
  });

  // Extra sparkles
  if (Math.random() < 0.4) {
    particles.push({
      x: bike.x,
      y: bike.y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 15,
      alpha: 1,
      color: 0xffffff,
      size: 1
    });
  }

  // Speed boost trail effect
  if (bike.speedBoost > 0) {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: bike.x + (Math.random() - 0.5) * 8,
        y: bike.y + (Math.random() - 0.5) * 8,
        vx: -dirs[bike.dir][0] * 3 + (Math.random() - 0.5),
        vy: -dirs[bike.dir][1] * 3 + (Math.random() - 0.5),
        life: 20,
        alpha: 0.8,
        color: 0xffff00,
        size: 2
      });
    }
  }
}

function ageTrails() {
  p1.trail = p1.trail.filter(t => {
    t.life--;
    return t.life > 0;
  });
  p2.trail = p2.trail.filter(t => {
    t.life--;
    return t.life > 0;
  });
}

function moveBike(bike) {
  if (!bike.alive) return;

  let spd = bike.speed;
  if (bike.slow > 0) spd = 1;

  for (let i = 0; i < spd; i++) {
    bike.x += dirs[bike.dir][0] * gridSize;
    bike.y += dirs[bike.dir][1] * gridSize;

    // Wrap around boundaries
    if (bike.x < 10) bike.x = 790;
    if (bike.x > 790) bike.x = 10;
    if (bike.y < 40) bike.y = 590;
    if (bike.y > 590) bike.y = 40;

    bike.trail.push({ x: bike.x, y: bike.y, life: bike.trailLife });
  }
}

function checkCollisions() {
  // Boundaries now wrap around instead of killing bikes

  if (p1.alive && p1.ghost === 0) {
    // Check own trail - skip only last 5 segments to avoid immediate collision
    const ownTrailToCheck = p1.trail.length > 5 ? p1.trail.slice(0, -5) : [];
    for (let t of ownTrailToCheck) {
      const dx = p1.x - t.x;
      const dy = p1.y - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < gridSize * 1.2) {
        if (p1.shield) {
          p1.shield = false;
          createShieldBreakEffect(p1.x, p1.y, 0x00ffff);
          playTone(game.scene.scenes[0], 400, 0.2);
        } else {
          p1.alive = false;
        }
        break;
      } else if (dist < gridSize * 3) {
        // NEAR MISS!
        createNearMissEffect(p1.x, p1.y, p1);
        p1.nearMisses++;
      }
    }
    // Check enemy trail - check ALL segments
    for (let t of p2.trail) {
      const dx = p1.x - t.x;
      const dy = p1.y - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < gridSize * 1.2) {
        if (p1.shield) {
          p1.shield = false;
          createShieldBreakEffect(p1.x, p1.y, 0x00ffff);
          playTone(game.scene.scenes[0], 400, 0.2);
        } else {
          p1.alive = false;
        }
        break;
      } else if (dist < gridSize * 3) {
        // NEAR MISS!
        createNearMissEffect(p1.x, p1.y, p1);
        p1.nearMisses++;
      }
    }
  }

  if (p2.alive && p2.ghost === 0) {
    // Check own trail - skip only last 5 segments to avoid immediate collision
    const ownTrailToCheck = p2.trail.length > 5 ? p2.trail.slice(0, -5) : [];
    for (let t of ownTrailToCheck) {
      const dx = p2.x - t.x;
      const dy = p2.y - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < gridSize * 1.2) {
        if (p2.shield) {
          p2.shield = false;
          createShieldBreakEffect(p2.x, p2.y, 0xff8800);
          playTone(game.scene.scenes[0], 400, 0.2);
        } else {
          p2.alive = false;
        }
        break;
      } else if (dist < gridSize * 3) {
        // NEAR MISS!
        createNearMissEffect(p2.x, p2.y, p2);
        p2.nearMisses++;
      }
    }
    // Check enemy trail - check ALL segments
    for (let t of p1.trail) {
      const dx = p2.x - t.x;
      const dy = p2.y - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < gridSize * 1.2) {
        if (p2.shield) {
          p2.shield = false;
          createShieldBreakEffect(p2.x, p2.y, 0xff8800);
          playTone(game.scene.scenes[0], 400, 0.2);
        } else {
          p2.alive = false;
        }
        break;
      } else if (dist < gridSize * 3) {
        // NEAR MISS!
        createNearMissEffect(p2.x, p2.y, p2);
        p2.nearMisses++;
      }
    }
  }

  for (let obs of obstacles) {
    // Improved collision detection - check larger area to prevent skipping
    const hitRange = gridSize * 2;
    if (p1.alive && p1.ghost === 0 && Math.abs(p1.x - obs.x) < hitRange && Math.abs(p1.y - obs.y) < hitRange) {
      if (p1.shield) {
        p1.shield = false;
        createShieldBreakEffect(p1.x, p1.y, 0x00ffff);
        playTone(game.scene.scenes[0], 400, 0.2);
      } else {
        p1.alive = false;
      }
    }
    if (p2.alive && p2.ghost === 0 && Math.abs(p2.x - obs.x) < hitRange && Math.abs(p2.y - obs.y) < hitRange) {
      if (p2.shield) {
        p2.shield = false;
        createShieldBreakEffect(p2.x, p2.y, 0xff8800);
        playTone(game.scene.scenes[0], 400, 0.2);
      } else {
        p2.alive = false;
      }
    }
  }

  if (!p1.alive && !p1.exploded && particles.length < 100) {
    p1.exploded = true;
    createExplosion(p1.x, p1.y, 0x00ffff);
    game.scene.scenes[0].cameras.main.shake(300, 0.01);

    // CRASH text
    const crashText = game.scene.scenes[0].add.text(p1.x, p1.y, 'CRASH!', {
      fontSize: '32px',
      fontFamily: 'Courier New, monospace',
      color: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);

    game.scene.scenes[0].tweens.add({
      targets: crashText,
      y: p1.y - 50,
      alpha: 0,
      scale: 2,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => crashText.destroy()
    });

    // Shockwave rings
    for (let r = 0; r < 3; r++) {
      setTimeout(() => {
        glowEffects.push({
          x: p1.x,
          y: p1.y,
          radius: 5,
          life: 40,
          alpha: 0.8,
          color: 0x00ffff
        });
      }, r * 100);
    }
  }
  if (!p2.alive && !p2.exploded && particles.length < 100) {
    p2.exploded = true;
    createExplosion(p2.x, p2.y, 0xff8800);
    game.scene.scenes[0].cameras.main.shake(300, 0.01);

    // CRASH text
    const crashText = game.scene.scenes[0].add.text(p2.x, p2.y, 'CRASH!', {
      fontSize: '32px',
      fontFamily: 'Courier New, monospace',
      color: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);

    game.scene.scenes[0].tweens.add({
      targets: crashText,
      y: p2.y - 50,
      alpha: 0,
      scale: 2,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => crashText.destroy()
    });

    // Shockwave rings
    for (let r = 0; r < 3; r++) {
      setTimeout(() => {
        glowEffects.push({
          x: p2.x,
          y: p2.y,
          radius: 5,
          life: 40,
          alpha: 0.8,
          color: 0xff8800
        });
      }, r * 100);
    }
  }
}

function checkPowerups(bike) {
  if (!bike.alive) return;

  for (let i = powerups.length - 1; i >= 0; i--) {
    const pw = powerups[i];
    if (Math.abs(bike.x - pw.x) < 15 && Math.abs(bike.y - pw.y) < 15) {
      applyPowerup(bike, pw.type, bike === p1 ? p2 : p1);
      powerups.splice(i, 1);

      if (pwrTypes[pw.type].good) {
        playTone(game.scene.scenes[0], 1200, 0.1);
        createCollectEffect(pw.x, pw.y, pwrTypes[pw.type].c);
      } else {
        playTone(game.scene.scenes[0], 200, 0.2);
        createCollectEffect(pw.x, pw.y, 0xff0000);
      }
    }
  }
}

function createCollectEffect(x, y, color) {
  glowEffects.push({
    x: x,
    y: y,
    radius: 5,
    life: 30,
    alpha: 1,
    color: color
  });

  // NEW: Radial particle burst
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * 4,
      vy: Math.sin(angle) * 4,
      life: 20,
      alpha: 1,
      color: color,
      size: 3
    });
  }

  // NEW: Floating text
  const txt = game.scene.scenes[0].add.text(x, y, '+BONUS', {
    fontSize: '16px',
    fontFamily: 'Courier New, monospace',
    color: '#' + color.toString(16).padStart(6, '0'),
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5);

  game.scene.scenes[0].tweens.add({
    targets: txt,
    y: y - 40,
    alpha: 0,
    duration: 800,
    onComplete: () => txt.destroy()
  });
}

function applyPowerup(bike, type, enemy) {
  if (type === 0) {
    bike.speed = 3;
    bike.speedBoost = 180; // 180 / 15 = 12 seconds at game update rate
  } else if (type === 1) {
    bike.ghost = 150;
  } else if (type === 2) {
    enemy.slow = 120;
  } else if (type === 3) {
    bike.trailLife = Math.min(bike.trailLife + 60, 300);
    createExplosion(bike.x, bike.y, 0x00ffaa);
  } else if (type === 4) {
    // NEW: SHIELD power-up
    bike.shield = true;
    createShieldEffect(bike.x, bike.y);
  } else if (type === 5) {
    bike.trailLife = Math.max(bike.trailLife - 40, 30);
    createExplosion(bike.x, bike.y, 0xff0000);
  }
}

function createNearMissEffect(x, y, bike) {
  if (frameCount % 10 !== 0) return; // Throttle

  // Main near-miss particle
  particles.push({
    x: x,
    y: y,
    vx: 0,
    vy: -2,
    life: 20,
    alpha: 1,
    color: 0xffff00,
    size: 2
  });

  // Near-miss streak bonus particles
  if (bike && bike.nearMisses > 0) {
    const streak = bike.nearMisses % 100;

    // Add ring particles for streak effect
    if (streak > 3) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          life: 25,
          alpha: 0.9,
          color: 0xffff00,
          size: 2
        });
      }
    }

    // Combo text at milestones
    if (streak === 5 || streak === 10 || streak === 20) {
      const comboText = game.scene.scenes[0].add.text(x, y, 'x' + streak + ' COMBO!', {
        fontSize: '20px',
        fontFamily: 'Courier New, monospace',
        color: '#ffff00',
        stroke: '#000',
        strokeThickness: 4
      }).setOrigin(0.5);

      game.scene.scenes[0].tweens.add({
        targets: comboText,
        y: y - 50,
        scale: 1.5,
        alpha: 0,
        duration: 1000,
        ease: 'Power2.easeOut',
        onComplete: () => comboText.destroy()
      });

      // Extra celebration particles
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          life: 30,
          alpha: 1,
          color: [0xffff00, 0xff8800, 0xffffff][Math.floor(Math.random() * 3)],
          size: 3
        });
      }
    }
  }
}

function createShieldEffect(x, y) {
  glowEffects.push({
    x: x,
    y: y,
    radius: 15,
    life: 30,
    alpha: 1,
    color: 0x00ddff
  });
}

function createShieldBreakEffect(x, y, color) {
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      life: 25,
      alpha: 1,
      color: 0x00ddff,
      size: 2
    });
  }
}

function updatePowerups() {
  if (p1.ghost > 0) p1.ghost--;
  if (p2.ghost > 0) p2.ghost--;
  if (p1.slow > 0) p1.slow--;
  if (p2.slow > 0) p2.slow--;
  if (p1.speedBoost > 0) {
    p1.speedBoost--;
    if (p1.speedBoost === 0) p1.speed = 2;
  }
  if (p2.speedBoost > 0) {
    p2.speedBoost--;
    if (p2.speedBoost === 0) p2.speed = 2;
  }
}

function spawnPowerup() {
  const isMine = Math.random() < 0.3;
  const type = isMine ? 5 : Math.floor(Math.random() * 5);
  // Keep powerups away from edges where bikes wrap around
  const px = 120 + Math.floor(Math.random() * 560 / gridSize) * gridSize;
  const py = 80 + Math.floor(Math.random() * 440 / gridSize) * gridSize;
  powerups.push({ x: px, y: py, type: type, anim: 0, pulse: 0 });
}

function spawnSpeedPoint() {
  // Keep speed points away from edges where bikes wrap around
  const px = 120 + Math.floor(Math.random() * 560 / gridSize) * gridSize;
  const py = 80 + Math.floor(Math.random() * 440 / gridSize) * gridSize;
  speedPoints.push({ x: px, y: py, anim: 0 });
}

function checkSpeedPoints(bike) {
  for (let i = speedPoints.length - 1; i >= 0; i--) {
    const sp = speedPoints[i];
    const dist = Math.sqrt((bike.x - sp.x) ** 2 + (bike.y - sp.y) ** 2);
    // Increased detection radius from gridSize * 2 to gridSize * 4 for high-speed collection
    if (dist < gridSize * 4) {
      speedPoints.splice(i, 1);
      bike.maxSpeed += 0.15;
      bike.currentSpeed = bike.maxSpeed;
      bike.speed = bike.maxSpeed;
      playTone(game.scene.scenes[0], 1200, 0.1);

      // Create collection effect
      for (let j = 0; j < 10; j++) {
        const angle = (j / 10) * Math.PI * 2;
        particles.push({
          x: sp.x,
          y: sp.y,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          life: 20,
          alpha: 1,
          color: 0xffff00,
          size: 2
        });
      }

      // Spawn new point
      if (speedPoints.length < 12) {
        spawnSpeedPoint();
      }
    }
  }
}

function createExplosion(x, y, color) {
  // PRIMARY WAVE - Large fast particles
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const speed = 3 + Math.random() * 5;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 40 + Math.random() * 20,
      alpha: 1,
      color: color,
      size: 3 + Math.random() * 3
    });
  }

  // SECONDARY WAVE - Slower particles (delayed)
  setTimeout(() => {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        alpha: 0.8,
        color: 0xffffff,
        size: 1 + Math.random() * 2
      });
    }
  }, 100);

  // SPARKS - Bright fast particles
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 4;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20,
      alpha: 1,
      color: 0xffffff,
      size: 1
    });
  }

  // MULTIPLE GLOW LAYERS
  glowEffects.push({
    x: x,
    y: y,
    radius: 15,
    life: 40,
    alpha: 1,
    color: color
  });

  glowEffects.push({
    x: x,
    y: y,
    radius: 8,
    life: 50,
    alpha: 0.8,
    color: 0xffffff
  });

  // Screen flash
  const scene = game.scene.scenes[0];
  if (scene && scene.cameras && scene.cameras.main) {
    scene.cameras.main.flash(200, 255, 255, 255, false, null);
  }
}

function endRound() {
  gameState = 'roundEnd';
  const scene = game.scene.scenes[0];

  // Hide speed indicators and score
  texts.p1Speed.setVisible(false);
  texts.p2Speed.setVisible(false);
  texts.roundInfo.setVisible(false);

  // Make all speed points fall with gravity and bounce
  for (let sp of speedPoints) {
    sp.vy = 0; // Initial vertical velocity
    sp.vx = (Math.random() - 0.5) * 4; // Random horizontal velocity
    sp.gravity = 0.3; // Gravity acceleration
    sp.bounce = 0.7; // Bounce factor (70% energy retained)
    sp.falling = true;
  }

  let winner = '';
  let winnerColor = 0xffffff;
  let winnerBike = null;

  if (!p1.alive && !p2.alive) {
    winner = 'DRAW!';
    winnerColor = 0xffff00;
  } else if (!p1.alive) {
    scores.p2++;
    winner = 'PLAYER 2 WINS!';
    winnerColor = 0xff8800;
    winnerBike = p2;

    // EPIC Victory celebration ENHANCED
    scene.cameras.main.shake(500, 0.008);

    // Massive fireworks
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * 800,
        y: -20,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 2,
        life: 80,
        alpha: 1,
        color: [0xff8800, 0xffff00, 0xff0000][Math.floor(Math.random() * 3)],
        size: 4 + Math.random() * 3
      });
    }

    // CONFETTI from sides
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: i < 25 ? 0 : 800,
        y: Math.random() * 600,
        vx: i < 25 ? 6 + Math.random() * 4 : -6 - Math.random() * 4,
        vy: (Math.random() - 0.5) * 8,
        life: 100,
        alpha: 1,
        color: [0xff8800, 0xffff00, 0xff0000, 0xffffff][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 4
      });
    }

    // STARS bursting from winner position
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      particles.push({
        x: p2.x,
        y: p2.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60,
        alpha: 1,
        color: 0xffff00,
        size: 3
      });
    }

    // CONTINUOUS CONFETTI RAIN
    const confettiInterval = setInterval(() => {
      if (gameState !== 'roundEnd') {
        clearInterval(confettiInterval);
        return;
      }
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: Math.random() * 800,
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          life: 80,
          alpha: 1,
          color: [0xff8800, 0xffff00, 0xff0000, 0xffffff][Math.floor(Math.random() * 4)],
          size: 2 + Math.random() * 3
        });
      }
    }, 100);

    playTone(scene, 659, 0.3);
    playTone(scene, 880, 0.2);
  } else {
    scores.p1++;
    winner = 'PLAYER 1 WINS!';
    winnerColor = 0x00ffff;
    winnerBike = p1;

    // EPIC Victory celebration ENHANCED
    scene.cameras.main.shake(500, 0.008);

    // Massive fireworks
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * 800,
        y: -20,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 2,
        life: 80,
        alpha: 1,
        color: [0x00ffff, 0x00ff00, 0xffff00][Math.floor(Math.random() * 3)],
        size: 4 + Math.random() * 3
      });
    }

    // CONFETTI from sides
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: i < 25 ? 0 : 800,
        y: Math.random() * 600,
        vx: i < 25 ? 6 + Math.random() * 4 : -6 - Math.random() * 4,
        vy: (Math.random() - 0.5) * 8,
        life: 100,
        alpha: 1,
        color: [0x00ffff, 0x00ff00, 0xffff00, 0xffffff][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 4
      });
    }

    // STARS bursting from winner position
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      particles.push({
        x: p1.x,
        y: p1.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60,
        alpha: 1,
        color: 0xffff00,
        size: 3
      });
    }

    // CONTINUOUS CONFETTI RAIN
    const confettiInterval = setInterval(() => {
      if (gameState !== 'roundEnd') {
        clearInterval(confettiInterval);
        return;
      }
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: Math.random() * 800,
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          life: 80,
          alpha: 1,
          color: [0x00ffff, 0x00ff00, 0xffff00, 0xffffff][Math.floor(Math.random() * 4)],
          size: 2 + Math.random() * 3
        });
      }
    }, 100);

    playTone(scene, 523, 0.3);
    playTone(scene, 698, 0.2);
  }


  updateUI();

  if (scores.p1 >= 3 || scores.p2 >= 3) {
    // NEW: Update arcade stats
    totalGames++;
    const winnerScore = Math.max(scores.p1, scores.p2);
    const isNewRecord = winnerScore > highScore;
    if (isNewRecord) {
      highScore = winnerScore;
    }

    let finalMsg = scores.p1 >= 3 ? 'PLAYER 1 WINS THE GAME!' : 'PLAYER 2 WINS THE GAME!';
    const finalWinnerColor = scores.p1 >= 3 ? 0x00ffff : 0xff8800;
    if (isNewRecord) {
      finalMsg += '\n🏆 NEW HIGH SCORE! 🏆';
    }
    const hexColor = '#' + finalWinnerColor.toString(16).padStart(6, '0');
    texts.start.setText(finalMsg).setVisible(true).setFontSize('40px').setColor(hexColor).setPosition(400, 250); // Centered and larger

    // MEGA celebration for game win
    for (let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        for (let i = 0; i < 40; i++) {
          const angle = (i / 40) * Math.PI * 2;
          particles.push({
            x: 400,
            y: 300,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            life: 50,
            alpha: 1,
            color: scores.p1 >= 3 ? 0x00ffff : 0xff8800,
            size: 4
          });
        }
        playTone(scene, 1000 + wave * 200, 0.15);
      }, wave * 300);
    }

    // NEW: Extra celebration for new record
    if (isNewRecord) {
      for (let i = 0; i < 100; i++) {
        setTimeout(() => {
          particles.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 60,
            alpha: 1,
            color: 0xffff00,
            size: 3 + Math.random() * 2
          });
        }, i * 20);
      }
    }

    setTimeout(() => {
      texts.start.setText('▶ PRESS SPACE TO RESTART ◀').setFontSize('24px').setPosition(400, 480);
    }, 2500);
  } else {
    const hexColor = '#' + winnerColor.toString(16).padStart(6, '0');
    texts.start.setText(winner + '\n▶ PRESS SPACE FOR NEXT ROUND ◀').setVisible(true).setFontSize('36px').setPosition(400, 300).setColor(hexColor);
  }
}

function showStartScreen(scene) {
  // Switch back to calm menu music
  playMenuMusic();

  // TITLE - Massive zoom in
  texts.titleGlow.setVisible(true).setAlpha(0).setScale(4);
  texts.title.setVisible(true).setAlpha(0).setScale(4);

  scene.tweens.add({
    targets: texts.titleGlow,
    alpha: 0.6,
    scale: 1.15,
    duration: 800,
    ease: 'Back.easeOut'
  });

  scene.tweens.add({
    targets: texts.title,
    alpha: 1,
    scale: 1,
    duration: 800,
    ease: 'Back.easeOut'
  });

  // Pulsing glow
  scene.tweens.add({
    targets: texts.titleGlow,
    alpha: 0.3,
    scale: 1.25,
    duration: 2000,
    delay: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // CONTROLS - Slide up
  texts.inst1.setVisible(true).setAlpha(0).setY(390);
  scene.tweens.add({
    targets: texts.inst1,
    alpha: 1,
    y: 370,
    duration: 600,
    delay: 400,
    ease: 'Power2.easeOut'
  });

  // START - Pulse
  texts.start.setVisible(true).setAlpha(0);
  scene.tweens.add({
    targets: texts.start,
    alpha: 1,
    duration: 600,
    delay: 800,
    ease: 'Power2.easeOut'
  });

  scene.tweens.add({
    targets: texts.start,
    scale: 1.08,
    duration: 700,
    delay: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // CAROUSEL - Rotating tips below "PRESS SPACE"
  const carouselMessages = [
    'WIN BY KILLING YOUR OPPONENT OR FILLING YOUR SPEED BAR!',
    'COLLECT YELLOW STARS TO BOOST SPEED!',
    'P1: WASD  •  P2: ARROWS',
    'FIRST TO 3 ROUNDS WINS THE MATCH!'
  ];

  let carouselIndex = 0;

  texts.carousel.setVisible(true).setAlpha(0);
  texts.carousel.setText(carouselMessages[0]);

  scene.tweens.add({
    targets: texts.carousel,
    alpha: 1,
    duration: 600,
    delay: 1000,
    ease: 'Power2.easeOut'
  });

  // Rotate carousel messages every 3 seconds
  scene.time.addEvent({
    delay: 3000,
    repeat: -1,
    callback: () => {
      if (gameState !== 'start') return;

      // Fade out
      scene.tweens.add({
        targets: texts.carousel,
        alpha: 0,
        duration: 400,
        ease: 'Power2.easeIn',
        onComplete: () => {
          // Change text
          carouselIndex = (carouselIndex + 1) % carouselMessages.length;
          texts.carousel.setText(carouselMessages[carouselIndex]);

          // Fade in
          scene.tweens.add({
            targets: texts.carousel,
            alpha: 1,
            duration: 400,
            ease: 'Power2.easeOut'
          });
        }
      });
    }
  });
}

function showVehicleSelect(scene) {
  // Hide other screens
  texts.title.setVisible(false);
  texts.titleGlow.setVisible(false);
  texts.inst1.setVisible(false);
  texts.start.setVisible(false);
  texts.carousel.setVisible(false);

  // Show vehicle selection
  texts.vehicleTitle.setVisible(true);
  texts.p1VehicleLabel.setVisible(true);
  texts.p2VehicleLabel.setVisible(true);
  texts.p1VehicleChoice.setVisible(true);
  texts.p2VehicleChoice.setVisible(true);
  texts.vehicleStart.setVisible(true);

  // Initialize demo bikes battling in background
  demoBikes = [
    { x: 150, y: 100, dir: 1, trail: [], speed: 1.5, color: 0x00ffff },
    { x: 650, y: 500, dir: 3, trail: [], speed: 1.5, color: 0xff8800 }
  ];

  updateVehicleUI();

  // Add blinking animation to start button
  scene.tweens.add({
    targets: texts.vehicleStart,
    alpha: 0.4,
    scale: 0.95,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
}

function updateVehicleUI() {
  const v1 = vehicleTypes[p1Vehicle];
  const v2 = vehicleTypes[p2Vehicle];

  const p1HexColor = '#' + v1.color.toString(16).padStart(6, '0');
  const p2HexColor = '#' + v2.color.toString(16).padStart(6, '0');

  // Update color choice text
  texts.p1VehicleChoice.setText(v1.n).setColor(p1HexColor);
  texts.p2VehicleChoice.setText(v2.n).setColor(p2HexColor);

  // Update player labels to match selected color
  texts.p1VehicleLabel.setColor(p1HexColor);
  texts.p2VehicleLabel.setColor(p2HexColor);
}

function updateUI() {
  texts.roundInfo.setText(scores.p1 + ' - ' + scores.p2);
}

function drawGame() {
  graphics.clear();

  // TRON CITY BACKGROUND
  // Dark gradient sky (using multiple rects for gradient effect)
  graphics.fillStyle(0x000814, 1);
  graphics.fillRect(0, 0, 800, 200);
  graphics.fillStyle(0x000a1a, 1);
  graphics.fillRect(0, 200, 800, 200);
  graphics.fillStyle(0x001233, 1);
  graphics.fillRect(0, 400, 800, 200);

  // Perspective grid floor (receding into distance)
  const horizonY = 400;
  const gridSpacing = 40;
  const time = frameCount * 0.5;

  // Horizontal grid lines (receding)
  for (let i = 0; i < 10; i++) {
    const y = horizonY + i * 20;
    const perspective = 1 - (y - horizonY) / 200;
    const alpha = 0.15 + perspective * 0.25;
    graphics.lineStyle(1, 0x00ffff, alpha);
    graphics.lineBetween(0, y, 800, y);
  }

  // Vertical grid lines (converging to center)
  const centerX = 400;
  for (let i = -10; i <= 10; i++) {
    const x = centerX + i * gridSpacing;
    const alpha = 0.2 - Math.abs(i) * 0.01;
    graphics.lineStyle(1, 0x00aaff, alpha);
    graphics.lineBetween(x, horizonY, x + (x - centerX) * 0.5, 600);
  }

  // TRON CITY BUILDINGS - distant skyline
  const buildings = [
    { x: 20, w: 90, h: 180, color: 0x001144 },
    { x: 120, w: 80, h: 250, color: 0x001155 },
    { x: 210, w: 50, h: 200, color: 0x001133 },
    { x: 270, w: 70, h: 280, color: 0x001166 },
    { x: 350, w: 90, h: 320, color: 0x001155 },
    { x: 450, w: 60, h: 240, color: 0x001144 },
    { x: 520, w: 80, h: 300, color: 0x001166 },
    { x: 610, w: 50, h: 220, color: 0x001133 },
    { x: 670, w: 70, h: 260, color: 0x001155 },
    { x: 750, w: 40, h: 180, color: 0x001144 }
  ];

  for (let bldg of buildings) {
    // Building body
    graphics.fillStyle(bldg.color, 0.7);
    graphics.fillRect(bldg.x, horizonY - bldg.h, bldg.w, bldg.h);

    // Neon edge lights
    const glowPulse = 0.3 + Math.sin(time / 20 + bldg.x) * 0.2;
    graphics.lineStyle(2, 0x00ffff, glowPulse);
    graphics.strokeRect(bldg.x, horizonY - bldg.h, bldg.w, bldg.h);

    // Window lights (random pattern)
    graphics.fillStyle(0x00ffff, 0.6);
    for (let y = horizonY - bldg.h + 10; y < horizonY - 10; y += 15) {
      for (let x = bldg.x + 8; x < bldg.x + bldg.w - 8; x += 12) {
        if (Math.random() > 0.3) {
          const windowPulse = 0.4 + Math.sin(time / 30 + x + y) * 0.3;
          graphics.fillStyle(0x00ffff, windowPulse);
          graphics.fillRect(x, y, 6, 8);
        }
      }
    }

    // Top antenna with blinking light
    if (Math.random() > 0.6) {
      graphics.lineStyle(2, 0x00ffff, 0.5);
      graphics.lineBetween(bldg.x + bldg.w / 2, horizonY - bldg.h, bldg.x + bldg.w / 2, horizonY - bldg.h - 20);
      const blink = Math.sin(time / 10 + bldg.x) > 0 ? 1 : 0.2;
      graphics.fillStyle(0xff0000, blink);
      graphics.fillCircle(bldg.x + bldg.w / 2, horizonY - bldg.h - 20, 3);
    }
  }

  // Atmospheric haze
  graphics.fillStyle(0x001133, 0.2);
  graphics.fillRect(0, horizonY - 100, 800, 100);

  // Background particles (stars/distant lights)
  for (let bp of backgroundParticles) {
    graphics.fillStyle(0x00ffff, bp.alpha);
    graphics.fillCircle(bp.x, bp.y, bp.size);
  }

  // Scanlines
  for (let sl of scanlines) {
    graphics.fillStyle(0x00ffff, sl.alpha);
    graphics.fillRect(0, sl.y, 800, 1);
  }

  if (gameState === 'vehicleSelect') {
    // Animated perspective grid (TRON style)
    graphics.lineStyle(1, 0x004466, 0.6);
    for (let x = 0; x < 800; x += 40) {
      graphics.lineBetween(x, 0, x, 600);
    }
    for (let y = 0; y < 600; y += 40) {
      graphics.lineBetween(0, y, 800, y);
    }

    // Demo bikes battling in background
    for (let db of demoBikes) {
      // Draw demo bike trails with glow
      if (db.trail.length > 1) {
        for (let i = 1; i < db.trail.length; i++) {
          const prev = db.trail[i - 1];
          const curr = db.trail[i];

          // FIX: Detect wrap-around (teleport) and skip drawing line across screen
          const dx = Math.abs(curr.x - prev.x);
          const dy = Math.abs(curr.y - prev.y);
          if (dx > 100 || dy > 100) continue; // Skip if big jump (wrap-around)

          const alpha = (curr.life / 40) * 0.4;

          // Outer glow
          graphics.lineStyle(8, db.color, alpha * 0.2);
          graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);

          // Main trail
          graphics.lineStyle(4, db.color, alpha * 0.6);
          graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);

          // Inner bright line
          graphics.lineStyle(2, 0xffffff, alpha * 0.4);
          graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);
        }
      }

      // Draw demo bike with improved design
      drawImprovedBike(db.x, db.y, db.dir, db.color, 0.5);
    }

    // Removed dark overlay and selection boxes for cleaner look

    // Draw vehicle preview
    const v1 = vehicleTypes[p1Vehicle];
    const v2 = vehicleTypes[p2Vehicle];
    drawVehiclePreview(200, 420, p1Vehicle, v1.color);
    drawVehiclePreview(600, 420, p2Vehicle, v2.color);

    // Main border with double glow effect
    const borderPulse = 0.7 + Math.sin(frameCount / 20) * 0.3;
    graphics.lineStyle(4, 0x00ffff, borderPulse);
    graphics.strokeRect(10, 10, 780, 580);
    graphics.lineStyle(2, 0x00aaff, borderPulse * 0.6);
    graphics.strokeRect(15, 15, 770, 570);

    // Corner accents
    const cornerSize = 20;
    graphics.lineStyle(3, 0x00ffff, borderPulse);
    // Top left
    graphics.lineBetween(10, 10, 10 + cornerSize, 10);
    graphics.lineBetween(10, 10, 10, 10 + cornerSize);
    // Top right
    graphics.lineBetween(790, 10, 790 - cornerSize, 10);
    graphics.lineBetween(790, 10, 790, 10 + cornerSize);
    // Bottom left
    graphics.lineBetween(10, 590, 10 + cornerSize, 590);
    graphics.lineBetween(10, 590, 10, 590 - cornerSize);
    // Bottom right
    graphics.lineBetween(790, 590, 790 - cornerSize, 590);
    graphics.lineBetween(790, 590, 790, 590 - cornerSize);

    return;
  }

  if (gameState === 'start') {
    // CLEAN: Simple subtle grid
    graphics.lineStyle(1, 0x003344, 0.3);
    for (let x = 0; x < 800; x += 80) {
      graphics.lineBetween(x, 0, x, 600);
    }
    for (let y = 0; y < 600; y += 80) {
      graphics.lineBetween(0, y, 800, y);
    }

    // NEW: Animated bikes in background (BEHIND title)
    // Create demo bikes if not exist
    if (demoBikes.length === 0 && frameCount > 60) {
      demoBikes = [
        { x: 100, y: 150, dir: 0, trail: [], speed: 1.8, color: 0x00ffff },
        { x: 700, y: 450, dir: 2, trail: [], speed: 1.8, color: 0xff8800 },
        { x: 400, y: 100, dir: 1, trail: [], speed: 1.5, color: 0xffff00 }
      ];
    }

    // Update and draw demo bikes
    if (demoBikes.length > 0 && frameCount % 3 === 0) {
      for (let db of demoBikes) {
        // Move
        db.x += dirs[db.dir][0] * gridSize * db.speed;
        db.y += dirs[db.dir][1] * gridSize * db.speed;

        // Wrap
        if (db.x < 20) db.x = 780;
        if (db.x > 780) db.x = 20;
        if (db.y < 20) db.y = 580;
        if (db.y > 580) db.y = 20;

        // Trail
        db.trail.push({ x: db.x, y: db.y, life: 50 });
        if (db.trail.length > 120) db.trail.shift();
        db.trail.forEach(t => t.life--);
        db.trail = db.trail.filter(t => t.life > 0);

        // Random turns
        if (Math.random() < 0.015) {
          db.dir = (db.dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
        }
      }
    }

    // NEW: ATTRACT MODE - More visible trails for demo bikes
    for (let db of demoBikes) {
      if (db.trail.length > 1) {
        for (let i = 1; i < db.trail.length; i++) {
          const prev = db.trail[i - 1];
          const curr = db.trail[i];

          // FIX: Detect wrap-around (teleport) and skip drawing line across screen
          const dx = Math.abs(curr.x - prev.x);
          const dy = Math.abs(curr.y - prev.y);
          if (dx > 100 || dy > 100) continue; // Skip if big jump (wrap-around)

          const alpha = (curr.life / 50) * 0.5; // More visible

          // Wider trails for attract mode
          graphics.lineStyle(5, db.color, alpha * 0.3);
          graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);

          graphics.lineStyle(3, db.color, alpha * 0.7);
          graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);

          // Bright core
          graphics.lineStyle(1, 0xffffff, alpha * 0.9);
          graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);
        }
      }

      // Draw demo bikes bigger
      drawImprovedBike(db.x, db.y, db.dir, db.color, 0.7);
    }

    // NEW: Pulsing border for attract mode
    const attractPulse = 0.5 + Math.sin(frameCount / 30) * 0.5;
    graphics.lineStyle(3, 0x00ffff, attractPulse * 0.6);
    graphics.strokeRect(5, 5, 790, 590);
    graphics.strokeRect(8, 8, 784, 584);

    return;
  }

  // ENHANCED Grid with pulse effects
  graphics.lineStyle(1, 0x001a1a, 0.6);
  for (let x = 0; x < 800; x += 40) {
    // Add pulsing highlight to some grid lines
    const pulse = Math.sin((frameCount + x) / 40) * 0.3;
    const alpha = x % 120 === 0 ? 0.6 + pulse : 0.6;
    graphics.lineStyle(1, 0x001a1a, alpha);
    graphics.lineBetween(x, 0, x, 600);
  }
  for (let y = 0; y < 600; y += 40) {
    const pulse = Math.sin((frameCount + y) / 40) * 0.3;
    const alpha = y % 120 === 0 ? 0.6 + pulse : 0.6;
    graphics.lineStyle(1, 0x001a1a, alpha);
    graphics.lineBetween(0, y, 800, y);
  }

  // Energy scan lines (moving)
  const scanY = (frameCount * 3) % 600;
  graphics.lineStyle(2, 0x00ffff, 0.3);
  graphics.lineBetween(0, scanY, 800, scanY);
  graphics.lineStyle(1, 0xffffff, 0.5);
  graphics.lineBetween(0, scanY + 1, 800, scanY + 1);

  // Animated border with corner accents
  const borderGlow = 0.7 + Math.sin(frameCount / 15) * 0.3;
  graphics.lineStyle(4, 0x00ffff, borderGlow);
  graphics.strokeRect(10, 40, 780, 550);
  graphics.lineStyle(2, 0xffffff, borderGlow * 0.5);
  graphics.strokeRect(12, 42, 776, 546);

  // Corner energy pulses
  const cornerPulse = 0.5 + Math.sin(frameCount / 10) * 0.5;
  graphics.fillStyle(0x00ffff, cornerPulse * 0.3);
  graphics.fillCircle(10, 40, 8);
  graphics.fillCircle(790, 40, 8);
  graphics.fillCircle(10, 590, 8);
  graphics.fillCircle(790, 590, 8);

  // UI Background panels for better readability
  // Removed HUD backgrounds - using vertical speed bars on sides instead

  // Removed old horizontal speed bars - now using vertical bars on sides

  // ENHANCED Obstacles with multi-layer effects
  for (let obs of obstacles) {
    const glowPulse = 0.5 + Math.sin((frameCount + obs.glow * 100) / 20) * 0.3;

    // Warning glow rings
    graphics.lineStyle(3, 0xff0000, glowPulse * 0.2);
    graphics.strokeRect(obs.x - 8, obs.y - 8, 16, 16);
    graphics.lineStyle(2, 0xff6666, glowPulse * 0.4);
    graphics.strokeRect(obs.x - 6, obs.y - 6, 12, 12);

    // Main obstacle body (metallic)
    graphics.fillStyle(0x888888, 1);
    graphics.fillRect(obs.x - 3, obs.y - 3, 6, 6);

    // Dark center
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(obs.x - 2, obs.y - 2, 4, 4);

    // Danger border
    graphics.lineStyle(1.5, 0xff6666, glowPulse);
    graphics.strokeRect(obs.x - 4, obs.y - 4, 8, 8);

    // Corner accents
    graphics.fillStyle(0xff0000, glowPulse);
    graphics.fillCircle(obs.x - 4, obs.y - 4, 2);
    graphics.fillCircle(obs.x + 4, obs.y - 4, 2);
    graphics.fillCircle(obs.x - 4, obs.y + 4, 2);
    graphics.fillCircle(obs.x + 4, obs.y + 4, 2);

    // Warning particles
    if (frameCount % 10 === 0 && Math.random() < 0.3) {
      particles.push({
        x: obs.x + (Math.random() - 0.5) * 8,
        y: obs.y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 25,
        alpha: 0.8,
        color: 0xff6666,
        size: 1
      });
    }
  }

  // Glow effects
  for (let g of glowEffects) {
    graphics.fillStyle(g.color, g.alpha * 0.3);
    graphics.fillCircle(g.x, g.y, g.radius);
    graphics.lineStyle(2, g.color, g.alpha);
    graphics.strokeCircle(g.x, g.y, g.radius);
  }

  // Enhanced trails
  drawEnhancedTrail(p1, p1.color || 0x00ffff);
  drawEnhancedTrail(p2, p2.color || 0xff8800);

  // Draw bikes as actual light cycles
  drawLightCycle(p1, p1.color || 0x00ffff);
  drawLightCycle(p2, p2.color || 0xff8800);

  // Power-ups with ULTRA enhanced effects
  for (let pw of powerups) {
    pw.anim = (pw.anim + 1) % 60;
    pw.pulse = Math.sin(pw.anim / 10) * 0.4;
    const pulse = 1 + pw.pulse;

    // RAINBOW rotating particles around power-up
    if (frameCount % 2 === 0 && pw.type !== 5) {
      const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x00ffff, 0x0088ff, 0xff00ff];
      const angle = (frameCount / 20 + powerups.indexOf(pw)) % (Math.PI * 2);
      const radius = 15;
      particles.push({
        x: pw.x + Math.cos(angle) * radius,
        y: pw.y + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 0.3,
        vy: Math.sin(angle) * 0.3,
        life: 20,
        alpha: 0.8,
        color: rainbowColors[Math.floor((frameCount / 5 + powerups.indexOf(pw)) % rainbowColors.length)],
        size: 2
      });
    }

    if (pw.type === 5) {
      // MINE with danger animation (type 5, not 4!)
      graphics.fillStyle(0xff0000, 0.8);
      graphics.fillCircle(pw.x, pw.y, 5 * pulse);
      graphics.lineStyle(2, 0xff0000, 1);
      graphics.strokeCircle(pw.x, pw.y, 8 * pulse);
      graphics.lineStyle(2, 0xffff00, 0.8);
      graphics.lineBetween(pw.x - 5, pw.y - 5, pw.x + 5, pw.y + 5);
      graphics.lineBetween(pw.x - 5, pw.y + 5, pw.x + 5, pw.y - 5);

      // Outer warning ring
      const warningAlpha = Math.abs(Math.sin(pw.anim / 5));
      graphics.lineStyle(1, 0xff0000, warningAlpha);
      graphics.strokeCircle(pw.x, pw.y, 12 * pulse);
    } else {
      // Good power-ups with dual-color glow
      graphics.fillStyle(pwrTypes[pw.type].c, 0.8);
      graphics.fillCircle(pw.x, pw.y, 6 * pulse);
      graphics.lineStyle(2, pwrTypes[pw.type].c, 0.8);
      graphics.strokeCircle(pw.x, pw.y, 9 * pulse);
      graphics.lineStyle(1, pwrTypes[pw.type].c2, 0.4);
      graphics.strokeCircle(pw.x, pw.y, 12 * pulse);

      // IMPROVED: Clear type-specific icons
      graphics.save();
      graphics.translateCanvas(pw.x, pw.y);

      if (pw.type === 0) { // SPEED - Triple lightning bolts
        graphics.lineStyle(2.5, 0xffff00, 1);
        // Left bolt
        graphics.beginPath();
        graphics.moveTo(-5, -4);
        graphics.lineTo(-3, 0);
        graphics.lineTo(-4, 0);
        graphics.lineTo(-2, 4);
        graphics.strokePath();
        // Center bolt (brightest)
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(0, -5);
        graphics.lineTo(1, 0);
        graphics.lineTo(0, 0);
        graphics.lineTo(2, 5);
        graphics.strokePath();
        // Right bolt
        graphics.lineStyle(2.5, 0xffff00, 1);
        graphics.beginPath();
        graphics.moveTo(4, -4);
        graphics.lineTo(5, 0);
        graphics.lineTo(4, 0);
        graphics.lineTo(6, 4);
        graphics.strokePath();

      } else if (pw.type === 1) { // GHOST - Pac-man ghost shape
        graphics.lineStyle(2, 0xff00ff, 1);
        // Ghost body
        graphics.beginPath();
        graphics.arc(0, -1, 4, Math.PI, 0, true);
        graphics.lineTo(4, 3);
        graphics.lineTo(3, 1);
        graphics.lineTo(2, 3);
        graphics.lineTo(1, 1);
        graphics.lineTo(0, 3);
        graphics.lineTo(-1, 1);
        graphics.lineTo(-2, 3);
        graphics.lineTo(-3, 1);
        graphics.lineTo(-4, 3);
        graphics.lineTo(-4, -1);
        graphics.strokePath();
        // Eyes (hollow)
        graphics.lineStyle(1.5, 0xffffff, 0.8);
        graphics.strokeCircle(-1.5, -1, 1);
        graphics.strokeCircle(1.5, -1, 1);

      } else if (pw.type === 2) { // SLOW - Clock/hourglass
        graphics.lineStyle(2.5, 0xff0088, 1);
        // Clock circle
        graphics.strokeCircle(0, 0, 4.5);
        // Clock hands
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.lineBetween(0, 0, 0, -3); // Hour hand
        graphics.lineBetween(0, 0, 2.5, 1); // Minute hand
        // Clock markers
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(0, -4, 1);
        graphics.fillCircle(4, 0, 1);
        graphics.fillCircle(0, 4, 1);
        graphics.fillCircle(-4, 0, 1);

      } else if (pw.type === 3) { // TRAIL+ - Wavy trail lines
        graphics.lineStyle(2.5, 0x00ffaa, 1);
        // Multiple trail lines
        for (let t = 0; t < 3; t++) {
          const yOff = (t - 1) * 2.5;
          graphics.beginPath();
          graphics.moveTo(-5, yOff);
          graphics.lineTo(-2, yOff - 1);
          graphics.lineTo(1, yOff + 1);
          graphics.lineTo(4, yOff);
          graphics.strokePath();
        }
        // Arrow tip
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.lineBetween(4, -2, 5, 0);
        graphics.lineBetween(4, 2, 5, 0);

      } else if (pw.type === 4) { // SHIELD - Strong hexagon with inner detail
        graphics.lineStyle(3, 0x00ddff, 1);
        // Outer hexagon
        for (let j = 0; j < 6; j++) {
          const angle1 = (j / 6) * Math.PI * 2;
          const angle2 = ((j + 1) / 6) * Math.PI * 2;
          graphics.lineBetween(
            Math.cos(angle1) * 5, Math.sin(angle1) * 5,
            Math.cos(angle2) * 5, Math.sin(angle2) * 5
          );
        }
        // Inner cross
        graphics.lineStyle(2, 0xffffff, 0.9);
        graphics.lineBetween(-3, 0, 3, 0);
        graphics.lineBetween(0, -3, 0, 3);
      }

      graphics.restore();
    }
  }

  // Speed points with star effect
  for (let sp of speedPoints) {
    // Apply gravity physics if falling
    if (sp.falling) {
      sp.vy += sp.gravity; // Apply gravity
      sp.y += sp.vy; // Update position
      sp.x += sp.vx; // Horizontal movement

      // Bounce off bottom
      if (sp.y >= 590) {
        sp.y = 590;
        sp.vy = -sp.vy * sp.bounce; // Reverse and reduce velocity
        sp.vx *= 0.95; // Friction

        // Create bounce particles
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI - Math.PI / 2;
          particles.push({
            x: sp.x,
            y: sp.y,
            vx: Math.cos(angle) * 2,
            vy: Math.sin(angle) * 2,
            life: 15,
            alpha: 1,
            color: 0xffff00,
            size: 1 + Math.random()
          });
        }
      }

      // Bounce off sides (using safe spawn zone limits to avoid wrap areas)
      if (sp.x <= 120 || sp.x >= 680) {
        sp.vx = -sp.vx * sp.bounce;
        sp.x = sp.x <= 120 ? 120 : 680;
      }

      // Stop bouncing if energy is too low
      if (Math.abs(sp.vy) < 0.5 && sp.y >= 585) {
        sp.vy = 0;
        sp.vx *= 0.9;
      }
    }

    sp.anim = (sp.anim + 1) % 60;
    const pulse = 1 + Math.sin(sp.anim / 8) * 0.3;
    const rotation = sp.anim / 15;

    // Outer glow ring
    graphics.fillStyle(0xffff00, 0.2 * pulse);
    graphics.fillCircle(sp.x, sp.y, 10 * pulse);

    // Star shape
    graphics.lineStyle(2, 0xffff00, 0.9);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + rotation;
      const x1 = sp.x + Math.cos(angle) * 6;
      const y1 = sp.y + Math.sin(angle) * 6;
      const x2 = sp.x + Math.cos(angle) * 2;
      const y2 = sp.y + Math.sin(angle) * 2;
      graphics.lineBetween(x1, y1, x2, y2);
    }

    // Center
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(sp.x, sp.y, 3);
    graphics.fillStyle(0xffff00, 0.8);
    graphics.fillCircle(sp.x, sp.y, 2);
  }

  // Speed bars on sides (only show during gameplay)
  if (gameState === 'playing') {
    const barWidth = 15;
    const barHeight = 400;
    const barX1 = 15;
    const barX2 = 785;
    const barY = 100;

    const p1Col = p1.color || 0x00ffff;
    const p2Col = p2.color || 0xff8800;

    // P1 speed bar (left)
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(barX1, barY, barWidth, barHeight);
    graphics.lineStyle(2, p1Col, 0.8);
    graphics.strokeRect(barX1, barY, barWidth, barHeight);

    const p1Speed = p1.currentSpeed || p1.speed || 2;
    const p1FillHeight = Math.min((p1Speed / 5) * barHeight, barHeight);
    graphics.fillStyle(p1Col, 0.8);
    graphics.fillRect(barX1, barY + barHeight - p1FillHeight, barWidth, p1FillHeight);

    // P2 speed bar (right)
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(barX2 - barWidth, barY, barWidth, barHeight);
    graphics.lineStyle(2, p2Col, 0.8);
    graphics.strokeRect(barX2 - barWidth, barY, barWidth, barHeight);

    const p2Speed = p2.currentSpeed || p2.speed || 2;
    const p2FillHeight = Math.min((p2Speed / 5) * barHeight, barHeight);
    graphics.fillStyle(p2Col, 0.8);
    graphics.fillRect(barX2 - barWidth, barY + barHeight - p2FillHeight, barWidth, p2FillHeight);
  }

  // Particles
  for (let p of particles) {
    graphics.fillStyle(p.color, p.alpha);
    graphics.fillCircle(p.x, p.y, p.size || 2);
  }
}

function drawEnhancedTrail(bike, color) {
  if (bike.trail.length < 2) return;

  // Breathing effect - pulsate the trail width
  const breathe = 1 + Math.sin(frameCount / 15) * 0.15;

  for (let i = 1; i < bike.trail.length; i++) {
    const prev = bike.trail[i - 1];
    const curr = bike.trail[i];

    // FIX: Detect wrap-around (teleport) and skip drawing line across screen
    const dx = Math.abs(curr.x - prev.x);
    const dy = Math.abs(curr.y - prev.y);
    if (dx > 100 || dy > 100) continue; // Skip if big jump (wrap-around)

    const fadeAlpha = Math.min(curr.life / 50, 1);
    const distanceFromHead = bike.trail.length - i;
    const proximityFade = 1 - (distanceFromHead / bike.trail.length) * 0.3;
    const ghostMod = bike.ghost > 0 ? 0.3 : 0.9;
    const alpha = fadeAlpha * proximityFade * ghostMod;

    // ULTRA INTENSE 5-LAYER GLOW
    // Outermost glow (massive soft halo)
    graphics.lineStyle(16 * breathe, color, alpha * 0.08);
    graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);

    // Second layer (bright outer glow)
    graphics.lineStyle(12 * breathe, color, alpha * 0.12);
    graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);

    // Third layer (medium glow)
    graphics.lineStyle(8 * breathe, color, alpha * 0.2);
    graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);

    // Main trail (solid color)
    graphics.lineStyle(5 * breathe, color, alpha * 0.9);
    graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);

    // Inner bright core - pulses more (white hot center)
    const corePulse = 1 + Math.sin(frameCount / 10 + i * 0.1) * 0.3;
    graphics.lineStyle(2.5 * corePulse, 0xffffff, alpha * 0.85);
    graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);

    // Ultra bright pixel core (electric)
    graphics.lineStyle(1, 0xffffff, alpha);
    graphics.lineBetween(prev.x, prev.y, curr.x, curr.y);
  }
}

function drawImprovedBike(x, y, dir, color, alpha) {
  const dirAngles = [0, Math.PI/2, Math.PI, -Math.PI/2];
  const angle = dirAngles[dir];
  const pulse = Math.sin(frameCount / 10) * 0.2 + 0.8;

  graphics.save();
  graphics.translateCanvas(x, y);
  graphics.rotateCanvas(angle);

  // TRON STYLE - Rear wheel with hexagon design
  graphics.lineStyle(2, color, alpha * 0.8);
  graphics.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + frameCount / 20;
    const r = 4;
    const px = -7 + Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) graphics.moveTo(px, py);
    else graphics.lineTo(px, py);
  }
  graphics.closePath();
  graphics.strokePath();

  graphics.fillStyle(color, alpha * 0.3);
  graphics.fillCircle(-7, 0, 3);

  // Body - sleek angular design
  graphics.fillStyle(color, alpha * 0.9);
  graphics.fillTriangle(-8, -2, 4, -2, 2, 0);
  graphics.fillTriangle(-8, 2, 4, 2, 2, 0);

  // Cockpit glow
  graphics.fillStyle(color, alpha * pulse);
  graphics.fillRect(-3, -3, 4, 6);
  graphics.fillStyle(0xffffff, alpha * 0.6);
  graphics.fillRect(-2, -2, 2, 4);

  // Side panels with detail
  graphics.lineStyle(1, 0xffffff, alpha * 0.7);
  graphics.lineBetween(-6, -2, 2, -2);
  graphics.lineBetween(-6, 2, 2, 2);
  graphics.lineBetween(-5, -1, 1, -1);
  graphics.lineBetween(-5, 1, 1, 1);

  // Front fork - angular
  graphics.fillStyle(color, alpha * 0.9);
  graphics.fillTriangle(4, -1, 8, -2, 8, 0);
  graphics.fillTriangle(4, 1, 8, 2, 8, 0);

  // Front wheel - hexagon spinning
  graphics.lineStyle(2, color, alpha * 0.8);
  graphics.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - frameCount / 20;
    const r = 4;
    const px = 10 + Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) graphics.moveTo(px, py);
    else graphics.lineTo(px, py);
  }
  graphics.closePath();
  graphics.strokePath();

  graphics.fillStyle(color, alpha * 0.3);
  graphics.fillCircle(10, 0, 3);

  // Headlight - triple beam
  graphics.fillStyle(0xffffff, alpha * pulse);
  graphics.fillCircle(12, 0, 2);
  graphics.fillStyle(0xffffff, alpha * 0.3);
  graphics.fillCircle(14, 0, 4);
  graphics.fillCircle(16, 0, 6);

  // Energy core (center)
  graphics.fillStyle(color, alpha * pulse);
  graphics.fillCircle(0, 0, 2);
  graphics.lineStyle(1, 0xffffff, alpha * 0.8);
  graphics.strokeCircle(0, 0, 3);

  // Rear thrusters
  graphics.fillStyle(color, alpha * 0.8 * pulse);
  graphics.fillRect(-10, -2, 2, 1);
  graphics.fillRect(-10, 1, 2, 1);
  graphics.fillStyle(0xffffff, alpha * 0.5);
  graphics.fillRect(-11, -2, 1, 1);
  graphics.fillRect(-11, 1, 1, 1);

  // Outer glow aura
  graphics.lineStyle(3, color, alpha * 0.2);
  graphics.strokeCircle(0, 0, 14);
  graphics.lineStyle(2, color, alpha * 0.4 * pulse);
  graphics.strokeCircle(0, 0, 12);

  // Wing details
  graphics.lineStyle(1, color, alpha * 0.6);
  graphics.lineBetween(-4, -4, -2, -6);
  graphics.lineBetween(-4, 4, -2, 6);
  graphics.fillStyle(color, alpha * 0.3);
  graphics.fillTriangle(-4, -4, -2, -6, -3, -4);
  graphics.fillTriangle(-4, 4, -2, 6, -3, 4);

  graphics.restore();
}

function drawVehiclePreview(x, y, vehicleType, color) {
  const scale = 3.5;
  graphics.save();
  graphics.translateCanvas(x, y);

  // All vehicles are now bikes (Light Cycle style)
  // Rear wheel
  graphics.fillStyle(color, 0.3);
  graphics.fillCircle(-7 * scale, 0, 5 * scale);
  graphics.fillStyle(color, 0.9);
  graphics.fillCircle(-7 * scale, 0, 3 * scale);

  // Body
  graphics.fillStyle(color, 1);
  graphics.fillRect(-8 * scale, -2 * scale, 12 * scale, 4 * scale);

  // Rider
  graphics.fillStyle(color, 0.8);
  graphics.fillRect(-2 * scale, -4 * scale, 3 * scale, 6 * scale);

  // Front fork
  graphics.fillRect(4 * scale, -1 * scale, 6 * scale, 2 * scale);

  // Front wheel
  graphics.fillStyle(color, 0.3);
  graphics.fillCircle(10 * scale, 0, 5 * scale);
  graphics.fillStyle(color, 0.9);
  graphics.fillCircle(10 * scale, 0, 3 * scale);

  // Headlight
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(11 * scale, 0, 2 * scale);

  // Removed glow circle effect for cleaner look

  graphics.restore();
}

function drawLightCycle(bike, color) {
  if (!bike.alive) return;

  const dirAngles = [0, Math.PI/2, Math.PI, -Math.PI/2];
  const angle = dirAngles[bike.dir];

  // All bikes are now Light Cycles
  graphics.save();
  graphics.translateCanvas(bike.x, bike.y);
  graphics.rotateCanvas(angle);

  // Rear wheel with glow
  graphics.fillStyle(color, 0.3);
  graphics.fillCircle(-5, 0, 4);
  graphics.fillStyle(color, 1);
  graphics.fillCircle(-5, 0, 2.5);

  // Main body
  graphics.fillStyle(color, 1);
  graphics.fillRect(-6, -1.5, 9, 3);

  // Rider
  graphics.fillStyle(color, 0.9);
  graphics.fillRect(-1, -3, 2, 4);

  // Front fork
  graphics.fillRect(3, -0.8, 4, 1.6);

  // Front wheel with glow
  graphics.fillStyle(color, 0.3);
  graphics.fillCircle(7, 0, 4);
  graphics.fillStyle(color, 1);
  graphics.fillCircle(7, 0, 2.5);

  // Headlight
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(8, 0, 1.5);

  // Energy glow (removed circle to avoid "ugly circle")
  graphics.lineStyle(1.5, color, 0.3);
  graphics.strokeRect(-6, -2, 14, 4);

  graphics.restore();

  // Ghost effect (MAGENTA) with icon indicator
  if (bike.ghost > 0) {
    const ghostAlpha = 0.3 + Math.sin(frameCount / 5) * 0.2;
    graphics.lineStyle(3, 0xff00ff, ghostAlpha);
    graphics.strokeCircle(bike.x, bike.y, 12);
    graphics.strokeCircle(bike.x, bike.y, 16);

    // Small ghost icon above bike
    const iconX = bike.x;
    const iconY = bike.y - 20;
    graphics.fillStyle(0xff00ff, 0.8);
    graphics.fillCircle(iconX, iconY, 5);
    graphics.lineStyle(1.5, 0xffffff, 0.9);
    graphics.strokeCircle(iconX - 2, iconY - 1, 1);
    graphics.strokeCircle(iconX + 2, iconY - 1, 1);
  }

  // NEW: Shield effect - rotating hexagon ENHANCED
  if (bike.shield) {
    const shieldAlpha = 0.5 + Math.sin(frameCount / 8) * 0.3;
    const shieldRadius = 15 + Math.sin(frameCount / 12) * 2;
    const rotation = frameCount / 30;

    // Triple layer hexagon
    for (let layer = 0; layer < 3; layer++) {
      const layerRadius = shieldRadius + layer * 3;
      const layerAlpha = shieldAlpha * (1 - layer * 0.3);

      graphics.lineStyle(3 - layer, 0x00ddff, layerAlpha);
      graphics.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + rotation * (1 + layer * 0.3);
        const x = bike.x + Math.cos(angle) * layerRadius;
        const y = bike.y + Math.sin(angle) * layerRadius;
        if (i === 0) graphics.moveTo(x, y);
        else graphics.lineTo(x, y);
      }
      graphics.closePath();
      graphics.strokePath();
    }

    // Inner glow removed to avoid large circle

    // Rotating particles on shield edge
    if (frameCount % 3 === 0) {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + rotation;
        particles.push({
          x: bike.x + Math.cos(angle) * shieldRadius,
          y: bike.y + Math.sin(angle) * shieldRadius,
          vx: Math.cos(angle) * 0.5,
          vy: Math.sin(angle) * 0.5,
          life: 15,
          alpha: 0.8,
          color: 0x00ddff,
          size: 2
        });
      }
    }

    // Energy lines from center
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rotation * 2;
      const lineLength = shieldRadius * 0.6;
      graphics.lineStyle(1, 0xffffff, shieldAlpha * 0.5);
      graphics.lineBetween(
        bike.x + Math.cos(angle) * 3,
        bike.y + Math.sin(angle) * 3,
        bike.x + Math.cos(angle) * lineLength,
        bike.y + Math.sin(angle) * lineLength
      );
    }
  }

  // ENHANCED Speed effect with motion lines
  if (bike.speed > 2 || bike.speedBoost > 0) {
    // Motion blur circles
    for (let i = 0; i < 5; i++) {
      const offset = (i + 1) * 5;
      const speedAlpha = 0.35 - (i * 0.07);
      graphics.fillStyle(color, speedAlpha);
      const backX = bike.x - dirs[bike.dir][0] * offset;
      const backY = bike.y - dirs[bike.dir][1] * offset;
      graphics.fillCircle(backX, backY, 3 + i * 0.3);
    }

    // Speed lines (perpendicular to direction)
    const perpDir = [(dirs[bike.dir][1]), -(dirs[bike.dir][0])];
    for (let i = 0; i < 6; i++) {
      const lineOffset = (i - 2.5) * 6;
      const lineLength = 15 + Math.random() * 10;
      const lineStart = bike.x - dirs[bike.dir][0] * 20;
      const lineStartY = bike.y - dirs[bike.dir][1] * 20;
      const linePosX = lineStart + perpDir[0] * lineOffset;
      const linePosY = lineStartY + perpDir[1] * lineOffset;

      const lineAlpha = 0.4 - Math.abs(i - 2.5) * 0.08;
      graphics.lineStyle(2, color, lineAlpha);
      graphics.lineBetween(
        linePosX,
        linePosY,
        linePosX - dirs[bike.dir][0] * lineLength,
        linePosY - dirs[bike.dir][1] * lineLength
      );
    }

    // Energy wave behind bike
    const waveAlpha = 0.5 + Math.sin(frameCount / 8) * 0.3;
    graphics.lineStyle(3, color, waveAlpha * 0.3);
    graphics.strokeCircle(
      bike.x - dirs[bike.dir][0] * 15,
      bike.y - dirs[bike.dir][1] * 15,
      12
    );

    // Speed boost icon indicator
    const iconX = bike.x;
    const iconY = bike.y - 25;
    graphics.fillStyle(0xffff00, 0.9);
    graphics.fillCircle(iconX, iconY, 5);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.lineBetween(iconX - 2, iconY, iconX + 2, iconY);
    graphics.lineBetween(iconX, iconY - 2, iconX + 2, iconY);
    graphics.lineBetween(iconX, iconY + 2, iconX + 2, iconY);
  }

  // Slow effect indicator (debuff)
  if (bike.slow > 0) {
    const slowAlpha = 0.4 + Math.sin(frameCount / 6) * 0.2;
    // Chains around bike
    graphics.lineStyle(2, 0xff0088, slowAlpha);
    graphics.strokeCircle(bike.x, bike.y, 10);
    graphics.strokeCircle(bike.x, bike.y, 14);

    // Slow icon above bike
    const iconX = bike.x;
    const iconY = bike.y - 20;
    graphics.fillStyle(0xff0088, 0.8);
    graphics.fillCircle(iconX, iconY, 5);
    // Clock symbol
    graphics.lineStyle(1.5, 0xffffff, 0.9);
    graphics.strokeCircle(iconX, iconY, 3);
    graphics.lineBetween(iconX, iconY, iconX, iconY - 2);
  }
}

// Draw "TRON" title in grid style with MORE pixels
function drawTRONTitle(g, cx, cy, cellSize, opacity) {
  const spacing = cellSize * 1.05;

  // Letter patterns (11x9 grid for each letter - MORE DETAILED!)
  const T = [
    [1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,1,0,0,0]
  ];

  const R = [
    [1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,0],
    [1,1,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,0,0,0],
    [1,1,0,1,1,1,0,0,0],
    [1,1,0,0,1,1,1,0,0],
    [1,1,0,0,0,1,1,1,0],
    [1,1,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,1,1]
  ];

  const O = [
    [0,0,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,1,1,1],
    [0,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,0,0]
  ];

  const N = [
    [1,1,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,0,1,1],
    [1,1,1,1,0,0,0,1,1],
    [1,1,1,1,1,0,0,1,1],
    [1,1,0,1,1,1,0,1,1],
    [1,1,0,0,1,1,1,1,1],
    [1,1,0,0,0,1,1,1,1],
    [1,1,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,1,1]
  ];

  const letters = [T, R, O, N];
  const letterSpacing = spacing * 3; // Space between letters

  // Calculate total width and starting position
  const totalWidth = (letters.length * 9 * spacing) + ((letters.length - 1) * letterSpacing);
  let currentX = cx - totalWidth / 2;
  const startY = cy - (11 * spacing) / 2;

  // Draw each letter
  for (let letterIdx = 0; letterIdx < letters.length; letterIdx++) {
    const letter = letters[letterIdx];

    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 9; col++) {
        if (letter[row][col] === 1) {
          const x = currentX + col * spacing;
          const y = startY + row * spacing;

          // Outer glow
          g.fillStyle(0x00ffff, opacity * 0.3);
          g.fillRect(x - 1, y - 1, cellSize + 2, cellSize + 2);

          // Main cell
          g.fillStyle(0x00ffff, opacity);
          g.fillRect(x, y, cellSize, cellSize);

          // Inner bright core
          if (opacity > 0.5) {
            g.fillStyle(0xffffff, opacity * 0.8);
            const coreSize = Math.max(2, cellSize * 0.4);
            const coreOffset = (cellSize - coreSize) / 2;
            g.fillRect(x + coreOffset, y + coreOffset, coreSize, coreSize);
          }

          // Border lines
          g.lineStyle(1, 0xffffff, opacity * 0.5);
          g.strokeRect(x, y, cellSize, cellSize);
        }
      }
    }

    currentX += 9 * spacing + letterSpacing;
  }
}

// Draw grid-style numbers for countdown (1, 2, 3)
function drawGridNumber(g, num, cx, cy, size) {
  const gridSize = size / 5;
  const spacing = gridSize * 1.2;

  // Define digit patterns as 5x5 grids (1 = filled, 0 = empty)
  const patterns = {
    1: [
      [0,1,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,1,1,0]
    ],
    2: [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [0,0,1,1,0],
      [0,1,0,0,0],
      [1,1,1,1,1]
    ],
    3: [
      [1,1,1,1,0],
      [0,0,0,0,1],
      [0,1,1,1,0],
      [0,0,0,0,1],
      [1,1,1,1,0]
    ]
  };

  const pattern = patterns[num];
  if (!pattern) return;

  // Calculate starting position (centered)
  const startX = cx - (spacing * 2.5);
  const startY = cy - (spacing * 2.5);

  // Draw each cell of the grid
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (pattern[row][col] === 1) {
        const x = startX + col * spacing;
        const y = startY + row * spacing;

        // Outer glow
        g.fillStyle(0x00ffff, 0.3);
        g.fillRect(x - 2, y - 2, gridSize + 4, gridSize + 4);

        // Main cell
        g.fillStyle(0x00ffff, 1);
        g.fillRect(x, y, gridSize, gridSize);

        // Inner bright core
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(x + gridSize * 0.3, y + gridSize * 0.3, gridSize * 0.4, gridSize * 0.4);

        // Border lines
        g.lineStyle(2, 0xffffff, 0.6);
        g.strokeRect(x, y, gridSize, gridSize);
      }
    }
  }
}

// Draw "GO" in grid style
function drawGridGO(g, cx, cy, size) {
  const gridSize = size / 5;
  const spacing = gridSize * 1.2;

  // G pattern
  const gPattern = [
    [0,1,1,1,0],
    [1,0,0,0,0],
    [1,0,1,1,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
  ];

  // O pattern
  const oPattern = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
  ];

  // Draw G (left side)
  const gStartX = cx - spacing * 6;
  const startY = cy - spacing * 2.5;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (gPattern[row][col] === 1) {
        const x = gStartX + col * spacing;
        const y = startY + row * spacing;

        // Outer glow
        g.fillStyle(0x00ffff, 0.3);
        g.fillRect(x - 2, y - 2, gridSize + 4, gridSize + 4);

        // Main cell
        g.fillStyle(0x00ffff, 1);
        g.fillRect(x, y, gridSize, gridSize);

        // Inner bright core
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(x + gridSize * 0.3, y + gridSize * 0.3, gridSize * 0.4, gridSize * 0.4);

        // Border lines
        g.lineStyle(2, 0xffffff, 0.6);
        g.strokeRect(x, y, gridSize, gridSize);
      }
    }
  }

  // Draw O (right side) - P2 color (RED)
  const oStartX = cx + spacing * 1;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (oPattern[row][col] === 1) {
        const x = oStartX + col * spacing;
        const y = startY + row * spacing;

        // Outer glow
        g.fillStyle(0xff0000, 0.3);
        g.fillRect(x - 2, y - 2, gridSize + 4, gridSize + 4);

        // Main cell (red for O - P2 color)
        g.fillStyle(0xff0000, 1);
        g.fillRect(x, y, gridSize, gridSize);

        // Inner bright core
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(x + gridSize * 0.3, y + gridSize * 0.3, gridSize * 0.4, gridSize * 0.4);

        // Border lines
        g.lineStyle(2, 0xffffff, 0.6);
        g.strokeRect(x, y, gridSize, gridSize);
      }
    }
  }
}

function playTone(scene, freq, dur) {
  if (!scene || !scene.sound || !scene.sound.context) return;
  const ctx = scene.sound.context;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = freq;
  osc.type = 'square';

  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

// Store music components globally for switching modes
let musicCtx = null;
let musicBassOsc1 = null;
let musicBassOsc2 = null;
let musicArpOsc = null;
let musicPadOsc = null;
let musicFilter = null;
let musicArpGain = null;
let musicBassGain = null;
let musicBass2Gain = null;
let musicArpInterval = null;
let musicBassInterval = null;
let musicMode = 'menu'; // 'menu' or 'battle'

function startBackgroundMusic(scene) {
  if (musicPlaying || !scene || !scene.sound || !scene.sound.context) return;
  musicPlaying = true;

  musicCtx = scene.sound.context;
  const ctx = musicCtx;

  // Deep sub bass for foundation (cleaner sine wave)
  musicBassOsc1 = ctx.createOscillator();
  musicBassOsc1.type = 'sine';
  musicBassOsc1.frequency.value = 55; // A1

  // Mid bass layer (triangle for warmth)
  musicBassOsc2 = ctx.createOscillator();
  musicBassOsc2.type = 'triangle';
  musicBassOsc2.frequency.value = 110; // A2

  // Lead synth arpeggio (sawtooth for bright TRON sound)
  musicArpOsc = ctx.createOscillator();
  musicArpOsc.type = 'sawtooth';
  musicArpOsc.frequency.value = 220;

  // Pad synth for atmosphere
  musicPadOsc = ctx.createOscillator();
  musicPadOsc.type = 'sine';
  musicPadOsc.frequency.value = 440;

  // Main low-pass filter for smooth TRON synth
  musicFilter = ctx.createBiquadFilter();
  musicFilter.type = 'lowpass';
  musicFilter.frequency.value = 1200;
  musicFilter.Q.value = 3;

  // High-pass filter to remove mud
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = 40;
  hpFilter.Q.value = 0.5;

  // Separate gains for mixing
  musicBassGain = ctx.createGain();
  musicBassGain.gain.value = 0.15;

  musicBass2Gain = ctx.createGain();
  musicBass2Gain.gain.value = 0.08;

  musicArpGain = ctx.createGain();
  musicArpGain.gain.value = 0;

  const padGain = ctx.createGain();
  padGain.gain.value = 0.03;

  // Master gain
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.25;

  // Compressor for cleaner sound
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  // Connection chain
  musicBassOsc1.connect(musicBassGain);
  musicBassOsc2.connect(musicBass2Gain);
  musicArpOsc.connect(musicFilter);
  musicPadOsc.connect(padGain);

  musicBassGain.connect(hpFilter);
  musicBass2Gain.connect(hpFilter);
  musicFilter.connect(musicArpGain);
  musicArpGain.connect(hpFilter);
  padGain.connect(hpFilter);

  hpFilter.connect(compressor);
  compressor.connect(musicGain);
  musicGain.connect(ctx.destination);

  musicBassOsc1.start();
  musicBassOsc2.start();
  musicArpOsc.start();
  musicPadOsc.start();

  // Start with menu music
  playMenuMusic();
}

// MENU MUSIC - Calm, atmospheric TRON theme
function playMenuMusic() {
  if (musicArpInterval) clearInterval(musicArpInterval);
  if (musicBassInterval) clearInterval(musicBassInterval);
  musicMode = 'menu';

  const ctx = musicCtx;
  if (!ctx) return;

  // MENU: Slower, calmer arpeggio
  const arpNotes = [220, 247, 277, 330, 370, 440, 370, 330]; // A minor pentatonic
  let arpIndex = 0;

  musicArpInterval = setInterval(() => {
    if (!musicArpOsc) return;
    const time = ctx.currentTime;

    musicArpOsc.frequency.setValueAtTime(arpNotes[arpIndex], time);

    // Softer envelope
    musicArpGain.gain.cancelScheduledValues(time);
    musicArpGain.gain.setValueAtTime(0, time);
    musicArpGain.gain.linearRampToValueAtTime(0.12, time + 0.01);
    musicArpGain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

    // Gentle filter sweep
    musicFilter.frequency.setValueAtTime(1200, time);
    musicFilter.frequency.linearRampToValueAtTime(2400, time + 0.05);
    musicFilter.frequency.exponentialRampToValueAtTime(800, time + 0.3);

    arpIndex = (arpIndex + 1) % arpNotes.length;
  }, 250);

  // Calm bass
  const bassNotes = [55, 55, 62, 55, 49, 55, 58, 55];
  let bassIndex = 0;

  musicBassInterval = setInterval(() => {
    if (!musicBassOsc1) return;
    const time = ctx.currentTime;

    musicBassOsc1.frequency.setTargetAtTime(bassNotes[bassIndex], time, 0.05);
    musicBassOsc2.frequency.setTargetAtTime(bassNotes[bassIndex] * 2, time, 0.05);

    bassIndex = (bassIndex + 1) % bassNotes.length;
  }, 2000);
}

// BATTLE MUSIC - Fast, aggressive, war-like
function playBattleMusic() {
  if (musicArpInterval) clearInterval(musicArpInterval);
  if (musicBassInterval) clearInterval(musicBassInterval);
  musicMode = 'battle';

  const ctx = musicCtx;
  if (!ctx) return;

  // BATTLE: Fast aggressive arpeggio with power chords
  const arpNotes = [
    110, 110, 165, 110, 147, 110, 165, 147,  // Fast double-time aggressive pattern
    110, 110, 165, 110, 147, 110, 165, 147
  ];
  let arpIndex = 0;

  musicArpInterval = setInterval(() => {
    if (!musicArpOsc) return;
    const time = ctx.currentTime;

    musicArpOsc.frequency.setValueAtTime(arpNotes[arpIndex], time);

    // AGGRESSIVE envelope - harder attack
    musicArpGain.gain.cancelScheduledValues(time);
    musicArpGain.gain.setValueAtTime(0, time);
    musicArpGain.gain.linearRampToValueAtTime(0.18, time + 0.005); // FAST ATTACK
    musicArpGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12); // Short decay

    // Aggressive filter sweep - more resonance
    musicFilter.frequency.setValueAtTime(800, time);
    musicFilter.frequency.linearRampToValueAtTime(3200, time + 0.02); // FAST sweep
    musicFilter.frequency.exponentialRampToValueAtTime(600, time + 0.15);

    arpIndex = (arpIndex + 1) % arpNotes.length;
  }, 125); // DOUBLE SPEED - 125ms instead of 250ms

  // WAR BASS - Heavy, pounding rhythm
  const bassNotes = [
    55, 55, 55, 65,  // A-A-A-D (pounding rhythm)
    55, 55, 55, 65,
    49, 49, 49, 58,  // G-G-G-Bb (variation)
    55, 55, 55, 65
  ];
  let bassIndex = 0;

  musicBassInterval = setInterval(() => {
    if (!musicBassOsc1) return;
    const time = ctx.currentTime;

    // Make bass LOUDER and more aggressive
    musicBassGain.gain.setTargetAtTime(0.25, time, 0.01); // Boost bass
    musicBass2Gain.gain.setTargetAtTime(0.15, time, 0.01);

    musicBassOsc1.frequency.setTargetAtTime(bassNotes[bassIndex], time, 0.02);
    musicBassOsc2.frequency.setTargetAtTime(bassNotes[bassIndex] * 2, time, 0.02);

    bassIndex = (bassIndex + 1) % bassNotes.length;
  }, 500); // FAST pounding - 500ms per note
}
