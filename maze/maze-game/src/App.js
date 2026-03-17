import React, { useEffect, useRef, useState, useCallback } from 'react';

const TILE_SIZE = 64;
const FOV = Math.PI / 3; // 60 degrees field of view

// Map: 1 = wall, 0 = empty
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,1,1,0,0,1],
  [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,1],
  [1,0,1,0,1,1,1,0,1,1,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1],
  [1,1,1,0,0,1,0,1,1,1,1,0,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const MAP_HEIGHT = MAP.length;
const MAP_WIDTH = MAP[0].length;

// Wall colors for variety (based on wall side)
const WALL_COLORS = {
  north: { r: 139, g: 69, b: 19 },   // Brown
  south: { r: 160, g: 82, b: 45 },   // Sienna
  east: { r: 105, g: 105, b: 105 },  // Gray
  west: { r: 128, g: 128, b: 128 },  // Lighter gray
};

export default function WolfensteinMaze() {
  const canvasRef = useRef(null);
  const minimapRef = useRef(null);
  const [screenSize, setScreenSize] = useState({ width: 640, height: 480 });
  
  // Player state
  const playerRef = useRef({
    x: 1.5 * TILE_SIZE,
    y: 1.5 * TILE_SIZE,
    angle: 0,
    speed: 3,
    rotSpeed: 0.05,
  });
  
  const keysRef = useRef({});
  
  // Check if position is walkable
  const isWalkable = useCallback((x, y) => {
    const mapX = Math.floor(x / TILE_SIZE);
    const mapY = Math.floor(y / TILE_SIZE);
    if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) return false;
    return MAP[mapY][mapX] === 0;
  }, []);
  
  // Cast a single ray and return distance to wall
  const castRay = useCallback((rayAngle) => {
    const player = playerRef.current;
    
    // Normalize angle
    rayAngle = rayAngle % (2 * Math.PI);
    if (rayAngle < 0) rayAngle += 2 * Math.PI;
    
    const sin = Math.sin(rayAngle);
    const cos = Math.cos(rayAngle);
    
    // Vertical line intersections (checking x-axis grid lines)
    let vDist = Infinity;
    let vHitX = 0, vHitY = 0;
    
    const stepX = cos > 0 ? TILE_SIZE : -TILE_SIZE;
    const firstX = cos > 0 
      ? Math.floor(player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE
      : Math.floor(player.x / TILE_SIZE) * TILE_SIZE - 0.001;
    
    if (cos !== 0) {
      let x = firstX;
      let y = player.y + (x - player.x) * (sin / cos);
      const deltaY = stepX * (sin / cos);
      
      for (let i = 0; i < 20; i++) {
        const mapX = Math.floor(x / TILE_SIZE);
        const mapY = Math.floor(y / TILE_SIZE);
        
        if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) break;
        
        if (MAP[mapY][mapX] === 1) {
          vDist = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
          vHitX = x;
          vHitY = y;
          break;
        }
        
        x += stepX;
        y += deltaY;
      }
    }
    
    // Horizontal line intersections (checking y-axis grid lines)
    let hDist = Infinity;
    let hHitX = 0, hHitY = 0;
    
    const stepY = sin > 0 ? TILE_SIZE : -TILE_SIZE;
    const firstY = sin > 0
      ? Math.floor(player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE
      : Math.floor(player.y / TILE_SIZE) * TILE_SIZE - 0.001;
    
    if (sin !== 0) {
      let y = firstY;
      let x = player.x + (y - player.y) * (cos / sin);
      const deltaX = stepY * (cos / sin);
      
      for (let i = 0; i < 20; i++) {
        const mapX = Math.floor(x / TILE_SIZE);
        const mapY = Math.floor(y / TILE_SIZE);
        
        if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) break;
        
        if (MAP[mapY][mapX] === 1) {
          hDist = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
          hHitX = x;
          hHitY = y;
          break;
        }
        
        y += stepY;
        x += deltaX;
      }
    }
    
    // Return closest hit
    if (vDist < hDist) {
      return {
        distance: vDist,
        hitX: vHitX,
        hitY: vHitY,
        side: cos > 0 ? 'east' : 'west',
        textureX: vHitY % TILE_SIZE,
      };
    } else {
      return {
        distance: hDist,
        hitX: hHitX,
        hitY: hHitY,
        side: sin > 0 ? 'south' : 'north',
        textureX: hHitX % TILE_SIZE,
      };
    }
  }, []);
  
  // Render the 3D view
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas || !minimap) return;
    
    const ctx = canvas.getContext('2d');
    const minimapCtx = minimap.getContext('2d');
    const { width, height } = screenSize;
    const player = playerRef.current;
    
    // Clear and draw sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height / 2);
    skyGradient.addColorStop(0, '#1a1a2e');
    skyGradient.addColorStop(1, '#16213e');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height / 2);
    
    // Draw floor
    const floorGradient = ctx.createLinearGradient(0, height / 2, 0, height);
    floorGradient.addColorStop(0, '#2d2d2d');
    floorGradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, height / 2, width, height / 2);
    
    // Cast rays and draw walls
    const numRays = width;
    const halfFOV = FOV / 2;
    
    for (let i = 0; i < numRays; i++) {
      const rayAngle = player.angle - halfFOV + (i / numRays) * FOV;
      const hit = castRay(rayAngle);
      
      // Fix fisheye effect
      const correctedDist = hit.distance * Math.cos(rayAngle - player.angle);
      
      // Calculate wall height
      const wallHeight = (TILE_SIZE * height) / correctedDist;
      const wallTop = (height - wallHeight) / 2;
      
      // Get wall color based on side
      const baseColor = WALL_COLORS[hit.side];
      
      // Distance-based shading
      const shade = Math.max(0.2, 1 - correctedDist / 600);
      const r = Math.floor(baseColor.r * shade);
      const g = Math.floor(baseColor.g * shade);
      const b = Math.floor(baseColor.b * shade);
      
      // Draw brick pattern
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(i, wallTop, 1, wallHeight);
      
      // Add simple texture effect (vertical lines)
      if (i % 8 === 0 && wallHeight > 20) {
        ctx.fillStyle = `rgba(0,0,0,0.1)`;
        ctx.fillRect(i, wallTop, 1, wallHeight);
      }
    }
    
    // Draw minimap
    const minimapScale = 6;
    const minimapWidth = MAP_WIDTH * minimapScale;
    const minimapHeight = MAP_HEIGHT * minimapScale;
    
    minimapCtx.fillStyle = '#000';
    minimapCtx.fillRect(0, 0, minimapWidth, minimapHeight);
    
    // Draw map tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (MAP[y][x] === 1) {
          minimapCtx.fillStyle = '#666';
        } else {
          minimapCtx.fillStyle = '#222';
        }
        minimapCtx.fillRect(
          x * minimapScale, 
          y * minimapScale, 
          minimapScale - 1, 
          minimapScale - 1
        );
      }
    }
    
    // Draw player on minimap
    const playerMapX = (player.x / TILE_SIZE) * minimapScale;
    const playerMapY = (player.y / TILE_SIZE) * minimapScale;
    
    minimapCtx.fillStyle = '#0f0';
    minimapCtx.beginPath();
    minimapCtx.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // Draw player direction
    minimapCtx.strokeStyle = '#0f0';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(playerMapX, playerMapY);
    minimapCtx.lineTo(
      playerMapX + Math.cos(player.angle) * 10,
      playerMapY + Math.sin(player.angle) * 10
    );
    minimapCtx.stroke();
    
  }, [screenSize, castRay]);
  
  // Game loop
  useEffect(() => {
    const update = () => {
      const player = playerRef.current;
      const keys = keysRef.current;
      
      // Rotation
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.angle -= player.rotSpeed;
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.angle += player.rotSpeed;
      }
      
      // Movement
      let moveX = 0;
      let moveY = 0;
      
      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        moveX += Math.cos(player.angle) * player.speed;
        moveY += Math.sin(player.angle) * player.speed;
      }
      if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        moveX -= Math.cos(player.angle) * player.speed;
        moveY -= Math.sin(player.angle) * player.speed;
      }
      
      // Strafe
      if (keys['q'] || keys['Q']) {
        moveX += Math.cos(player.angle - Math.PI/2) * player.speed;
        moveY += Math.sin(player.angle - Math.PI/2) * player.speed;
      }
      if (keys['e'] || keys['E']) {
        moveX += Math.cos(player.angle + Math.PI/2) * player.speed;
        moveY += Math.sin(player.angle + Math.PI/2) * player.speed;
      }
      
      // Collision detection with padding
      const padding = 10;
      if (isWalkable(player.x + moveX + (moveX > 0 ? padding : -padding), player.y)) {
        player.x += moveX;
      }
      if (isWalkable(player.x, player.y + moveY + (moveY > 0 ? padding : -padding))) {
        player.y += moveY;
      }
      
      render();
    };
    
    const gameLoop = setInterval(update, 1000 / 60);
    return () => clearInterval(gameLoop);
  }, [render, isWalkable]);
  
  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Initial render
  useEffect(() => {
    render();
  }, [render]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <h1 className="text-2xl font-bold text-gray-100 mb-2 tracking-wider">
        WOLFENSTEIN 3D
      </h1>
      <p className="text-gray-400 text-sm mb-4">
        WASD/Arrows: Move | Q/E: Strafe
      </p>
      
      <div className="relative border-4 border-gray-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={screenSize.width}
          height={screenSize.height}
          className="bg-black"
        />
        
        {/* Minimap overlay */}
        <canvas
          ref={minimapRef}
          width={MAP_WIDTH * 6}
          height={MAP_HEIGHT * 6}
          className="absolute top-2 right-2 border border-green-500 opacity-80"
        />
        
        {/* Gun/Weapon placeholder */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
          <div className="w-16 h-24 bg-gradient-to-t from-gray-600 to-gray-800 rounded-t-lg border-t-2 border-l-2 border-r-2 border-gray-500" />
        </div>
      </div>
      
      {/* Mobile controls */}
      <div className="mt-4 grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button 
          className="bg-gray-700 text-white p-4 rounded active:bg-gray-600"
          onTouchStart={() => keysRef.current['w'] = true}
          onTouchEnd={() => keysRef.current['w'] = false}
        >▲</button>
        <div />
        <button 
          className="bg-gray-700 text-white p-4 rounded active:bg-gray-600"
          onTouchStart={() => keysRef.current['ArrowLeft'] = true}
          onTouchEnd={() => keysRef.current['ArrowLeft'] = false}
        >◀</button>
        <button 
          className="bg-gray-700 text-white p-4 rounded active:bg-gray-600"
          onTouchStart={() => keysRef.current['s'] = true}
          onTouchEnd={() => keysRef.current['s'] = false}
        >▼</button>
        <button 
          className="bg-gray-700 text-white p-4 rounded active:bg-gray-600"
          onTouchStart={() => keysRef.current['ArrowRight'] = true}
          onTouchEnd={() => keysRef.current['ArrowRight'] = false}
        >▶</button>
      </div>
    </div>
  );
}
