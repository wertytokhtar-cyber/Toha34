import { useCallback, useEffect, useRef, useState } from 'react';
import HeroSprite from './components/HeroSprite';
import { Auth } from './components/Auth';
import { Snake3D } from './components/Snake3D';
import { CastleDuel } from './components/CastleDuel';

type Weapon = 'normal' | 'fireball' | 'spread' | 'ray' | 'frost' | 'plasma' | 'rocket' | 'boomerang';
type Shot = { id: number; x: number; weapon?: Weapon };
type AttackKind = 'fire' | 'fist' | 'minion' | 'gear' | 'laser' | 'clock' | 'bubble' | 'ink' | 'tentacle' | 'mug' | 'barrel' | 'carrot' | 'potato' | 'onion';
type EnemyShot = Shot & { lane: 'low' | 'high'; kind: AttackKind };
type Language = 'ru' | 'en' | 'fr';
const uiText = {
  ru: { settings:'НАСТРОЙКИ', paused:'ИГРА НА ПАУЗЕ', resume:'ПРОДОЛЖИТЬ', restart:'ПЕРЕЗАПУСТИТЬ БОЙ', music:'Музыка', volume:'Громкость', language:'Язык', back:'ЗАКРЫТЬ И ПРОДОЛЖИТЬ', map:'КАРТА', hero:'ГЕРОЙ', shop:'МАГАЗИН', phase:'ФАЗА', ultimate:'УЛЬТА', start:'НАЧАТЬ', contract:'КОНТРАКТ', lives:'жизни', soundOn:'Включена', soundOff:'Выключена' },
  en: { settings:'SETTINGS', paused:'GAME PAUSED', resume:'RESUME', restart:'RESTART FIGHT', music:'Music', volume:'Volume', language:'Language', back:'CLOSE AND RESUME', map:'MAP', hero:'HERO', shop:'SHOP', phase:'PHASE', ultimate:'SUPER', start:'START', contract:'CONTRACT', lives:'lives', soundOn:'On', soundOff:'Off' },
  fr: { settings:'PARAMÈTRES', paused:'JEU EN PAUSE', resume:'CONTINUER', restart:'RECOMMENCER LE COMBAT', music:'Musique', volume:'Volume', language:'Langue', back:'FERMER ET CONTINUER', map:'CARTE', hero:'HÉROS', shop:'BOUTIQUE', phase:'PHASE', ultimate:'ULTIME', start:'COMMENCER', contract:'CONTRAT', lives:'vies', soundOn:'Activée', soundOff:'Désactivée' },
} as const;
const levels = [
  { title: 'Шумная таверна', boss: 'Хозяин таверны', asset: '/assets/tavern-source.png', theme: 'tavern' },
  { title: 'Бунт на грядке', boss: 'Овощная банда', asset: '/assets/vegetables-source.png', theme: 'garden' },
  { title: 'Огненная сцена', boss: 'Багровый дракон', asset: '/assets/dragon-source.png', theme: 'fire' },
  { title: 'Лунный завод', boss: 'Механический месяц', asset: '/assets/moon-source.png', theme: 'moon' },
];
const heroes = [
  { name: 'Тоха', asset: '/assets/hero-muscular.png' },
  { name: 'Лея', asset: '/assets/hero-aviator.png' },
  { name: 'Маг', asset: '/assets/hero-magician.png' },
  { name: 'Айконя', asset: '/assets/hero-mira.png' },
];
const weapons: ReadonlyArray<{ id: Weapon; name: string; damage: number }> = [
  { id:'normal', name:'Чернильная пуля', damage:10 }, { id:'fireball', name:'Огненный шар', damage:250 },
  { id:'spread', name:'Картечь', damage:60 }, { id:'ray', name:'Луч', damage:120 },
  { id:'frost', name:'Ледяная комета', damage:175 }, { id:'plasma', name:'Плазменная сфера', damage:210 },
  { id:'rocket', name:'Мини-ракета', damage:320 }, { id:'boomerang', name:'Золотой бумеранг', damage:145 },
];
const heroSkins = [
  [{ id:'classic', name:'Классический', price:0 }, { id:'deputy', name:'Депутат', price:450 }, { id:'gamer', name:'Геймер', price:350 }],
  [{ id:'classic', name:'Классическая', price:0 }, { id:'ace', name:'Небесный ас', price:320 }, { id:'neon', name:'Неоновая лётчица', price:400 }],
  [{ id:'classic', name:'Классический', price:0 }, { id:'archmage', name:'Архимаг', price:380 }, { id:'shadow', name:'Теневой маг', price:420 }],
  [{ id:'classic', name:'Классическая', price:0 }, { id:'royal', name:'Королева', price:390 }, { id:'cyber', name:'Кибер-Айконя', price:440 }],
] as const;

