"use strict";

/* ---------------- DOM ---------------- */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const gameUI = document.getElementById("gameUI");

const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const diffText = document.getElementById("difficultyText");
const leaderboardEl = document.getElementById("leaderboard");

const startBtn = document.getElementById("startBtn");
const difficultySelect = document.getElementById("difficultySelect");

/* ---------------- GAME STATE ---------------- */
let score = 0;
let timeSurvived = 0;
let enemySpeed = 4;
let gameOver = false;
let shieldActive = false;
let timeStopped = false;
let timerInterval;

/* ---------------- OBJECTS ---------------- */
const player = { x: 185, y: 480, size: 30, color: "#00d2ff" };
const enemy = { x: Math.random() * 370, y: -40, size: 30 };
let powerups = [];

/* ---------------- INIT ---------------- */
startBtn.addEventListener("click", startGame);
canvas.addEventListener("mousemove", movePlayer);

updateLeaderboard();

/* ---------------- GAME FLOW ---------------- */
function startGame() {
    menu.hidden = true;
    gameUI.hidden = false;
    setDifficulty();
    startTimer();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    clearInterval(timerInterval);
    saveScore();
    alert(`Game Over!\nScore: ${score}\nTime: ${timeSurvived}s`);
    location.reload();
}

/* ---------------- DIFFICULTY ---------------- */
function setDifficulty() {
    const diff = difficultySelect.value;

    const map = {
        easy:    { speed: 4, color: "#00ff88" },
        medium:  { speed: 6, color: "#ffa500" },
        hard:    { speed: 8, color: "#ff4d4d" },
        expert:  { speed: 10, color: "#ff00ff" }
    };

    enemySpeed = map[diff].speed;
    diffText.textContent = diff.toUpperCase();
    diffText.style.color = map[diff].color;
}

/* ---------------- TIMER ---------------- */
function startTimer() {
    timerInterval = setInterval(() => {
        if (!gameOver) {
            timeSurvived++;
            timerEl.textContent = timeSurvived;
        }
    }, 1000);
}

/* ---------------- GAME LOOP ---------------- */
function gameLoop() {
    if (gameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    drawEnemy();
    updatePowerups();
    detectCollision();

    requestAnimationFrame(gameLoop);
}

/* ---------------- DRAW ---------------- */
function drawPlayer() {
    ctx.fillStyle = shieldActive ? "#ff4757" : player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
}

function drawEnemy() {
    ctx.fillStyle = "#e94560";
    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

    if (!timeStopped) enemy.y += enemySpeed;

    if (enemy.y > canvas.height) {
        enemy.y = -40;
        enemy.x = Math.random() * 370;
        score++;
        scoreEl.textContent = score;
    }
}

/* ---------------- POWERUPS ---------------- */
setInterval(() => {
    if (!gameOver) spawnPowerup();
}, 8000);

function spawnPowerup() {
    const types = ["shield", "freeze", "score"];
    powerups.push({
        x: Math.random() * 370,
        y: -20,
        size: 20,
        type: types[Math.floor(Math.random() * types.length)]
    });
}

function updatePowerups() {
    powerups.forEach(p => {
        p.y += 3;
        ctx.fillStyle =
            p.type === "shield" ? "red" :
            p.type === "freeze" ? "blue" : "yellow";

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();

        if (collision(player, p)) activatePowerup(p);
    });

    powerups = powerups.filter(p => p.y < canvas.height);
}

function activatePowerup(p) {
    if (p.type === "shield") shieldActive = true;
    if (p.type === "freeze") {
        timeStopped = true;
        setTimeout(() => timeStopped = false, 3000);
    }
    if (p.type === "score") {
        score += 5;
        scoreEl.textContent = score;
    }
    powerups.splice(powerups.indexOf(p), 1);
}

/* ---------------- COLLISION ---------------- */
function detectCollision() {
    if (collision(player, enemy)) {
        if (shieldActive) {
            shieldActive = false;
            enemy.y = -40;
        } else {
            endGame();
        }
    }
}

function collision(a, b) {
    return (
        a.x < b.x + b.size &&
        a.x + a.size > b.x &&
        a.y < b.y + b.size &&
        a.y + a.size > b.y
    );
}

/* ---------------- CONTROLS ---------------- */
function movePlayer(e) {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.size / 2;
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
}

/* ---------------- LEADERBOARD ---------------- */
function saveScore() {
    let scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
    scores.push(score);
    scores.sort((a, b) => b - a);
    scores = scores.slice(0, 5);
    localStorage.setItem("leaderboard", JSON.stringify(scores));
}

function updateLeaderboard() {
    leaderboardEl.innerHTML = "";
    const scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
    scores.forEach((s, i) => {
        const li = document.createElement("li");
        li.textContent = `#${i + 1} – ${s}`;
        leaderboardEl.appendChild(li);
    });
}