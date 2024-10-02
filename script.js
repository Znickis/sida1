const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

// Ladda bilder
const catImage = new Image();
catImage.src = 'cat.png';

const dogImage = new Image();
dogImage.src = 'dog.png';

const lightningImage = new Image();
lightningImage.src = 'lightning.png';

const powerUpInvincibleImage = new Image();
powerUpInvincibleImage.src = 'powerup_invincible.png';

const powerUpGiantImage = new Image();
powerUpGiantImage.src = 'powerup_giant.png';

const explosionImage = new Image();
explosionImage.src = 'explosion.png';

// Ladda ljud
const jumpSound = new Audio('jump.mp3');
const deathSound = new Audio('death.mp3');

let player = {
    x: 50,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    dy: 0,
    gravity: 0.8,
    jumpPower: -15,
    maxJump: -20,
    isJumping: false,
    isInvincible: false,
    isGiant: false,
    isHoldingJump: false,
    isAlive: true,
};

let obstacles = [];
let platforms = [];
let powerUps = [];
let explosions = [];
let gameSpeed = 4; // Starta med en snabbare spelhastighet
let score = 0;
let highscore = localStorage.getItem('highscore') || 0;
let gameOver = false;

let highscoreList = JSON.parse(localStorage.getItem('highscoreList')) || [];

document.getElementById('highscore').innerText = highscore;
updateHighscoreList();

// Skapa plattformar
function createPlatform() {
    let platform = {
        x: canvas.width,
        y: Math.random() * (canvas.height - 150) + 200,
        width: Math.random() * 100 + 50,
        height: 20,
    };
    platforms.push(platform);
}

// Skapa hinder (hundar)
function createObstacle() {
    if (obstacles.length >= 2) return; // Begränsa antalet hinder till max 2 på skärmen

    let obstacle = {
        x: canvas.width,
        y: canvas.height - 60,
        width: Math.random() * 40 + 30,
        height: Math.random() * 40 + 30,
    };
    obstacles.push(obstacle);
}

// Skapa power-ups
function createPowerUp() {
    if (powerUps.length >= 2) return; // Begränsa antalet power-ups till max 2 på skärmen

    let powerUpType = Math.random() < 0.5 ? 'invincible' : 'giant';
    let powerUp = {
        x: canvas.width,
        y: Math.random() * (canvas.height - 150) + 100,
        width: 30,
        height: 30,
        type: powerUpType,
    };
    powerUps.push(powerUp);
}

// Skapa explosion
function createExplosion(x, y) {
    let explosion = {
        x: x,
        y: y,
        width: 50,
        height: 50,
        duration: 20, // Varaktighet av explosionen
    };
    explosions.push(explosion);
}

// Kollisionsdetektion
function detectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Hantera spelaren
function updatePlayer() {
    if (!player.isAlive) return;

    if (player.isHoldingJump && player.dy > player.maxJump) {
        player.dy -= 0.2; // Om mellanslag hålls in, ge extra skjuts uppåt
    }

    player.dy += player.gravity;
    player.y += player.dy;

    // Se till att spelaren inte går under marken
    if (player.y + player.height >= canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.isJumping = false;
    }

    ctx.drawImage(catImage, player.x, player.y, player.width, player.height);
}

// Hantera hinder (hundar)
function handleObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];
        obstacle.x -= gameSpeed;

        // Rita hinder
        ctx.drawImage(dogImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Kollision mellan spelaren och hinder
        if (!player.isInvincible && detectCollision(player, obstacle) && player.isAlive) {
            player.isAlive = false;
            deathSound.play();
            createExplosion(player.x, player.y);
            handleGameOver();
        }

        // Ta bort hinder som lämnar skärmen
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
}

// Hantera plattformar
function handlePlatforms() {
    for (let i = 0; i < platforms.length; i++) {
        let platform = platforms[i];
        platform.x -= gameSpeed;

        // Rita plattform
        ctx.fillStyle = '#654321';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Kollision mellan spelaren och plattform
        if (player.dy > 0 && detectCollision(player, platform)) {
            player.y = platform.y - player.height;
            player.dy = 0;
            player.isJumping = false;
        }

        // Ta bort plattformar som lämnar skärmen
        if (platform.x + platform.width < 0) {
            platforms.splice(i, 1);
            i--;
        }
    }
}

