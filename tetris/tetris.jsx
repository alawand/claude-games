import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 24;

// NES Tetris exact colors for each piece
const PIECE_COLORS = {
  I: { main: '#00F0F0', light: '#60FFFF', dark: '#009090' },
  O: { main: '#F0F000', light: '#FFFF60', dark: '#909000' },
  T: { main: '#A000F0', light: '#D060FF', dark: '#600090' },
  S: { main: '#00F000', light: '#60FF60', dark: '#009000' },
  Z: { main: '#F00000', light: '#FF6060', dark: '#900000' },
  J: { main: '#0000F0', light: '#6060FF', dark: '#000090' },
  L: { main: '#F0A000', light: '#FFD060', dark: '#906000' },
};

// Classic tetromino shapes
const TETROMINOES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

// NES scoring system
const SCORES = { 1: 40, 2: 100, 3: 300, 4: 1200 };

// NES level speeds (frames per drop) converted to ms
const LEVEL_SPEEDS = [
  800, 717, 633, 550, 467, 383, 300, 217, 133, 100,
  83, 83, 83, 67, 67, 67, 50, 50, 50, 33
];

const createEmptyBoard = () =>
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));

// Korobeiniki (Type A) melody - the classic Tetris theme
const MELODY = [
  { note: 'E5', duration: '4n' },
  { note: 'B4', duration: '8n' },
  { note: 'C5', duration: '8n' },
  { note: 'D5', duration: '4n' },
  { note: 'C5', duration: '8n' },
  { note: 'B4', duration: '8n' },
  { note: 'A4', duration: '4n' },
  { note: 'A4', duration: '8n' },
  { note: 'C5', duration: '8n' },
  { note: 'E5', duration: '4n' },
  { note: 'D5', duration: '8n' },
  { note: 'C5', duration: '8n' },
  { note: 'B4', duration: '4n.' },
  { note: 'C5', duration: '8n' },
  { note: 'D5', duration: '4n' },
  { note: 'E5', duration: '4n' },
  { note: 'C5', duration: '4n' },
  { note: 'A4', duration: '4n' },
  { note: 'A4', duration: '2n' },
  { note: null, duration: '8n' },
  { note: 'D5', duration: '4n' },
  { note: 'F5', duration: '8n' },
  { note: 'A5', duration: '4n' },
  { note: 'G5', duration: '8n' },
  { note: 'F5', duration: '8n' },
  { note: 'E5', duration: '4n.' },
  { note: 'C5', duration: '8n' },
  { note: 'E5', duration: '4n' },
  { note: 'D5', duration: '8n' },
  { note: 'C5', duration: '8n' },
  { note: 'B4', duration: '4n' },
  { note: 'B4', duration: '8n' },
  { note: 'C5', duration: '8n' },
  { note: 'D5', duration: '4n' },
  { note: 'E5', duration: '4n' },
  { note: 'C5', duration: '4n' },
  { note: 'A4', duration: '4n' },
  { note: 'A4', duration: '4n' },
];

const BASS = [
  { note: 'E2', duration: '4n' },
  { note: 'E3', duration: '4n' },
  { note: 'E2', duration: '4n' },
  { note: 'E3', duration: '4n' },
  { note: 'A2', duration: '4n' },
  { note: 'A3', duration: '4n' },
  { note: 'A2', duration: '4n' },
  { note: 'A3', duration: '4n' },
  { note: 'G#2', duration: '4n' },
  { note: 'G#3', duration: '4n' },
  { note: 'G#2', duration: '4n' },
  { note: 'G#3', duration: '4n' },
  { note: 'A2', duration: '4n' },
  { note: 'A3', duration: '4n' },
  { note: 'A2', duration: '4n' },
  { note: 'B2', duration: '4n' },
  { note: 'C3', duration: '4n' },
  { note: 'C4', duration: '4n' },
  { note: 'C3', duration: '4n' },
  { note: 'C4', duration: '4n' },
  { note: 'D3', duration: '4n' },
  { note: 'D4', duration: '4n' },
  { note: 'D3', duration: '4n' },
  { note: 'D4', duration: '4n' },
  { note: 'E3', duration: '4n' },
  { note: 'E4', duration: '4n' },
  { note: 'E3', duration: '4n' },
  { note: 'E4', duration: '4n' },
  { note: 'A2', duration: '4n' },
  { note: 'A3', duration: '4n' },
  { note: 'A2', duration: '2n' },
];

