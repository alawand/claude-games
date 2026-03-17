const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const SHIP_SPRITES = [
  {
    palette: {
      1: "#78f7ff",
      2: "#00c2ff",
      3: "#ff8ce6",
    },
    shadow: "#6be8ff",
    pattern: [
      "000111000",
      "001222100",
      "012222210",
      "122333221",
      "122333221",
      "012212210",
      "001111100",
      "000101000",
    ],
  },
  {
    palette: {
      1: "#ffe066",
      2: "#ffb347",
      3: "#ff6392",
    },
    shadow: "#ff9a3c",
    pattern: [
      "000110000",
      "001331000",
      "013332100",
      "133333310",
      "133333310",
      "013112100",
      "001111000",
      "011000110",
    ],
  },
  {
    palette: {
      1: "#c3f75a",
      2: "#7de673",
      3: "#4dd599",
    },
    shadow: "#a1ff73",
    pattern: [
      "000111100",
      "001222210",
      "012333321",
      "123333332",
      "123101332",
      "012333321",
      "001202210",
      "011000110",
    ],
  },
];

const state = {
  player: {
    width: 60,
    height: 18,
    x: canvas.width / 2 - 30,
    y: canvas.height - 70,
    speed: 320,
  },
  bullets: [],
  invaders: [],
  invaderDirection: 1,
  invaderSpeed: 45,
  score: 0,
  lastFire: 0,
  cooldown: 300,
  gameStatus: "playing", // "win" | "lose"
};

const INVADER_CONFIG = {
  rows: 5,
  cols: 8,
  width: 44,
  height: 26,
  horizontalGap: 18,
  verticalGap: 18,
  startX: 70,
  startY: 80,
  descendAmount: 18,
};

const keys = {
  left: false,
  right: false,
};

