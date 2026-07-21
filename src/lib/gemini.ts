import { supabase } from './supabase';

export async function askGameCoach(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ text?: string; error?: string }>('ai', {
    body: {
      prompt,
      system: 'Ты дружелюбный тренер игры Boss Rush. Отвечай на языке вопроса, коротко: максимум 5 предложений. Давай только практичные советы по боссу, движению и оружию. Не выдумывай механики, которых нет в описании.',
    },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.text?.trim()) throw new Error('Gemini не вернул ответ. Попробуй ещё раз.');
  return data.text.trim();
}
