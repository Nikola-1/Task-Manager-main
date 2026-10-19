'use client';

import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { Micro_5 } from 'next/font/google';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './animation.module.css';

const micro = Micro_5({ weight: '400', subsets: ['latin'] });
const stars = Array.from({ length: 60 }, (_, index) => ({
  y: (index * 37.73) % 100,
  width: 18 + index * 19 % 65,
  duration: 2 + index % 8 * 0.2,
  delay: -(index / 60) * (2 + index % 8 * 0.2),
}));
const crossingDuration = 2.4;
const crossingDelay = 0.45;

const stickerPaths = ['3d-star', '3d-present', '3d-music', '3d-briefcase', '3d-paper-bag', '3d-headphone', '3d-tokens', '3d-truck', 'first-aid', 'lunch-box', 'gift-box'];
const lanes = stickerPaths.map((sticker, index) => {
  const offset = (index - 5) * 200;
  const firstX = Math.max(-200, -200 - offset);
  const lastX = Math.min(1200, 1200 - offset);
  const reverse = index % 2 === 1;
  const startX = reverse ? lastX : firstX;
  const endX = reverse ? firstX : lastX;
  return {
    sticker, startX, startY: startX + offset, endX, endY: endX + offset,
    duration: crossingDuration * (lastX - firstX) / 1400,
    delay: crossingDelay + index % 4 * 0.12,
    reverse,
  };
});
const logoDelay = Math.max(...lanes.map(lane => lane.delay + lane.duration)) + 0.12;


function DiagonalScene() {
  const reducedMotion = useReducedMotion();
  return <div className={styles.scene}>
    <div className={styles.stars} aria-hidden="true">
      {stars.map((star, index) => <span key={index} className={styles.star} style={{
        top: star.y + '%', width: star.width,
        '--duration': star.duration + 's', '--delay': star.delay + 's',
      } as CSSProperties} />)}
    </div>
    <svg className={styles.paint} viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      {lanes.map(lane => <motion.line key={lane.sticker}
        x1={lane.startX} y1={lane.startY} stroke="#bfdbfe" strokeWidth={146} strokeLinecap="butt"
        initial={{ x2: lane.startX, y2: lane.startY }}
        animate={{ x2: lane.endX, y2: lane.endY }}
        transition={{ duration: reducedMotion ? 0 : lane.duration, delay: reducedMotion ? 0 : lane.delay, ease: 'linear' }} />)}
    </svg>
    {!reducedMotion && lanes.map(lane => <motion.div key={lane.sticker} className={styles.sticker} aria-hidden="true"
      initial={{ left: lane.startX / 10 + '%', top: lane.startY / 10 + '%', rotate: lane.reverse ? 16 : -16 }}
      animate={{ left: lane.endX / 10 + '%', top: lane.endY / 10 + '%', rotate: lane.reverse ? -20 : 20 }}
      transition={{ duration: lane.duration, delay: lane.delay, ease: 'linear' }}>
      <Image src={'/img/' + lane.sticker + '.png'} alt="" width={160} height={160} priority className={styles.stickerImage} />
    </motion.div>)}
    <div className={styles.logoCenter}>
      <motion.h1 className={styles.logo + ' ' + micro.className}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.3, y: 14 }}
        animate={reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: [0, 1, 1], scale: [0.3, 1.12, 1], y: [14, -4, 0] }}
        transition={{ delay: reducedMotion ? 0 : logoDelay, duration: reducedMotion ? 0 : 0.65, times: [0, 0.7, 1], ease: 'easeOut' }}>
        HelpTask
      </motion.h1>
    </div>
  </div>;
}

export default function Animation8() {
  const [run, setRun] = useState(0);
  return <main className={styles.page}>
    <DiagonalScene key={run} />
    <button type="button" className={styles.replay} onClick={() => setRun(current => current + 1)} aria-label="Replay HelpTask animation">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Replay
    </button>
  </main>;
}
