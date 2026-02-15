const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Riesige Karte (Erweiterte Welt)
canvas.width = 4000;
canvas.height = 3000;

let money = 0;
let collectedData = 0;
let gameOver = false;

// Bilder laden
const imgCar = new Image();
imgCar.src = 'https://cdn-icons-png.flaticon.com/512/744/744465.png'; // Normales SUV
const imgInterceptor = new Image();
imgInterceptor.src = 'https://cdn-icons-png.flaticon.com/512/2739/2739667.png'; // Dominator-Look
const imgTornado = new Image();
imgTornado.src = 'https://cdn-icons-png.flaticon.com/512/1146/1146860.png'; // Tornado-Icon

// Straßen-Netzwerk (viele Straßen für Realismus)
const roads = [
    {x: 0, y: 1500, w: 4000, h: 120}, // Ost-West Highway
    {x: 2000, y: 0, w: 120, h: 3000}, // Nord-Süd Highway
    {x: 0, y: 500, w: 2000, h: 60},   // Feldweg 1
    {x: 2000, y: 2500, w: 2000, h: 60} // Feldweg 2
];

let player = {
    x: 2050, y: 2800,
    baseMaxSpeed: 3, 
    isInterceptor: false,
    hp: 100, maxHp: 100,
    width: 60, height: 35
};

let tornado = {
    x: 2000, y: -500,
    size: 150,
    speed: 0.3, // EXTREM LANGSAM
    windSpeed: 110,
    efScale: "EF0"
};

let probe = { x: -100, y: -100, active: false };
let keys = {};

window.onkeydown = e => keys[e.key.toLowerCase()] = true;
window.onkeyup = e => keys[e.key.toLowerCase()] = false;
window.onkeypress = e => { if(e.code === 'Space') deployProbe(); };

function deployProbe() {
    if(!probe.active) { probe.x = player.x; probe.y = player.y; probe.active = true; }
}

function buyInterceptor() {
    if (money >= 500 && !player.isInterceptor) {
        money -= 500;
        player.isInterceptor = true;
        player.baseMaxSpeed = 4.5;
        player.hp = 800; player.maxHp = 800;
        const btn = document.getElementById('buyBtn');
        btn.innerText = "DOMINATOR AKTIV";
        btn.classList.add('unlocked');
    }
}

function drawMap() {
    // Realistischeres Gras (Dunkles Grün)
    ctx.fillStyle = "#1e2b14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Asphalt-Straßen mit Mittelstreifen
    ctx.fillStyle = "#333";
    roads.forEach(r => {
        ctx.fillRect(r.x, r.y, r.w, r.h);
        // Mittelstreifen
        ctx.strokeStyle = "#ffd700";
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        if(r.w > r.h) { ctx.moveTo(r.x, r.y+r.h/2); ctx.lineTo(r.x+r.w, r.y+r.h/2); }
        else { ctx.moveTo(r.x+r.w/2, r.y); ctx.lineTo(r.x+r.w/2, r.y+r.h); }
        ctx.stroke();
    });

    // Viele Häuser für Realismus
    for(let i=0; i<30; i++) {
        drawRealisticHouse(500 + (i*600)%3000, 300 + (i*450)%2500);
    }
}

function drawRealisticHouse(x, y) {
    ctx.fillStyle = "#444"; ctx.fillRect(x, y, 80, 60); // Wand
    ctx.fillStyle = "#222"; ctx.fillRect(x+20, y+20, 15, 15); // Fenster
    ctx.fillStyle = "#600"; ctx.beginPath(); // Dach
    ctx.moveTo(x-10, y); ctx.lineTo(x+40, y-40); ctx.lineTo(x+90, y); ctx.fill();
}

function update() {
    if(gameOver) return;

    let onRoad = roads.some(r => player.x > r.x && player.x < r.x+r.w && player.y > r.y && player.y < r.y+r.h);
    let speed = onRoad ? player.baseMaxSpeed : player.baseMaxSpeed * 0.4;

    if (keys['w']) player.y -= speed;
    if (keys['s']) player.y += speed;
    if (keys['a']) player.x -= speed;
    if (keys['d']) player.x += speed;

    // Tornado-KI
    tornado.y += tornado.speed;
    tornado.x += Math.sin(Date.now()/2000) * 0.5;

    if (tornado.y > canvas.height + 500) {
        tornado.y = -500;
        tornado.x = 500 + Math.random() * 3000;
        tornado.efScale = Math.random() > 0.8 ? "EF5" : "EF1";
        tornado.size = tornado.efScale === "EF5" ? 300 : 120;
        tornado.speed = 0.2 + Math.random() * 0.3;
    }

    // Kamera-Fix: Folgt dem Auto
    const viewport = document.getElementById('game-viewport');
    viewport.scrollLeft = player.x - window.innerWidth / 2;
    viewport.scrollTop = player.y - window.innerHeight / 2;

    // Kollision
    let dist = Math.hypot(tornado.x - player.x, tornado.y - player.y);
    if (dist < tornado.size/2) {
        player.hp -= player.isInterceptor ? 0.1 : 5;
        if(player.hp <= 0) { alert("Das Fahrzeug wurde vernichtet!"); location.reload(); }
    }

    // Daten sammeln
    if (probe.active) {
        let pDist = Math.hypot(tornado.x - probe.x, tornado.y - probe.y);
        if (pDist < tornado.size) {
            collectedData += 0.5;
            if (collectedData >= 100) { money += 400; collectedData = 0; probe.active = false; }
        }
    }

    document.getElementById('money').innerText = Math.floor(money);
    document.getElementById('data').innerText = Math.floor(collectedData);
    if(money >= 500 && !player.isInterceptor) document.getElementById('buyBtn').classList.add('affordable');
}

function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    drawMap();

    // Sonde
    if(probe.active) {
        ctx.fillStyle = "red"; ctx.beginPath(); ctx.arc(probe.x, probe.y, 10, 0, 7); ctx.fill();
        ctx.fillStyle = "white"; ctx.fillRect(probe.x-2, probe.y-15, 4, 15); // Antenne
    }

    // Spieler-Auto (Bild statt Rechteck)
    const activeImg = player.isInterceptor ? imgInterceptor : imgCar;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.drawImage(activeImg, -player.width/2, -player.height/2, player.width, player.height);
    ctx.restore();

    // HP Balken
    ctx.fillStyle = "red"; ctx.fillRect(player.x-30, player.y-40, 60, 8);
    ctx.fillStyle = "lime"; ctx.fillRect(player.x-30, player.y-40, 60 * (player.hp/player.maxHp), 8);

    // Tornado (Bild + Effekt)
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.drawImage(imgTornado, tornado.x - tornado.size/2, tornado.y - tornado.size/2, tornado.size, tornado.size);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "white"; ctx.font = "bold 24px Arial"; ctx.fillText(tornado.efScale, tornado.x-20, tornado.y-tornado.size/2);
    ctx.restore();
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();