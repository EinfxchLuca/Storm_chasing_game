const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DIE KARTE IST JETZT VIEL GRÖSSER
canvas.width = 2500;
canvas.height = 1800;

let money = 0;
let collectedData = 0;
let gameOver = false;

// Straßen-Definitionen für die große Karte
const roadWidth = 100;
const horizontalRoadY = 800;
const verticalRoadX = 1200;

let player = {
    x: 1250, 
    y: 1600, 
    speed: 0,
    baseMaxSpeed: 2.5, // Langsames, realistisches Fahren
    isInterceptor: false,
    hp: 100,
    maxHp: 100
};

let tornado = {
    x: 1250, 
    y: -300,
    size: 60,
    speed: 0.5, // Der Tornado zieht sehr langsam und bedrohlich
    windSpeed: 110,
    efScale: "EF0"
};

let probe = { x: -100, y: -100, active: false };
let keys = {};

// Steuerung
window.addEventListener('keydown', function(e) {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', function(e) {
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener('keypress', function(e) {
    if(e.code === 'Space') {
        deployProbe();
    }
});

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
    // 1. Grasfläche
    ctx.fillStyle = "#3e4a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Straßen (Feldwege)
    ctx.fillStyle = "#7a6652";
    // Horizontaler Weg
    ctx.fillRect(0, horizontalRoadY, canvas.width, roadWidth);
    // Vertikaler Weg
    ctx.fillRect(verticalRoadX, 0, roadWidth, canvas.height);

    // 3. Häuser auf der Karte verteilen
    drawHouse(400, 400);
    drawHouse(1800, 500);
    drawHouse(600, 1200);
    drawHouse(2000, 1400);
}

function drawHouse(x, y) {
    ctx.fillStyle = "#5d4037"; 
    ctx.fillRect(x, y, 60, 45); // Hauswand
    ctx.fillStyle = "#b71c1c"; 
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 30, y - 30);
    ctx.lineTo(x + 65, y);
    ctx.fill();
}

function respawnTornado() {
    tornado.y = -400;
    tornado.x = 300 + Math.random() * 1900;
    
    let randomRoll = Math.random();
    if(randomRoll > 0.9) {
        tornado.efScale = "EF5"; 
        tornado.size = 160; 
        tornado.windSpeed = 460; 
        tornado.speed = 0.7;
    } else if(randomRoll > 0.6) {
        tornado.efScale = "EF2"; 
        tornado.size = 85; 
        tornado.windSpeed = 200; 
        tornado.speed = 0.55;
    } else {
        tornado.efScale = "EF0"; 
        tornado.size = 55; 
        tornado.windSpeed = 110; 
        tornado.speed = 0.45;
    }
}

function update() {
    if(gameOver) return;

    // PRÜFEN: Ist der Spieler auf der Straße?
    let onHorizontalRoad = (player.y > horizontalRoadY && player.y < horizontalRoadY + roadWidth);
    let onVerticalRoad = (player.x > verticalRoadX && player.x < verticalRoadX + roadWidth);
    
    let currentMaxSpeed = (onHorizontalRoad || onVerticalRoad) ? player.baseMaxSpeed : player.baseMaxSpeed * 0.4;
    
    // Bewegung des Spielers
    if (keys['w'] || keys['arrowup']) player.y -= currentMaxSpeed;
    if (keys['s'] || keys['arrowdown']) player.y += currentMaxSpeed;
    if (keys['a'] || keys['arrowleft']) player.x -= currentMaxSpeed;
    if (keys['d'] || keys['arrowright']) player.x += currentMaxSpeed;

    // Tornado-Logik
    tornado.y += tornado.speed;
    tornado.x += Math.sin(Date.now() / 1500) * 1; // Sanftes Pendeln

    if (tornado.y > canvas.height + 400) {
        respawnTornado();
    }

    // Kollisionsprüfung (Spieler im Tornado?)
    let distanceToTornado = Math.hypot(tornado.x - player.x, tornado.y - player.y);
    if (distanceToTornado < tornado.size) {
        let damageAmount = player.isInterceptor ? 0.12 : 3.5;
        player.hp -= damageAmount;
        if (player.hp <= 0) {
            gameOver = true;
            alert("Dein Fahrzeug wurde vom Tornado zerstört!");
            location.reload();
        }
    }

    // Datensammeln mit der Sonde
    if (probe.active) {
        let distanceToProbe = Math.hypot(tornado.x - probe.x, tornado.y - probe.y);
        if (distanceToProbe < tornado.size + 40) {
            collectedData += 0.35;
            if (collectedData >= 100) {
                money += 300 + (tornado.windSpeed / 2);
                collectedData = 0;
                probe.active = false;
            }
        }
    }

    // KAMERA-STEUERUNG: Das Browser-Fenster scrollt zum Spieler
    window.scrollTo(
        player.x - window.innerWidth / 2, 
        player.y - window.innerHeight / 2
    );

    updateUI();
}

function updateUI() {
    document.getElementById('money').innerText = Math.floor(money);
    document.getElementById('data').innerText = Math.floor(collectedData);
    
    const btn = document.getElementById('buyBtn');
    if(money >= 500 && !player.isInterceptor) {
        btn.classList.add('affordable');
    }
}

function draw() {
    // 1. Hintergrund zeichnen
    drawBackground();

    // 2. Sonde zeichnen
    if (probe.active) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(probe.x, probe.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();
    }

    // 3. Spieler zeichnen
    ctx.fillStyle = player.isInterceptor ? '#111111' : '#3498db';
    ctx.fillRect(player.x - 20, player.y - 12, 40, 24);
    
    // HP-Balken
    ctx.fillStyle = "red";
    ctx.fillRect(player.x - 20, player.y - 25, 40, 6);
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x - 20, player.y - 25, 40 * (player.hp / player.maxHp), 6);

    // 4. Tornado zeichnen
    let tornadoGradient = ctx.createRadialGradient(tornado.x, tornado.y, 10, tornado.x, tornado.y, tornado.size);
    tornadoGradient.addColorStop(0, 'rgba(60, 60, 60, 1)');
    tornadoGradient.addColorStop(0.7, 'rgba(100, 100, 100, 0.7)');
    tornadoGradient.addColorStop(1, 'rgba(150, 150, 150, 0)');
    
    ctx.fillStyle = tornadoGradient;
    ctx.beginPath();
    ctx.arc(tornado.x, tornado.y, tornado.size, 0, Math.PI * 2);
    ctx.fill();

    // Info-Text am Tornado
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.fillText(tornado.efScale, tornado.x - 20, tornado.y + 10);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();