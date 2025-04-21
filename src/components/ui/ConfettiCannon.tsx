'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

// --- Adapted Confetti Logic ---

// Utility functions grouped into a single object
const Utils = {
  parsePx: (value: string): number => parseFloat(value.replace(/px/, "")),
  getRandomInRange: (min: number, max: number, precision: number = 0): number => {
    const multiplier = Math.pow(10, precision);
    const randomValue = Math.random() * (max - min) + min;
    return Math.floor(randomValue * multiplier) / multiplier;
  },
  getRandomItem: <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)],
  getScaleFactor: (): number => {
    if (typeof window === 'undefined') return 1; // Avoid errors during SSR/build
    return Math.min(2, Math.max(0.5, Math.log(window.innerWidth) / Math.log(1920))); // Clamp scale factor
  },
  debounce: <T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  },
};

const DEG_TO_RAD = Math.PI / 180;

const defaultConfettiConfig = {
  confettiesNumber: 250,
  confettiRadius: 6,
  confettiColors: [
    "#fcf403", "#62fc03", "#f4fc03", "#03e7fc", "#03fca5", "#a503fc", "#fc03ad", "#fc03c2"
  ],
  emojies: [] as string[],
  svgIcon: null as string | null,
};

type ConfettiConfig = typeof defaultConfettiConfig;

interface ConfettiProps {
  initialPosition: { x: number; y: number };
  direction: "left" | "right";
  radius: number;
  colors: string[];
  emojis: string[];
  svgIcon: string | null;
}

class Confetti {
  speed: { x: number; y: number };
  finalSpeedX: number;
  rotationSpeed: number;
  dragCoefficient: number;
  radius: { x: number; y: number };
  initialRadius: number;
  rotationAngle: number;
  emojiRotationAngle: number;
  radiusYDirection: "down" | "up";
  absCos: number;
  absSin: number;
  position: { x: number; y: number };
  initialPosition: { x: number; y: number };
  color: string | null;
  emoji: string | null;
  svgIcon: HTMLImageElement | null = null;
  svgImage: HTMLImageElement | null = null;
  createdAt: number;
  direction: "left" | "right";

  constructor({ initialPosition, direction, radius, colors, emojis, svgIcon }: ConfettiProps) {
    const speedFactor = Utils.getRandomInRange(0.9, 1.7, 3) * Utils.getScaleFactor();
    this.speed = { x: speedFactor, y: speedFactor };
    this.finalSpeedX = Utils.getRandomInRange(0.2, 0.6, 3);
    this.rotationSpeed = emojis.length || svgIcon ? 0.01 : Utils.getRandomInRange(0.03, 0.07, 3) * Utils.getScaleFactor();
    this.dragCoefficient = Utils.getRandomInRange(0.0005, 0.0009, 6);
    this.radius = { x: radius, y: radius };
    this.initialRadius = radius;
    this.rotationAngle = direction === "left" ? Utils.getRandomInRange(0, 0.2, 3) : Utils.getRandomInRange(-0.2, 0, 3);
    this.emojiRotationAngle = Utils.getRandomInRange(0, 2 * Math.PI);
    this.radiusYDirection = "down";

    const angle = direction === "left" ? Utils.getRandomInRange(82, 15) * DEG_TO_RAD : Utils.getRandomInRange(-15, -82) * DEG_TO_RAD;
    this.absCos = Math.abs(Math.cos(angle));
    this.absSin = Math.abs(Math.sin(angle));

    const offset = Utils.getRandomInRange(-150, 0);
    const position = {
      x: initialPosition.x + (direction === "left" ? -offset : offset) * this.absCos,
      y: initialPosition.y - offset * this.absSin
    };

    this.position = { ...position };
    this.initialPosition = { ...position };
    this.color = emojis.length || svgIcon ? null : Utils.getRandomItem(colors);
    this.emoji = emojis.length ? Utils.getRandomItem(emojis) : null;

    if (svgIcon) {
      this.svgImage = new Image();
      this.svgImage.src = svgIcon;
      this.svgImage.onload = () => { this.svgIcon = this.svgImage; };
    }

    this.createdAt = Date.now();
    this.direction = direction;
  }

  draw(context: CanvasRenderingContext2D) {
    const { x, y } = this.position;
    const { x: radiusX, y: radiusY } = this.radius;
    if (typeof window === 'undefined') return; // Avoid errors during SSR/build
    const scale = window.devicePixelRatio || 1;

    if (this.svgIcon?.complete && this.svgIcon.naturalHeight !== 0) { // Check if image is loaded
      context.save();
      context.translate(scale * x, scale * y);
      context.rotate(this.emojiRotationAngle);
      context.drawImage(this.svgIcon, -radiusX * scale, -radiusY * scale, radiusX * 2 * scale, radiusY * 2 * scale);
      context.restore();
    } else if (this.color) {
      context.fillStyle = this.color;
      context.beginPath();
      context.ellipse(x * scale, y * scale, radiusX * scale, radiusY * scale, this.rotationAngle, 0, 2 * Math.PI);
      context.fill();
    } else if (this.emoji) {
      context.font = `${radiusX * 2 * scale}px sans-serif`; // Use font size based on radius
      context.save();
      context.translate(scale * x, scale * y);
      context.rotate(this.emojiRotationAngle);
      context.textAlign = "center";
      context.textBaseline = "middle"; // Better vertical alignment
      context.fillText(this.emoji, 0, 0);
      context.restore();
    }
  }

