// --- PARTICLES ---
class Particle {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.life = 1.0;
        this.type = type;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (type === 'explode' ? 4 : type === 'grass' ? 2 : 1);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.decay = type === 'grass' ? 0.05 : 0.02;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        if (this.type === 'grass') { ctx.fillStyle = '#0f0'; ctx.fillRect(this.x, this.y, 3, 3); }
        else if (this.type === 'sparkle') { ctx.fillStyle = '#fff'; ctx.fillRect(this.x, this.y, 2, 2); }
        else if (this.type === 'explode') { ctx.fillStyle = `hsl(${Math.random() * 60}, 100%, 50%)`; ctx.fillRect(this.x, this.y, 4, 4); }
        else if (this.type === 'trail') { ctx.fillStyle = 'rgba(0,255,255,0.3)'; ctx.fillRect(this.x, this.y, 30, 30); }
        ctx.globalAlpha = 1;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = VIEWPORT_WIDTH; this.canvas.height = VIEWPORT_HEIGHT;

        this.state = 'MENU';
        this.levelIdx = 0; this.score = 0; this.lives = 3; this.radiation = 0;
        this.keysHeld = 0; this.blockadesHeld = 0; this.carryCapacity = 1000; // Infinite stack
        this.globalFrame = 0;

        this.map = []; this.width = 0; this.height = 0;
        this.player = { x: 0, y: 0, w: 32, h: 32, carrying: false, carryingCount: 0, isMoving: false, moveDir: { x: 0, y: 0 }, distMoved: 0, lastDir: { x: 1, y: 0 }, trail: [] };
        this.camera = { x: 0, y: 0 };
        this.enemies = []; this.items = []; this.lasers = []; this.particles = [];
        this.input = { up: false, down: false, left: false, right: false, q: false };
        this.qPressed = false;
        this.plutoniumTotal = 0; this.plutoniumCollected = 0; this.plutoniumOnMap = 0;
        this.laserTimer = 0; this.laserState = false;

        // Editor
        this.editorMap = []; this.editorW = 40; this.editorH = 30; this.editorTool = '1';
        this.isMouseDown = false; this.mousePos = { x: 0, y: 0 };
        this.customLevelData = null; this.testingLevel = false;

