const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// VIEL GRÖSSERE KARTE
canvas.width = 2000;
canvas.height = 1500;

let money = 0;
let collectedData = 0;
let gameOver = false;

// Straßennetz (breiter und mehr Wege)
const roads = [
    { x: 0, y: 700, w: 2000, h: 80 },   // Hauptstraße Horizontal
    { x: 900, y: 0, w: 80, h: 1500 },  // Hauptstraße Vertikal
    { x: 0, y: 200, w: 1000, h: 50 },  // Feldweg oben
    { x: 1500, y: 700, w: 50, h: 800 } // Weg rechts unten
];

let player = {
    x: 940, 
    y: 1400, 
    speed: 0,
    baseMaxSpeed: 2.5, // Deutlich langsamer für mehr Realismus
    isInterceptor: false,
    hp: 100,
    maxHp: 100
};

let tornado = {
    x: 1000, 
    y: -200,
    size: 50,
    speed: 0.6, // Sehr langsames, bedrohliches Ziehen
    windSpeed: 110,
    efScale: "EF0",
    targetX: 1000
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
        player.baseMaxSpeed = 3.5;
        player.hp = 600;
        player.maxHp = 600;
        const btn = document.getElementById('buyBtn');
        btn.innerText = "DOMINATOR 3 AKTIV";
        btn.classList.add('unlocked');
    }
}

function drawBackground() {
    // Wiese
    ctx.fillStyle = "#3e4a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wege zeichnen
    ctx.fillStyle = "#7a6652";
    roads.forEach(r => ctx.fillRect(r.x, r.y, r.w, r.h));

    // Viele Häuser/Farmen verteilt auf der großen Karte
    drawFarm(200, 200);
    drawFarm(1600, 300);
    drawFarm(400, 1100);
    drawFarm(1700, 1200);
    drawFarm(950, 650);
}

function drawFarm(x, y) {
    ctx.fillStyle = "#5d4037"; ctx.fillRect(x, y, 50, 40); // Haus
    ctx.fillStyle = "#b71c1c"; ctx.beginPath(); ctx.moveTo(x-5, y); ctx.lineTo(x+25, y-25); ctx.lineTo(x+55, y); ctx.fill();
    ctx.fillStyle = "#222"; ctx.fillRect(x+60, y+10, 30, 60); // Silo
}

function respawnTornado() {
    tornado.y = -300;
    tornado.x = 200 + Math.random() * 1600;
    tornado.targetX = tornado.x + (Math.random() - 0.5) * 500;
    
    let r = Math.random();
    if(r > 0.92) {
        tornado.efScale = "EF5"; tornado.size = 150; tornado.windSpeed = 420; tornado.speed = 0.8;
    } else if(r > 0.6) {
        tornado.efScale = "EF2"; tornado.size = 80; tornado.windSpeed = 185; tornado.speed = 0.5;
    } else {
        tornado.efScale = "EF0"; tornado.size = 45; tornado.windSpeed = 105; tornado.speed = 0.4;
    }
}

function update() {
    if(gameOver) return;

    // Speed Check
    let onRoad = false;
    roads.forEach(r => {
        if(player.x > r.x && player.x < r.x + r.w && player.y > r.y && player.y < r.y + r.h) onRoad = true;
    });
    
    let currentSpeed = onRoad ? player.baseMaxSpeed : player.baseMaxSpeed * 0.4;

    if (keys['ArrowUp'] || keys['w']) player.y -= currentSpeed;
    if (keys['ArrowDown'] || keys['s']) player.y += currentSpeed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= currentSpeed;
    if (keys['ArrowRight'] || keys['d']) player.x += currentSpeed;

    // Tornado KI: Bewegt sich langsam Richtung Ziel-X
    tornado.y += tornado.speed;
    if (tornado.x < tornado.targetX) tornado.x += 0.2;
    else tornado.x -= 0.2;

    if (tornado.y > canvas.height + 300) respawnTornado();

    // Schaden
    let d = Math.hypot(tornado.x - player.x, tornado.y - player.y);
    if (d < tornado.size) {
        player.hp -= player.isInterceptor ? 0.15 : 4; 
        if (player.hp <= 0) {
            gameOver = true;
            alert("Dein Fahrzeug wurde zerstört!");
            location.reload();
        }
    }

    // Daten sammeln (Sonde muss im Pfad liegen)
    if (probe.active) {
        let dp = Math.hypot(tornado.x - probe.x, tornado.y - probe.y);
        if (dp < tornado.size + 50) {
            collectedData += 0.25; 
            if (collectedData >= 100) {
                money += 250 + (tornado.windSpeed / 2);
                collectedData = 0;
                probe.active = false;
            }
        }
    }

    // Kamera folgt dem Spieler (Scrollt das Fenster)
    window.scrollTo(player.x - window.innerWidth / 2, player.y - window.innerHeight / 2);

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
        ctx.fillStyle = 'orange'; ctx.beginPath(); 
        ctx.arc(probe.x, probe.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.stroke();
    }

    // Spieler
    ctx.fillStyle = player.isInterceptor ? '#111' : '#546e7a';
    ctx.fillRect(player.x - 20, player.y - 12, 40, 24);
    
    // HP
    ctx.fillStyle = "black"; ctx.fillRect(player.x-20, player.y-30, 40, 6);
    ctx.fillStyle = "lime"; ctx.fillRect(player.x-20, player.y-30, 40 * (player.hp/player.maxHp), 6);

    // Tornado (schönerer Effekt)
    let g = ctx.createRadialGradient(tornado.x, tornado.y, 10, tornado.x, tornado.y, tornado.size);
    g.addColorStop(0, 'rgba(50,50,50,0.95)');
    g.addColorStop(0.7, 'rgba(100,100,100,0.6)');
    g.addColorStop(1, 'rgba(150,150,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tornado.x, tornado.y, tornado.size, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = "white"; ctx.font = "bold 18px Arial";
    ctx.fillText(tornado.efScale + " (" + tornado.windSpeed + " km/h)", tornado.x - 50, tornado.y - tornado.size - 10);
}

function loop() {
    update(); draw(); requestAnimationFrame(loop);
}
loop();