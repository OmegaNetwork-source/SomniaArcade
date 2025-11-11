const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game-canvas'));
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

canvas.width = 768 * dpr;
canvas.height = 1024 * dpr;
ctx.scale(dpr, dpr);

const depthEl = document.getElementById('depth');
const bestEl = document.getElementById('best-depth');
const shieldEl = document.getElementById('shield');
const chargeCountEl = document.getElementById('charge-count');
const livesEl = document.getElementById('lives');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const gameoverOverlay = document.getElementById('gameover-overlay');
const retryBtn = document.getElementById('retry-btn');
const finalReadout = document.getElementById('final-readout');
const toastEl = document.getElementById('toast');
const showControlsBtn = document.getElementById('show-controls');

const world = {
    width: 768,
    height: 1024,
    laneCount: 5,
    laneWidth: 0,
    laneX: [],
};

const state = {
    running: false,
    depth: 0,
    bestDepth: Number(localStorage.getItem('fall-best') || 0),
    speed: 240,
    targetSpeed: 240,
    shield: 1,
    lives: 3,
    chargeCount: 0,
    laneCooldown: 0,
    warningTimer: 0,
    elapsed: 0,
};

const pilot = {
    lane: 2,
    targetLane: 2,
    x: 0,
    y: 0,
    radius: 48,
    tilt: 0,
};

const parallaxLayers = [];
const debris = [];
const charges = [];
const particles = [];

let lastTime = performance.now();
let debrisTimer = 0;
let chargeTimer = 0;
let streakTimer = 0;

function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function initWorld() {
    world.laneWidth = world.width / world.laneCount;
    world.laneX = Array.from({ length: world.laneCount }, (_, i) => (i + 0.5) * world.laneWidth);
    pilot.x = world.laneX[pilot.lane];
    pilot.y = world.height - 320;
    bestEl.textContent = `${state.bestDepth.toLocaleString()} m`;
    initParallax();
    draw();
}

function initParallax() {
    parallaxLayers.length = 0;
    const configs = [
        { count: 30, speed: 120, alpha: 0.12, size: [180, 360] },
        { count: 24, speed: 190, alpha: 0.18, size: [120, 260] },
        { count: 20, speed: 260, alpha: 0.24, size: [80, 160] },
    ];
    configs.forEach((cfg) => {
        parallaxLayers.push({
            speed: cfg.speed,
            pieces: Array.from({ length: cfg.count }, () => ({
                x: Math.random() * world.width,
                y: Math.random() * world.height,
                h: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
                alpha: cfg.alpha * (0.6 + Math.random() * 0.6),
            })),
        });
    });
}

function resetGame() {
    state.running = true;
    state.depth = 0;
    state.speed = 240;
    state.targetSpeed = 240;
    state.shield = 1;
    state.lives = 3;
    state.chargeCount = 0;
    state.elapsed = 0;
    state.warningTimer = 0;
    state.laneCooldown = 0;
    debris.length = 0;
    charges.length = 0;
    particles.length = 0;
    pilot.lane = 2;
    pilot.targetLane = 2;
    pilot.x = world.laneX[pilot.lane];
    pilot.y = world.height - 420;
    pilot.tilt = 0;
    debrisTimer = 0.35;
    chargeTimer = 1.5;
    streakTimer = 0;
    for (let i = 0; i < 6; i += 1) spawnDebris(true);
    spawnCharge();
    toast('Re-entry corridor aligned');
    updateHudStatic();
}

function toast(message, duration = 1200) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

function spawnDebris(seed = false) {
    const lane = Math.floor(Math.random() * world.laneCount);
    const base = 60 + Math.random() * 90;
    debris.push({
        lane,
        x: world.laneX[lane] + (Math.random() - 0.5) * 42,
        y: seed ? Math.random() * world.height : world.height + 220,
        width: base,
        height: base * (0.6 + Math.random() * 0.9),
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 1.8,
        hue: 190 + Math.random() * 120,
    });
}

function spawnCharge() {
    const lane = Math.floor(Math.random() * world.laneCount);
    charges.push({
        lane,
        x: world.laneX[lane],
        y: world.height + 120,
        pulse: 0,
    });
}

function spawnStreak() {
    const x = Math.random() * world.width;
    particles.push({
        type: 'streak',
        x,
        y: world.height + 140,
        length: 120 + Math.random() * 220,
        speed: state.speed * (0.9 + Math.random() * 0.5),
        alpha: 0.1 + Math.random() * 0.15,
    });
}

