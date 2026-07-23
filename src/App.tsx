import { useCallback, useEffect, useRef, useState } from 'react';
import HeroSprite from './components/HeroSprite';
import ProjectileSprite from './components/ProjectileSprite';
import { Auth } from './components/Auth';
import { Snake3D } from './components/Snake3D';
import { CastleDuel } from './components/CastleDuel';
import { GeminiCoach } from './components/GeminiCoach';
import { DeviceMode, IntroScreen } from './components/IntroScreen';
import { supabase } from './lib/supabase';
import { playCombatSound } from './lib/combatSound';

type Weapon = 'normal' | 'fireball' | 'spread' | 'ray' | 'frost' | 'plasma' | 'rocket' | 'boomerang';
type Shot = { id: number; x: number; weapon?: Weapon };
type AttackKind = 'fire' | 'fist' | 'minion' | 'gear' | 'laser' | 'clock' | 'bubble' | 'ink' | 'tentacle' | 'mug' | 'barrel' | 'carrot' | 'potato' | 'onion';
type EnemyShot = Shot & { lane: 'low' | 'high'; kind: AttackKind };
type Language = 'ru' | 'en' | 'fr';
type Difficulty = 'easy' | 'normal' | 'hard';
type OnlineState = { id:string; x:number; jumping:boolean; moving:boolean; facingLeft:boolean; hero:number; weapon:Weapon; shot:number; bossHealth:number; lives:number; level:number };
const difficulties = {
  easy: { label:'ЛЁГКАЯ', bossHp:3500, attackSpeed:1.25, damage:1 },
  normal: { label:'ОБЫЧНАЯ', bossHp:5000, attackSpeed:1, damage:1 },
  hard: { label:'СЛОЖНАЯ', bossHp:7500, attackSpeed:.68, damage:2 },
} as const;
const uiText = {
  ru: { settings:'НАСТРОЙКИ', paused:'ИГРА НА ПАУЗЕ', resume:'ПРОДОЛЖИТЬ', restart:'ПЕРЕЗАПУСТИТЬ БОЙ', music:'Музыка', volume:'Громкость', language:'Язык', back:'ЗАКРЫТЬ И ПРОДОЛЖИТЬ', map:'КАРТА', hero:'ГЕРОЙ', shop:'МАГАЗИН', phase:'ФАЗА', ultimate:'УЛЬТА', start:'НАЧАТЬ', contract:'КОНТРАКТ', lives:'жизни', soundOn:'Включена', soundOff:'Выключена' },
  en: { settings:'SETTINGS', paused:'GAME PAUSED', resume:'RESUME', restart:'RESTART FIGHT', music:'Music', volume:'Volume', language:'Language', back:'CLOSE AND RESUME', map:'MAP', hero:'HERO', shop:'SHOP', phase:'PHASE', ultimate:'SUPER', start:'START', contract:'CONTRACT', lives:'lives', soundOn:'On', soundOff:'Off' },
  fr: { settings:'PARAMÈTRES', paused:'JEU EN PAUSE', resume:'CONTINUER', restart:'RECOMMENCER LE COMBAT', music:'Musique', volume:'Volume', language:'Langue', back:'FERMER ET CONTINUER', map:'CARTE', hero:'HÉROS', shop:'BOUTIQUE', phase:'PHASE', ultimate:'ULTIME', start:'COMMENCER', contract:'CONTRAT', lives:'vies', soundOn:'Activée', soundOff:'Désactivée' },
} as const;
const levels = [
  { title: 'Шумная таверна', boss: 'Хозяин таверны', asset: '/assets/tavern-source.png', theme: 'tavern', story:'В старой таверне исчезают путники. Хозяин собирает их смелость в заколдованные кружки. Герой должен разбить проклятие до последнего удара часов.' },
  { title: 'Бунт на грядке', boss: 'Овощная банда', asset: '/assets/vegetables-source.png', theme: 'garden', story:'Огород ожил после падения странной звезды. Овощная банда захватила дорогу к островам и не пропускает никого без боя.' },
  { title: 'Огненная сцена', boss: 'Багровый дракон', asset: '/assets/dragon-source.png', theme: 'fire', story:'На вершине вулкана проснулся последний багровый дракон. Он охраняет древний контракт и готов обрушить огонь на весь остров.' },
  { title: 'Лунный завод', boss: 'Механический месяц', asset: '/assets/moon-source.png', theme: 'moon', story:'Заброшенный завод построил себе механическое сердце. Теперь железная луна управляет временем и превращает ночь в бесконечный механизм.' },
];
const heroes = [
  { name: 'Мухамеди', role:'Силач', bio:'Защитник острова, который полагается на силу и никогда не бросает друзей.', asset: '/assets/hero-muhamedi.png', runAsset:'/assets/hero-muhamedi-run2.png', stats:{ health:5, speed:78, damage:125, super:90 } },
  { name: 'Лея', role:'Скорость', bio:'Отважная лётчица, разыскивающая пропавшую экспедицию среди проклятых островов.', asset: '/assets/hero-aviator.png', runAsset:'/assets/hero-aviator-run2.png', stats:{ health:3, speed:125, damage:90, super:105 } },
  { name: 'Маг', role:'Ультимейты', bio:'Хранитель звёздного огня, способный обратить энергию врага против него самого.', asset: '/assets/hero-magician.png', runAsset:'/assets/hero-magician-run2.png', stats:{ health:3, speed:92, damage:100, super:140 } },
  { name: 'Айконя', role:'Баланс', bio:'Искательница тайн, которая собрала команду и первой нашла карту контрактов.', asset: '/assets/hero-mira.png', runAsset:'/assets/hero-mira-run2.png', stats:{ health:4, speed:105, damage:108, super:110 } },
];
const weapons: ReadonlyArray<{ id: Weapon; name: string; damage: number }> = [
  { id:'normal', name:'Чернильная пуля', damage:10 }, { id:'fireball', name:'Огненный шар', damage:250 },
  { id:'spread', name:'Картечь', damage:60 }, { id:'ray', name:'Луч', damage:120 },
  { id:'frost', name:'Ледяная комета', damage:175 }, { id:'plasma', name:'Плазменная сфера', damage:210 },
  { id:'rocket', name:'Мини-ракета', damage:320 }, { id:'boomerang', name:'Золотой бумеранг', damage:145 },
];
const weaponProjectileAssets: Partial<Record<Weapon, string>> = {
  fireball:'/assets/projectile-fireball-v2-source.png',
  frost:'/assets/projectile-frost-v2-source.png',
  plasma:'/assets/projectile-orb-v2-source.png',
  rocket:'/assets/projectile-rocket-v2-source.png',
  boomerang:'/assets/projectile-boomerang-v2-source.png',
};
const bossProjectileAssets: Partial<Record<AttackKind, string>> = {
  fire:'/assets/projectile-fireball-v2-source.png',
  fist:'/assets/projectile-fist-v2-source.png',
  bubble:'/assets/projectile-orb-v2-source.png',
  barrel:'/assets/projectile-barrel-v2-source.png',
};
type HeroSkin = { id:string; name:string; price:number; asset?:string };
const heroSkins: ReadonlyArray<ReadonlyArray<HeroSkin>> = [
  [{ id:'classic', name:'Классический', price:0 }, { id:'deputy', name:'Депутат', price:450, asset:'/assets/skin-muhamedi-deputy.png' }, { id:'gamer', name:'Геймер', price:350, asset:'/assets/skin-muhamedi-gamer.png' }],
  [{ id:'classic', name:'Классическая', price:0 }, { id:'ace', name:'Небесный ас', price:320, asset:'/assets/skin-leya-ace.png' }, { id:'neon', name:'Неоновая лётчица', price:400, asset:'/assets/skin-leya-neon.png' }],
  [{ id:'classic', name:'Классический', price:0 }, { id:'archmage', name:'Архимаг', price:380, asset:'/assets/skin-mage-archmage.png' }, { id:'shadow', name:'Теневой маг', price:420, asset:'/assets/skin-mage-shadow.png' }],
  [{ id:'classic', name:'Классическая', price:0 }, { id:'royal', name:'Королева', price:390, asset:'/assets/skin-aikonya-royal.png' }, { id:'cyber', name:'Кибер-Айконя', price:440, asset:'/assets/skin-aikonya-cyber.png' }],
];

