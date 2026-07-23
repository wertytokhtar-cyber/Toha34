export type DeviceMode = 'auto' | 'desktop' | 'mobile';

type Props = {
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  onStart: () => void;
};

const devices: Array<{ id:DeviceMode; icon:string; title:string; hint:string }> = [
  { id:'auto', icon:'◎', title:'Авто', hint:'Определить устройство' },
  { id:'desktop', icon:'⌨', title:'Компьютер', hint:'Клавиатура и большой экран' },
  { id:'mobile', icon:'▯', title:'Телефон', hint:'Сенсорные кнопки' },
];

export function IntroScreen({ deviceMode, onDeviceModeChange, onStart }: Props) {
  return <main className="contract-intro">
    <div className="intro-noise" aria-hidden="true" />
    <div className="intro-seal" aria-hidden="true"><span>4</span><small>КОНТРАКТА</small></div>
    <section className="intro-content">
      <p className="intro-kicker">ИНТЕРАКТИВНОЕ ПРИКЛЮЧЕНИЕ</p>
      <h1>КОНТРАКТ</h1>
      <p className="intro-tagline">Выбери героя. Прими вызов. Победи четырёх уникальных боссов.</p>
      <div className="intro-features" aria-label="Возможности игры">
        <span>⚔ 4 босса и фазы</span><span>◆ 8 видов оружия</span><span>♟ 4 героя</span><span>⌁ Онлайн и кооператив</span>
      </div>
      <div className="device-picker">
        <b>НА КАКОМ УСТРОЙСТВЕ ИГРАЕМ?</b>
        <div>{devices.map((device) => <button key={device.id} className={deviceMode === device.id ? 'selected' : ''} onClick={() => onDeviceModeChange(device.id)} aria-pressed={deviceMode === device.id}>
          <i>{device.icon}</i><strong>{device.title}</strong><small>{device.hint}</small>
        </button>)}</div>
      </div>
      <button className="intro-start" onClick={onStart}><span>НАЧАТЬ ИГРУ</span><i>→</i></button>
      <p className="intro-controls">{deviceMode === 'mobile' ? 'Используй экранные кнопки движения, прыжка и огня' : 'WASD — движение · ПРОБЕЛ — прыжок · P — огонь · Q/E — ульты'}</p>
    </section>
    <footer>Boss Rush · Demo Edition 2026</footer>
  </main>;
}