        this.bindInput();
        this.initLevels(); // Initialize levels including start config
        requestAnimationFrame(t => this.loop(t));
    }

    toggleMusic() {
        const isPlaying = soundManager.toggleMusic();
        document.getElementById('music-btn').innerText = isPlaying ? "MUSIC: ON" : "MUSIC: OFF";
    }

    initLevels() {
        // 1. Load START_CONFIG as Level 1
        if (START_CONFIG) {
            this.editorMap = START_CONFIG.map;
            this.editorH = START_CONFIG.height;
            this.editorW = START_CONFIG.width;
            let csv = this.jsonToCsv(START_CONFIG);
            CSV_LEVELS[0] = csv;
        } else { this.initEditorGrid(); }

        // 2. Load Additional Levels
        ADDITIONAL_LEVELS.forEach((lvlData) => {
            try {
                const lvl = (typeof lvlData === 'string') ? JSON.parse(lvlData) : lvlData;
                const csv = this.jsonToCsv(lvl);
                CSV_LEVELS.push(csv);
            } catch (e) { console.error("Error parsing level", e); }
        });
    }

    jsonToCsv(levelObj) {
        return levelObj.map.map(row => row.map(c => {
            if (c === '1') return '█'; if (c === '2') return '▒'; if (c === '3') return 'L/';
            if (c === '4') return 'D'; if (c === '5') return 'K'; if (c === '6') return '?';
            if (c === '7') return 'X'; if (c === '9') return 'S'; if (c === 'R') return 'R';
            if (c === 'A') return 'A'; if (c === 'M') return 'M';
            if (c === '11') return '"'; if (c === '12') return 'B';
            return ',';
        }).join(',')).join('\n');
    }

    initEditorGrid() {
        this.editorMap = [];
        for (let y = 0; y < this.editorH; y++) {
            let row = [];
            for (let x = 0; x < this.editorW; x++) {
                if (x === 0 || x === this.editorW - 1 || y === 0 || y === this.editorH - 1) row.push('1'); else row.push('0');
            }
            this.editorMap.push(row);
        }
    }

    bindInput() {
        window.addEventListener('keydown', e => this.handleKey(e, true));
        window.addEventListener('keyup', e => this.handleKey(e, false));
        this.canvas.addEventListener('mousedown', e => { this.isMouseDown = true; this.handleMouse(e); });
        this.canvas.addEventListener('mousemove', e => {
            const r = this.canvas.getBoundingClientRect();
            this.mousePos.x = (e.clientX - r.left) * (this.canvas.width / r.width);
            this.mousePos.y = (e.clientY - r.top) * (this.canvas.height / r.height);
            if (this.isMouseDown) this.handleMouse(e);
        });
        window.addEventListener('mouseup', () => this.isMouseDown = false);
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.editorTool = btn.getAttribute('data-tool');
            });
        });
        const touchBtns = document.querySelectorAll('.d-btn, .action-btn');
        touchBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleKey({ key: btn.dataset.key }, true); });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.handleKey({ key: btn.dataset.key }, false); });
        });
    }

    handleKey(e, pressed) {
        const k = e.key.toLowerCase();
        if (k === 'w' || k === 'arrowup') this.input.up = pressed;
        if (k === 's' || k === 'arrowdown') this.input.down = pressed;
        if (k === 'a' || k === 'arrowleft') this.input.left = pressed;
        if (k === 'd' || k === 'arrowright') this.input.right = pressed;
        if (k === 'q') this.input.q = pressed;
    }

    handleMouse(e) {
        if (this.state !== 'EDITOR') return;
        const gx = Math.floor((this.mousePos.x + this.camera.x) / TILE_SIZE);
        const gy = Math.floor((this.mousePos.y + this.camera.y) / TILE_SIZE);
        if (gx >= 0 && gx < this.editorW && gy >= 0 && gy < this.editorH && this.isMouseDown) {
            this.editorMap[gy][gx] = this.editorTool;
        }
    }

    // --- UI LOGIC ---
    openEditor() {
        this.state = 'EDITOR';
        this.hideScreens();
        document.getElementById('editor-ui').style.display = 'block';
        document.getElementById('ui-layer').style.display = 'none';
        this.camera.x = 0; this.camera.y = 0;
        soundManager.isCarrying = false;
    }
    quitEditor() {
        this.state = 'MENU';
        document.getElementById('editor-ui').style.display = 'none';
        document.getElementById('ui-layer').style.display = 'flex';
        document.getElementById('start-screen').style.display = 'flex';
    }
    saveLevel() {
        const levelObj = { name: "Custom", width: this.editorW, height: this.editorH, map: this.editorMap };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(levelObj));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "zonex_level.json");
        dlAnchorElem.click();
    }
    loadLevelFromFile(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const obj = JSON.parse(e.target.result);
                if (obj.map) { this.editorMap = obj.map; this.editorH = obj.map.length; this.editorW = obj.map[0].length; alert("Level geladen!"); }
            } catch (err) { alert("Fehler: " + err); }
        };
        reader.readAsText(file);
    }
    testLevel() {
        let csv = this.jsonToCsv({ map: this.editorMap });
        this.customLevelData = csv; this.testingLevel = true; this.start(true);
    }

    openLevelSelect() {
        this.hideScreens();
        const grid = document.getElementById('level-select-grid');
        grid.innerHTML = '';
        CSV_LEVELS.forEach((lvl, idx) => {
            const btn = document.createElement('div');
            btn.className = 'level-btn';
            btn.innerText = `ZONE 1-${idx + 1}`;
            btn.onclick = () => {
                this.levelIdx = idx;
                this.customLevelData = null;
                this.start();
            };
            grid.appendChild(btn);
        });
        document.getElementById('level-select-screen').style.display = 'flex';
    }

    quitToMenu() {
        this.state = 'MENU'; this.hideScreens();
        document.getElementById('start-screen').style.display = 'flex';
        document.getElementById('editor-ui').style.display = 'none';
        document.getElementById('ui-layer').style.display = 'flex';
        soundManager.isCarrying = false;
    }

    start(isTest = false) {
        soundManager.startAmbience();
        if (!isTest) {
            // Start normal progression
        } else {
            this.levelIdx = 0; // Test level context
        }
        this.score = 0; this.lives = 3; this.hideScreens();
        document.getElementById('editor-ui').style.display = 'none';
        document.getElementById('ui-layer').style.display = 'flex';
        this.loadLevel(this.levelIdx);
    }
    reset() { if (this.testingLevel) this.start(true); else this.start(); }

    loadLevel(idx) {
        let data = this.customLevelData ? this.customLevelData : CSV_LEVELS[idx];

        if (!data && !this.customLevelData) {
            // Try loop back to level 1 if out of levels
            if (CSV_LEVELS.length > 0) {
                this.levelIdx = 0;
                data = CSV_LEVELS[0];
            } else {
                document.getElementById('win-screen').style.display = 'flex'; return;
            }
        }

        if (!this.customLevelData) document.getElementById('level-title').innerText = `ZONE 1-${idx + 1}`;
        else document.getElementById('level-title').innerText = "TEST ZONE";

        this.radiation = 0; this.player.carrying = false; this.player.carryingCount = 0; soundManager.isCarrying = false; this.keysHeld = 0; this.blockadesHeld = 0;
        this.player.trail = []; // Clear trail on new level
        document.getElementById('level-screen').style.display = 'flex';
        this.parseLevel(data);
        soundManager.playLevelStart();
        setTimeout(() => { this.hideScreens(); this.state = 'PLAYING'; }, 2000);
    }

    parseLevel(csv) {
        const rows = csv.split('\n');
        this.height = rows.length; this.width = 0;
        this.map = []; this.items = []; this.enemies = []; this.lasers = [];
        this.plutoniumCollected = 0; this.particles = [];

        // Count total plutonium in this level
        let pCount = 0;
        rows.forEach(r => {
            for (const c of r.split(',')) {
                if (c.includes('?') || c.includes('(') || c.includes('6')) pCount++;
            }
        });
        this.plutoniumOnMap = pCount;
        this.plutoniumTotal = pCount; // Total for level completion logic

        rows.forEach((rowStr, y) => {
            const cells = rowStr.split(',');
            this.width = Math.max(this.width, cells.length);
            const row = [];
            cells.forEach((cell, x) => {
                let type = ENTITY.EMPTY;
                const cx = x * TILE_SIZE, cy = y * TILE_SIZE;
                if (cell.includes('█')) type = ENTITY.WALL;
                else if (cell.includes('▒')) type = ENTITY.FLOOR;
                else if (cell.includes('S')) { this.player.x = cx + 4; this.player.y = cy + 4; type = ENTITY.START; }
                else if (cell.includes('K')) this.items.push({ x: cx, y: cy, type: ENTITY.KEY, active: true });
                else if (cell.includes('?') || cell.includes('(')) { this.items.push({ x: cx, y: cy, type: ENTITY.PLUTONIUM, active: true }); }
                else if (cell.includes('X')) type = ENTITY.CONTAINER;
                else if (cell.includes('D')) type = ENTITY.DOOR;
                else if (cell.includes('"')) type = ENTITY.GRASS;
                else if (cell.includes('B')) type = ENTITY.BLOCKADE_STATION;
                else if (cell.includes('L') || cell.includes('l')) { type = ENTITY.LASER; this.lasers.push({ x, y }); }
                else if (cell.includes('R') || cell.includes('r')) this.enemies.push({ id: Math.random(), x: cx, y: cy, type: 'ROBOT', dir: 1, axis: 'x', speed: 2 });
                else if (cell.includes('A')) this.enemies.push({ id: Math.random(), x: cx, y: cy, type: 'ALIEN', dir: 1, axis: 'y', speed: 3 });
                else if (cell.includes('M')) this.enemies.push({ id: Math.random(), x: cx, y: cy, type: 'MINE', dir: 0, axis: '', speed: 0 });
                row.push(type);
            });
            this.map.push(row);
        });
    }

    loop(t) {
        const dt = t - (this.lastTime || t); this.lastTime = t;
        if (this.state === 'EDITOR') { this.updateEditor(dt); this.drawEditor(t); }
        else if (this.state === 'PLAYING') { this.updateGame(dt, t); this.drawGame(t); }
        requestAnimationFrame(time => this.loop(time));
    }

    updateEditor(dt) {
        const speed = 10;
        if (this.input.up) this.camera.y -= speed;
        if (this.input.down) this.camera.y += speed;
        if (this.input.left) this.camera.x -= speed;
        if (this.input.right) this.camera.x += speed;
    }

    drawEditor(t) {
        this.ctx.fillStyle = "#000"; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save(); this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));
        for (let y = 0; y < this.editorH; y++) {
            if (!this.editorMap[y]) continue;
            for (let x = 0; x < this.editorW; x++) {
                const c = this.editorMap[y][x];
                const px = x * TILE_SIZE, py = y * TILE_SIZE;
                this.ctx.strokeStyle = "#111"; this.ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                if (c !== '0') this.drawEntity(this.ctx, c, px, py, TILE_SIZE, TILE_SIZE, t);
            }
        }
        const mx = Math.floor((this.mousePos.x + this.camera.x) / TILE_SIZE) * TILE_SIZE;
        const my = Math.floor((this.mousePos.y + this.camera.y) / TILE_SIZE) * TILE_SIZE;
        this.ctx.strokeStyle = "#0f0"; this.ctx.lineWidth = 2; this.ctx.strokeRect(mx, my, TILE_SIZE, TILE_SIZE);
        this.ctx.restore();
    }

    drawEntity(ctx, type, x, y, w, h, t) {
        if (!type) return;
        const cx = x + w / 2; const cy = y + h / 2;

        if (type === 'WALL' || type === '1') {
            ctx.fillStyle = "#222"; ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = "#00ff00"; ctx.lineWidth = 1;
            ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
            ctx.fillStyle = "#004400"; ctx.fillRect(x, y, w, 4);
        } else if (type === 'FLOOR' || type === '2') {
            ctx.strokeStyle = "rgba(0, 50, 0, 0.3)"; ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);
        } else if (type === 'GRASS' || type === '11') {
            ctx.fillStyle = "#006600";
            for (let i = 0; i < 5; i++) ctx.fillRect(x + Math.random() * 30, y + Math.random() * 30, 3, 6);
        } else if (type === 'BLOCKADE_STATION' || type === '12') {
            ctx.fillStyle = "#003366"; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "#00ffff"; ctx.fillText("BLK", cx - 10, cy + 5);
            ctx.strokeStyle = "#0ff"; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
        } else if (type === 'BLOCKADE' || type === '13') {
            ctx.fillStyle = "#555"; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
            ctx.fillStyle = "#aaa"; ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
            ctx.strokeStyle = "#fff"; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
        } else if (type === 'DOOR' || type === '4') {
            ctx.fillStyle = "#400"; ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = "#f00"; ctx.strokeRect(x, y, w, h);
            if (Math.floor(t / 500) % 2 === 0) { ctx.fillStyle = "#f00"; ctx.fillRect(x + 10, y + 10, 20, 20); }
        } else if (type === 'CONTAINER' || type === '7') {
            ctx.fillStyle = "#001144"; ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = "#0ff"; ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
        } else if (type === 'LASER' || type === '3') {
            ctx.fillStyle = "#111"; ctx.fillRect(x, y, w, h);
            if (this.laserState || this.state === 'EDITOR') {
                ctx.strokeStyle = "#ff00ff"; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + w, cy); ctx.stroke();
                ctx.shadowBlur = 20; ctx.shadowColor = "#f0f"; ctx.stroke(); ctx.shadowBlur = 0;
            }
        } else if (type === 'PLUTONIUM' || type === '6') {
            const pulse = Math.sin(t / 100) * 5;
            ctx.fillStyle = "#0f0"; ctx.shadowBlur = 10; ctx.shadowColor = "#0f0";
            ctx.beginPath(); ctx.arc(cx, cy, 5 + pulse, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
        } else if (type === 'KEY' || type === '5') {
            ctx.fillStyle = "#ff0"; ctx.textAlign = "center"; ctx.font = "bold 20px Arial";
            ctx.fillText("🗝️", cx, cy + 7);
        } else if (type === 'PLAYER' || type === '9') {
            ctx.fillStyle = this.player.carrying ? "#0f0" : "#0ff";
            ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath(); ctx.moveTo(cx, y + 5); ctx.lineTo(x + w - 5, y + h - 5); ctx.lineTo(x + 5, y + h - 5); ctx.fill(); ctx.shadowBlur = 0;
        } else if (type === 'ROBOT' || type === 'R') {
            ctx.fillStyle = "#d00"; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
            ctx.fillStyle = "#ff0"; ctx.fillRect(x + 8, y + 8, 6, 4); ctx.fillRect(x + 20, y + 8, 6, 4);
        } else if (type === 'ALIEN' || type === 'A') {
            // Violett sphere - Changed to Blue with Yellow Eyes as requested
            const bob = Math.sin(t / 200) * 4;
            ctx.fillStyle = "#00f"; // Blue
            ctx.beginPath(); ctx.arc(cx, cy + bob, 10, 0, 6.28); ctx.fill();
            // Yellow eyes
            ctx.fillStyle = "#ff0";
            ctx.fillRect(x + 10, y + 10 + bob, 4, 4); ctx.fillRect(x + 26, y + 10 + bob, 4, 4);
        } else if (type === 'MINE' || type === 'M') {
            ctx.fillStyle = "#333"; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 6.28); ctx.fill();
            ctx.fillStyle = "#f00"; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 6.28); ctx.fill();
        } else if (type === 'START' || type === '9') {
            ctx.fillStyle = "#00f"; ctx.fillText("S", cx, cy + 5);
        }
    }

    updateGame(dt, t) {
        this.globalFrame++;
        soundManager.updateAmbience(this.radiation, this.player.carryingCount);

        // High Rad Shake
        if (this.radiation > 90) {
            document.getElementById('high-rad-overlay').style.display = 'block';
            this.canvas.classList.add('high-rad-shake');
        } else {
            document.getElementById('high-rad-overlay').style.display = 'none';
            this.canvas.classList.remove('high-rad-shake');
        }

        this.laserTimer += dt;
        if (this.laserTimer > 2000) { this.laserTimer = 0; this.laserState = !this.laserState; }

        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => p.update());

        const speed = 4;
        let intendedDir = null;
        if (this.input.up) intendedDir = { x: 0, y: -1 };
        else if (this.input.down) intendedDir = { x: 0, y: 1 };
        else if (this.input.left) intendedDir = { x: -1, y: 0 };
        else if (this.input.right) intendedDir = { x: 1, y: 0 };

        // Blockade Logic (Input Q)
        if (this.input.q && !this.qPressed) {
            this.qPressed = true;
            if (this.blockadesHeld > 0) {
                // Place behind
                const tC = Math.round((this.player.x - 4) / TILE_SIZE) - this.player.lastDir.x;
                const tR = Math.round((this.player.y - 4) / TILE_SIZE) - this.player.lastDir.y;
                const tile = this.getTile(tC, tR);

                if (tile === ENTITY.EMPTY || tile === ENTITY.FLOOR) {
                    this.setTile(tC, tR, ENTITY.BLOCKADE);
                    this.blockadesHeld--;
                    soundManager.playSFX('block_place');
                    this.spawnParticles(tC * TILE_SIZE + 20, tR * TILE_SIZE + 20, "explode", 10);
                }
            }
        }
        if (!this.input.q) this.qPressed = false;

        if (this.player.isMoving) {
            this.player.x += this.player.moveDir.x * speed;
            this.player.y += this.player.moveDir.y * speed;
            this.player.distMoved += speed;
            moveSynth.start(); moveSynth.update(this.player.x, this.player.y);

            // Sound for step
            if (this.globalFrame % 15 === 0) soundManager.playSFX('step');

            if (this.globalFrame % 5 === 0) this.spawnParticles(this.player.x + 16, this.player.y + 16, "trail", 1);

            if (this.player.distMoved >= TILE_SIZE) {
                const col = Math.round((this.player.x - 4) / TILE_SIZE);
                const row = Math.round((this.player.y - 4) / TILE_SIZE);

                // Update Trail (Limit to last 10)
                this.player.trail.push({ x: col, y: row });
                if (this.player.trail.length > 10) this.player.trail.shift();

                // Check Grass
                if (this.getTile(col, row) === ENTITY.GRASS) {
                    this.setTile(col, row, ENTITY.EMPTY);
                    soundManager.playSFX('grass');
                    this.spawnParticles(col * TILE_SIZE + 20, row * TILE_SIZE + 20, "grass", 10);
                }

                // Check Blockade Station
                if (this.getTile(col, row) === ENTITY.BLOCKADE_STATION) {
                    if (this.blockadesHeld < 3) {
                        this.blockadesHeld = 3; // Refill
                        soundManager.playSFX('block_pickup');
                    }
                }

                this.player.x = col * TILE_SIZE + 4;
                this.player.y = row * TILE_SIZE + 4;
                this.player.isMoving = false; this.player.distMoved = 0;
                if (intendedDir) this.tryMove(intendedDir); else moveSynth.stop();
            }
        } else {
            moveSynth.stop();
            if (intendedDir) this.tryMove(intendedDir);
        }

        const pCol = Math.floor((this.player.x + 16) / TILE_SIZE);
        const pRow = Math.floor((this.player.y + 16) / TILE_SIZE);

        this.items.forEach(i => {
            if (i.active && this.checkCol(this.player, { x: i.x, y: i.y, w: 32, h: 32 })) {
                if (i.type === ENTITY.PLUTONIUM) {
                    // Check capacity
                    if (this.player.carryingCount < this.carryCapacity) {
                        i.active = false;
                        this.player.carryingCount++;
                        this.player.carrying = true;
                        soundManager.isCarrying = true;
                        soundManager.playSFX('pickup_plutonium', this.player.carryingCount); this.spawnParticles(i.x + 16, i.y + 16, "sparkle", 20);
                    }
                }
                else if (i.type === ENTITY.KEY) {
                    i.active = false; this.keysHeld++; this.score += 50; soundManager.playSFX('key');
                    this.spawnParticles(i.x + 16, i.y + 16, "sparkle", 10);
                }
            }
        });

        if (this.getTile(pCol, pRow) === ENTITY.CONTAINER && this.player.carrying) {
            // Drop ALL carried plutonium
            const deposited = this.player.carryingCount;
            this.plutoniumCollected += deposited;
            this.score += deposited * 100;

            this.player.carryingCount = 0;
            this.player.carrying = false;
            soundManager.isCarrying = false;
            this.radiation = Math.max(0, this.radiation - 20); // Heal

            soundManager.playSFX('deposit');
            this.spawnParticles(this.player.x + 16, this.player.y + 16, "explode", 30);

            if (this.plutoniumCollected >= this.plutoniumTotal) {
                this.score += 1000;
                soundManager.playNextLevel();
                if (this.testingLevel) { setTimeout(() => { alert("Level geschafft!"); this.quitEditor(); }, 2000); }
                else { setTimeout(() => this.loadLevel(this.levelIdx + 1), 2000); }
            }
        }

        if (this.player.carrying) {
            this.radiation += 0.05 * this.player.carryingCount;
        } else {
            this.radiation += 0.01;
        }

        if (this.radiation >= 100) this.die();

        this.enemies.forEach(en => {
            if (en.type === 'MINE') { if (this.checkCol(this.player, { x: en.x + 8, y: en.y + 8, w: 16, h: 16 })) this.die(); return; }

            const speedModifier = en.type === 'ALIEN' ? 0.5 : 1;

            let ex = en.x + (en.axis === 'x' ? en.speed * speedModifier * en.dir : 0);
            let ey = en.y + (en.axis === 'y' ? en.speed * speedModifier * en.dir : 0);
            let blocked = false;

            const c1 = Math.floor(ex / TILE_SIZE), r1 = Math.floor(ey / TILE_SIZE);
            const c2 = Math.floor((ex + 31) / TILE_SIZE), r2 = Math.floor((ey + 31) / TILE_SIZE);

            // Check Enemy Collisions with Wall, Door, Grass, Blockade, Station, Container, Laser
            const solidForEnemy = (t) => t !== ENTITY.EMPTY && t !== ENTITY.FLOOR; // Everything is solid except empty/floor
            if ([c1, c2].some(c => [r1, r2].some(r => solidForEnemy(this.getTile(c, r))))) blocked = true;

            // Check Enemy-Enemy Collision
            if (!blocked) {
                for (let other of this.enemies) {
                    if (other === en) continue;
                    if (Math.abs(other.x - ex) < 30 && Math.abs(other.y - ey) < 30) {
                        blocked = true;
                        break;
                    }
                }
            }

            if (!blocked) { en.x = ex; en.y = ey; }
            else {
                en.dir *= -1;
                // Chance to change axis when blocked
                if (Math.random() > 0.5) en.axis = en.axis === 'x' ? 'y' : 'x';
            }

            if (this.checkCol(this.player, { x: en.x + 4, y: en.y + 4, w: 24, h: 24 })) this.die();
        });

        if (this.laserState && this.getTile(pCol, pRow) === ENTITY.LASER) this.die();

        const tx = Math.max(0, Math.min(this.player.x - VIEWPORT_WIDTH / 2, (this.width * TILE_SIZE) - VIEWPORT_WIDTH));
        const ty = Math.max(0, Math.min(this.player.y - VIEWPORT_HEIGHT / 2, (this.height * TILE_SIZE) - VIEWPORT_HEIGHT));
        this.camera.x += (tx - this.camera.x) * 0.1;
        this.camera.y += (ty - this.camera.y) * 0.1;
        this.updateUI();
    }

    spawnParticles(x, y, type, n) { for (let i = 0; i < n; i++) this.particles.push(new Particle(x, y, type)); }

    tryMove(dir) {
        const c = Math.round((this.player.x - 4) / TILE_SIZE) + dir.x;
        const r = Math.round((this.player.y - 4) / TILE_SIZE) + dir.y;
        const t = this.getTile(c, r);

        // Pickup Blockade Logic
        if (t === ENTITY.BLOCKADE) {
            this.setTile(c, r, ENTITY.EMPTY);
            this.blockadesHeld++;
            soundManager.playSFX('block_recover');
            this.spawnParticles(c * TILE_SIZE + 20, r * TILE_SIZE + 20, "sparkle", 10);
        } else if (t === ENTITY.WALL) {
            return;
        }

        if (t === ENTITY.DOOR) {
            if (this.keysHeld > 0) { this.setTile(c, r, ENTITY.EMPTY); this.keysHeld--; soundManager.playSFX('door'); this.spawnParticles(c * TILE_SIZE + 20, r * TILE_SIZE + 20, "explode", 15); } else return;
        }
        this.player.isMoving = true; this.player.moveDir = dir; this.player.lastDir = dir; this.player.distMoved = 0;
    }

    die() {
        soundManager.playSFX('die'); soundManager.isCarrying = false; this.lives--;

        // --- NEW: Return collected plutonium to map (optional, or just keep it collected) ---
        // In this arcade logic, deaths usually mean restart or continue with penalty.
        // But the user asked for "if you die, collected plutonium counts as delivered" logic or similar?
        // Wait, the request was: "wenn man ein oder mehrere plutonium bereits aufgesammelt hat und dann stirbt, sollten diese dann als abgeliefert beim plutonium counter berücksichtigt werden."
        // So if player dies while carrying, we add carryingCount to collected.

        if (this.player.carrying) {
            this.plutoniumCollected += this.player.carryingCount;
            this.score += this.player.carryingCount * 50; // Half points for death delivery
            this.player.carrying = false;
            this.player.carryingCount = 0;
        }

        this.spawnParticles(this.player.x + 16, this.player.y + 16, "explode", 50);
        if (this.lives <= 0) { document.getElementById('game-over-screen').style.display = 'flex'; this.state = 'GAMEOVER'; }
        else {
            this.player.isMoving = false; this.player.distMoved = 0; this.radiation = 0;
            // Reset position
            for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) if (this.map[y][x] === ENTITY.START) { this.player.x = x * TILE_SIZE + 4; this.player.y = y * TILE_SIZE + 4; }
        }
    }

    drawGame(t) {
        this.ctx.fillStyle = "#000"; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save(); this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        this.particles.forEach(p => p.draw(this.ctx));

        // Draw Player Trail
        this.ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
        this.player.trail.forEach((pos, i) => {
            this.ctx.globalAlpha = (i + 1) / 10 * 0.3; // Fade out
            this.ctx.fillRect(pos.x * TILE_SIZE, pos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });
        this.ctx.globalAlpha = 1.0;

        for (let y = Math.floor(this.camera.y / TILE_SIZE); y <= (this.camera.y + VIEWPORT_HEIGHT) / TILE_SIZE + 1; y++) {
            for (let x = Math.floor(this.camera.x / TILE_SIZE); x <= (this.camera.x + VIEWPORT_WIDTH) / TILE_SIZE + 1; x++) {
                const tType = this.getTile(x, y);
                const px = x * TILE_SIZE, py = y * TILE_SIZE;
                this.drawEntity(this.ctx, 'FLOOR', px, py, TILE_SIZE, TILE_SIZE, t);
                if (tType === ENTITY.WALL) this.drawEntity(this.ctx, 'WALL', px, py, TILE_SIZE, TILE_SIZE, t);
                else if (tType === ENTITY.DOOR) this.drawEntity(this.ctx, 'DOOR', px, py, TILE_SIZE, TILE_SIZE, t);
                else if (tType === ENTITY.GRASS) this.drawEntity(this.ctx, 'GRASS', px, py, TILE_SIZE, TILE_SIZE, t);
                else if (tType === ENTITY.BLOCKADE_STATION) this.drawEntity(this.ctx, 'BLOCKADE_STATION', px, py, TILE_SIZE, TILE_SIZE, t);
                else if (tType === ENTITY.BLOCKADE) this.drawEntity(this.ctx, 'BLOCKADE', px, py, TILE_SIZE, TILE_SIZE, t);
                else if (tType === ENTITY.CONTAINER) this.drawEntity(this.ctx, 'CONTAINER', px, py, TILE_SIZE, TILE_SIZE, t);
                else if (tType === ENTITY.LASER) this.drawEntity(this.ctx, 'LASER', px, py, TILE_SIZE, TILE_SIZE, t);
            }
        }

        this.items.forEach(i => {
            if (!i.active) return;
            if (i.type === ENTITY.PLUTONIUM) this.drawEntity(this.ctx, 'PLUTONIUM', i.x, i.y, 32, 32, t);
            else if (i.type === ENTITY.KEY) this.drawEntity(this.ctx, 'KEY', i.x, i.y, 32, 32, t);
        });

        const pBob = this.player.isMoving ? Math.sin(t / 50) * 2 : 0;
        this.drawEntity(this.ctx, 'PLAYER', this.player.x, this.player.y + pBob, 32, 32, t);

        this.enemies.forEach(e => {
            let type = 'ROBOT'; if (e.type === 'ALIEN') type = 'ALIEN'; if (e.type === 'MINE') type = 'MINE';
            this.drawEntity(this.ctx, type, e.x, e.y, 32, 32, t);
        });

        this.ctx.restore();
        const grad = this.ctx.createRadialGradient(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, 200, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, VIEWPORT_WIDTH);
        grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,10,0,0.6)");
        this.ctx.fillStyle = grad; this.ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    }

    updateUI() {
        document.getElementById('score-display').innerText = this.score.toString().padStart(5, '0');
        document.getElementById('plutonium-display').innerText = `${this.plutoniumCollected}/${this.plutoniumTotal}`;
        document.getElementById('lives-display').innerText = this.lives;
        document.getElementById('radiation-bar').style.width = Math.min(100, this.radiation) + '%';
        document.getElementById('final-score').innerText = this.score;
        const inv = document.getElementById('inventory'); inv.innerHTML = '';
        for (let i = 0; i < this.keysHeld; i++) inv.innerHTML += '<span class="icon-glow">🔑</span>';
        for (let i = 0; i < this.blockadesHeld; i++) inv.innerHTML += '<span class="icon-glow" style="color:#0ff">B</span>';
    }

    checkCol(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    getTile(col, row) { if (col < 0 || col >= this.width || row < 0 || row >= this.height) return ENTITY.WALL; return this.map[row][col]; }
    setTile(col, row, v) { if (col >= 0 && col < this.width && row >= 0 && row < this.height) this.map[row][col] = v; }
    hideScreens() { document.querySelectorAll('.screen').forEach(s => s.style.display = 'none'); }
}