export default function App() {
  const [introOpen, setIntroOpen] = useState(true);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    try {
      const saved = localStorage.getItem('contract-device-mode');
      return saved === 'desktop' || saved === 'mobile' ? saved : 'auto';
    } catch { return 'auto'; }
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [playerX, setPlayerX] = useState(14);
  const [player2X, setPlayer2X] = useState(24);
  const [multiplayer, setMultiplayer] = useState(false);
  const [onlineMode, setOnlineMode] = useState(false);
  const [onlineRoom, setOnlineRoom] = useState('ISLAND');
  const [onlineStatus, setOnlineStatus] = useState('не подключено');
  const [onlinePlayers, setOnlinePlayers] = useState(1);
  const [isJumping2, setIsJumping2] = useState(false);
  const [isMoving2, setIsMoving2] = useState(false);
  const [facingLeft2, setFacingLeft2] = useState(false);
  const [hero2Index, setHero2Index] = useState(1);
  const [shotNonce, setShotNonce] = useState(0);
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
  const [heroAttacking, setHeroAttacking] = useState(false);
  const [bossAttacking, setBossAttacking] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [hitBurst, setHitBurst] = useState(0);
  const [combo, setCombo] = useState(0);
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
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [flyMode, setFlyMode] = useState(false);
  const [flightY, setFlightY] = useState(0);
  const [oneShot, setOneShot] = useState(false);
  const [cheatInput, setCheatInput] = useState('');
  const [cheatMessage, setCheatMessage] = useState('');
  const shotId = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastShotAt = useRef(0);
  const lastShotAt2 = useRef(0);
  const heroAttackTimer = useRef(0);
  const comboTimer = useRef(0);
  const movement = useRef({ left: false, right: false, up: false, down: false });
  const movement2 = useRef({ left: false, right: false });
  const facing = useRef(1);
  const playerXRef = useRef(playerX);
  const player2XRef = useRef(player2X);
  const jumpingRef = useRef(isJumping);
  const jumping2Ref = useRef(isJumping2);
  const clientId = useRef(crypto.randomUUID());
  const remoteShot = useRef(0);
  const onlineSnapshot = useRef({ moving:false, facingLeft:false, hero:0, weapon:'normal' as Weapon, shot:0, bossHealth:5000, lives:3, level:0 });
  const bossMaxHealth = difficulties[difficulty].bossHp;
  const bossPhase = bossHealth > bossMaxHealth * .75 ? 1 : bossHealth > bossMaxHealth * .5 ? 2 : bossHealth > bossMaxHealth * .25 ? 3 : 4;
  const level = levels[levelIndex];
  const heroStats = heroes[heroIndex].stats;
  const activeSkin = heroSkins[heroIndex].find((skin) => skin.id === selectedSkins[heroIndex]);
  const activeHeroAsset = activeSkin?.asset ?? heroes[heroIndex].asset;
  const activeHeroRunAsset = activeSkin?.asset ?? heroes[heroIndex].runAsset;
  const secondPlayerReady = multiplayer && (!onlineMode || onlinePlayers >= 2);
  const t = uiText[language];
  const buyOrEquipSkin = (skinId: string, price: number) => {
    const key = `${heroIndex}:${skinId}`;
    if (ownedSkins.includes(key)) { setSelectedSkins((current) => ({ ...current, [heroIndex]:skinId })); return; }
    if (crystals < price) return;
    setCrystals((value) => value - price);
    setOwnedSkins((current) => [...current, key]);
    setSelectedSkins((current) => ({ ...current, [heroIndex]:skinId }));
  };
  useEffect(() => {
    document.documentElement.dataset.deviceMode = deviceMode;
    try { localStorage.setItem('contract-device-mode', deviceMode); } catch { /* Игра работает и без сохранения настройки. */ }
  }, [deviceMode]);
  const activateCheat = () => {
    const code = cheatInput.trim().toUpperCase();
    if (code === 'FLYMODE') { setFlyMode((value) => !value); setFlightY(0); setCheatMessage('Режим полёта переключён'); }
    else if (code === 'ONESHOT') { setOneShot(true); setCheatMessage('Следующий выстрел победит босса'); }
    else setCheatMessage('Неизвестный чит-код');
    setCheatInput('');
  };

  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
  useEffect(() => { player2XRef.current = player2X; }, [player2X]);
  useEffect(() => { jumpingRef.current = isJumping; }, [isJumping]);
  useEffect(() => { jumping2Ref.current = isJumping2; }, [isJumping2]);
  useEffect(() => () => {
    window.clearTimeout(heroAttackTimer.current);
    window.clearTimeout(comboTimer.current);
  }, []);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { if (data.session) setAccessScreen('game'); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (session) setAccessScreen('game'); });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { onlineSnapshot.current = { moving:isMoving, facingLeft, hero:heroIndex, weapon, shot:shotNonce, bossHealth, lives, level:levelIndex }; }, [bossHealth, facingLeft, heroIndex, isMoving, levelIndex, lives, shotNonce, weapon]);
  useEffect(() => {
    if (!onlineMode || onlineRoom.trim().length < 3) { setOnlineStatus('не подключено'); return; }
    const channel = supabase.channel(`boss-rush:${onlineRoom.trim().toUpperCase()}`, { config:{ presence:{ key:clientId.current } } });
    channel.on('presence', { event:'sync' }, () => setOnlinePlayers(Object.keys(channel.presenceState()).length));
    channel.on('broadcast', { event:'state' }, ({ payload }: { payload:OnlineState }) => {
      if (!payload || payload.id === clientId.current) return;
      setPlayer2X(payload.x); setIsJumping2(payload.jumping); setIsMoving2(payload.moving); setFacingLeft2(payload.facingLeft); setHero2Index(payload.hero);
      if (payload.level === onlineSnapshot.current.level) { setBossHealth((health) => Math.min(health, payload.bossHealth)); setLives((value) => Math.min(value, payload.lives)); }
      if (payload.shot > remoteShot.current) { remoteShot.current = payload.shot; setShots((current) => [...current, { id:shotId.current++, x:payload.x + 7, weapon:payload.weapon ?? 'normal' }]); }
    });
    channel.subscribe(async (status) => { if (status === 'SUBSCRIBED') { setOnlineStatus('подключено'); await channel.track({ joinedAt:Date.now() }); } else if (status === 'CHANNEL_ERROR') setOnlineStatus('ошибка соединения'); });
    const timer = window.setInterval(() => { const state = onlineSnapshot.current; void channel.send({ type:'broadcast', event:'state', payload:{ id:clientId.current, x:playerXRef.current, jumping:jumpingRef.current, moving:state.moving, facingLeft:state.facingLeft, hero:state.hero, weapon:state.weapon, shot:state.shot, bossHealth:state.bossHealth, lives:state.lives, level:state.level } satisfies OnlineState }); }, 90);
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); setOnlinePlayers(1); };
  }, [onlineMode, onlineRoom]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = musicVolume;
    audio.muted = !musicEnabled;
    if (musicEnabled) void audio.play().catch(() => undefined);
  }, [musicEnabled, musicVolume]);
  useEffect(() => {
    const unlockAudio = () => {
      const audio = audioRef.current;
      if (audio && musicEnabled && audio.paused) void audio.play().catch(() => undefined);
    };
    window.addEventListener('pointerdown', unlockAudio, { once:true });
    return () => window.removeEventListener('pointerdown', unlockAudio);
  }, [musicEnabled]);

  const jump = useCallback(() => {
    if (!started || paused || flyMode || isJumping || lives <= 0) return;
    setIsJumping(true);
  }, [flyMode, isJumping, lives, paused, started]);

  const shoot = useCallback(() => {
    if (!started || paused || bossHealth <= 0 || shopOpen) return;
    const now = performance.now();
    if (now - lastShotAt.current < 220) return;
    lastShotAt.current = now;
    window.clearTimeout(heroAttackTimer.current);
    setHeroAttacking(true);
    heroAttackTimer.current = window.setTimeout(() => setHeroAttacking(false), 180);
    if (musicEnabled) playCombatSound('shot', Math.max(.05, musicVolume * .24));
    setShots((current) => current.length >= 6 ? current : [...current, { id: shotId.current++, x: playerX + 7, weapon }]);
    if (onlineMode) setShotNonce((value) => value + 1);
  }, [bossHealth, musicEnabled, musicVolume, onlineMode, paused, playerX, shopOpen, started, weapon]);

  const jump2 = useCallback(() => {
    if (!multiplayer || !started || paused || isJumping2 || lives <= 0) return;
    setIsJumping2(true);
  }, [isJumping2, lives, multiplayer, paused, started]);

  const shoot2 = useCallback(() => {
    if (!multiplayer || !started || paused || bossHealth <= 0 || shopOpen) return;
    const now = performance.now();
    if (now - lastShotAt2.current < 220) return;
    lastShotAt2.current = now;
    setShots((current) => current.length >= 10 ? current : [...current, { id:shotId.current++, x:player2X + 7, weapon }]);
  }, [bossHealth, multiplayer, paused, player2X, shopOpen, started, weapon]);

  const useUltimate = useCallback(() => {
    if (!started || paused || superMeter < 100 || ultimateActive || bossHealth <= 0) return;
    setSuperMeter(0);
    setUltimateActive(true);
    setBossHealth((health) => Math.max(0, health - Math.round(500 * heroStats.super / 100)));
    setEnemyShots([]);
    window.setTimeout(() => setUltimateActive(false), 900);
  }, [bossHealth, heroStats.super, paused, started, superMeter, ultimateActive]);

  const useNova = useCallback(() => {
    if (!started || paused || superMeter < 100 || novaActive || bossHealth <= 0) return;
    setSuperMeter(0); setNovaActive(true); setEnemyShots([]);
    setBossHealth((health) => Math.max(0, health - Math.round(850 * heroStats.super / 100)));
    window.setTimeout(() => setNovaActive(false), 850);
  }, [bossHealth, heroStats.super, novaActive, paused, started, superMeter]);

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
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.code === 'KeyA') { movement.current.left = true; facing.current = -1; setFacingLeft(true); setIsMoving(true); }
      if (event.code === 'KeyD') { movement.current.right = true; facing.current = 1; setFacingLeft(false); setIsMoving(true); }
      if (multiplayer && !onlineMode && event.key === 'ArrowLeft') { movement2.current.left = true; setFacingLeft2(true); setIsMoving2(true); }
      if (multiplayer && !onlineMode && event.key === 'ArrowRight') { movement2.current.right = true; setFacingLeft2(false); setIsMoving2(true); }
      if (event.code === 'KeyW' || event.key === 'ArrowUp') movement.current.up = true;
      if (event.code === 'KeyS' || event.key === 'ArrowDown') { if (flyMode) movement.current.down = true; else setIsCrouching(true); }
      if (event.code === 'KeyP') { event.preventDefault(); shoot(); }
      if (multiplayer && !onlineMode && event.code === 'Enter') { event.preventDefault(); shoot2(); }
      if (event.code === 'KeyQ') { event.preventDefault(); useUltimate(); }
      if (event.code === 'KeyE') { event.preventDefault(); useNova(); }
      if (event.code === 'Space' || (!multiplayer && event.key === 'ArrowUp')) { event.preventDefault(); jump(); }
      if (multiplayer && !onlineMode && event.key === 'ArrowUp') { event.preventDefault(); jump2(); }
      if (event.key === 'Shift' && !event.repeat) dash();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'KeyA') movement.current.left = false;
      if (event.code === 'KeyD') movement.current.right = false;
      if (event.key === 'ArrowLeft') movement2.current.left = false;
      if (event.key === 'ArrowRight') movement2.current.right = false;
      if (event.code === 'KeyW' || event.key === 'ArrowUp') movement.current.up = false;
      if (!movement.current.left && !movement.current.right) setIsMoving(false);
      if (!movement2.current.left && !movement2.current.right) setIsMoving2(false);
      if (event.code === 'KeyS' || event.key === 'ArrowDown') { movement.current.down = false; setIsCrouching(false); }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [dash, flyMode, jump, jump2, multiplayer, onlineMode, shoot, shoot2, useNova, useUltimate]);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const move = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      const direction = timeFrozen || paused ? 0 : Number(movement.current.right) - Number(movement.current.left);
      if (direction) setPlayerX((x) => Math.min(72, Math.max(4, x + direction * 34 * (heroStats.speed / 100) * seconds)));
      if (multiplayer && !onlineMode && !paused && !timeFrozen) {
        const direction2 = Number(movement2.current.right) - Number(movement2.current.left);
        if (direction2) setPlayer2X((x) => Math.min(72, Math.max(4, x + direction2 * 34 * (heroes[hero2Index].stats.speed / 100) * seconds)));
      }
      if (flyMode && !paused) {
        const vertical = Number(movement.current.up) - Number(movement.current.down);
        if (vertical) setFlightY((y) => Math.min(43, Math.max(0, y + vertical * 38 * seconds)));
      }
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, [flyMode, hero2Index, heroStats.speed, multiplayer, onlineMode, paused, timeFrozen]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (paused) return;
      setShots((current) => {
        let hits = 0;
        let damage = 0;
        const next = current.flatMap((shot) => {
          if (shot.x >= 82) {
            hits += 1;
            damage += oneShot ? 5000 : weapons.find((item) => item.id === (shot.weapon ?? 'normal'))?.damage ?? 10;
            return [];
          }
          return [{ ...shot, x: shot.x + 2.5 }];
        });
        if (hits) {
          if (oneShot) setOneShot(false);
          setBossHealth((health) => Math.max(0, health - Math.round(damage * heroStats.damage / 100)));
          setSuperMeter((meter) => Math.min(100, meter + hits * 4));
          setHitBurst((value) => value + 1);
          if (musicEnabled) playCombatSound('impact', Math.max(.05, musicVolume * .2));
          setCombo((value) => value + hits);
          window.clearTimeout(comboTimer.current);
          comboTimer.current = window.setTimeout(() => setCombo(0), 1800);
        }
        return next;
      });
    }, 32);
    return () => window.clearInterval(timer);
  }, [heroStats.damage, musicEnabled, musicVolume, oneShot, paused]);

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
    // Небольшая передышка между сериями делает паттерны читаемыми и честными.
    const delay = Math.round(delays[levelIndex][bossPhase - 1] * difficulties[difficulty].attackSpeed * 1.25);
    const pendingAttacks = new Set<number>();
    const launchAttack = () => {
      setBossAttacking(true);
      const timer = window.setTimeout(() => {
        pendingAttacks.delete(timer);
        setBossAttacking(false);
      const counts: Partial<Record<AttackKind, number>> = { mug:2, barrel:1, carrot:3, potato:1, onion:2, fire:2, minion:2, gear:2, laser:1, clock:3 };
      const count = counts[kind] ?? 1;
      const isVegetableVolley = kind === 'carrot' || kind === 'potato' || kind === 'onion';
      const volley = Array.from({ length: count }, (_, index): EnemyShot => ({
        id: shotId.current++, x: 82 + index * (isVegetableVolley ? 12 : kind === 'laser' ? 16 : 8),
        lane: isVegetableVolley || kind === 'barrel' ? 'low' : kind === 'mug' ? (index % 2 === 0 ? 'low' : 'high') : index % 2 === 0 ? 'low' : 'high', kind,
      }));
      setEnemyShots((current) => [...current, ...volley]);
      }, 260);
      pendingAttacks.add(timer);
    };
    const attack = window.setInterval(launchAttack, delay);
    return () => { window.clearInterval(attack); pendingAttacks.forEach(window.clearTimeout); setBossAttacking(false); };
  }, [bossHealth, bossPhase, difficulty, levelIndex, lives, paused, started]);

  useEffect(() => {
    if (!started || paused || level.theme !== 'fire' || bossPhase !== 2 || lives <= 0) return;
    let impactTimer = 0;
    const slam = window.setInterval(() => {
      setBossSlamming(true);
      impactTimer = window.setTimeout(() => {
        const insideLandingZone = Math.abs(playerXRef.current - 64) <= 20;
        if (!jumpingRef.current && insideLandingZone) setLives((value) => Math.max(0, value - difficulties[difficulty].damage));
        setBossSlamming(false);
      }, 850);
    }, Math.round(3200 * difficulties[difficulty].attackSpeed));
    return () => { window.clearInterval(slam); window.clearTimeout(impactTimer); setBossSlamming(false); };
  }, [bossPhase, difficulty, level.theme, lives, paused, started]);

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
        const hitsPlayer1 = nextX <= heroX + 7 && nextX >= heroX - 2 && canHit;
        const canHit2 = shot.lane === 'high' ? jumping2Ref.current : !jumping2Ref.current;
        const hitsPlayer2 = secondPlayerReady && nextX <= player2XRef.current + 7 && nextX >= player2XRef.current - 2 && canHit2;
        if (hitsPlayer1 || hitsPlayer2) {
          if (!invulnerable && !hitRegistered) {
            hitRegistered = true;
            setLives((value) => Math.max(0, value - difficulties[difficulty].damage));
            setInvulnerable(true);
            setDamageFlash(true);
            if (musicEnabled) playCombatSound('damage', Math.max(.06, musicVolume * .25));
            setCombo(0);
            window.clearTimeout(comboTimer.current);
            window.setTimeout(() => setInvulnerable(false), 900);
            window.setTimeout(() => setDamageFlash(false), 260);
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
  }, [bossPhase, difficulty, invulnerable, musicEnabled, musicVolume, paused, secondPlayerReady]);

  const restart = () => { movement.current = { left:false, right:false, up:false, down:false }; movement2.current = { left:false, right:false }; window.clearTimeout(comboTimer.current); setBossHealth(bossMaxHealth); setShots([]); setEnemyShots([]); setLives(heroStats.health + (secondPlayerReady ? 2 : 0)); setPlayerX(14); setPlayer2X(24); setIsJumping(false); setIsJumping2(false); setIsMoving(false); setIsMoving2(false); setIsCrouching(false); setBossSlamming(false); setHeroAttacking(false); setBossAttacking(false); setDamageFlash(false); setCombo(0); setSuperMeter(0); setUltimateActive(false); setNovaActive(false); setTimeFrozen(false); setInked(false); setInvulnerable(false); setFlightY(0); setPaused(false); setSettingsOpen(false); setStarted(true); };
  const openContract = (index: number) => { setLevelIndex(index); restart(); setStarted(false); setMapOpen(false); };

  if (introOpen) return <IntroScreen deviceMode={deviceMode} onDeviceModeChange={setDeviceMode} onStart={() => setIntroOpen(false)} />;
  if (accessScreen === 'choose') return <main className="login-screen"><section className="login-card welcome-card"><p className="eyebrow">КОНТРАКТ · ИГРОВАЯ КОЛЛЕКЦИЯ</p><h1>Выбери режим</h1><p>Главная кампания, аркада и тактическая дуэль — в одной игре.</p><button className="guest-button featured-mode" onClick={() => setAccessScreen('game')}><b>BOSS-RUSH</b><small>Главная кампания · 4 уникальных босса</small></button><button onClick={() => setAccessScreen('auth')}>ВОЙТИ ИЛИ СОЗДАТЬ АККАУНТ</button><button className="snake-button" onClick={() => setAccessScreen('snake')}>ЗАПУСТИТЬ ЗМЕЙКУ 3D</button><button className="duel-button" onClick={() => setAccessScreen('duel')}>КРЕПОСТНАЯ ДУЭЛЬ</button><button className="text-button" onClick={() => setIntroOpen(true)}>← НА СТАРТОВЫЙ ЭКРАН</button></section></main>;
  if (accessScreen === 'auth') return <Auth onAuthenticated={() => setAccessScreen('game')} onBack={() => setAccessScreen('choose')} />;
  if (accessScreen === 'snake') return <Snake3D onBack={() => setAccessScreen('choose')} />;
  if (accessScreen === 'duel') return <CastleDuel onBack={() => setAccessScreen('choose')} />;
  if (mapOpen) return <main className="world-map"><header><p className="eyebrow">ОСТРОВА КОНТРАКТОВ</p><h1>Выбери следующего босса</h1><span>Монеты: ∞</span><div className="mode-selectors"><section><b>СЛОЖНОСТЬ</b>{(Object.keys(difficulties) as Difficulty[]).map((id) => <button className={difficulty === id ? 'selected' : ''} key={id} onClick={() => { setDifficulty(id); setBossHealth(difficulties[id].bossHp); }}>{difficulties[id].label}</button>)}</section><section><b>РЕЖИМ</b><button className={!multiplayer ? 'selected' : ''} onClick={() => { setMultiplayer(false); setOnlineMode(false); }}>1 ИГРОК</button><button className={multiplayer && !onlineMode ? 'selected' : ''} onClick={() => { setMultiplayer(true); setOnlineMode(false); }}>2 НА ОДНОМ ПК</button><button className={onlineMode ? 'selected' : ''} onClick={() => { setMultiplayer(true); setOnlineMode(true); }}>ОНЛАЙН</button>{multiplayer && !onlineMode && <select value={hero2Index} onChange={(event) => setHero2Index(Number(event.target.value))}>{heroes.map((hero,index) => <option key={hero.name} value={index}>Игрок 2: {hero.name}</option>)}</select>}</section>{onlineMode && <section className="online-room"><b>КОМНАТА</b><input value={onlineRoom} maxLength={12} onChange={(event) => setOnlineRoom(event.target.value.replace(/[^a-zа-я0-9-]/gi,'').toUpperCase())} /><span className={onlineStatus === 'подключено' ? 'online-ok' : ''}>● {onlineStatus} · игроков: {onlinePlayers}</span></section>}</div></header><div className="map-road" /> <div className="map-nodes">{levels.map((item, index) => <button key={item.boss} className={`map-node map-node--${item.theme}`} onClick={() => openContract(index)}><span>{index + 1}</span><b>{item.boss}</b><small>{item.title}</small></button>)}</div></main>;

  return (
    <main className="game-page">
      <header className="game-header">
        <div><span className="eyebrow">КОНТРАКТ {levelIndex + 1} / {levels.length}</span><h1>{level.title}</h1></div>
        <div className="header-actions"><button className="crystal-balance" onClick={() => { setCrystalShopOpen(true); setPaused(true); }}>💎 {crystals}</button><button className="shop-button" onClick={() => setMapOpen(true)}>{t.map}</button><button className="shop-button" onClick={() => setHeroMenuOpen(true)}>{t.hero}</button><button className="shop-button" onClick={() => setShopOpen(true)}>{t.shop}</button><button className="shop-button ai-coach-button" onClick={() => { setGeminiOpen(true); setPaused(true); }}>✦ ИИ</button><button className="shop-button settings-button" onClick={() => { setSettingsOpen(true); setPaused(true); }}>⚙ {t.settings}</button><div className="lives" aria-label={`${lives} ${t.lives}`}>{'♥ '.repeat(lives)}<i>{'♥ '.repeat(Math.max(0, heroStats.health - lives))}</i></div></div>
      </header>

      <section key={levelIndex} className={`stage stage--${level.theme} ${timeFrozen ? 'stage--frozen' : ''} ${damageFlash ? 'stage--damage' : ''} ${paused ? 'stage--paused' : ''}`} onClick={shoot}>
        <div className="adventure-backdrop" aria-hidden="true"><i className="sky-orb" /><i className="cloud cloud--one" /><i className="cloud cloud--two" /><div className="mountains" /><div className="far-land" /><div className="castle"><i /><i /><i /></div><div className="platform platform--one" /><div className="platform platform--two" /></div>
        <div className="map-depth"><i /><i /><i /><i /><i /></div>
        <div className="curtain curtain--left" /><div className="curtain curtain--right" />
        <div className="spotlight" />
        <div className="boss-bar"><span style={{ width: `${bossHealth / bossMaxHealth * 100}%` }} /><b>{t.phase} {bossPhase} · {bossHealth} HP · {difficulties[difficulty].label}</b></div>
        <div className={`super-meter ${superMeter >= 100 ? 'super-meter--ready' : ''}`}><b>{t.ultimate} · Q</b><span><i style={{ width: `${superMeter}%` }} /></span></div>
        <div className={`boss boss--${level.theme} boss--phase-${bossPhase} ${bossSlamming ? 'boss--slam' : ''} ${bossAttacking ? 'boss--attacking' : ''}`} aria-label={level.boss}><HeroSprite src={level.asset} className="dragon-sprite" label={level.boss} />{bossAttacking && <i className="boss-attack-flash" />}</div>
        {hitBurst > 0 && <div key={hitBurst} className="boss-hit-burst"><i /><i /><i /></div>}
        {combo >= 2 && <div className="combo-counter"><strong>{combo}</strong><span>COMBO</span></div>}
        {bossSlamming && <div className="landing-wave" aria-label="Зона приземления" />}
        {level.theme === 'fire' && bossPhase === 4 && <div className="dragon-kids" aria-label="Дети дракона"><HeroSprite src="/assets/dragon-source.png" className="dragon-kid dragon-kid--one" /><HeroSprite src="/assets/dragon-source.png" className="dragon-kid dragon-kid--two" /></div>}
        {shots.map((shot) => { const asset = weaponProjectileAssets[shot.weapon ?? 'normal']; return <i className={`shot shot--${shot.weapon ?? 'normal'} ${asset ? 'shot--art' : ''}`} key={shot.id} style={{ left: `${shot.x}%` }}>{asset && <ProjectileSprite src={asset} label="Снаряд героя" />}</i>; })}
        {ultimateActive && <div className="ultimate-beam"><i /></div>}
        {novaActive && <div className="ultimate-nova" />}
        {inked && <div className="ink-splash" aria-label="Чернила закрывают обзор" />}
        {enemyShots.map((shot) => { const asset = bossProjectileAssets[shot.kind]; return <i className={`enemy-shot enemy-shot--${shot.lane} enemy-shot--${shot.kind} ${asset ? 'enemy-shot--art' : ''}`} key={shot.id} style={{ left: `${shot.x}%` }} aria-label="Атака босса">{asset && <ProjectileSprite src={asset} label="Атака босса" />}</i>; })}
        <div className={`player skin--${selectedSkins[heroIndex]} ${heroAttacking ? 'player--attacking' : ''} ${flyMode ? 'player--flying' : ''} ${invulnerable ? 'player--hit' : ''} ${isJumping ? 'player--jump' : ''} ${isCrouching ? 'player--crouch' : ''} ${isMoving ? 'player--moving' : ''} ${facingLeft ? 'player--left' : ''}`} style={{ left: `${playerX}%`, ...(flyMode ? { bottom:`${13 + flightY}%` } : {}) }} onAnimationEnd={(event) => { if (event.animationName === 'jump' || event.animationName === 'jump-left') setIsJumping(false); }}><HeroSprite src={activeHeroAsset} className="hero-sprite hero-sprite--base" fitScale={heroIndex === 0 ? 0.55 : 0.77} /><HeroSprite src={activeHeroRunAsset} className="hero-sprite hero-sprite--run-frame" fitScale={heroIndex === 0 ? 0.55 : 0.77} />{heroAttacking && <i className="hero-muzzle-flash" />}</div>
        {secondPlayerReady && <div className={`player player--two ${invulnerable ? 'player--hit' : ''} ${isJumping2 ? 'player--jump' : ''} ${isMoving2 ? 'player--moving' : ''} ${facingLeft2 ? 'player--left' : ''}`} style={{ left:`${player2X}%` }} onAnimationEnd={(event) => { if (event.animationName === 'jump' || event.animationName === 'jump-left') setIsJumping2(false); }}><HeroSprite src={heroes[hero2Index].asset} className="hero-sprite hero-sprite--base" fitScale={hero2Index === 0 ? .55 : .77} /><HeroSprite src={heroes[hero2Index].runAsset} className="hero-sprite hero-sprite--run-frame" fitScale={hero2Index === 0 ? .55 : .77} /><b className="player-number">2</b></div>}
        {onlineMode && !secondPlayerReady && <div className="online-waiting"><i /><span>ОЖИДАНИЕ ВТОРОГО ИГРОКА</span><small>Комната: {onlineRoom}</small></div>}
        <div className="floor" />
        {!started && <div className="overlay story-cutscene" onClick={(event) => event.stopPropagation()}><p>{t.contract} №{levelIndex + 1} · ИСТОРИЯ</p><div className="cutscene-cast"><div><HeroSprite src={activeHeroAsset} className="cutscene-hero" /><b>{heroes[heroIndex].name}</b></div><i>VS</i><div><HeroSprite src={level.asset} className="cutscene-boss" /><b>{level.boss}</b></div></div><h2>{level.title}</h2><p className="cutscene-story">{level.story}</p><p className="cutscene-hero-story">{heroes[heroIndex].bio}</p><button onClick={() => setStarted(true)}>{t.start}</button></div>}
        {bossHealth === 0 && <div className="overlay"><p>КОНТРАКТ ВЫПОЛНЕН!</p><h2>{level.boss} побеждён</h2><button onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}>ВЕРНУТЬСЯ НА КАРТУ</button></div>}
        {lives === 0 && <div className="overlay"><p>ЗАНАВЕС...</p><h2>Контракт не выполнен</h2><button onClick={(e) => { e.stopPropagation(); restart(); }}>ЕЩЁ РАЗ</button></div>}
        {shopOpen && <div className="overlay shop" onClick={(e) => e.stopPropagation()}><p>ОРУЖЕЙНАЯ ЛАВКА · БАЛАНС ∞</p><h2>Восемь оружий</h2><div className="shop-items">{weapons.map((item) => <button className={weapon === item.id ? 'selected' : ''} key={item.id} onClick={() => setWeapon(item.id)}><i className={`weapon-icon weapon-icon--${item.id}`} /><b>{item.name}</b><small>{item.damage} урона · куплено</small></button>)}</div><p>Ульты: <kbd>Q</kbd> энергетический луч · <kbd>E</kbd> звёздная вспышка</p><button onClick={() => setShopOpen(false)}>ВЕРНУТЬСЯ В БОЙ</button></div>}
        {heroMenuOpen && <div className="overlay hero-menu" onClick={(e) => e.stopPropagation()}><p>ВЫБОР ГЕРОЯ</p><h2>Кто идёт в бой?</h2><div className="hero-cards">{heroes.map((hero, index) => <button className={heroIndex === index ? 'selected' : ''} key={hero.name} onClick={() => { setHeroIndex(index); setLives(hero.stats.health); }}><HeroSprite src={hero.asset} className="hero-preview" label={hero.name} /><b>{hero.name}</b><small className="hero-role">{hero.role}</small><small className="hero-bio">{hero.bio}</small><div className="hero-stats"><span><em>HP</em><i style={{ width:`${hero.stats.health * 20}%` }} /></span><span><em>СКР</em><i style={{ width:`${Math.min(100, hero.stats.speed / 1.4)}%` }} /></span><span><em>УРОН</em><i style={{ width:`${Math.min(100, hero.stats.damage / 1.4)}%` }} /></span><span><em>УЛЬТА</em><i style={{ width:`${Math.min(100, hero.stats.super / 1.4)}%` }} /></span></div></button>)}</div><button onClick={() => setHeroMenuOpen(false)}>ГОТОВО</button></div>}
        {crystalShopOpen && <div className="overlay crystal-shop" onClick={(event) => event.stopPropagation()}>
          <p>💎 КРИСТАЛЬНАЯ ЛАВКА · {crystals}</p><h2>Скины для {heroes[heroIndex].name}</h2>
          <div className="skin-list">{heroSkins[heroIndex].map((skin) => {
            const owned = ownedSkins.includes(`${heroIndex}:${skin.id}`);
            const equipped = selectedSkins[heroIndex] === skin.id;
            return <button className={`skin-card skin-card--${skin.id} ${equipped ? 'selected' : ''}`} key={skin.id} onClick={() => buyOrEquipSkin(skin.id, skin.price)} disabled={!owned && crystals < skin.price}><HeroSprite src={skin.asset ?? heroes[heroIndex].asset} className="skin-preview" /><b>{skin.name}</b><small>{equipped ? 'НАДЕТО' : owned ? 'ВЫБРАТЬ' : `💎 ${skin.price}`}</small></button>;
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
            <label><span>Устройство</span><select value={deviceMode} onChange={(event) => setDeviceMode(event.target.value as DeviceMode)}><option value="auto">Авто</option><option value="desktop">Компьютер</option><option value="mobile">Телефон</option></select></label>
            <label className="cheat-field"><span>Чит-код</span><input value={cheatInput} onChange={(event) => setCheatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') activateCheat(); }} placeholder="Введи код" /></label>
          </div>
          {cheatMessage && <small className="cheat-message">{cheatMessage}</small>}
          <button className="cheat-activate" onClick={activateCheat}>АКТИВИРОВАТЬ КОД</button>
          <div className="settings-actions"><button onClick={() => { setSettingsOpen(false); setPaused(false); }}>{t.resume}</button><button onClick={restart}>{t.restart}</button></div>
        </div>}
        {geminiOpen && <GeminiCoach boss={level.boss} phase={bossPhase} weapon={weapons.find((item) => item.id === weapon)?.name ?? weapon} hero={heroes[heroIndex].name} onClose={() => { setGeminiOpen(false); setPaused(false); }} />}
        <div className="mobile-controls" onClick={(event) => event.stopPropagation()} aria-label="Мобильное управление">
          <div className="mobile-pad">
            <button className="mobile-button mobile-button--left" aria-label="Двигаться влево" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startMobileMove('left'); }} onPointerUp={() => stopMobileMove('left')} onPointerCancel={() => stopMobileMove('left')} onLostPointerCapture={() => stopMobileMove('left')}>◀</button>
            <button className="mobile-button mobile-button--right" aria-label="Двигаться вправо" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startMobileMove('right'); }} onPointerUp={() => stopMobileMove('right')} onPointerCancel={() => stopMobileMove('right')} onLostPointerCapture={() => stopMobileMove('right')}>▶</button>
          </div>
          <div className="mobile-actions">
            {flyMode && <><button className="mobile-button mobile-button--fly" aria-label="Лететь вверх" onPointerDown={() => { movement.current.up = true; }} onPointerUp={() => { movement.current.up = false; }} onPointerCancel={() => { movement.current.up = false; }}>⇧</button><button className="mobile-button mobile-button--fly" aria-label="Лететь вниз" onPointerDown={() => { movement.current.down = true; }} onPointerUp={() => { movement.current.down = false; }} onPointerCancel={() => { movement.current.down = false; }}>⇩</button></>}
            <button className="mobile-button mobile-button--dash" aria-label="Рывок" onPointerDown={(event) => { event.preventDefault(); dash(); }}>↠<small>РЫВОК</small></button>
            <button className="mobile-button mobile-button--jump" aria-label="Прыжок" onPointerDown={(event) => { event.preventDefault(); jump(); }}>↑<small>ПРЫЖОК</small></button>
            <button className="mobile-button mobile-button--shoot" aria-label="Стрелять" onPointerDown={(event) => { event.preventDefault(); shoot(); }}>●<small>ОГОНЬ</small></button>
            <button className={`mobile-button mobile-button--super ${superMeter >= 100 ? 'ready' : ''}`} aria-label="Ульта" onPointerDown={(event) => { event.preventDefault(); useUltimate(); }}>★<small>УЛЬТА</small></button>
          </div>
        </div>
      </section>

      <footer className="controls"><span>ИГРОК 1: <kbd>A</kbd><kbd>D</kbd> · <kbd>SPACE</kbd> · <kbd>P</kbd></span>{multiplayer && <span>ИГРОК 2: <kbd>←</kbd><kbd>→</kbd> · <kbd>↑</kbd> · <kbd>ENTER</kbd></span>}<span><kbd>Q</kbd> луч</span><span><kbd>E</kbd> вспышка</span><span><kbd>SHIFT</kbd> рывок</span></footer>
      <audio ref={audioRef} className="game-music" controls autoPlay loop src="/audio/i-will-survive.mp3">Музыка не поддерживается браузером.</audio>
    </main>
  );
}
