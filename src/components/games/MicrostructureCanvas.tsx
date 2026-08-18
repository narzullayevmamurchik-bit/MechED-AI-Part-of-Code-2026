import { useEffect, useRef } from "react";

interface Props {
  ferrite: number;
  pearlite: number;
  martensite: number;
  bainite: number;
}

export function MicrostructureCanvas({ ferrite, pearlite, martensite, bainite }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width;
    const H = c.height;
    ctx.fillStyle = "hsl(var(--muted))";
    ctx.fillRect(0, 0, W, H);

    const phases = [
      { ratio: ferrite / 100, color: "hsl(48 80% 70%)" }, // ferrite (yellow)
      { ratio: pearlite / 100, color: "hsl(220 30% 35%)" }, // pearlite (dark blue)
      { ratio: martensite / 100, color: "hsl(0 0% 92%)" }, // martensite (light)
      { ratio: bainite / 100, color: "hsl(160 35% 35%)" }, // bainite (teal-green)
    ];

    const grains = 220;
    for (let i = 0; i < grains; i++) {
      const r = Math.random();
      let acc = 0;
      let color = phases[0].color;
      for (const p of phases) {
        acc += p.ratio;
        if (r <= acc) {
          color = p.color;
          break;
        }
      }
      const x = Math.random() * W;
      const y = Math.random() * H;
      const radius = 6 + Math.random() * 10;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [ferrite, pearlite, martensite, bainite]);

  return (
    <canvas
      ref={ref}
      width={400}
      height={260}
      className="w-full rounded-lg border border-border bg-muted"
    />
  );
}
