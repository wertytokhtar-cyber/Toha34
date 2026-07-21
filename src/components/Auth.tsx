import { useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthProps = { onAuthenticated: () => void; onBack: () => void };

export function Auth({ onAuthenticated, onBack }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) setMessage(result.error.message);
      else if (result.data.session) onAuthenticated();
      else setMessage('Аккаунт создан. Подтверди email и затем войди.');
    } catch { setMessage('Не удалось подключиться. Попробуй ещё раз.'); }
    finally { setBusy(false); }
  }

  async function signInWithGoogle() {
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) { setMessage(`Google: ${error.message}`); setBusy(false); }
  }

  return <main className="login-screen"><section className="login-card">
    <p className="eyebrow">ЧЕРНИЛЬНЫЙ ДОЛГ</p>
    <h1>{mode === 'signin' ? 'Вход в игру' : 'Новый герой'}</h1>
    <form onSubmit={handleSubmit} className="login-form">
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Пароль — минимум 6 символов" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
      <button type="submit" disabled={busy}>{busy ? 'Подождите…' : mode === 'signin' ? 'ВОЙТИ' : 'СОЗДАТЬ АККАУНТ'}</button>
    </form>
    <div className="auth-divider"><span>или</span></div>
    <button className="google-auth-button" onClick={signInWithGoogle} disabled={busy}><i>G</i> ПРОДОЛЖИТЬ С GOOGLE</button>
    {message && <p className="login-message">{message}</p>}
    <button className="text-button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}</button>
    <button className="text-button" onClick={onBack}>← Назад</button>
  </section></main>;
}
