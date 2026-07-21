import { useEffect, useRef } from 'react';

type Props = { src:string; className?:string; label?:string };
const spriteCache = new Map<string, Promise<HTMLCanvasElement>>();

function loadSprite(src:string): Promise<HTMLCanvasElement> {
  const cached = spriteCache.get(src);
  if (cached) return cached;

  const pending = new Promise<HTMLCanvasElement>((resolve, reject) => {
    const image = new Image();
    image.src = src;
    image.onerror = () => reject(new Error(`Не удалось загрузить снаряд: ${src}`));
    image.onload = () => {
      const work = document.createElement('canvas');
      work.width = image.naturalWidth;
      work.height = image.naturalHeight;
      const workContext = work.getContext('2d', { willReadFrequently:true });
      if (!workContext) { reject(new Error('Canvas недоступен')); return; }
      workContext.drawImage(image, 0, 0);
      const frame = workContext.getImageData(0, 0, work.width, work.height);
      const pixels = frame.data;
      let left = work.width, right = 0, top = work.height, bottom = 0;

      for (let y = 0; y < work.height; y++) {
        for (let x = 0; x < work.width; x++) {
          const index = (y * work.width + x) * 4;
          const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
          const magenta = Math.min(red, blue) - green;
          if (red > 165 && blue > 165 && magenta > 65) {
            pixels[index + 3] = Math.max(0, 255 - (magenta - 65) * 5);
            pixels[index] = Math.min(red, green * 2);
            pixels[index + 2] = Math.min(blue, green * 2);
          }
          if (pixels[index + 3] > 35) {
            left = Math.min(left, x); right = Math.max(right, x);
            top = Math.min(top, y); bottom = Math.max(bottom, y);
          }
        }
      }
      workContext.putImageData(frame, 0, 0);
      const width = Math.max(1, right - left + 1);
      const height = Math.max(1, bottom - top + 1);
      const scale = Math.min(1, 320 / Math.max(width, height));
      const sprite = document.createElement('canvas');
      sprite.width = Math.max(1, Math.round(width * scale));
      sprite.height = Math.max(1, Math.round(height * scale));
      sprite.getContext('2d')?.drawImage(work, left, top, width, height, 0, 0, sprite.width, sprite.height);
      resolve(sprite);
    };
  });
  spriteCache.set(src, pending);
  pending.catch(() => spriteCache.delete(src));
  return pending;
}

// Удаляет однотонный фон и плотно обрезает снаряд при загрузке.
export default function ProjectileSprite({ src, className = 'projectile-sprite', label = 'Снаряд' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    let active = true;
    void loadSprite(src).then((sprite) => {
      if (!active) return;
      canvas.width = sprite.width;
      canvas.height = sprite.height;
      context.drawImage(sprite, 0, 0);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [src]);

  return <canvas ref={canvasRef} className={className} aria-label={label} />;
}
