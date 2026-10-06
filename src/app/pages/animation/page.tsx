"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./StarField.css";
import {userImage} from "@/assets/img/user.png"
import { Micro_5 } from "next/font/google";

const micro5 = Micro_5({
  weight: "400",
  subsets: ["latin"],
});
type Star = {
  x: number;
  y: number;
  speed: number;
  length: number;
  size: number;
  opacity: number;
};
type FloatingImage = {
  id: number;
  src: string;
  top: number;
  size: number;
  duration: number;
  rotate: number;

  exitX: number;
  exitY: number;
};

interface StarFieldProps {
  starCount?: number;
  minSpeed?: number;
  maxSpeed?: number;
}

const spaceImages = [
  `/img/3d-paper-bag.png`,
  "/img/3d-music.png",
  "/img/3d-headphone.png",
  "/img/3d-briefcase.png",
  "/img/hot-chocolate.png",
];

export default function StarField({
  starCount = 350,
  minSpeed = 8,
  maxSpeed = 28,
}: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showTitle, setShowTitle] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [floatingImages, setFloatingImages] = useState<FloatingImage[]>([]);

  const imageIdRef = useRef(0);

  useEffect(() => {
    const showTimer = window.setTimeout(() => {
      setShowImages(true);
    }, 1000);

    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
  const titleTimer = window.setTimeout(() => {
    setShowTitle(true);
  }, 9500);

  return () => window.clearTimeout(titleTimer);
}, []);

  useEffect(() => {
    if (!showImages) return;

    const createFloatingImage = () => {
      const randomImage =
        spaceImages[Math.floor(Math.random() * spaceImages.length)];

      const newImage: FloatingImage = {
  id: imageIdRef.current++,
  src: randomImage,

  top: 10 + Math.random() * 70,
  size: 70 + Math.random() * 110,

  duration: 4.5,

  rotate: -20 + Math.random() * 40,

  // random odlazak
  exitX: 700 + Math.random() * 900,
  exitY: -500 + Math.random() * 1000,
};

      setFloatingImages((previousImages) => [
        ...previousImages,
        newImage,
      ]);

      window.setTimeout(() => {
        setFloatingImages((previousImages) =>
          previousImages.filter((image) => image.id !== newImage.id)
        );
      }, newImage.duration * 1000 + 500);
    };

    createFloatingImage();

    const imageInterval = window.setInterval(() => {
      createFloatingImage();
    }, 700);

    const stopTimer = window.setTimeout(() => {
      window.clearInterval(imageInterval);
    }, 5000);

    return () => {
      window.clearInterval(imageInterval);
      window.clearTimeout(stopTimer);
    };
  }, [showImages]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId = 0;
    let stars: Star[] = [];

    const createStar = (startAnywhere = true): Star => {
      const speed =
        Math.random() * (maxSpeed - minSpeed) + minSpeed;

      return {
        x: startAnywhere
          ? Math.random() * width
          : -Math.random() * 300,
        y: Math.random() * height,
        speed,
        length: speed * (2 + Math.random() * 4),
        size: 0.5 + Math.random() * 1.8,
        opacity: 0.25 + Math.random() * 0.75,
      };
    };

    const createStars = () => {
      stars = Array.from(
        { length: starCount },
        () => createStar(true)
      );
    };

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
      );

      createStars();
    };

    const resetStar = (star: Star) => {
      const newStar = createStar(false);

      star.x = newStar.x;
      star.y = newStar.y;
      star.speed = newStar.speed;
      star.length = newStar.length;
      star.size = newStar.size;
      star.opacity = newStar.opacity;
    };

    const animate = () => {
   context.fillStyle = "rgba(147, 197, 253, 0.32)"; 
      context.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        star.x += star.speed;

        if (star.x - star.length > width) {
          resetStar(star);
        }

        const gradient = context.createLinearGradient(
          star.x - star.length,
          star.y,
          star.x,
          star.y
        );

        gradient.addColorStop(
          0,
          "rgba(255,255,255,0)"
        );

        gradient.addColorStop(
          1,
          `rgba(255,255,255,${star.opacity})`
        );

        context.beginPath();
        context.moveTo(star.x - star.length, star.y);
        context.lineTo(star.x, star.y);

        context.strokeStyle = gradient;
        context.lineWidth = star.size;
        context.lineCap = "round";
        context.stroke();

        context.beginPath();
        context.arc(
          star.x,
          star.y,
          star.size,
          0,
          Math.PI * 2
        );

        context.fillStyle = `rgba(255,255,255,${star.opacity})`;
        context.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [starCount, minSpeed, maxSpeed]);

  return (
  <div className="star-field">
    <canvas
      ref={canvasRef}
      className="star-canvas"
    />

    <div className="floating-images-layer">
      <AnimatePresence>
        {floatingImages.map((item) => (
          <motion.div
            key={item.id}
            className="floating-space-image"
            style={{
              top: `${item.top}%`,
              width: item.size,
              height: item.size,
            }}
            initial={{
              x: -item.size * 2,
              y: 0,
              opacity: 0,
              scale: 0.55,
              rotate: item.rotate - 15,
              filter: "blur(15px)",
            }}
            animate={{
              x: [
                -item.size * 2,
                window.innerWidth * 0.35,
                window.innerWidth * 0.42,
                window.innerWidth * 0.42,
                window.innerWidth * 0.39,
                item.exitX,
              ],

              y: [
                0,
                0,
                0,
                0,
                15,
                item.exitY,
              ],

              opacity: [
                0,
                1,
                1,
                1,
                1,
                0,
              ],

              scale: [
                0.55,
                1,
                1.05,
                1.05,
                0.95,
                0.5,
              ],

              rotate: [
                item.rotate,
                item.rotate,
                item.rotate + 5,
                item.rotate + 5,
                item.rotate - 8,
                item.rotate + 50,
              ],

              filter: [
                "blur(15px)",
                "blur(2px)",
                "blur(0px)",
                "blur(0px)",
                "blur(0px)",
                "blur(12px)",
              ],
            }}
            transition={{
              duration: item.duration,

              times: [
                0,
                0.25,
                0.42,
                0.62,
                0.70,
                1,
              ],

              ease: [
                "easeOut",
                "easeOut",
                "linear",
                "easeIn",
                "easeIn",
              ],
            }}
          >
            <Image
              src={item.src}
              alt=""
              fill
              sizes={`${item.size}px`}
              className="space-image"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>

    <AnimatePresence>
      {showTitle && (
        <motion.div
          className="help-task-title"
          initial={{
            opacity: 0,
            scale: 0.4,
            filter: "blur(20px)",
          }}
          animate={{
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.h1
            className={micro5.className}
            initial={{
              y: 30,
              letterSpacing: "40px",
            }}
            animate={{
              y: 0,
              letterSpacing: "8px",
            }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
            }}
          >
            HelpTask
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="space-overlay" />
  </div>
);
}