function update(delta) {
    state.elapsed += delta;
    state.speed += (state.targetSpeed - state.speed) * 0.15 * delta;
    state.targetSpeed = 240 + Math.min(320, state.elapsed * 18);
    state.laneCooldown = Math.max(0, state.laneCooldown - delta);
    state.warningTimer = Math.max(0, state.warningTimer - delta);

    debrisTimer += delta;
    if (debrisTimer > 0.65) {
        spawnDebris();
        if (Math.random() > 0.65) spawnDebris();
        debrisTimer = 0;
    }

    chargeTimer += delta;
    if (chargeTimer > 2.4) {
        if (Math.random() > 0.45) spawnCharge();
        chargeTimer = 0;
    }

    streakTimer += delta;
    if (streakTimer > 0.18) {
        spawnStreak();
        streakTimer = 0;
    }

    // parallax movement (environment rushing upward)
    for (const layer of parallaxLayers) {
        const speed = (state.speed * 0.25 + layer.speed) * delta;
        for (const piece of layer.pieces) {
            piece.y -= speed;
            if (piece.y + piece.h < 0) {
                piece.y = world.height + Math.random() * 200;
                piece.x = Math.random() * world.width;
            }
        }
    }

    // debris movement and collisions
    for (let i = debris.length - 1; i >= 0; i -= 1) {
        const block = debris[i];
        block.y -= state.speed * delta;
        block.rotation += block.spin * delta;
        if (block.y + block.height / 2 < -120) {
            debris.splice(i, 1);
            continue;
        }
        const dx = Math.abs(block.x - pilot.x);
        const dy = Math.abs(block.y - pilot.y);
        if (dx < (block.width + pilot.radius) * 0.45 && dy < (block.height + pilot.radius * 2) * 0.45) {
            collide();
            debris.splice(i, 1);
        }
    }

    // charge nodes
    for (let i = charges.length - 1; i >= 0; i -= 1) {
        const node = charges[i];
        node.y -= state.speed * delta * 0.7;
        node.pulse += delta * 6;
        if (node.y < -80) {
            charges.splice(i, 1);
            continue;
        }
        if (Math.abs(node.x - pilot.x) < 56 && Math.abs(node.y - pilot.y) < 70) {
            collectCharge();
            charges.splice(i, 1);
        }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        if (p.type === 'streak') {
            p.y -= p.speed * delta;
            if (p.y + p.length < -40) particles.splice(i, 1);
        } else {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vy += 260 * delta;
            p.life -= delta;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    // pilot easing
    const targetX = world.laneX[pilot.targetLane];
    pilot.x += (targetX - pilot.x) * 9 * delta;
    pilot.y = Math.min(pilot.y + (world.height - 420 - pilot.y) * 6 * delta, world.height - 420);
    pilot.tilt += ((targetX - pilot.x) * 0.004 - pilot.tilt) * 10 * delta;

    state.depth += state.speed * delta;
    depthEl.textContent = `${Math.floor(state.depth).toLocaleString()} m`;
    shieldEl.textContent = `${Math.max(0, Math.round(state.shield * 100))}%`;
    chargeCountEl.textContent = state.chargeCount.toString();
    livesEl.textContent = state.lives.toString();
}

function collide() {
    state.shield = Math.max(0, state.shield - 0.5);
    if (state.shield > 0.1) {
        state.warningTimer = 0.6;
        toast('Hull breach absorbed', 750);
        spawnCollisionSparks();
    } else {
        state.lives -= 1;
        if (state.lives > 0) {
            state.shield = 1;
            state.warningTimer = 0.6;
            toast(`Structural damage, ${state.lives} lives remaining`, 900);
            spawnCollisionSparks();
        } else {
            endGame(false);
        }
    }
}

function collectCharge() {
    state.shield = Math.min(1, state.shield + 0.4);
    state.chargeCount += 1;
    toast('Shield replenished', 900);
    for (let i = 0; i < 16; i += 1) {
        particles.push({
            type: 'spark',
            x: pilot.x + (Math.random() - 0.5) * 30,
            y: pilot.y + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 200,
            vy: -60 + Math.random() * 120,
            life: 0.45 + Math.random() * 0.3,
            color: 'rgba(65,246,255,0.65)',
        });
    }
}

function spawnCollisionSparks() {
    for (let i = 0; i < 20; i += 1) {
        particles.push({
            type: 'spark',
            x: pilot.x + (Math.random() - 0.5) * 46,
            y: pilot.y + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 280,
            vy: -120 + Math.random() * 240,
            life: 0.5 + Math.random() * 0.4,
            color: Math.random() > 0.5 ? 'rgba(65,246,255,0.7)' : 'rgba(255,72,208,0.7)',
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, world.width, world.height);

    const bg = ctx.createLinearGradient(0, 0, 0, world.height);
    bg.addColorStop(0, 'rgba(10,16,34,0.92)');
    bg.addColorStop(1, 'rgba(2,6,14,0.96)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, world.width, world.height);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = 'rgba(65,246,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= world.laneCount; i += 1) {
        const x = world.laneWidth * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + pilot.tilt * 40, world.height);
        ctx.stroke();
    }
    ctx.restore();

    for (const layer of parallaxLayers) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (const piece of layer.pieces) {
            ctx.fillStyle = 'rgba(65,246,255,0.1)';
            ctx.fillRect(piece.x - 1, piece.y, 2, piece.h);
        }
        ctx.restore();
    }

    if (state.warningTimer > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255,72,120,${state.warningTimer * 0.45})`;
        ctx.fillRect(0, 0, world.width, world.height);
        ctx.restore();
    }

    for (const node of charges) {
        ctx.save();
        ctx.translate(node.x, node.y);
        const scale = 1 + Math.sin(node.pulse) * 0.15;
        ctx.scale(scale, scale);
        const grd = ctx.createRadialGradient(0, 0, 6, 0, 0, 22);
        grd.addColorStop(0, 'rgba(255,255,255,0.9)');
        grd.addColorStop(0.5, 'rgba(65,246,255,0.6)');
        grd.addColorStop(1, 'rgba(65,246,255,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    for (const block of debris) {
        ctx.save();
        ctx.translate(block.x, block.y);
        ctx.rotate(block.rotation);
        const grad = ctx.createLinearGradient(0, -block.height / 2, 0, block.height / 2);
        grad.addColorStop(0, `hsla(${block.hue}, 80%, 65%, 0.85)`);
        grad.addColorStop(1, `hsla(${block.hue + 40}, 80%, 45%, 0.85)`);
        ctx.fillStyle = grad;
        roundRect(ctx, -block.width / 2, -block.height / 2, block.width, block.height, 20);
        ctx.fill();
        ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.35;
    const trailGrad = ctx.createLinearGradient(pilot.x, pilot.y - 20, pilot.x, pilot.y + 260);
    trailGrad.addColorStop(0, 'rgba(65,246,255,0.55)');
    trailGrad.addColorStop(1, 'rgba(65,246,255,0)');
    ctx.fillStyle = trailGrad;
    ctx.fillRect(pilot.x - 18, pilot.y - 20, 36, 280);
    ctx.restore();

    ctx.save();
    ctx.translate(pilot.x, pilot.y);
    ctx.rotate(pilot.tilt * 0.45);

    // outer shell
    const outer = ctx.createRadialGradient(0, 0, 0, 0, 0, pilot.radius);
    outer.addColorStop(0, 'rgba(255,255,255,0.95)');
    outer.addColorStop(1, 'rgba(65,246,255,0.75)');
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(0, 0, pilot.radius, 0, Math.PI * 2);
    ctx.fill();

    // inner chassis
    ctx.fillStyle = 'rgba(6,14,26,0.92)';
    ctx.beginPath();
    ctx.arc(0, 0, pilot.radius * 0.62, 0, Math.PI * 2);
    ctx.fill();

    // visor streak
    ctx.fillStyle = 'rgba(65,246,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(18, -6, pilot.radius * 0.36, pilot.radius * 0.2, 0, Math.PI * 0.3, Math.PI * 1.6);
    ctx.fill();

    // hazard lights
    const lightGrad = ctx.createRadialGradient(pilot.radius * 0.65, pilot.radius * 0.65, 0, pilot.radius * 0.65, pilot.radius * 0.65, pilot.radius * 0.3);
    lightGrad.addColorStop(0, 'rgba(255,72,208,0.9)');
    lightGrad.addColorStop(1, 'rgba(255,72,208,0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.arc(pilot.radius * 0.65, pilot.radius * 0.65, pilot.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    const lightGrad2 = ctx.createRadialGradient(-pilot.radius * 0.65, pilot.radius * 0.65, 0, -pilot.radius * 0.65, pilot.radius * 0.65, pilot.radius * 0.3);
    lightGrad2.addColorStop(0, 'rgba(65,246,255,0.9)');
    lightGrad2.addColorStop(1, 'rgba(65,246,255,0)');
    ctx.fillStyle = lightGrad2;
    ctx.beginPath();
    ctx.arc(-pilot.radius * 0.65, pilot.radius * 0.65, pilot.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    for (const p of particles) {
        if (p.type === 'streak') {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            const g = ctx.createLinearGradient(p.x, p.y, p.x, p.y - p.length);
            g.addColorStop(0, 'rgba(65,246,255,0.35)');
            g.addColorStop(1, 'rgba(65,246,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(p.x - 2, p.y - p.length, 4, p.length);
            ctx.restore();
        } else {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / 0.6);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawInRunHud();
}

function drawInRunHud() {
    ctx.save();
    ctx.font = '18px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(224, 238, 255, 0.9)';
    ctx.textBaseline = 'top';
    ctx.fillText(`Charge Nodes: ${state.chargeCount}`, 24, 24);

    ctx.fillText('Shield', 24, 54);
    const barWidth = 200;
    const barHeight = 14;
    ctx.strokeStyle = 'rgba(65,246,255,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 74, barWidth, barHeight);
    ctx.fillStyle = 'rgba(65,246,255,0.45)';
    ctx.fillRect(24, 74, barWidth * Math.max(0, Math.min(1, state.shield)), barHeight);

    ctx.fillStyle = 'rgba(224, 238, 255, 0.9)';
    ctx.fillText('Lives', 24, 102);
    for (let i = 0; i < state.lives; i += 1) {
        ctx.beginPath();
        ctx.arc(70 + i * 28, 128, 10, 0, Math.PI * 2);
        ctx.fillStyle = i < state.lives ? 'rgba(255,72,208,0.85)' : 'rgba(255,255,255,0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.stroke();
    }
    ctx.restore();
}

function loop(now) {
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (state.running) {
        update(delta);
        draw();
        requestAnimationFrame(loop);
    }
}

function startGame() {
    startOverlay.classList.add('overlay--hidden');
    gameoverOverlay.classList.add('overlay--hidden');
    resetGame();
    lastTime = performance.now();
    requestAnimationFrame(loop);
}

function endGame(surfaceReached) {
    state.running = false;
    const finalDepth = Math.floor(state.depth);
    finalReadout.textContent = surfaceReached
        ? `Surface contact achieved at ${finalDepth.toLocaleString()} m.`
        : `Impact occurred at ${finalDepth.toLocaleString()} m.`;
    gameoverOverlay.classList.remove('overlay--hidden');
    if (finalDepth > state.bestDepth) {
        state.bestDepth = finalDepth;
        localStorage.setItem('fall-best', state.bestDepth);
        toast('New descent record');
    } else {
        toast('Telemetry lost');
    }
    bestEl.textContent = `${state.bestDepth.toLocaleString()} m`;
}

function changeLane(direction) {
    if (state.laneCooldown > 0) return;
    const nextLane = Math.min(Math.max(pilot.targetLane + direction, 0), world.laneCount - 1);
    if (nextLane === pilot.targetLane) return;
    pilot.targetLane = nextLane;
    state.laneCooldown = 0.12;
    pilot.tilt = -direction * 0.8;
    toast(direction > 0 ? 'Vector drift right' : 'Vector drift left', 500);
}

window.addEventListener('keydown', (event) => {
    if (!state.running && event.code === 'Space') {
        startGame();
        return;
    }
    if (!state.running) return;
    if (event.repeat) return;
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') changeLane(-1);
    if (event.code === 'ArrowRight' || event.code === 'KeyD') changeLane(1);
});

let touchStartX = 0;

canvas.addEventListener('touchstart', (event) => {
    if (!state.running) {
        startGame();
        return;
    }
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
}, { passive: true });

canvas.addEventListener('touchend', (event) => {
    if (!state.running) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    if (Math.abs(dx) > 30) {
        changeLane(dx > 0 ? 1 : -1);
    }
}, { passive: true });

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);
showControlsBtn.addEventListener('click', (event) => {
    event.preventDefault();
    startOverlay.classList.remove('overlay--hidden');
    state.running = false;
});

function updateHudStatic() {
    shieldEl.textContent = '100%';
    chargeCountEl.textContent = '0';
    livesEl.textContent = state.lives.toString();
}

initWorld();

