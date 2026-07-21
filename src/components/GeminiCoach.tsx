import { FormEvent, useState } from 'react';
import { askGameCoach } from '../lib/gemini';

type GeminiCoachProps = {
  boss: string;
  phase: number;
  weapon: string;
  hero: string;
  onClose: () => void;
};

export function GeminiCoach({ boss, phase, weapon, hero, onClose }: GeminiCoachProps) {
  const [question, setQuestion] = useState('Как победить этого босса?');
  const [answer, setAnswer] = useState('Нажми «Спросить», и Gemini подскажет тактику для текущего боя.');
  const [loading, setLoading] = useState(false);

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      setAnswer(await askGameCoach(`Сейчас босс: ${boss}, фаза: ${phase}, герой: ${hero}, оружие: ${weapon}. Вопрос игрока: ${question.trim()}`));
    } catch (error) {
      setAnswer(error instanceof Error ? `Ошибка: ${error.message}` : 'Не удалось связаться с Gemini.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="overlay gemini-coach" onClick={(event) => event.stopPropagation()}>
    <p>✦ GEMINI · ИИ-ТРЕНЕР</p>
    <h2>Подсказка для боя</h2>
    <div className="coach-context"><span>{boss}</span><span>Фаза {phase}</span><span>{hero}</span></div>
    <div className="coach-answer">{loading ? 'Gemini думает…' : answer}</div>
    <form onSubmit={ask}><input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={240} placeholder="Спроси про тактику или оружие" /><button disabled={loading}>СПРОСИТЬ</button></form>
    <button className="coach-close" onClick={onClose}>ЗАКРЫТЬ И ПРОДОЛЖИТЬ</button>
  </div>;
}