const TetrisBlock = ({ color, x, y, isGhost }) => {
  if (!color) return null;
  const colors = PIECE_COLORS[color];
  
  return (
    <div
      style={{
        position: 'absolute',
        left: x * CELL_SIZE,
        top: y * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE,
        opacity: isGhost ? 0.3 : 1,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.main,
          boxSizing: 'border-box',
          borderTop: `3px solid ${colors.light}`,
          borderLeft: `3px solid ${colors.light}`,
          borderBottom: `3px solid ${colors.dark}`,
          borderRight: `3px solid ${colors.dark}`,
        }}
      >
        <div
          style={{
            width: '40%',
            height: '40%',
            backgroundColor: colors.light,
            opacity: 0.5,
            margin: '15%',
          }}
        />
      </div>
    </div>
  );
};

export default function Tetris() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  const gameRef = useRef(null);
  const dropTimeRef = useRef(null);
  const melodyPartRef = useRef(null);
  const bassPartRef = useRef(null);
  const melodySynthRef = useRef(null);
  const bassSynthRef = useRef(null);
  const sfxSynthRef = useRef(null);

  // Initialize audio
  const initAudio = useCallback(async () => {
    if (audioInitialized) return;
    
    await Tone.start();
    
    // NES-style square wave for melody
    melodySynthRef.current = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 },
      volume: -12,
    }).toDestination();
    
    // Triangle wave for bass (NES style)
    bassSynthRef.current = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1 },
      volume: -15,
    }).toDestination();
    
    // SFX synth
    sfxSynthRef.current = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.05 },
      volume: -10,
    }).toDestination();
    
    // Create melody sequence
    let melodyTime = 0;
    const melodyEvents = MELODY.map(({ note, duration }) => {
      const event = { time: melodyTime, note, duration };
      melodyTime += Tone.Time(duration).toSeconds();
      return event;
    });
    
    melodyPartRef.current = new Tone.Part((time, value) => {
      if (value.note && melodySynthRef.current) {
        melodySynthRef.current.triggerAttackRelease(value.note, value.duration, time);
      }
    }, melodyEvents.map(e => [e.time, e]));
    
    melodyPartRef.current.loop = true;
    melodyPartRef.current.loopEnd = melodyTime;
    
    // Create bass sequence
    let bassTime = 0;
    const bassEvents = BASS.map(({ note, duration }) => {
      const event = { time: bassTime, note, duration };
      bassTime += Tone.Time(duration).toSeconds();
      return event;
    });
    
    bassPartRef.current = new Tone.Part((time, value) => {
      if (value.note && bassSynthRef.current) {
        bassSynthRef.current.triggerAttackRelease(value.note, value.duration, time);
      }
    }, bassEvents.map(e => [e.time, e]));
    
    bassPartRef.current.loop = true;
    bassPartRef.current.loopEnd = bassTime;
    
    Tone.Transport.bpm.value = 140;
    setAudioInitialized(true);
  }, [audioInitialized]);

  const startMusic = useCallback(() => {
    if (!audioInitialized || !musicOn) return;
    Tone.Transport.start();
    if (melodyPartRef.current) melodyPartRef.current.start(0);
    if (bassPartRef.current) bassPartRef.current.start(0);
  }, [audioInitialized, musicOn]);

  const stopMusic = useCallback(() => {
    Tone.Transport.stop();
    if (melodyPartRef.current) melodyPartRef.current.stop();
    if (bassPartRef.current) bassPartRef.current.stop();
  }, []);

  const playLineClear = useCallback(() => {
    if (!sfxSynthRef.current || !musicOn) return;
    const now = Tone.now();
    sfxSynthRef.current.triggerAttackRelease('C6', '16n', now);
    sfxSynthRef.current.triggerAttackRelease('E6', '16n', now + 0.05);
    sfxSynthRef.current.triggerAttackRelease('G6', '16n', now + 0.1);
    sfxSynthRef.current.triggerAttackRelease('C7', '8n', now + 0.15);
  }, [musicOn]);

  const playDrop = useCallback(() => {
    if (!sfxSynthRef.current || !musicOn) return;
    sfxSynthRef.current.triggerAttackRelease('C3', '32n');
  }, [musicOn]);

  const playGameOver = useCallback(() => {
    if (!sfxSynthRef.current || !musicOn) return;
    stopMusic();
    const now = Tone.now();
    sfxSynthRef.current.triggerAttackRelease('E4', '8n', now);
    sfxSynthRef.current.triggerAttackRelease('D4', '8n', now + 0.15);
    sfxSynthRef.current.triggerAttackRelease('C4', '4n', now + 0.3);
  }, [musicOn, stopMusic]);

  // Toggle music
  const toggleMusic = useCallback(() => {
    if (musicOn) {
      stopMusic();
    } else if (gameStarted && !gameOver && !isPaused) {
      startMusic();
    }
    setMusicOn(prev => !prev);
  }, [musicOn, gameStarted, gameOver, isPaused, startMusic, stopMusic]);

  const getRandomPiece = useCallback(() => {
    const pieces = Object.keys(TETROMINOES);
    return pieces[Math.floor(Math.random() * pieces.length)];
  }, []);

  const getRotatedPiece = useCallback((piece, rotations) => {
    let shape = TETROMINOES[piece];
    for (let r = 0; r < rotations % 4; r++) {
      const rows = shape.length;
      const cols = shape[0].length;
      const rotated = [];
      for (let c = 0; c < cols; c++) {
        const newRow = [];
        for (let row = rows - 1; row >= 0; row--) {
          newRow.push(shape[row][c]);
        }
        rotated.push(newRow);
      }
      shape = rotated;
    }
    return shape;
  }, []);

  const [rotation, setRotation] = useState(0);

  const isValidPosition = useCallback((piece, pos, rot, testBoard) => {
    const shape = getRotatedPiece(piece, rot);
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }
          if (newY >= 0 && testBoard[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, [getRotatedPiece]);

  const getGhostPosition = useCallback(() => {
    if (!currentPiece) return null;
    let ghostY = currentPos.y;
    while (isValidPosition(currentPiece, { x: currentPos.x, y: ghostY + 1 }, rotation, board)) {
      ghostY++;
    }
    return { x: currentPos.x, y: ghostY };
  }, [currentPiece, currentPos, rotation, board, isValidPosition]);

  const lockPiece = useCallback(() => {
    const shape = getRotatedPiece(currentPiece, rotation);
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardY = currentPos.y + y;
          const boardX = currentPos.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece;
          }
        }
      }
    }

    let clearedLines = 0;
    const finalBoard = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (newBoard[y].every(cell => cell !== null)) {
        clearedLines++;
      } else {
        finalBoard.push(newBoard[y]);
      }
    }
    
    while (finalBoard.length < BOARD_HEIGHT) {
      finalBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }

    if (clearedLines > 0) {
      playLineClear();
      const newLines = lines + clearedLines;
      const newLevel = Math.floor(newLines / 10);
      setLines(newLines);
      setLevel(newLevel);
      setScore(prev => prev + SCORES[clearedLines] * (level + 1));
    }

    setBoard(finalBoard);
    return finalBoard;
  }, [board, currentPiece, currentPos, rotation, getRotatedPiece, level, lines, playLineClear]);

  const spawnPiece = useCallback((pieceType, testBoard) => {
    const shape = TETROMINOES[pieceType];
    const startX = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
    const startY = 0;

    if (!isValidPosition(pieceType, { x: startX, y: startY }, 0, testBoard)) {
      setGameOver(true);
      playGameOver();
      return false;
    }

    setCurrentPiece(pieceType);
    setCurrentPos({ x: startX, y: startY });
    setRotation(0);
    return true;
  }, [isValidPosition, playGameOver]);

  const startGame = useCallback(async () => {
    await initAudio();
    
    const newBoard = createEmptyBoard();
    setBoard(newBoard);
    setScore(0);
    setLines(0);
    setLevel(0);
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);
    
    const first = getRandomPiece();
    const second = getRandomPiece();
    setNextPiece(second);
    spawnPiece(first, newBoard);
    
    if (musicOn) {
      setTimeout(startMusic, 100);
    }
  }, [getRandomPiece, spawnPiece, initAudio, startMusic, musicOn]);

  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    if (isValidPosition(currentPiece, { x: currentPos.x, y: currentPos.y + 1 }, rotation, board)) {
      setCurrentPos(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      playDrop();
      const newBoard = lockPiece();
      const next = nextPiece;
      setNextPiece(getRandomPiece());
      spawnPiece(next, newBoard);
    }
  }, [currentPiece, currentPos, rotation, board, gameOver, isPaused, isValidPosition, lockPiece, nextPiece, getRandomPiece, spawnPiece, playDrop]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    let dropY = currentPos.y;
    while (isValidPosition(currentPiece, { x: currentPos.x, y: dropY + 1 }, rotation, board)) {
      dropY++;
    }
    setScore(prev => prev + (dropY - currentPos.y) * 2);
    setCurrentPos({ x: currentPos.x, y: dropY });
    playDrop();
    
    setTimeout(() => {
      const shape = getRotatedPiece(currentPiece, rotation);
      const newBoard = board.map(row => [...row]);
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const boardY = dropY + y;
            const boardX = currentPos.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT) {
              newBoard[boardY][boardX] = currentPiece;
            }
          }
        }
      }

      let clearedLines = 0;
      const finalBoard = [];
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        if (newBoard[y].every(cell => cell !== null)) {
          clearedLines++;
        } else {
          finalBoard.push(newBoard[y]);
        }
      }
      
      while (finalBoard.length < BOARD_HEIGHT) {
        finalBoard.unshift(Array(BOARD_WIDTH).fill(null));
      }

      if (clearedLines > 0) {
        playLineClear();
        const newLines = lines + clearedLines;
        const newLevel = Math.floor(newLines / 10);
        setLines(newLines);
        setLevel(newLevel);
        setScore(prev => prev + SCORES[clearedLines] * (level + 1));
      }

      setBoard(finalBoard);
      
      const next = nextPiece;
      setNextPiece(getRandomPiece());
      spawnPiece(next, finalBoard);
    }, 0);
  }, [currentPiece, currentPos, rotation, board, gameOver, isPaused, isValidPosition, getRotatedPiece, lines, level, nextPiece, getRandomPiece, spawnPiece, playDrop, playLineClear]);

  const moveHorizontal = useCallback((dir) => {
    if (!currentPiece || gameOver || isPaused) return;
    const newX = currentPos.x + dir;
    if (isValidPosition(currentPiece, { x: newX, y: currentPos.y }, rotation, board)) {
      setCurrentPos(prev => ({ ...prev, x: newX }));
    }
  }, [currentPiece, currentPos, rotation, board, gameOver, isPaused, isValidPosition]);

  const rotate = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    const newRotation = (rotation + 1) % 4;
    
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (isValidPosition(currentPiece, { x: currentPos.x + kick, y: currentPos.y }, newRotation, board)) {
        setCurrentPos(prev => ({ ...prev, x: prev.x + kick }));
        setRotation(newRotation);
        return;
      }
    }
  }, [currentPiece, currentPos, rotation, board, gameOver, isPaused, isValidPosition]);

  // Handle pause/resume music
  useEffect(() => {
    if (!audioInitialized) return;
    
    if (isPaused || gameOver || !gameStarted) {
      stopMusic();
    } else if (musicOn) {
      startMusic();
    }
  }, [isPaused, gameOver, gameStarted, musicOn, audioInitialized, startMusic, stopMusic]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        toggleMusic();
        return;
      }
      
      if (!gameStarted) {
        if (e.key === 'Enter' || e.key === ' ') {
          startGame();
        }
        return;
      }
      
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setIsPaused(prev => !prev);
        return;
      }
      
      if (gameOver) {
        if (e.key === 'Enter' || e.key === ' ') {
          startGame();
        }
        return;
      }
      
      if (isPaused) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
        case 'd':
          moveHorizontal(1);
          break;
        case 'ArrowDown':
        case 's':
          moveDown();
          setScore(prev => prev + 1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'x':
          rotate();
          break;
        case ' ':
          hardDrop();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, isPaused, moveHorizontal, moveDown, rotate, hardDrop, startGame, toggleMusic]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;
    
    const speed = LEVEL_SPEEDS[Math.min(level, LEVEL_SPEEDS.length - 1)];
    dropTimeRef.current = setInterval(moveDown, speed);
    
    return () => clearInterval(dropTimeRef.current);
  }, [gameStarted, gameOver, isPaused, level, moveDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      if (melodySynthRef.current) melodySynthRef.current.dispose();
      if (bassSynthRef.current) bassSynthRef.current.dispose();
      if (sfxSynthRef.current) sfxSynthRef.current.dispose();
    };
  }, [stopMusic]);

  const ghostPos = getGhostPosition();
  const currentShape = currentPiece ? getRotatedPiece(currentPiece, rotation) : null;

  return (
    <div
      ref={gameRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#000',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        color: '#fff',
      }}
    >
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Main game board */}
        <div
          style={{
            position: 'relative',
            width: BOARD_WIDTH * CELL_SIZE,
            height: BOARD_HEIGHT * CELL_SIZE,
            backgroundColor: '#111',
            border: '4px solid #333',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
          }}
        >
          {/* Grid lines */}
          {Array(BOARD_HEIGHT).fill(null).map((_, y) =>
            Array(BOARD_WIDTH).fill(null).map((_, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  position: 'absolute',
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  border: '1px solid #1a1a1a',
                  boxSizing: 'border-box',
                }}
              />
            ))
          )}
          
          {/* Locked pieces */}
          {board.map((row, y) =>
            row.map((cell, x) =>
              cell && <TetrisBlock key={`${x}-${y}-locked`} color={cell} x={x} y={y} />
            )
          )}
          
          {/* Ghost piece */}
          {currentPiece && ghostPos && currentShape && currentShape.map((row, y) =>
            row.map((cell, x) =>
              cell ? (
                <TetrisBlock
                  key={`ghost-${x}-${y}`}
                  color={currentPiece}
                  x={ghostPos.x + x}
                  y={ghostPos.y + y}
                  isGhost
                />
              ) : null
            )
          )}
          
          {/* Current piece */}
          {currentPiece && currentShape && currentShape.map((row, y) =>
            row.map((cell, x) =>
              cell ? (
                <TetrisBlock
                  key={`current-${x}-${y}`}
                  color={currentPiece}
                  x={currentPos.x + x}
                  y={currentPos.y + y}
                />
              ) : null
            )
          )}
          
          {/* Game Over / Start overlay */}
          {(!gameStarted || gameOver) && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              {gameOver ? (
                <>
                  <div style={{ fontSize: '16px', color: '#F00' }}>GAME OVER</div>
                  <div style={{ fontSize: '10px' }}>Score: {score}</div>
                </>
              ) : (
                <div style={{ fontSize: '14px', color: '#0F0' }}>TETRIS</div>
              )}
              <div style={{ fontSize: '8px', opacity: 0.7 }}>Press ENTER</div>
            </div>
          )}
          
          {/* Pause overlay */}
          {isPaused && !gameOver && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#FF0' }}>PAUSED</div>
            </div>
          )}
        </div>
        
        {/* Side panel */}
        <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Next piece */}
          <div
            style={{
              backgroundColor: '#111',
              border: '4px solid #333',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '8px', marginBottom: '10px', textAlign: 'center' }}>NEXT</div>
            <div
              style={{
                position: 'relative',
                height: '60px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {nextPiece && TETROMINOES[nextPiece].map((row, y) =>
                row.map((cell, x) =>
                  cell ? (
                    <div
                      key={`next-${x}-${y}`}
                      style={{
                        position: 'absolute',
                        left: 20 + x * 18,
                        top: 10 + y * 18,
                        width: 18,
                        height: 18,
                        backgroundColor: PIECE_COLORS[nextPiece].main,
                        border: `2px solid ${PIECE_COLORS[nextPiece].light}`,
                        borderBottomColor: PIECE_COLORS[nextPiece].dark,
                        borderRightColor: PIECE_COLORS[nextPiece].dark,
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : null
                )
              )}
            </div>
          </div>
          
          {/* Score */}
          <div
            style={{
              backgroundColor: '#111',
              border: '4px solid #333',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '8px', marginBottom: '5px' }}>SCORE</div>
            <div style={{ fontSize: '12px', color: '#0F0' }}>{score.toString().padStart(6, '0')}</div>
          </div>
          
          {/* Lines */}
          <div
            style={{
              backgroundColor: '#111',
              border: '4px solid #333',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '8px', marginBottom: '5px' }}>LINES</div>
            <div style={{ fontSize: '12px', color: '#0FF' }}>{lines}</div>
          </div>
          
          {/* Level */}
          <div
            style={{
              backgroundColor: '#111',
              border: '4px solid #333',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '8px', marginBottom: '5px' }}>LEVEL</div>
            <div style={{ fontSize: '12px', color: '#FF0' }}>{level}</div>
          </div>
          
          {/* Music toggle */}
          <div
            onClick={toggleMusic}
            style={{
              backgroundColor: '#111',
              border: '4px solid #333',
              padding: '10px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '8px', color: musicOn ? '#0F0' : '#F00' }}>
              MUSIC {musicOn ? 'ON' : 'OFF'}
            </div>
          </div>
          
          {/* Controls */}
          <div style={{ fontSize: '6px', opacity: 0.6, lineHeight: '1.8' }}>
            <div>← → MOVE</div>
            <div>↓ SOFT DROP</div>
            <div>↑ ROTATE</div>
            <div>SPACE HARD DROP</div>
            <div>P PAUSE</div>
            <div>M MUSIC</div>
          </div>
        </div>
      </div>
    </div>
  );
}
