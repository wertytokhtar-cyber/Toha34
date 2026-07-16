import { useCallback, useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };
type Snake3DProps = { onBack: () => void };
const SIZE = 16;

export function Snake3D({ onBack }: Snake3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>([{ x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }]);
  const directionRef = useRef<Point>({ x: 1, y: 0 });
  const nextDirectionRef = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef<Point>({ x: 11, y: 8 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const project = (x: number, y: number, z = 0) => ({ x: 450 + (x - y) * 25, y: 70 + (x + y) * 12 - z });

  const drawCube = useCallback((context: CanvasRenderingContext2D, point: Point, height: number, head: boolean) => {
    const p = project(point.x, point.y, height), floor = project(point.x, point.y);
    context.beginPath(); context.moveTo(p.x, p.y - 12); context.lineTo(p.x + 25, p.y); context.lineTo(p.x, p.y + 12); context.lineTo(p.x - 25, p.y); context.closePath();
    context.fillStyle = head ? '#b8ff64' : '#65c94f'; context.fill(); context.strokeStyle = '#173b25'; context.stroke();
    context.beginPath(); context.moveTo(p.x - 25, p.y); context.lineTo(p.x, p.y + 12); context.lineTo(floor.x, floor.y + 12); context.lineTo(floor.x - 25, floor.y); context.closePath(); context.fillStyle = '#286e3d'; context.fill();
    context.beginPath(); context.moveTo(p.x + 25, p.y); context.lineTo(p.x, p.y + 12); context.lineTo(floor.x, floor.y + 12); context.lineTo(floor.x + 25, floor.y); context.closePath(); context.fillStyle = '#3d9447'; context.fill();
    if (head) { context.fillStyle = '#14291d'; context.beginPath(); context.arc(p.x - 7, p.y - 2, 3, 0, 7); context.arc(p.x + 7, p.y + 3, 3, 0, 7); context.fill(); }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current, context = canvas?.getContext('2d'); if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height); gradient.addColorStop(0, '#183249'); gradient.addColorStop(1, '#07131f'); context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
    for (let x = 0; x <= SIZE; x++) for (let y = 0; y <= SIZE; y++) { const p = project(x, y); context.fillStyle = (x + y) % 2 ? '#29495a' : '#315769'; context.beginPath(); context.moveTo(p.x, p.y - 12); context.lineTo(p.x + 25, p.y); context.lineTo(p.x, p.y + 12); context.lineTo(p.x - 25, p.y); context.closePath(); context.fill(); }
    const food = project(foodRef.current.x, foodRef.current.y, 22); context.fillStyle = '#ff4f47'; context.shadowColor = '#ff3d36'; context.shadowBlur = 22; context.beginPath(); context.arc(food.x, food.y, 12, 0, 7); context.fill(); context.shadowBlur = 0;
    [...snakeRef.current].reverse().forEach((part, index, array) => drawCube(context, part, 24, index === array.length - 1));
  }, [drawCube]);

  const restart = () => { snakeRef.current = [{ x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }]; directionRef.current = { x: 1, y: 0 }; nextDirectionRef.current = { x: 1, y: 0 }; foodRef.current = { x: 11, y: 8 }; setScore(0); setGameOver(false); };

  useEffect(() => {
    const key = (event: KeyboardEvent) => { const directions: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 } }; const next = directions[event.code]; if (next && !(next.x === -directionRef.current.x && next.y === -directionRef.current.y)) nextDirectionRef.current = next; };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);

  useEffect(() => { draw(); if (gameOver) return; const timer = window.setInterval(() => { directionRef.current = nextDirectionRef.current; const head = snakeRef.current[0], next = { x: head.x + directionRef.current.x, y: head.y + directionRef.current.y }; if (next.x < 0 || next.y < 0 || next.x >= SIZE || next.y >= SIZE || snakeRef.current.some((part) => part.x === next.x && part.y === next.y)) { setGameOver(true); return; } const body = [next, ...snakeRef.current]; if (next.x === foodRef.current.x && next.y === foodRef.current.y) { setScore((value) => value + 1); foodRef.current = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) }; } else body.pop(); snakeRef.current = body; draw(); }, Math.max(65, 150 - score * 4)); return () => window.clearInterval(timer); }, [draw, gameOver, score]);

  return <main className="snake-page"><header><button onClick={onBack}>← НАЗАД</button><h1>ЗМЕЙКА 3D</h1><b>СЧЁТ: {score}</b></header><canvas ref={canvasRef} width="900" height="520" />{gameOver && <div className="snake-over"><h2>ИГРА ОКОНЧЕНА</h2><button onClick={restart}>ЕЩЁ РАЗ</button></div>}<p>Управление: WASD или стрелки</p></main>;
}
