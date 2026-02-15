/**
 * STORM CHASER PRO - CORE ENGINE
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Engine Settings
const WORLD_SIZE = { w: 5000, h: 4000 };
let money = 0;
let dataProgress = 0;

// Camera System
const camera = { x: 0, y: 0, zoom: 1 };

// Asset Loader (Placeholder Icons)
const assets = {
    car: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
    interceptor: 'https://cdn-icons-png.flaticon.com/512/2739/2739667.png',
    tornado: 'https://cdn-icons-png.flaticon.com/512/1146/1146860.png'
};

const images = {};
Object.keys(assets).forEach(key => {
    images[key] = new Image();
    images[key].src = assets[key];
});

// Game Objects
const player = {
    x: WORLD_SIZE.w / 2,
    y: WORLD_SIZE.h - 500,
    angle: 0,
    speed: 0,
    maxSpeed: 2.5, // PROFESSIONELL GEDROSSELT
    accel: 0.05,
    isInterceptor: false,
    hp: 100
};

const tornado = {
    x: WORLD_SIZE.w / 2,
    y: -500,
    size: 250,
    speed: 0.4, // SEHR REALISTISCH LANGSAM
    wind: 120,
    scale: "EF1"
};

const roads = [
    { x: 0, y: 1500, w: 5000, h: 140 }, // Main Highway
    { x: 2400, y: 0, w: 140, h: 4000 }  // Meridian Road
];

// Input handling
const keys = {};
window.onkeydown = e => keys[e.key.toLowerCase()] = true;
window.onkeyup = e => keys[e.key.toLowerCase()] = false;

function update() {
    // 1. Physik & Bewegung
    let onRoad = roads.some(r => player.x > r.x && player.x < r.x + r.w && player.y > r.y && player.y < r.y + r.h);
    let targetMax = onRoad ? player.maxSpeed : player.maxSpeed * 0.4;

    if (keys['w']) player.speed = Math.min(player.speed + player.accel, targetMax);
    else if (keys['s']) player.speed = Math.max(player.speed - player.accel, -targetMax/2);
    else player.speed *= 0.95; // Friction

    if (keys['a']) player.angle -= 0.03;
    if (keys['d']) player.angle += 0.03;

    player.x += Math.cos(player.angle - Math.PI/2) * player.speed;
    player.y += Math.sin(player.angle - Math.PI/2) * player.speed;

    // 2. Tornado Logic
    tornado.y += tornado.speed;
    tornado.x += Math.sin(Date.now()/3000) * 0.8;

    // 3. Camera Follow (Smooth Lerp)
    camera.x += (player.x - canvas.width/2 - camera.x) * 0.1;
    camera.y += (player.y - canvas.height/2 - camera.y) * 0.1;

    // 4. Collision & UI
    let dist = Math.hypot(tornado.x - player.x, tornado.y - player.y);
    if (dist < tornado.size/2) {
        player.hp -= player.isInterceptor ? 0.1 : 3;
        if(player.hp <= 0) location.reload();
    }

    if (keys[' ']) { // Data collection while near
        if(dist < tornado.size) {
            dataProgress += 0.5;
            if(dataProgress >= 100) { money += 400; dataProgress = 0; }
        }
    }

    // Update UI DOM
    document.getElementById('money').innerText = `$${Math.floor(money)}`;
    document.getElementById('data-bar').style.width = `${dataProgress}%`;
    const buyBtn = document.getElementById('buyBtn');
    if(money >= 500 && !player.isInterceptor) buyBtn.classList.add('affordable');
}

function draw() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // BACKGROUND: Fields & Grass
    ctx.fillStyle = "#1e2b14";
    ctx.fillRect(0, 0, WORLD_SIZE.w, WORLD_SIZE.h);

    // Draw Realistic Fields
    ctx.fillStyle = "#2d3d1d";
    for(let i=0; i<30; i++) {
        ctx.fillRect((i*800)%WORLD_SIZE.w, (i*600)%WORLD_SIZE.h, 400, 300);
    }

    // ROADS
    ctx.fillStyle = "#222";
    roads.forEach(r => {
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = "#ffd700"; ctx.setLineDash([30, 30]); ctx.lineWidth = 4;
        ctx.beginPath();
        if(r.w > r.h) { ctx.moveTo(r.x, r.y+r.h/2); ctx.lineTo(r.x+r.w, r.y+r.h/2); }
        else { ctx.moveTo(r.x+r.w/2, r.y); ctx.lineTo(r.x+r.w/2, r.y+r.h); }
        ctx.stroke();
    });

    // HOUSES
    for(let i=0; i<25; i++) {
        let hx = (i*900)%WORLD_SIZE.w; let hy = (i*700)%WORLD_SIZE.h;
        ctx.fillStyle = "#443"; ctx.fillRect(hx, hy, 100, 70); // Shadow/Body
        ctx.fillStyle = "#622"; ctx.beginPath(); 
        ctx.moveTo(hx-10, hy); ctx.lineTo(hx+50, hy-40); ctx.lineTo(hx+110, hy); ctx.fill();
    }

    // PLAYER
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.shadowBlur = 15; ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.drawImage(player.isInterceptor ? images.interceptor : images.car, -40, -25, 80, 50);
    ctx.restore();

    // TORNADO
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.translate(tornado.x, tornado.y);
    ctx.rotate(Date.now()/500);
    ctx.drawImage(images.tornado, -tornado.size/2, -tornado.size/2, tornado.size, tornado.size);
    ctx.restore();

    ctx.restore();
}

function buyInterceptor() {
    if(money >= 500) {
        money -= 500; player.isInterceptor = true; player.maxSpeed = 4;
        const btn = document.getElementById('buyBtn');
        btn.innerText = "ACTIVATED"; btn.classList.add('unlocked');
    }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();