import { useCallback, useEffect, useRef, useState } from 'react';

type UnitKind = 'guard' | 'archer' | 'brute' | 'mage';
type Unit = { id: number; side: 'blue' | 'red'; kind: UnitKind; x: number; y: number; hp: number; cooldown: number };
type Card = { name: string; cost: number; hp: number; speed: number; damage: number; range: number; color: string };
type CastleDuelProps = { onBack: () => void };

const CARDS: Record<UnitKind, Card> = {
  guard: { name: 'Страж', cost: 3, hp: 180, speed: 38, damage: 28, range: 28, color: '#5f9dea' },
  archer: { name: 'Лучница', cost: 3, hp: 105, speed: 32, damage: 22, range: 115, color: '#74c77a' },
  brute: { name: 'Громила', cost: 5, hp: 390, speed: 20, damage: 48, range: 32, color: '#d88954' },
  mage: { name: 'Искра', cost: 4, hp: 125, speed: 27, damage: 38, range: 95, color: '#a87ae3' },
};

export function CastleDuel({ onBack }: CastleDuelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const units = useRef<Unit[]>([]);
  const towerHp = useRef({ blue: 1200, red: 1200 });
  const nextId = useRef(1);
  const blueMana = useRef(5);
  const redMana = useRef(5);
  const [mana, setMana] = useState(5);
  const [selected, setSelected] = useState<UnitKind>('guard');
  const [seconds, setSeconds] = useState(150);
  const [result, setResult] = useState('');

  const deploy = useCallback((side: 'blue' | 'red', kind: UnitKind, lane: number) => {
    const card = CARDS[kind], pool = side === 'blue' ? blueMana : redMana;
    if (pool.current < card.cost || result) return;
    pool.current -= card.cost; if (side === 'blue') setMana(pool.current);
    units.current.push({ id: nextId.current++, side, kind, x: side === 'blue' ? 150 : 750, y: lane ? 350 : 170, hp: card.hp, cooldown: 0 });
  }, [result]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return;
    const field = ctx.createLinearGradient(0, 0, 0, 520); field.addColorStop(0, '#8bd17d'); field.addColorStop(1, '#397854'); ctx.fillStyle = field; ctx.fillRect(0, 0, 900, 520);
    for (let x = 0; x < 900; x += 30) for (let y = 0; y < 520; y += 28) { ctx.fillStyle = (x + y) % 3 ? '#ffffff08' : '#173e2511'; ctx.fillRect(x, y, 15, 8); }
    const river = ctx.createLinearGradient(0, 235, 0, 285); river.addColorStop(0, '#85dff2'); river.addColorStop(.5, '#348dad'); river.addColorStop(1, '#22647f'); ctx.fillStyle = river; ctx.fillRect(0, 235, 900, 50);
    [170, 350].forEach((laneY) => { ctx.fillStyle = '#6c4627'; ctx.fillRect(410, laneY - 43, 80, 86); for (let plank = 0; plank < 5; plank++) { ctx.fillStyle = plank % 2 ? '#c48a4b' : '#a96c37'; ctx.fillRect(414 + plank * 15, laneY - 40, 13, 80); } });
    [170, 350].forEach((y) => { ctx.strokeStyle = '#e7d4a455'; ctx.lineWidth = 3; ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(900, y); ctx.stroke(); }); ctx.setLineDash([]);
    const smallTower = (x: number, y: number, side: 'blue' | 'red') => { ctx.fillStyle = '#17201844'; ctx.beginPath(); ctx.ellipse(x, y + 35, 35, 13, 0, 0, 7); ctx.fill(); ctx.fillStyle = side === 'blue' ? '#416fc2' : '#b94747'; ctx.fillRect(x - 25, y - 10, 50, 55); ctx.fillStyle = '#e7d5a2'; ctx.fillRect(x - 30, y - 20, 60, 18); for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * 22 - 7, y - 31, 14, 15); };
    const tower = (x: number, side: 'blue' | 'red') => { ctx.fillStyle = '#17201855'; ctx.beginPath(); ctx.ellipse(x, 342, 58, 18, 0, 0, 7); ctx.fill(); ctx.fillStyle = side === 'blue' ? '#315caf' : '#a6383e'; ctx.fillRect(x - 45, 195, 90, 140); ctx.fillStyle = '#ead8a3'; ctx.fillRect(x - 52, 180, 104, 35); for (let i = -2; i <= 2; i++) ctx.fillRect(x + i * 23 - 8, 165, 16, 25); ctx.fillStyle = '#f0bd83'; ctx.beginPath(); ctx.arc(x, 212, 18, 0, 7); ctx.fill(); ctx.fillStyle = '#3b2119'; ctx.fillRect(x - 13, 214, 26, 8); ctx.fillStyle = '#ffd653'; ctx.beginPath(); ctx.moveTo(x - 21, 193); ctx.lineTo(x - 13, 173); ctx.lineTo(x, 190); ctx.lineTo(x + 13, 173); ctx.lineTo(x + 21, 193); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 6, 207, 3, 0, 7); ctx.arc(x + 6, 207, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#241c18'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${towerHp.current[side]} HP`, x, 360); };
    smallTower(145, 150, 'blue'); smallTower(145, 370, 'blue'); smallTower(755, 150, 'red'); smallTower(755, 370, 'red');
    tower(75, 'blue'); tower(825, 'red');
    [...units.current].sort((a, b) => a.y - b.y).forEach((unit) => { const card = CARDS[unit.kind], radius = unit.kind === 'brute' ? 23 : 18; ctx.fillStyle = '#15201d55'; ctx.beginPath(); ctx.ellipse(unit.x, unit.y + 19, 26, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = card.color; ctx.beginPath(); ctx.arc(unit.x, unit.y, radius, 0, 7); ctx.fill(); ctx.strokeStyle = unit.side === 'blue' ? '#d8edff' : '#ffd6d6'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#f1c08c'; ctx.beginPath(); ctx.arc(unit.x, unit.y - 6, radius * .55, 0, 7); ctx.fill(); ctx.fillStyle = '#33231d'; ctx.beginPath(); ctx.arc(unit.x, unit.y - 11, radius * .55, Math.PI, 0); ctx.fill(); if (unit.kind === 'archer') { ctx.strokeStyle = '#593c23'; ctx.beginPath(); ctx.arc(unit.x + 15, unit.y, 12, -1.5, 1.5); ctx.stroke(); } if (unit.kind === 'mage') { ctx.fillStyle = '#d7a6ff'; ctx.beginPath(); ctx.arc(unit.x + 19, unit.y - 11, 6, 0, 7); ctx.fill(); } ctx.fillStyle = '#222'; ctx.fillRect(unit.x - 22, unit.y - 35, 44, 5); ctx.fillStyle = '#67e66d'; ctx.fillRect(unit.x - 22, unit.y - 35, 44 * Math.max(0, unit.hp / card.hp), 5); });
  }, []);

  useEffect(() => { if (result) return; const timer = window.setInterval(() => { blueMana.current = Math.min(10, blueMana.current + .1); redMana.current = Math.min(10, redMana.current + .1); setMana(blueMana.current); units.current.forEach((unit) => { const card = CARDS[unit.kind]; unit.cooldown -= .05; const foes = units.current.filter((other) => other.side !== unit.side && Math.abs(other.y - unit.y) < 50); const target = foes.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))[0]; const distance = target ? Math.abs(target.x - unit.x) : Infinity; if (target && distance <= card.range) { if (unit.cooldown <= 0) { target.hp -= card.damage; unit.cooldown = .75; } } else { const towerX = unit.side === 'blue' ? 825 : 75; if (Math.abs(towerX - unit.x) <= card.range + 35) { if (unit.cooldown <= 0) { towerHp.current[unit.side === 'blue' ? 'red' : 'blue'] -= card.damage; unit.cooldown = .75; } } else unit.x += (unit.side === 'blue' ? 1 : -1) * card.speed * .05; } }); units.current = units.current.filter((unit) => unit.hp > 0); if (towerHp.current.red <= 0) setResult('ПОБЕДА!'); if (towerHp.current.blue <= 0) setResult('ПОРАЖЕНИЕ'); draw(); }, 50); return () => window.clearInterval(timer); }, [draw, result]);
  useEffect(() => { if (result) return; const clock = window.setInterval(() => setSeconds((value) => { if (value <= 1) { setResult(towerHp.current.blue >= towerHp.current.red ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'); return 0; } return value - 1; }), 1000); const ai = window.setInterval(() => { const choices = Object.keys(CARDS) as UnitKind[]; deploy('red', choices[Math.floor(Math.random() * choices.length)], Math.random() > .5 ? 1 : 0); }, 1200); return () => { clearInterval(clock); clearInterval(ai); }; }, [deploy, result]);
  useEffect(draw, [draw]);

  const restart = () => { units.current = []; towerHp.current = { blue: 1200, red: 1200 }; blueMana.current = 5; redMana.current = 5; setMana(5); setSeconds(150); setResult(''); };
  return <main className="duel-page"><header><button onClick={onBack}>← НАЗАД</button><h1>КРЕПОСТНАЯ ДУЭЛЬ</h1><b>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</b></header><canvas ref={canvasRef} width="900" height="520" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const y = (e.clientY - rect.top) * 520 / rect.height; deploy('blue', selected, y > 260 ? 1 : 0); }} /><section className="duel-deck"><div className="duel-mana">ЭНЕРГИЯ {mana.toFixed(1)} / 10</div>{(Object.entries(CARDS) as [UnitKind, Card][]).map(([id, card]) => <button className={selected === id ? 'selected' : ''} key={id} onClick={() => setSelected(id)}><i className={`card-portrait card-portrait--${id}`} style={{ background: card.color }}><em /><strong /></i><b>{card.name}</b><small>{id === 'guard' ? 'Ближний бой' : id === 'archer' ? 'Дальний бой' : id === 'brute' ? 'Много здоровья' : 'Магический урон'}</small><span>◆ {card.cost}</span></button>)}</section>{result && <div className="duel-result"><h2>{result}</h2><button onClick={restart}>ЕЩЁ РАЗ</button></div>}</main>;
}