  updatePosition(deltaTime: number, currentTime: number) {
    const elapsed = currentTime - this.createdAt;

    if (this.speed.x > this.finalSpeedX) {
      this.speed.x -= this.dragCoefficient * deltaTime;
    }

    this.position.x += this.speed.x * (this.direction === "left" ? -this.absCos : this.absCos) * deltaTime;
    this.position.y = this.initialPosition.y - this.speed.y * this.absSin * elapsed + 0.00125 * Math.pow(elapsed, 2) / 2;

    if (!this.emoji && !this.svgIcon) {
      this.rotationSpeed -= 1e-5 * deltaTime;
      this.rotationSpeed = Math.max(this.rotationSpeed, 0);

      if (this.radiusYDirection === "down") {
        this.radius.y -= deltaTime * this.rotationSpeed;
        if (this.radius.y <= 0) {
          this.radius.y = 0; this.radiusYDirection = "up";
        }
      } else {
        this.radius.y += deltaTime * this.rotationSpeed;
        if (this.radius.y >= this.initialRadius) {
          this.radius.y = this.initialRadius; this.radiusYDirection = "down";
        }
      }
    } else {
         // Rotate emojis/SVGs
         this.emojiRotationAngle += this.rotationSpeed * deltaTime * (this.direction === "left" ? -1 : 1); // Adjust rotation direction maybe
    }
  }

  isVisible(canvasHeight: number): boolean {
    return this.position.y < canvasHeight + 100; // Check against pixel ratio adjusted height?
  }
}

// --- React Component ---

export interface ConfettiCannonHandle {
  fire: (config?: Partial<ConfettiConfig>) => void;
}

const ConfettiCannon = forwardRef<ConfettiCannonHandle>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const confettiRef = useRef<Confetti[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdatedRef = useRef<number>(Date.now());
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resizeCanvas = () => {
    if (canvasRef.current && typeof window !== 'undefined') {
       const scale = window.devicePixelRatio || 1;
       canvasRef.current.width = window.innerWidth * scale;
       canvasRef.current.height = window.innerHeight * scale;
       // No need to get context again here, it persists
    }
  };

  const loop = () => {
    if (!contextRef.current || !canvasRef.current) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - lastUpdatedRef.current;
    lastUpdatedRef.current = currentTime;

    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiRef.current = confettiRef.current.filter((item) => {
      item.updatePosition(deltaTime, currentTime);
      item.draw(ctx);
      // Use canvas height directly (already scaled)
      return item.isVisible(canvas.height / (window.devicePixelRatio || 1));
    });

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (canvasRef.current && typeof window !== 'undefined') {
      contextRef.current = canvasRef.current.getContext("2d");
      resizeCanvas(); // Initial size

      const debouncedResize = Utils.debounce(resizeCanvas, 200);
      window.addEventListener("resize", debouncedResize);

      lastUpdatedRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(loop);

      // Cleanup function
      return () => {
        window.removeEventListener("resize", debouncedResize);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        confettiRef.current = []; // Clear confetti on unmount
      };
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // Expose the fire function via ref
  useImperativeHandle(ref, () => ({
    fire: (config: Partial<ConfettiConfig> = {}) => {
        if (typeof window === 'undefined') return; // Avoid errors during SSR/build

        const combinedConfig = { ...defaultConfettiConfig, ...config };
        const { confettiesNumber, confettiRadius, confettiColors, emojies, svgIcon } = combinedConfig;

        const baseY = (5 * window.innerHeight) / 7;
        const currentConfetti: Confetti[] = [];

        for (let i = 0; i < confettiesNumber / 2; i++) {
            currentConfetti.push(new Confetti({
                initialPosition: { x: 0, y: baseY },
                direction: "right",
                radius: confettiRadius,
                colors: confettiColors,
                emojis: emojies,
                svgIcon: svgIcon,
            }));
            currentConfetti.push(new Confetti({
                initialPosition: { x: window.innerWidth, y: baseY },
                direction: "left",
                radius: confettiRadius,
                colors: confettiColors,
                emojis: emojies,
                svgIcon: svgIcon,
            }));
        }
        // Add the new confetti to the existing array
        confettiRef.current.push(...currentConfetti);
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1000, // Ensure it's above other content
        pointerEvents: "none", // Make it non-interactive
      }}
    />
  );
});

ConfettiCannon.displayName = "ConfettiCannon";

export default ConfettiCannon; 