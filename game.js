// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 700;

let money = 0;
let collectedData = 0;
let gameOver = false;

let player = {
    x: 500, y: 600, 
    speed: 4, 
    isInterceptor: false,
    hp: 100
};

let tornado = {
    x: 500, y: 100,
    size: 40,
    speed: 1,
    windSpeed: 120, // km/h
    efScale: "EF0"
};

let probe = { x: -100, y: -100, active: false };
let keys = {};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
window.addEventListener('keypress', e => { if(e.key === ' ') deployProbe(); });

function deployProbe() {
    if(!probe.active) {
        probe.x = player.x;
        probe.y = player.y;
        probe.active = true;
    }
}

function buyInterceptor() {
    if (money >= 500 && !player.isInterceptor) {
        money -= 500;
        player.isInterceptor = true;
        player.speed = 6;
        player.hp = 500;
        document.getElementById('buyBtn').innerText = "DOMINATOR AKTIV";
        document.getElementById('buyBtn').classList.add('unlocked');
    }
}

function update() {
    if(gameOver) return;

    // Bewegung
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;

    // Tornado Logik
    tornado.x += (Math.random() - 0.5) * 10;
    tornado.y += (Math.random() - 0.5) * 2 + tornado.speed;

    if (tornado.y > canvas.height) respawnTornado();

    // Kollision & Schaden
    let distToTornado = Math.hypot(tornado.x - player.x, tornado.y - player.y);
    if (distToTornado < tornado.size) {
        let damage = player.isInterceptor ? 0.1 : 2;
        player.hp -= damage;
        if (player.hp <= 0) {
            gameOver = true;
            alert("Dein Fahrzeug wurde vom Tornado zerstört! Seite neu laden.");
        }
    }

    // Datensammeln
    if (probe.active) {
        let distToProbe = Math.hypot(tornado.x - probe.x, tornado.y - probe.y);
        if (distToProbe < tornado.size + 20) {
            collectedData += 0.2 * (tornado.windSpeed / 100);
            if (collectedData >= 100) {
                money += 250;
                collectedData = 0;
                probe.active = false;
            }
        }
    }

    updateUI();
}

function respawnTornado() {
    tornado.y = -100;
    tornado.x = Math.random() * canvas.width;
    let roll = Math.random();
    if(roll > 0.9) {
        tornado.efScale = "EF5"; tornado.size = 120; tornado.windSpeed = 450;
    } else if(roll > 0.6) {
        tornado.efScale = "EF2"; tornado.size = 60; tornado.windSpeed = 200;
    } else {
        tornado.efScale = "EF0"; tornado.size = 30; tornado.windSpeed = 110;
    }
}

function updateUI() {
    document.getElementById('money').innerText = Math.floor(money);
    document.getElementById('data').innerText = Math.floor(collectedData);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sonde
    if (probe.active) {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath(); ctx.arc(probe.x, probe.y, 6, 0, Math.PI*2); ctx.fill();
    }

    // Spieler (Auto)
    ctx.fillStyle = player.isInterceptor ? '#222' : '#ccc';
    ctx.fillRect(player.x - 15, player.y - 10, 30, 20);
    // HP Balken
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x - 15, player.y - 20, (player.hp / (player.isInterceptor ? 5 : 1)), 5);

    // Tornado
    let gradient = ctx.createRadialGradient(tornado.x, tornado.y, 5, tornado.x, tornado.y, tornado.size);
    gradient.addColorStop(0, 'rgba(100,100,100,0.9)');
    gradient.addColorStop(1, 'rgba(200,200,200,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(tornado.x, tornado.y, tornado.size, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = "white";
    ctx.fillText(tornado.efScale, tornado.x - 10, tornado.y);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();