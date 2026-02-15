const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 900;
canvas.height = 600;

let money = 0;
let collectedData = 0;
let gameOver = false;

// Straßenbereiche definieren (für Speed-Check)
const roadX = { start: 380, end: 460 }; // Vertikaler Weg
const roadY = { start: 280, end: 340 }; // Horizontaler Weg

let player = {
    x: 420, 
    y: 500, 
    speed: 0,
    baseMaxSpeed: 4, 
    isInterceptor: false,
    hp: 100,
    maxHp: 100
};

let tornado = {
    x: 450, 
    y: -100,
    size: 40,
    speed: 1.2,
    windSpeed: 110,
    efScale: "EF0"
};

let probe = { x: -100, y: -100, active: false };
let keys = {};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
window.addEventListener('keypress', e => { if(e.key === ' ') deployProbe(); });

function deployProbe() {
    if(!probe.active && !gameOver) {
        probe.x = player.x;
        probe.y = player.y;
        probe.active = true;
    }
}

function buyInterceptor() {
    if (money >= 500 && !player.isInterceptor) {
        money -= 500;
        player.isInterceptor = true;
        player.baseMaxSpeed = 6;
        player.hp = 500;
        player.maxHp = 500;
        const btn = document.getElementById('buyBtn');
        btn.innerText = "DOMINATOR 3 AKTIV";
        btn.classList.add('unlocked');
    }
}

function drawBackground() {
    // Gras
    ctx.fillStyle = "#3e4a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Feldwege
    ctx.fillStyle = "#7a6652";
    ctx.fillRect(0, roadY.start, canvas.width, roadY.end - roadY.start); // Horizontal
    ctx.fillRect(roadX.start, 0, roadX.end - roadX.start, canvas.height); // Vertikal

    // Häuser
    drawHouse(120, 100);
    drawHouse(700, 120);
    drawHouse(150, 450);
    drawHouse(750, 400);
}

function drawHouse(x, y) {
    ctx.fillStyle = "#5d4037"; ctx.fillRect(x, y, 40, 30);
    ctx.fillStyle = "#b71c1c"; ctx.beginPath();
    ctx.moveTo(x-5, y); ctx.lineTo(x+20, y-20); ctx.lineTo(x+45, y); ctx.fill();
}

function respawnTornado() {
    tornado.y = -150;
    tornado.x = 100 + Math.random() * (canvas.width - 200);
    let r = Math.random();
    if(r > 0.9) {
        tornado.efScale = "EF5"; tornado.size = 110; tornado.windSpeed = 460; tornado.speed = 2.2;
    } else if(r > 0.6) {
        tornado.efScale = "EF2"; tornado.size = 60; tornado.windSpeed = 190; tornado.speed = 1.6;
    } else {
        tornado.efScale = "EF0"; tornado.size = 35; tornado.windSpeed = 110; tornado.speed = 1.1;
    }
}

function update() {
    if(gameOver) return;

    // Speed Check: Auf Straße oder Wiese?
    let onRoad = (player.x > roadX.start && player.x < roadX.end) || 
                 (player.y > roadY.start && player.y < roadY.end);
    
    let currentSpeed = onRoad ? player.baseMaxSpeed : player.baseMaxSpeed * 0.4;

    if (keys['ArrowUp'] || keys['w']) player.y -= currentSpeed;
    if (keys['ArrowDown'] || keys['s']) player.y += currentSpeed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= currentSpeed;
    if (keys['ArrowRight'] || keys['d']) player.x += currentSpeed;

    // Tornado Bewegung
    tornado.y += tornado.speed;
    tornado.x += Math.sin(Date.now() / 800) * 1.5;

    if (tornado.y > canvas.height + 200) respawnTornado();

    // Kollision & Schaden
    let d = Math.hypot(tornado.x - player.x, tornado.y - player.y);
    if (d < tornado.size) {
        player.hp -= player.isInterceptor ? 0.2 : 2.5;
        if (player.hp <= 0) {
            gameOver = true;
            alert("Dein Auto wurde zerstört! Drücke F5 zum Neustart.");
        }
    }

    // Daten sammeln
    if (probe.active) {
        let dp = Math.hypot(tornado.x - probe.x, tornado.y - probe.y);
        if (dp < tornado.size + 40) {
            collectedData += 0.4 * (tornado.windSpeed / 100);
            if (collectedData >= 100) {
                money += 200 + (tornado.windSpeed / 2);
                collectedData = 0;
                probe.active = false;
            }
        }
    }

    updateUI();
}

function updateUI() {
    document.getElementById('money').innerText = Math.floor(money);
    document.getElementById('data').innerText = Math.floor(collectedData);
    const btn = document.getElementById('buyBtn');
    if(money >= 500 && !player.isInterceptor) btn.classList.add('affordable');
}

function draw() {
    drawBackground();

    if (probe.active) {
        ctx.fillStyle = 'yellow'; ctx.beginPath(); 
        ctx.arc(probe.x, probe.y, 5, 0, Math.PI*2); ctx.fill();
    }

    // Spieler
    ctx.fillStyle = player.isInterceptor ? '#111' : '#546e7a';
    ctx.fillRect(player.x - 15, player.y - 10, 30, 20);
    // HP
    ctx.fillStyle = "red"; ctx.fillRect(player.x-15, player.y-20, 30, 4);
    ctx.fillStyle = "lime"; ctx.fillRect(player.x-15, player.y-20, 30 * (player.hp/player.maxHp), 4);

    // Tornado
    let g = ctx.createRadialGradient(tornado.x, tornado.y, 5, tornado.x, tornado.y, tornado.size);
    g.addColorStop(0, 'rgba(80,80,80,0.9)'); g.addColorStop(1, 'rgba(150,150,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tornado.x, tornado.y, tornado.size, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = "white"; ctx.font = "12px Arial";
    ctx.fillText(tornado.efScale, tornado.x - 10, tornado.y - tornado.size - 5);
}

function loop() {
    update(); draw(); requestAnimationFrame(loop);
}
loop();