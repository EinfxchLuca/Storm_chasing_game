const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WORLD = { w: 5000, h: 4000 };
let money = 0;
let dataProgress = 0;

// Assets (Top-Down Perspektive)
const images = {
    car: new Image(),
    dominator: new Image(),
    tornado: new Image()
};
images.car.src = 'https://cdn-icons-png.flaticon.com/512/3085/3085330.png'; // Top-down SUV
images.dominator.src = 'https://cdn-icons-png.flaticon.com/512/804/804246.png'; // Top-down Armored
images.tornado.src = 'https://cdn-icons-png.flaticon.com/512/2316/2316631.png'; // Wirbel-Optik

// Spielobjekte
let player = {
    x: WORLD.w/2, y: WORLD.h-500,
    angle: 0, speed: 0,
    maxSpeed: 2.8, accel: 0.04,
    isInterceptor: false, hp: 100
};

let tornado = {
    x: WORLD.w/2, y: -800,
    size: 150, speed: 0.3,
    ef: 0, wind: 110
};

// Generiere Häuser mit Zerstörungs-Status
let houses = [];
for(let i=0; i<60; i++) {
    houses.push({
        x: Math.random() * WORLD.w,
        y: Math.random() * WORLD.h,
        alive: true,
        size: 80 + Math.random() * 40
    });
}

const camera = { x: 0, y: 0 };
const keys = {};
window.onkeydown = e => keys[e.key.toLowerCase()] = true;
window.onkeyup = e => keys[e.key.toLowerCase()] = false;

function respawnTornado() {
    tornado.y = -1000;
    tornado.x = 500 + Math.random() * (WORLD.w - 1000);
    const roll = Math.random();
    if(roll > 0.8) { tornado.ef = 5; tornado.size = 500; tornado.wind = 450; tornado.speed = 0.2; }
    else if(roll > 0.5) { tornado.ef = 3; tornado.size = 280; tornado.wind = 250; tornado.speed = 0.3; }
    else { tornado.ef = 0; tornado.size = 120; tornado.wind = 115; tornado.speed = 0.4; }
}

function update() {
    // Steuerung (Top-Down Physics)
    if (keys['w']) player.speed = Math.min(player.speed + player.accel, player.maxSpeed);
    else if (keys['s']) player.speed = Math.max(player.speed - player.accel, -player.maxSpeed/2);
    else player.speed *= 0.96;

    if (keys['a']) player.angle -= 0.035;
    if (keys['d']) player.angle += 0.035;

    player.x += Math.cos(player.angle - Math.PI/2) * player.speed;
    player.y += Math.sin(player.angle - Math.PI/2) * player.speed;

    // Tornado Bewegung
    tornado.y += tornado.speed;
    if(tornado.y > WORLD.h + 1000) respawnTornado();

    // Zerstörung von Häusern
    houses.forEach(h => {
        if(h.alive && tornado.ef >= 3) {
            let d = Math.hypot(tornado.x - h.x, tornado.y - h.y);
            if(d < tornado.size * 0.6) h.alive = false; // Haus wird weggerissen
        }
    });

    // Kamera folgt Spieler
    camera.x = player.x - canvas.width/2;
    camera.y = player.y - canvas.height/2;

    // Daten sammeln (Leertaste halten im Radius)
    let dist = Math.hypot(tornado.x - player.x, tornado.y - player.y);
    if(keys[' '] && dist < tornado.size) {
        dataProgress += 0.3;
        if(dataProgress >= 100) { money += 300 + (tornado.ef * 100); dataProgress = 0; }
    }

    // UI
    document.getElementById('money').innerText = `$${Math.floor(money)}`;
    document.getElementById('data-bar').style.width = `${dataProgress}%`;
    const btn = document.getElementById('buyBtn');
    if(money >= 500 && !player.isInterceptor) btn.classList.add('affordable');
}

function draw() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Welt-Boden
    ctx.fillStyle = "#15200b"; ctx.fillRect(0,0, WORLD.w, WORLD.h);

    // Häuser zeichnen
    houses.forEach(h => {
        if(h.alive) {
            ctx.fillStyle = "#5c4033"; ctx.fillRect(h.x, h.y, h.size, h.size); // Haus
            ctx.fillStyle = "#3e2723"; ctx.fillRect(h.x+10, h.y-10, h.size-20, 10); // Dachansatz
        } else {
            ctx.fillStyle = "#333"; // Ruinen
            ctx.beginPath(); ctx.arc(h.x + h.size/2, h.y + h.size/2, h.size/3, 0, 7); ctx.fill();
        }
    });

    // Spieler (Top-Down)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(player.isInterceptor ? images.dominator : images.car, -40, -40, 80, 80);
    ctx.restore();

    // Tornado (Skaliert nach EF-Stärke)
    ctx.save();
    ctx.translate(tornado.x, tornado.y);
    ctx.rotate(Date.now() / 200);
    ctx.globalAlpha = 0.7;
    ctx.drawImage(images.tornado, -tornado.size/2, -tornado.size/2, tornado.size, tornado.size);
    ctx.restore();

    // EF Label am Tornado
    ctx.fillStyle = "white"; ctx.font = "bold 30px Arial";
    ctx.fillText("EF" + tornado.ef, tornado.x - 30, tornado.y - tornado.size/2 - 20);

    ctx.restore();
}

function buyInterceptor() {
    if(money >= 500) {
        money -= 500; player.isInterceptor = true; player.maxSpeed = 4.2;
        document.getElementById('buyBtn').innerText = "DOMINATOR ACTIVE";
        document.getElementById('buyBtn').className = "unlocked";
    }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();