// ============================================================================
// FILE: carrom_game.js
// Description: Smooth Carrom Engine with Aiming Arrow & Synthesized Audio
// ============================================================================

(function () {
  const canvas = document.getElementById("carromCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Responsive High-DPI Scaling for Smooth Rendering
  const BOARD_SIZE = 600;
  canvas.width = BOARD_SIZE;
  canvas.height = BOARD_SIZE;

  // ----------------------------------------------------------------------------
  // 1. WEB AUDIO API SYNTHESIZER (Impact & Pocket Sounds)
  // ----------------------------------------------------------------------------
  let AudioCtx = null;
  function getAudioContext() {
    if (!AudioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) AudioCtx = new AudioClass();
    }
    if (AudioCtx && AudioCtx.state === "suspended") {
      AudioCtx.resume().catch(() => {});
    }
    return AudioCtx;
  }

  function playSound(type, intensity = 1) {
    try {
      const actx = getAudioContext();
      if (!actx) return;

      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);

      const now = actx.currentTime;

      if (type === "collision") {
        // Sharp wooden click sound
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400 * intensity, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(Math.min(intensity, 1), now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "pocket") {
        // Deeper wooden thud sound
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {
      // Audio fallback
    }
  }

  // ----------------------------------------------------------------------------
  // 2. PHYSICS CONSTANTS & GAME OBJECTS
  // ----------------------------------------------------------------------------
  const FRICTION = 0.982; // Smooth decelerating drag
  const POCKET_RADIUS = 28;
  const POCKETS = [
    { x: 45, y: 45 },
    { x: BOARD_SIZE - 45, y: 45 },
    { x: 45, y: BOARD_SIZE - 45 },
    { x: BOARD_SIZE - 45, y: BOARD_SIZE - 45 },
  ];

  class Piece {
    constructor(x, y, radius, color, isStriker = false) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.radius = radius;
      this.color = color;
      this.isStriker = isStriker;
      this.isPotted = false;
    }

    update() {
      if (this.isPotted) return;

      // Apply Velocity
      this.x += this.vx;
      this.y += this.vy;

      // Apply Friction
      this.vx *= FRICTION;
      this.vy *= FRICTION;

      // Stop Micro-movements
      if (Math.hypot(this.vx, this.vy) < 0.05) {
        this.vx = 0;
        this.vy = 0;
      }

      // Border Collisions (Wood Frame)
      const margin = 35 + this.radius;
      if (this.x < margin) {
        this.x = margin;
        this.vx *= -0.85;
        playSound("collision", Math.abs(this.vx));
      }
      if (this.x > BOARD_SIZE - margin) {
        this.x = BOARD_SIZE - margin;
        this.vx *= -0.85;
        playSound("collision", Math.abs(this.vx));
      }
      if (this.y < margin) {
        this.y = margin;
        this.vy *= -0.85;
        playSound("collision", Math.abs(this.vy));
      }
      if (this.y > BOARD_SIZE - margin) {
        this.y = BOARD_SIZE - margin;
        this.vy *= -0.85;
        playSound("collision", Math.abs(this.vy));
      }

      // Pocket Check
      for (let p of POCKETS) {
        if (Math.hypot(this.x - p.x, this.y - p.y) < POCKET_RADIUS) {
          this.isPotted = true;
          this.vx = 0;
          this.vy = 0;
          playSound("pocket");
        }
      }
    }

    draw(ctx) {
      if (this.isPotted) return;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      // Inner Ring Detail
      ctx.strokeStyle = this.isStriker ? "#ffd700" : "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  // ----------------------------------------------------------------------------
  // 3. INITIALIZE PIECES & BOARD STATE
  // ----------------------------------------------------------------------------
  const pieces = [];
  const striker = new Piece(BOARD_SIZE / 2, 475, 18, "#f5f5f5", true);

  // Center Layout (Carrom Pucks setup)
  function setupBoard() {
    pieces.length = 0;
    striker.x = BOARD_SIZE / 2;
    striker.y = 475;
    striker.vx = 0;
    striker.vy = 0;
    striker.isPotted = false;
    pieces.push(striker);

    const cx = BOARD_SIZE / 2;
    const cy = BOARD_SIZE / 2;
    const r = 13;

    // Red Queen
    pieces.push(new Piece(cx, cy, r, "#e74c3c"));

    // Surrounding Ring (Alternate White and Black)
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const color = i % 2 === 0 ? "#ffffff" : "#2c3e50";
      pieces.push(
        new Piece(
          cx + Math.cos(angle) * (r * 2.1),
          cy + Math.sin(angle) * (r * 2.1),
          r,
          color
        )
      );
    }
  }
  setupBoard();

  // ----------------------------------------------------------------------------
  // 4. ELASTIC COLLISION DETECTOR & RESOLVER
  // ----------------------------------------------------------------------------
  function resolveCollisions() {
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        let p1 = pieces[i];
        let p2 = pieces[j];

        if (p1.isPotted || p2.isPotted) continue;

        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dist = Math.hypot(dx, dy);
        let minDist = p1.radius + p2.radius;

        if (dist < minDist && dist > 0.001) {
          // Separate overlapping pieces
          let overlap = 0.5 * (minDist - dist);
          let nx = dx / dist;
          let ny = dy / dist;

          p1.x -= nx * overlap;
          p1.y -= ny * overlap;
          p2.x += nx * overlap;
          p2.y += ny * overlap;

          // Elastic momentum transfer
          let kx = p1.vx - p2.vx;
          let ky = p1.vy - p2.vy;
          let p = (2 * (nx * kx + ny * ky)) / 2; // Assuming equal mass

          p1.vx -= p * nx;
          p1.vy -= p * ny;
          p2.vx += p * nx;
          p2.vy += p * ny;

          let impulse = Math.hypot(p1.vx - p2.vx, p1.vy - p2.vy);
          playSound("collision", impulse * 0.1);
        }
      }
    }
  }

  // ----------------------------------------------------------------------------
  // 5. INPUT HANDLING & AIMING ARROW ENGINE
  // ----------------------------------------------------------------------------
  let isDragging = false;
  let dragPos = { x: 0, y: 0 };

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (
      Math.hypot(mx - striker.x, my - striker.y) < striker.radius * 2 &&
      striker.vx === 0 &&
      striker.vy === 0
    ) {
      isDragging = true;
      dragPos = { x: mx, y: my };
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    dragPos.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    dragPos.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  });

  canvas.addEventListener("pointerup", () => {
    if (!isDragging) return;
    isDragging = false;

    const dx = striker.x - dragPos.x;
    const dy = striker.y - dragPos.y;

    // Launch Striker
    striker.vx = dx * 0.18;
    striker.vy = dy * 0.18;
  });

  // Predictive collision calculation for aiming
  function getPredictedCollision(startX, startY, angle, maxDist) {
    let closestDist = maxDist;
    let hitTarget = null;

    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    for (let p of pieces) {
      if (p.isStriker || p.isPotted) continue;
      const ocX = p.x - startX;
      const ocY = p.y - startY;
      const proj = ocX * dirX + ocY * dirY;
      if (proj <= 0) continue;

      const perpSq = ocX * ocX + ocY * ocY - proj * proj;
      const combinedRadius = striker.radius + p.radius;
      if (perpSq >= combinedRadius * combinedRadius) continue;

      const halfChord = Math.sqrt(combinedRadius * combinedRadius - perpSq);
      const hitDist = proj - halfChord;
      if (hitDist > 0 && hitDist < closestDist) {
        closestDist = hitDist;
        hitTarget = p;
      }
    }

    return { closestDist, hitTarget };
  }

  // Draw Aiming Guide Line and Arrow Head with Predictive Collision Pathing
  function drawAimingArrow() {
    if (!isDragging) return;

    const dx = striker.x - dragPos.x;
    const dy = striker.y - dragPos.y;
    const angle = Math.atan2(dy, dx);
    const rawPower = Math.min(Math.hypot(dx, dy), 120);
    const fullDist = rawPower * 1.8;

    const { closestDist, hitTarget } = getPredictedCollision(
      striker.x,
      striker.y,
      angle,
      fullDist
    );

    const hitX = striker.x + Math.cos(angle) * closestDist;
    const hitY = striker.y + Math.sin(angle) * closestDist;

    ctx.save();

    // Dynamic Trajectory Dotted Line
    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.moveTo(striker.x, striker.y);
    ctx.lineTo(hitX, hitY);
    ctx.strokeStyle = "rgba(231, 76, 60, 0.85)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Target Circle Ring (Predictive Impact Location)
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(hitX, hitY, striker.radius, 0, Math.PI * 2);
    ctx.strokeStyle = hitTarget ? "#2ecc71" : "#e74c3c";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Arrow Head Pointer
    const arrowSize = 12;
    ctx.beginPath();
    ctx.moveTo(hitX, hitY);
    ctx.lineTo(
      hitX - arrowSize * Math.cos(angle - Math.PI / 6),
      hitY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      hitX - arrowSize * Math.cos(angle + Math.PI / 6),
      hitY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = hitTarget ? "#2ecc71" : "#e74c3c";
    ctx.fill();

    // Predictive Target Deflection Path
    if (hitTarget) {
      const normalX = hitTarget.x - hitX;
      const normalY = hitTarget.y - hitY;
      const normalLen = Math.hypot(normalX, normalY);
      if (normalLen > 0.001) {
        const nx = normalX / normalLen;
        const ny = normalY / normalLen;
        const defLen = 50;

        // Puck deflected trajectory
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(hitTarget.x, hitTarget.y);
        ctx.lineTo(hitTarget.x + nx * defLen, hitTarget.y + ny * defLen);
        ctx.strokeStyle = "rgba(46, 204, 113, 0.9)";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arrow on puck deflection
        ctx.beginPath();
        const pDefX = hitTarget.x + nx * defLen;
        const pDefY = hitTarget.y + ny * defLen;
        const pAngle = Math.atan2(ny, nx);
        ctx.moveTo(pDefX, pDefY);
        ctx.lineTo(
          pDefX - 8 * Math.cos(pAngle - Math.PI / 6),
          pDefY - 8 * Math.sin(pAngle - Math.PI / 6)
        );
        ctx.lineTo(
          pDefX - 8 * Math.cos(pAngle + Math.PI / 6),
          pDefY - 8 * Math.sin(pAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = "#2ecc71";
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ----------------------------------------------------------------------------
  // 6. MAIN GAME RENDER LOOP (60 FPS)
  // ----------------------------------------------------------------------------
  function gameLoop() {
    // Clear Frame
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Update Physics
    pieces.forEach((p) => p.update());
    resolveCollisions();

    // If striker is potted or all pieces stop, reset striker if necessary
    if (striker.isPotted) {
      striker.x = BOARD_SIZE / 2;
      striker.y = 475;
      striker.vx = 0;
      striker.vy = 0;
      striker.isPotted = false;
    }

    // Render Pockets
    POCKETS.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#111";
      ctx.fill();
      ctx.strokeStyle = "#3e2723";
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // Render Game Objects & Trajectory
    pieces.forEach((p) => p.draw(ctx));
    drawAimingArrow();

    requestAnimationFrame(gameLoop);
  }

  // Start Render Engine
  requestAnimationFrame(gameLoop);

  // Expose reset to window
  window.resetCarromGame = setupBoard;
})();
