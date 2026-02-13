"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, motion } from "framer-motion";

interface Star {
  x: number;
  y: number;
  z: number; // depth layer 0-1
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

function createStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      size: Math.random() * 1.8 + 0.3,
      brightness: Math.random() * 0.6 + 0.4,
      twinkleSpeed: Math.random() * 0.003 + 0.001,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>(createStars(280));
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { damping: 50, stiffness: 100 });
  const springY = useSpring(mouseY, { damping: 50, stiffness: 100 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }

    resize();
    window.addEventListener("resize", resize);

    function draw(time: number) {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // Deep space gradient
      const grad = ctx.createRadialGradient(
        w * 0.4,
        h * 0.3,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.8
      );
      grad.addColorStop(0, "#0d1020");
      grad.addColorStop(0.4, "#080c18");
      grad.addColorStop(1, "#040610");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Nebula haze — very subtle
      const nebulaGrad = ctx.createRadialGradient(
        w * 0.7,
        h * 0.6,
        0,
        w * 0.7,
        h * 0.6,
        w * 0.4
      );
      nebulaGrad.addColorStop(0, "rgba(40, 50, 120, 0.04)");
      nebulaGrad.addColorStop(0.5, "rgba(60, 30, 90, 0.02)");
      nebulaGrad.addColorStop(1, "transparent");
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, w, h);

      const mx = springX.get();
      const my = springY.get();

      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const parallax = s.z * 20;
        const px = s.x * w + (mx - 0.5) * parallax;
        const py = s.y * h + (my - 0.5) * parallax;

        const twinkle =
          Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7;
        const alpha = s.brightness * twinkle;

        // Star glow
        if (s.size > 1) {
          const glowR = s.size * 4;
          const glowGrad = ctx.createRadialGradient(
            px, py, 0, px, py, glowR
          );
          glowGrad.addColorStop(0, `rgba(180, 200, 255, ${alpha * 0.15})`);
          glowGrad.addColorStop(1, "transparent");
          ctx.fillStyle = glowGrad;
          ctx.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2);
        }

        // Star core
        ctx.beginPath();
        ctx.arc(px, py, s.size * window.devicePixelRatio * 0.5, 0, Math.PI * 2);
        const warmth = s.z > 0.7 ? 220 : s.z > 0.4 ? 200 : 180;
        ctx.fillStyle = `rgba(${warmth}, ${warmth + 20}, 255, ${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [springX, springY]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="starfield-bg"
      onMouseMove={(e) => {
        mouseX.set(e.clientX / window.innerWidth);
        mouseY.set(e.clientY / window.innerHeight);
      }}
      style={{ pointerEvents: "auto" }}
    />
  );
}