// Hantera power-ups
function handlePowerUps() {
    for (let i = 0; i < powerUps.length; i++) {
        let powerUp = powerUps[i];
        powerUp.x -= gameSpeed;

        // Rita power-up
        if (powerUp.type === 'invincible') {
            ctx.drawImage(powerUpInvincibleImage, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        } else if (powerUp.type === 'giant') {
            ctx.drawImage(powerUpGiantImage, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        }

        // Kollision mellan spelaren och power-up
        if (detectCollision(player, powerUp) && player.isAlive) {
            if (powerUp.type === 'invincible') {
                player.isInvincible = true;
                setTimeout(() => player.isInvincible = false, 5000);
            } else if (powerUp.type === 'giant') {
                player.isGiant = true;
                player.width = 80;
                player.height = 80;
                setTimeout(() => {
                    player.isGiant = false;
                    player.width = 40;
                    player.height = 40;
                }, 5000);
            }
            powerUps.splice(i, 1);
            i--;
        }
    }
}

// Hantera explosioner
function handleExplosions() {
    for (let i = 0; i < explosions.length; i++) {
        let explosion = explosions[i];
        ctx.drawImage(explosionImage, explosion.x, explosion.y, explosion.width, explosion.height);
        explosion.duration--;

        // Ta bort explosioner när de är klara
        if (explosion.duration <= 0) {
            explosions.splice(i, 1);
            i--;
        }
    }
}

// Spelets huvudloop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!gameOver) {
        updatePlayer();
        handleObstacles();
        handlePlatforms();
        handlePowerUps();
        handleExplosions();

        // Lägg till nya objekt
        if (obstacles.length < 2 && Math.random() < 0.02) {
            createObstacle();
        }
        if (platforms.length < 2 && Math.random() < 0.02) {
            createPlatform();
        }
        if (powerUps.length < 2 && Math.random() < 0.005) {
            createPowerUp();
        }

        // Uppdatera poäng och öka spelhastigheten
        score++;
        if (score % 100 === 0) {
            gameSpeed += 0.5; // Öka hastigheten var hundrade poäng
        }
        document.getElementById('score').innerText = score;

        requestAnimationFrame(gameLoop);
    }
}

// Hantera spelets slut
function handleGameOver() {
    document.getElementById('gameOverMessage').style.display = 'block';
    gameOver = true;

    // Spara highscore och uppdatera highscorelistan
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('highscore', highscore);
    }
    highscoreList.push(score);
    highscoreList.sort((a, b) => b - a);
    highscoreList = highscoreList.slice(0, 5);  // Behåll topp 5
    localStorage.setItem('highscoreList', JSON.stringify(highscoreList));

    updateHighscoreList();
}

// Uppdatera highscorelistan på sidan
function updateHighscoreList() {
    const highscoreUl = document.getElementById('highscoreUl');
    highscoreUl.innerHTML = '';
    highscoreList.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. Poäng: ${score}`;
        highscoreUl.appendChild(li);
    });
}

// Starta om spelet
function resetGame() {
    player = {
        x: 50,
        y: canvas.height - 60,
        width: 40,
        height: 40,
        dy: 0,
        gravity: 0.8,
        jumpPower: -15,
        maxJump: -20,
        isJumping: false,
        isHoldingJump: false,
        isInvincible: false,
        isGiant: false,
        isAlive: true,
    };
    obstacles = [];
    platforms = [];
    powerUps = [];
    explosions = [];
    gameSpeed = 4; // Återställ startvärdet för spelhastigheten
    score = 0;
    gameOver = false;
    document.getElementById('gameOverMessage').style.display = 'none';
    gameLoop();
}

// Starta spelet
document.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else if (!player.isJumping && player.isAlive) {
            player.isJumping = true;
            player.dy = player.jumpPower;
            player.isHoldingJump = true;  // Håller koll om spelaren håller in knappen
            jumpSound.play();
        }
    }
});

document.addEventListener('keyup', function (e) {
    if (e.code === 'Space') {
        player.isHoldingJump = false;  // När mellanslag släpps
    }
});

gameLoop();