function createInvaders() {
  state.invaders = [];
  for (let row = 0; row < INVADER_CONFIG.rows; row += 1) {
    for (let col = 0; col < INVADER_CONFIG.cols; col += 1) {
      const x =
        INVADER_CONFIG.startX +
        col * (INVADER_CONFIG.width + INVADER_CONFIG.horizontalGap);
      const y =
        INVADER_CONFIG.startY +
        row * (INVADER_CONFIG.height + INVADER_CONFIG.verticalGap);
      const spriteIndex = (row + col) % SHIP_SPRITES.length;
      state.invaders.push({
        x,
        y,
        width: INVADER_CONFIG.width,
        height: INVADER_CONFIG.height,
        spriteIndex,
      });
    }
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function shootBullet(timestamp) {
  if (timestamp - state.lastFire < state.cooldown || state.gameStatus !== "playing") {
    return;
  }
  state.lastFire = timestamp;
  state.bullets.push({
    x: state.player.x + state.player.width / 2 - 2,
    y: state.player.y,
    width: 4,
    height: 16,
    speed: 480,
    active: true,
  });
}

function resetGame() {
  state.player.x = canvas.width / 2 - state.player.width / 2;
  state.bullets = [];
  state.invaderDirection = 1;
  state.invaderSpeed = 45;
  state.score = 0;
  state.lastFire = 0;
  state.gameStatus = "playing";
  createInvaders();
}

function update(delta) {
  if (state.gameStatus !== "playing") {
    return;
  }

  const distance = state.player.speed * delta;
  if (keys.left) {
    state.player.x -= distance;
  }
  if (keys.right) {
    state.player.x += distance;
  }
  state.player.x = clamp(state.player.x, 20, canvas.width - state.player.width - 20);

  state.bullets.forEach((bullet) => {
    bullet.y -= bullet.speed * delta;
    if (bullet.y + bullet.height < 0) {
      bullet.active = false;
    }
  });
  state.bullets = state.bullets.filter((bullet) => bullet.active !== false);

  const speed = state.invaderSpeed * delta * state.invaderDirection;
  let edgeHit = false;
  state.invaders.forEach((invader) => {
    invader.x += speed;
    if (
      (state.invaderDirection === 1 && invader.x + invader.width >= canvas.width - 20) ||
      (state.invaderDirection === -1 && invader.x <= 20)
    ) {
      edgeHit = true;
    }
  });

  if (edgeHit) {
    state.invaderDirection *= -1;
    state.invaderSpeed = Math.min(state.invaderSpeed + 4, 220);
    state.invaders.forEach((invader) => {
      invader.y += INVADER_CONFIG.descendAmount;
      if (invader.y + invader.height >= state.player.y) {
        state.gameStatus = "lose";
      }
    });
  }

  state.bullets.forEach((bullet) => {
    state.invaders.forEach((invader) => {
      if (
        bullet.x < invader.x + invader.width &&
        bullet.x + bullet.width > invader.x &&
        bullet.y < invader.y + invader.height &&
        bullet.y + bullet.height > invader.y
      ) {
        bullet.active = false;
        invader.hit = true;
        state.score += 10;
      }
    });
  });

  state.invaders = state.invaders.filter((invader) => !invader.hit);

  if (state.invaders.length === 0) {
    state.gameStatus = "win";
  }
}

function drawBackground() {
  ctx.fillStyle = "#02040b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  for (let i = 0; i < 40; i += 1) {
    const size = Math.random() * 2;
    const x = (Math.random() * canvas.width) | 0;
    const y = (Math.random() * canvas.height) | 0;
    ctx.fillRect(x, y, size, size);
  }
}

function drawPlayer() {
  ctx.fillStyle = "#32ffc7";
  ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
  ctx.beginPath();
  ctx.moveTo(state.player.x + state.player.width / 2, state.player.y - 12);
  ctx.lineTo(state.player.x + state.player.width / 2 - 12, state.player.y);
  ctx.lineTo(state.player.x + state.player.width / 2 + 12, state.player.y);
  ctx.closePath();
  ctx.fill();
}

function drawBullets() {
  ctx.fillStyle = "#ffed00";
  state.bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawInvaderSprite(invader) {
  const sprite = SHIP_SPRITES[invader.spriteIndex % SHIP_SPRITES.length];
  const rows = sprite.pattern.length;
  const cols = sprite.pattern[0].length;
  const cellWidth = invader.width / cols;
  const cellHeight = invader.height / rows;

  ctx.save();
  ctx.shadowColor = sprite.shadow;
  ctx.shadowBlur = 8;

  sprite.pattern.forEach((row, rowIndex) => {
    [...row].forEach((cell, colIndex) => {
      if (cell === "0") {
        return;
      }
      const color = sprite.palette[cell];
      if (!color) {
        return;
      }
      ctx.fillStyle = color;
      const cellX = invader.x + colIndex * cellWidth;
      const cellY = invader.y + rowIndex * cellHeight;
      ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
    });
  });

  ctx.restore();
}

function drawInvaders() {
  state.invaders.forEach(drawInvaderSprite);
}

function drawHud() {
  ctx.fillStyle = "#e2f5ff";
  ctx.font = "18px Space Mono, 'Courier New', monospace";
  ctx.fillText(`Score: ${state.score}`, 20, 30);
  ctx.fillText(`Invaders: ${state.invaders.length}`, 680, 30);
}

function drawStatusOverlay() {
  if (state.gameStatus === "playing") {
    return;
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Space Mono, 'Courier New', monospace";
  ctx.textAlign = "center";
  const message = state.gameStatus === "win" ? "You saved Earth!" : "Invaders Win";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "20px Space Mono, 'Courier New', monospace";
  ctx.fillText("Press Enter or the button to restart", canvas.width / 2, canvas.height / 2 + 26);
  ctx.textAlign = "left";
}

let lastTime = 0;
function loop(timestamp) {
  const delta = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;
  drawBackground();
  update(delta);
  drawInvaders();
  drawPlayer();
  drawBullets();
  drawHud();
  drawStatusOverlay();
  requestAnimationFrame(loop);
}

function handleKeyDown(e) {
  if (e.code === "ArrowLeft" || e.code === "KeyA") {
    keys.left = true;
  }
  if (e.code === "ArrowRight" || e.code === "KeyD") {
    keys.right = true;
  }
  if (e.code === "Space") {
    e.preventDefault();
    shootBullet(performance.now());
  }
  if (e.code === "Enter" && state.gameStatus !== "playing") {
    resetGame();
  }
}

function handleKeyUp(e) {
  if (e.code === "ArrowLeft" || e.code === "KeyA") {
    keys.left = false;
  }
  if (e.code === "ArrowRight" || e.code === "KeyD") {
    keys.right = false;
  }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
document.getElementById("restart").addEventListener("click", resetGame);

createInvaders();
requestAnimationFrame(loop);
