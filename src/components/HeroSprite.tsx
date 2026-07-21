import { useEffect, useRef } from 'react';

type Props = { src?: string; className?: string; label?: string; fitScale?: number };

export default function HeroSprite({ src = '/assets/hero-muhamedi.png', className = 'hero-sprite', label = 'Игровой герой', fitScale = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const image = new Image();
    image.src = src;
    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.drawImage(image, 0, 0);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = frame.data;

      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const keyStrength = Math.min(red, blue) - green;
        if (red > 180 && blue > 180 && keyStrength > 90) {
          pixels[index + 3] = Math.max(0, 255 - (keyStrength - 90) * 4);
          pixels[index] = Math.min(red, green * 2);
          pixels[index + 2] = Math.min(blue, green * 2);
        }
      }
      context.putImageData(frame, 0, 0);

      let left = canvas.width, right = 0, top = canvas.height, bottom = 0;
      for (let y = 0; y < canvas.height; y += 3) {
        for (let x = 0; x < canvas.width; x += 3) {
          if (pixels[(y * canvas.width + x) * 4 + 3] > 30) {
            left = Math.min(left, x); right = Math.max(right, x);
            top = Math.min(top, y); bottom = Math.max(bottom, y);
          }
        }
      }
      const source = document.createElement('canvas');
      source.width = canvas.width; source.height = canvas.height;
      source.getContext('2d')?.drawImage(canvas, 0, 0);
      const width = Math.max(1, right - left);
      const height = Math.max(1, bottom - top);
      const scale = Math.min(540 / width, 840 / height) * fitScale;
      canvas.width = 600; canvas.height = 900;
      const drawWidth = width * scale, drawHeight = height * scale;
      context.drawImage(source, left, top, width, height, (600 - drawWidth) / 2, 900 - drawHeight - 25, drawWidth, drawHeight);
    };
  }, [fitScale, src]);

  return <canvas ref={canvasRef} className={className} aria-label={label} />;
}