export default function App() {
  const [playerX, setPlayerX] = useState(14);
  const [shots, setShots] = useState<Shot[]>([]);
  const [bossHealth, setBossHealth] = useState(5000);
  const [levelIndex, setLevelIndex] = useState(0);
  const [enemyShots, setEnemyShots] = useState<EnemyShot[]>([]);
  const [lives, setLives] = useState(3);
  const [invulnerable, setInvulnerable] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isCrouching, setIsCrouching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [bossSlamming, setBossSlamming] = useState(false);
  const [superMeter, setSuperMeter] = useState(0);
  const [ultimateActive, setUltimateActive] = useState(false);
  const [novaActive, setNovaActive] = useState(false);
  const [timeFrozen, setTimeFrozen] = useState(false);
  const [inked, setInked] = useState(false);
  const [weapon, setWeapon] = useState<Weapon>('normal');
  const [shopOpen, setShopOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroMenuOpen, setHeroMenuOpen] = useState(false);
  const [crystalShopOpen, setCrystalShopOpen] = useState(false);
  const [crystals, setCrystals] = useState(1000);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['0:classic','1:classic','2:classic','3:classic']);
  const [selectedSkins, setSelectedSkins] = useState<Record<number, string>>({ 0:'classic', 1:'classic', 2:'classic', 3:'classic' });
  const [accessScreen, setAccessScreen] = useState<'choose' | 'auth' | 'game' | 'snake' | 'duel'>('choose');
  const [mapOpen, setMapOpen] = useState(true);
  const [started, setStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.55);
  const [language, setLanguage] = useState<Language>('ru');
  const shotId = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastShotAt = useRef(0);
  const movement = useRef({ left: false, right: false });
  const facing = useRef(1);
  const playerXRef = useRef(playerX);
  const jumpingRef = useRef(isJumping);
  const bossPhase = bossHealth > 3750 ? 1 : bossHealth > 2500 ? 2 : bossHealth > 1250 ? 3 : 4;
  const level = levels[levelIndex];
  const t = uiText[language];
  const buyOrEquipSkin = (skinId: string, price: number) => {
    const key = `${heroIndex}:${skinId}`;
    if (ownedSkins.includes(key)) { setSelectedSkins((current) => ({ ...current, [heroIndex]:skinId })); return; }
    if (crystals < price) return;
    setCrystals((value) => value - price);
    setOwnedSkins((current) => [...current, key]);
    setSelectedSkins((current) => ({ ...current, [heroIndex]:skinId }));
  };

  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
  useEffect(() => { jumpingRef.current = isJumping; }, [isJumping]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = musicVolume;
    audio.muted = !musicEnabled;
    if (musicEnabled) void audio.play().catch(() => undefined);
  }, [musicEnabled, musicVolume]);

  const jump = useCallback(() => {
    if (!started || paused || isJumping || lives <= 0) return;
    setIsJumping(true);
  }, [isJumping, lives, paused, started]);

  const shoot = useCallback(() => {
    if (!started || paused || bossHealth <= 0 || shopOpen) return;
    const now = performance.now();
    if (now - lastShotAt.current < 220) return;
    lastShotAt.current = now;
    setShots((current) => current.length >= 6 ? current : [...current, { id: shotId.current++, x: playerX + 7, weapon }]);
  }, [bossHealth, paused, playerX, shopOpen, started, weapon]);

  const useUltimate = useCallback(() => {
    if (!started || paused || superMeter < 100 || ultimateActive || bossHealth <= 0) return;
    setSuperMeter(0);
    setUltimateActive(true);
    setBossHealth((health) => Math.max(0, health - 500));
    setEnemyShots([]);
    window.setTimeout(() => setUltimateActive(false), 900);
  }, [bossHealth, paused, started, superMeter, ultimateActive]);

  const useNova = useCallback(() => {
    if (!started || paused || superMeter < 100 || novaActive || bossHealth <= 0) return;
    setSuperMeter(0); setNovaActive(true); setEnemyShots([]);
    setBossHealth((health) => Math.max(0, health - 850));
    window.setTimeout(() => setNovaActive(false), 850);
  }, [bossHealth, novaActive, paused, started, superMeter]);

  const dash = useCallback(() => {
    if (!started || paused || lives <= 0 || shopOpen) return;
    setPlayerX((x) => Math.min(72, Math.max(4, x + facing.current * 11)));
  }, [lives, paused, shopOpen, started]);

  const startMobileMove = (direction: 'left' | 'right') => {
    movement.current[direction] = true;
    facing.current = direction === 'left' ? -1 : 1;
    setFacingLeft(direction === 'left');
    setIsMoving(true);
  };

  const stopMobileMove = (direction: 'left' | 'right') => {
    movement.current[direction] = false;
    if (!movement.current.left && !movement.current.right) setIsMoving(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyA' || event.key === 'ArrowLeft') { movement.current.left = true; facing.current = -1; setFacingLeft(true); setIsMoving(true); }
      if (event.code === 'KeyD' || event.key === 'ArrowRight') { movement.current.right = true; facing.current = 1; setFacingLeft(false); setIsMoving(true); }
      if (event.code === 'KeyS' || event.key === 'ArrowDown') setIsCrouching(true);
      if (event.code === 'KeyP') { event.preventDefault(); shoot(); }
      if (event.code === 'KeyQ') { event.preventDefault(); useUltimate(); }
      if (event.code === 'KeyE') { event.preventDefault(); useNova(); }
      if (event.code === 'Space' || event.key === 'ArrowUp') { event.preventDefault(); jump(); }
      if (event.key === 'Shift' && !event.repeat) dash();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'KeyA' || event.key === 'ArrowLeft') movement.current.left = false;
      if (event.code === 'KeyD' || event.key === 'ArrowRight') movement.current.right = false;
      if (!movement.current.left && !movement.current.right) setIsMoving(false);
      if (event.code === 'KeyS' || event.key === 'ArrowDown') setIsCrouching(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [dash, jump, shoot, useNova, useUltimate]);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const move = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      const direction = timeFrozen || paused ? 0 : Number(movement.current.right) - Number(movement.current.left);
      if (direction) setPlayerX((x) => Math.min(72, Math.max(4, x + direction * 34 * seconds)));
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, [paused, timeFrozen]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (paused) return;
      setShots((current) => {
        let hits = 0;
        let damage = 0;
        const next = current.flatMap((shot) => {
          if (shot.x >= 82) {
            hits += 1;
            damage += weapons.find((item) => item.id === (shot.weapon ?? 'normal'))?.damage ?? 10;
            return [];
          }
          return [{ ...shot, x: shot.x + 2.5 }];
        });
        if (hits) {
          setBossHealth((health) => Math.max(0, health - damage));
          setSuperMeter((meter) => Math.min(100, meter + hits * 4));
        }
        return next;
      });
    }, 32);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (!started || paused || bossHealth <= 0 || lives <= 0) return;
    const patterns: AttackKind[][] = [
      ['mug', 'barrel', 'fist', 'barrel'],
      ['carrot', 'potato', 'onion', 'carrot'],
      ['fire', 'fire', 'fist', 'minion'],
      ['gear', 'laser', 'fist', 'clock'],
      ['bubble', 'ink', 'tentacle', 'ink'],
    ];
    const delays = [[900, 1150, 680, 470], [980, 850, 720, 440], [950, 1200, 720, 520], [820, 1050, 680, 430], [1100, 760, 900, 470]];
    const kind = patterns[levelIndex][bossPhase - 1];
    const delay = delays[levelIndex][bossPhase - 1];
    const attack = window.setInterval(() => {
      const count = (kind === 'clock' || (kind === 'ink' && bossPhase === 4)) ? 3 : 1;
      const volley = Array.from({ length: count }, (_, index): EnemyShot => ({
        id: shotId.current++, x: 82 + index * 7,
        lane: index % 2 === 0 ? 'low' : 'high', kind,
      }));
      setEnemyShots((current) => [...current, ...volley]);
    }, delay);
    return () => window.clearInterval(attack);
  }, [bossHealth, bossPhase, levelIndex, lives, paused, started]);

  useEffect(() => {
    if (!started || paused || level.theme !== 'fire' || bossPhase !== 2 || lives <= 0) return;
    const slam = window.setInterval(() => {
      setBossSlamming(true);
      window.setTimeout(() => {
        const insideLandingZone = Math.abs(playerXRef.current - 64) <= 20;
        if (!jumpingRef.current && insideLandingZone) setLives((value) => Math.max(0, value - 1));
        setBossSlamming(false);
      }, 850);
    }, 3200);
    return () => window.clearInterval(slam);
  }, [bossPhase, level.theme, lives, paused, started]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (paused) return;
      setEnemyShots((current) => {
        let hitRegistered = false;
        return current.flatMap((shot) => {
        const speeds: Record<AttackKind, number> = { fire: 1.55, fist: 2.1, minion: 1.15, gear: 1.65, laser: 3.5, clock: 1.25, bubble: .9, ink: 2.8, tentacle: 1.35, mug: 1.8, barrel: 1.2, carrot: 2.5, potato: 1.1, onion: 1.7 };
        const speed = speeds[shot.kind];
        const nextX = shot.x - speed;
        const heroX = playerXRef.current;
        const canHit = shot.lane === 'high' ? jumpingRef.current : !jumpingRef.current;
        if (nextX <= heroX + 7 && nextX >= heroX - 2 && canHit) {
          if (!invulnerable && !hitRegistered) {
            hitRegistered = true;
            setLives((value) => Math.max(0, value - 1));
            setInvulnerable(true);
            window.setTimeout(() => setInvulnerable(false), 900);
            if (shot.kind === 'clock') { setTimeFrozen(true); window.setTimeout(() => setTimeFrozen(false), 1200); }
            if (shot.kind === 'ink') { setInked(true); window.setTimeout(() => setInked(false), 1000); }
          }
          return [];
        }
        return nextX < 0 ? [] : [{ ...shot, x: nextX }];
        });
      });
    }, 32);
    return () => window.clearInterval(timer);
  }, [bossPhase, invulnerable, paused]);

  const restart = () => { setBossHealth(5000); setShots([]); setEnemyShots([]); setLives(3); setPlayerX(14); setIsJumping(false); setBossSlamming(false); setSuperMeter(0); setUltimateActive(false); setNovaActive(false); setTimeFrozen(false); setInked(false); setPaused(false); setSettingsOpen(false); setStarted(true); };
  const openContract = (index: number) => { setLevelIndex(index); restart(); setStarted(false); setMapOpen(false); };

  if (accessScreen === 'choose') return <main className="login-screen"><section className="login-card welcome-card"><p className="eyebrow">ЧЕРНИЛЬНЫЙ ДОЛГ</p><h1>Выбери игру</h1><p>Три отдельных режима доступны с одного экрана.</p><button onClick={() => setAccessScreen('auth')}>ВОЙТИ ИЛИ СОЗДАТЬ АККАУНТ</button><button className="guest-button" onClick={() => setAccessScreen('game')}>ИГРАТЬ В BOSS-RUSH</button><button className="snake-button" onClick={() => setAccessScreen('snake')}>ЗАПУСТИТЬ ЗМЕЙКУ 3D</button><button className="duel-button" onClick={() => setAccessScreen('duel')}>КРЕПОСТНАЯ ДУЭЛЬ</button></section></main>;
  if (accessScreen === 'auth') return <Auth onAuthenticated={() => setAccessScreen('game')} onBack={() => setAccessScreen('choose')} />;
  if (accessScreen === 'snake') return <Snake3D onBack={() => setAccessScreen('choose')} />;
  if (accessScreen === 'duel') return <CastleDuel onBack={() => setAccessScreen('choose')} />;
  if (mapOpen) return <main className="world-map"><header><p className="eyebrow">ОСТРОВА КОНТРАКТОВ</p><h1>Выбери следующего босса</h1><span>Монеты: ∞</span></header><div className="map-road" /> <div className="map-nodes">{levels.map((item, index) => <button key={item.boss} className={`map-node map-node--${item.theme}`} onClick={() => openContract(index)}><span>{index + 1}</span><b>{item.boss}</b><small>{item.title}</small></button>)}</div></main>;

  return (
    <main className="game-page">
      <header className="game-header">
        <div><span className="eyebrow">КОНТРАКТ {levelIndex + 1} / {levels.length}</span><h1>{level.title}</h1></div>
        <div className="header-actions"><button className="crystal-balance" onClick={() => { setCrystalShopOpen(true); setPaused(true); }}>💎 {crystals}</button><button className="shop-button" onClick={() => setMapOpen(true)}>{t.map}</button><button className="shop-button" onClick={() => setHeroMenuOpen(true)}>{t.hero}</button><button className="shop-button" onClick={() => setShopOpen(true)}>{t.shop}</button><button className="shop-button settings-button" onClick={() => { setSettingsOpen(true); setPaused(true); }}>⚙ {t.settings}</button><div className="lives" aria-label={`${lives} ${t.lives}`}>{'♥ '.repeat(lives)}<i>{'♥ '.repeat(3 - lives)}</i></div></div>
      </header>

      <section key={levelIndex} className={`stage stage--${level.theme} ${timeFrozen ? 'stage--frozen' : ''} ${paused ? 'stage--paused' : ''}`} onClick={shoot}>
        <div className="map-depth"><i /><i /><i /><i /><i /></div>
        <div className="curtain curtain--left" /><div className="curtain curtain--right" />
        <div className="spotlight" />
        <div className="boss-bar"><span style={{ width: `${bossHealth / 50}%` }} /><b>{t.phase} {bossPhase} · {bossHealth} HP</b></div>
        <div className={`super-meter ${superMeter >= 100 ? 'super-meter--ready' : ''}`}><b>{t.ultimate} · Q</b><span><i style={{ width: `${superMeter}%` }} /></span></div>
        <div className={`boss boss--${level.theme} boss--phase-${bossPhase} ${bossSlamming ? 'boss--slam' : ''}`} aria-label={level.boss}><HeroSprite src={level.asset} className="dragon-sprite" label={level.boss} /></div>
        {bossSlamming && <div className="landing-wave" aria-label="Зона приземления" />}
        {level.theme === 'fire' && bossPhase === 4 && <div className="dragon-kids" aria-label="Дети дракона"><HeroSprite src="/assets/dragon-source.png" className="dragon-kid dragon-kid--one" /><HeroSprite src="/assets/dragon-source.png" className="dragon-kid dragon-kid--two" /></div>}
        {shots.map((shot) => <i className={`shot shot--${shot.weapon ?? 'normal'}`} key={shot.id} style={{ left: `${shot.x}%` }} />)}
        {ultimateActive && <div className="ultimate-beam"><i /></div>}
        {novaActive && <div className="ultimate-nova" />}
        {inked && <div className="ink-splash" aria-label="Чернила закрывают обзор" />}
        {enemyShots.map((shot) => <i className={`enemy-shot enemy-shot--${shot.lane} enemy-shot--${shot.kind}`} key={shot.id} style={{ left: `${shot.x}%` }} aria-label="Атака босса" />)}
        <div className={`player skin--${selectedSkins[heroIndex]} ${invulnerable ? 'player--hit' : ''} ${isJumping ? 'player--jump' : ''} ${isCrouching ? 'player--crouch' : ''} ${isMoving ? 'player--moving' : ''} ${facingLeft ? 'player--left' : ''}`} style={{ left: `${playerX}%` }} onAnimationEnd={(event) => { if (event.animationName === 'jump') setIsJumping(false); }}><HeroSprite src={heroes[heroIndex].asset} fitScale={heroIndex === 0 ? 0.72 : 1} /></div>
        <div className="floor" />
        {!started && <div className="overlay"><p>{t.contract} №{levelIndex + 1}</p><h2>{level.boss}</h2><button onClick={(e) => { e.stopPropagation(); setStarted(true); }}>{t.start}</button></div>}
        {bossHealth === 0 && <div className="overlay"><p>КОНТРАКТ ВЫПОЛНЕН!</p><h2>{level.boss} побеждён</h2><button onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}>ВЕРНУТЬСЯ НА КАРТУ</button></div>}
        {lives === 0 && <div className="overlay"><p>ЗАНАВЕС...</p><h2>Контракт не выполнен</h2><button onClick={(e) => { e.stopPropagation(); restart(); }}>ЕЩЁ РАЗ</button></div>}
        {shopOpen && <div className="overlay shop" onClick={(e) => e.stopPropagation()}><p>ОРУЖЕЙНАЯ ЛАВКА · БАЛАНС ∞</p><h2>Восемь оружий</h2><div className="shop-items">{weapons.map((item) => <button className={weapon === item.id ? 'selected' : ''} key={item.id} onClick={() => setWeapon(item.id)}><i className={`weapon-icon weapon-icon--${item.id}`} /><b>{item.name}</b><small>{item.damage} урона · куплено</small></button>)}</div><p>Ульты: <kbd>Q</kbd> энергетический луч · <kbd>E</kbd> звёздная вспышка</p><button onClick={() => setShopOpen(false)}>ВЕРНУТЬСЯ В БОЙ</button></div>}
        {heroMenuOpen && <div className="overlay hero-menu" onClick={(e) => e.stopPropagation()}><p>ВЫБОР ГЕРОЯ</p><h2>Кто идёт в бой?</h2><div className="hero-cards">{heroes.map((hero, index) => <button className={heroIndex === index ? 'selected' : ''} key={hero.name} onClick={() => setHeroIndex(index)}><HeroSprite src={hero.asset} className="hero-preview" label={hero.name} /><b>{hero.name}</b></button>)}</div><button onClick={() => setHeroMenuOpen(false)}>ГОТОВО</button></div>}
        {crystalShopOpen && <div className="overlay crystal-shop" onClick={(event) => event.stopPropagation()}>
          <p>💎 КРИСТАЛЬНАЯ ЛАВКА · {crystals}</p><h2>Скины для {heroes[heroIndex].name}</h2>
          <div className="skin-list">{heroSkins[heroIndex].map((skin) => {
            const owned = ownedSkins.includes(`${heroIndex}:${skin.id}`);
            const equipped = selectedSkins[heroIndex] === skin.id;
            return <button className={`skin-card skin-card--${skin.id} ${equipped ? 'selected' : ''}`} key={skin.id} onClick={() => buyOrEquipSkin(skin.id, skin.price)} disabled={!owned && crystals < skin.price}><HeroSprite src={heroes[heroIndex].asset} className="skin-preview" /><b>{skin.name}</b><small>{equipped ? 'НАДЕТО' : owned ? 'ВЫБРАТЬ' : `💎 ${skin.price}`}</small></button>;
          })}</div>
          <div className="crystal-packs"><span>Демо-пополнение:</span><button onClick={() => setCrystals((value) => value + 100)}>+100 💎</button><button onClick={() => setCrystals((value) => value + 500)}>+500 💎</button></div>
          <button onClick={() => { setCrystalShopOpen(false); setPaused(false); }}>ВЕРНУТЬСЯ В БОЙ</button>
        </div>}
        {settingsOpen && <div className="overlay settings-panel" onClick={(event) => event.stopPropagation()}>
          <p>{t.paused}</p><h2>⚙ {t.settings}</h2>
          <div className="settings-fields">
            <label><span>{t.music}: {musicEnabled ? t.soundOn : t.soundOff}</span><button className="setting-toggle" onClick={() => setMusicEnabled((value) => !value)}>{musicEnabled ? '🔊' : '🔇'}</button></label>
            <label><span>{t.volume}: {Math.round(musicVolume * 100)}%</span><input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(event) => setMusicVolume(Number(event.target.value))} /></label>
            <label><span>{t.language}</span><select value={language} onChange={(event) => setLanguage(event.target.value as Language)}><option value="ru">Русский</option><option value="en">English</option><option value="fr">Français</option></select></label>
          </div>
          <div className="settings-actions"><button onClick={() => { setSettingsOpen(false); setPaused(false); }}>{t.resume}</button><button onClick={restart}>{t.restart}</button></div>
        </div>}
        <div className="mobile-controls" onClick={(event) => event.stopPropagation()} aria-label="Мобильное управление">
          <div className="mobile-pad">
            <button className="mobile-button mobile-button--left" aria-label="Двигаться влево" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startMobileMove('left'); }} onPointerUp={() => stopMobileMove('left')} onPointerCancel={() => stopMobileMove('left')} onLostPointerCapture={() => stopMobileMove('left')}>◀</button>
            <button className="mobile-button mobile-button--right" aria-label="Двигаться вправо" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startMobileMove('right'); }} onPointerUp={() => stopMobileMove('right')} onPointerCancel={() => stopMobileMove('right')} onLostPointerCapture={() => stopMobileMove('right')}>▶</button>
          </div>
          <div className="mobile-actions">
            <button className="mobile-button mobile-button--dash" aria-label="Рывок" onPointerDown={(event) => { event.preventDefault(); dash(); }}>↠<small>РЫВОК</small></button>
            <button className="mobile-button mobile-button--jump" aria-label="Прыжок" onPointerDown={(event) => { event.preventDefault(); jump(); }}>↑<small>ПРЫЖОК</small></button>
            <button className="mobile-button mobile-button--shoot" aria-label="Стрелять" onPointerDown={(event) => { event.preventDefault(); shoot(); }}>●<small>ОГОНЬ</small></button>
            <button className={`mobile-button mobile-button--super ${superMeter >= 100 ? 'ready' : ''}`} aria-label="Ульта" onPointerDown={(event) => { event.preventDefault(); useUltimate(); }}>★<small>УЛЬТА</small></button>
          </div>
        </div>
      </section>

      <footer className="controls"><span><kbd>A</kbd><kbd>D</kbd> движение</span><span><kbd>SPACE</kbd> прыжок</span><span><kbd>P</kbd> выстрел</span><span><kbd>Q</kbd> луч</span><span><kbd>E</kbd> вспышка</span><span><kbd>SHIFT</kbd> рывок</span></footer>
      <audio ref={audioRef} className="game-music" controls autoPlay loop src="/audio/i-will-survive.mp3">Музыка не поддерживается браузером.</audio>
    </main>
  );
}
