'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { Micro_5 } from 'next/font/google';
import Image from 'next/image';
import { getStickers } from '@/lib/supabase/stickers.repository';
import styles from './HelpTaskIntro.module.css';

interface IntroProps {
  targetRef?: RefObject<HTMLElement | null>;
  targetSelector?: string;
  showReplay?: boolean;
}

const micro = Micro_5({ weight: '400', subsets: ['latin'], variable: '--intro-logo-font' });
const fallbackStickers = ['3d-music', '3d-present', '3d-briefcase', '3d-paper-bag',
  '3d-star', '3d-tokens', '3d-truck', 'first-aid', 'lunch-box', 'snow-globe', 'christmas', 'gift-box']
  .map(path => `/img/${path}.png`);

function preloadStickers(paths: string[]) {
  return Promise.all(paths.map(path => new Promise<string | null>(resolve => {
    const image = new window.Image();
    image.onload = () => resolve(path);
    image.onerror = () => resolve(null);
    image.src = path;
  }))).then(loaded => loaded.filter((path): path is string => path !== null));
}
// Stable star positions avoid hydration differences and repeat identically.
const stars = Array.from({ length: 28 }, (_, index) => ({
  y: (index * 37.73) % 100,
  width: 12 + (index * 19) % 42,
  duration: 2.2 + (index % 9) * .2,
  delay: -(index / 28) * (2.2 + (index % 9) * .2),
  opacity: .2 + (index % 6) * .08,
}));

function SpaceIntro({ replay, stickers, targetRef, targetSelector, showReplay }: IntroProps & { replay: () => void; stickers: string[] }) {
  const visibleStickers = stickers.slice(0, 8);
  const flyingIcons = visibleStickers.map((image, index) => ({
    image, y: 14 + (index * 23) % 72, size: 64 + (index % 3) * 12,
    delay: -(index / Math.max(visibleStickers.length, 1)) * 5.5, rotation: index % 2 === 0 ? 360 : -360,
  }));
  const [phase, setPhase] = useState<'space' | 'docking' | 'done'>('space');
  const [impact, setImpact] = useState(false);
  const logo = useAnimationControls();
  const backdrop = useAnimationControls();
  const reducedMotion = useReducedMotion();
  const logoElement = useRef<HTMLDivElement>(null);
  const restoreSidebar = useRef<(() => void) | null>(null);
  const extinguishSidebar = useRef<(() => void) | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    if (reducedMotion) { setPhase('done'); return; }
    const getTarget = () => targetRef ? targetRef.current : document.querySelector<HTMLElement>(targetSelector ?? '[data-helptask-sidebar-logo]');
    const sidebarLogo = getTarget();
    if (sidebarLogo && logoElement.current) {
      const typography = window.getComputedStyle(sidebarLogo);
      // Use the sidebar typeface from the first frame; never animate font-family.
      logoElement.current.style.fontFamily = typography.fontFamily;
      logoElement.current.style.fontWeight = typography.fontWeight;
      logoElement.current.style.lineHeight = String(parseFloat(typography.lineHeight) / parseFloat(typography.fontSize));
    }
    const revealTimer = window.setTimeout(() => {
      if (!cancelled.current) {
        void logo.start({ opacity: 1, scale: 1, transition: { duration: .8, ease: 'easeOut' } });
      }
    }, 4800);
    const timer = window.setTimeout(() => {
      const dock = async () => {
        if (cancelled.current) return;
        const target = getTarget();
        const rect = target?.getBoundingClientRect();
        setPhase('docking');
        // Read the real sidebar position at departure, including mobile layouts.
        if (target && rect && rect.width > 0 && rect.height > 0) {
          const computed = window.getComputedStyle(target);
          const currentFontSize = parseFloat(window.getComputedStyle(logoElement.current!).fontSize);
          const destinationScale = parseFloat(computed.fontSize) / currentFontSize;
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const directionX = centerX - (rect.left + rect.width / 2);
          const directionY = centerY - (rect.top + rect.height / 2);
          const distance = Math.hypot(directionX, directionY) || 1;
          // Pull back away from the destination before accelerating into it.
          await logo.start({ left: centerX + directionX / distance * 70,
              top: centerY + directionY / distance * 70, scale: 1.08,
              textShadow: '0 0 18px rgba(255, 226, 143, 0.65)',
              transition: { duration: .5, ease: 'easeInOut' } });
          if (cancelled.current) return;
          const arrivalRect = target.getBoundingClientRect();
          const previousVisibility = target.style.visibility;
          target.style.visibility = 'hidden';
          restoreSidebar.current = () => { target.style.visibility = previousVisibility; };
          await logo.start({ left: arrivalRect.left + arrivalRect.width / 2, top: arrivalRect.top + arrivalRect.height / 2,
              color: computed.color, scale: destinationScale,
              textShadow: '0 0 0px rgba(255, 226, 143, 0)',
              transition: { duration: .45, ease: [.7, 0, .9, .6] } });
          if (cancelled.current) return;
          // Ignite and flash on arrival, rather than on an independent timer.
          target.classList.add(styles.burning);
          let evaporation: Animation | null = null;
          const fireTimer = window.setTimeout(() => {
            // Fade from the current flicker frame, keeping the letter fill intact.
            const currentShadow = window.getComputedStyle(target).textShadow;
            evaporation = target.animate([
              { textShadow: currentShadow },
              { textShadow: '1px -2px 1px #ffbb4540, -1px -2px 1px #ffbb4540, 0 -1px 1px #ffbb4530, 0 -3px 2px #ffe28a40, 0 -5px 3px #ffbe4530, 1px -8px 4px #ff752420, -1px -12px 5px #f4481510', offset: .55 },
              { textShadow: '1px -4px 2px transparent, -1px -4px 2px transparent, 0 -3px 2px transparent, 0 -5px 3px transparent, 0 -8px 4px transparent, 1px -12px 5px transparent, -1px -16px 6px transparent' },
            ], { duration: 1200, easing: 'ease-out', fill: 'forwards' });
            target.classList.remove(styles.burning);
            evaporation.onfinish = () => {
              evaporation?.cancel();
              extinguishSidebar.current = null;
            };
          }, 3500);
          extinguishSidebar.current = () => {
            window.clearTimeout(fireTimer);
            if (evaporation) {
              evaporation.onfinish = null;
              evaporation.cancel();
            }
            target.classList.remove(styles.burning);
          };
          setImpact(true);
        } else {
          await Promise.all([
            logo.start({ opacity: 0, transition: { duration: .6 } }),
            backdrop.start({ opacity: 0, transition: { duration: .6 } }),
          ]);
        }
        if (cancelled.current) return;
        restoreSidebar.current?.();
        restoreSidebar.current = null;
        setPhase('done');
      };
      void dock();
    }, 6500);
    return () => {
      cancelled.current = true;
      window.clearTimeout(timer);
      window.clearTimeout(revealTimer);
      logo.stop();
      backdrop.stop();
      restoreSidebar.current?.();
      restoreSidebar.current = null;
      extinguishSidebar.current?.();
      extinguishSidebar.current = null;
    };
  }, [logo, backdrop, reducedMotion, targetRef, targetSelector]);

  const skip = () => {
    cancelled.current = true;
    logo.stop();
    backdrop.stop();
    restoreSidebar.current?.();
    restoreSidebar.current = null;
    extinguishSidebar.current?.();
    extinguishSidebar.current = null;
    setPhase('done');
  };

  return <div className={showReplay ? styles.page : styles.host}>
    {showReplay && <div className={styles.finishedPanel}>
      <p>Welcome to HelpTask</p>
      <button type="button" onClick={replay} disabled={phase !== 'done'}>Replay intro</button>
    </div>}
    {phase !== 'done' && <div className={styles.intro}>
      <motion.div className={styles.backdrop} initial={{ opacity: 1 }} animate={backdrop}>
        <div className={styles.starfield} aria-hidden="true">
          {stars.map((star, index) => <span key={index} className={styles.star}
            style={{ top: star.y + '%', width: star.width, opacity: star.opacity,
              '--star-duration': `${star.duration}s`, '--star-delay': `${star.delay}s` } as CSSProperties} />)}
        </div>
        <div className={styles.iconfield} aria-hidden="true">
          {flyingIcons.map((icon, index) => <span key={index} className={styles.flyingIcon}
            style={{ top: icon.y + '%', width: icon.size, height: icon.size,
              '--sticker-delay': `${icon.delay}s`, '--sticker-turn': `${icon.rotation}deg` } as CSSProperties}>
            <Image src={icon.image} alt="" width={icon.size} height={icon.size} unoptimized loading="eager" />
          </span>)}
        </div>
      </motion.div>
      <motion.div ref={logoElement} className={styles.logo + ' ' + micro.variable} initial={{ opacity: 0, scale: .85 }} animate={logo}>HelpTask</motion.div>
      {phase === 'space' && <button type="button" className={styles.skip} onClick={skip}>Skip intro</button>}
    </div>}
    {impact && !reducedMotion && <motion.div className={styles.flash} aria-hidden="true"
      initial={{ opacity: 0 }} animate={{ opacity: [0, .8, .8, 0] }}
      transition={{ duration: .9, times: [0, .12, .28, 1], ease: 'easeOut' }}
      onAnimationComplete={() => setImpact(false)} />}
    <span className={styles.srOnly} role="status">{phase === 'done' ? 'Intro complete. Welcome to HelpTask.' : 'HelpTask intro is playing.'}</span>
  </div>;
}

export default function HelpTaskIntro({ targetRef, targetSelector, showReplay = false }: IntroProps) {
  const [run, setRun] = useState(0);
  const [stickers, setStickers] = useState<string[] | null>(null);
  

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      let paths = fallbackStickers;
      try {
        const categories = await getStickers();
        const available = categories?.filter(sticker => typeof sticker.sticker_path === 'string')
          .slice(0, 12).map(sticker => `/img/${sticker.sticker_path}.png`);
        if (available?.length) paths = available;
      } catch {
        // The bundled category stickers also work when the catalog is offline.
      }
      let loaded = await preloadStickers(paths);
      if (!loaded.length && paths !== fallbackStickers) loaded = await preloadStickers(fallbackStickers);
      if (!disposed) setStickers(loaded);
    };
    void load();
    return () => { disposed = true; };
  }, []);

  if (!stickers) return <div className={styles.loading} aria-label="Loading intro" />;
  return <SpaceIntro key={run} stickers={stickers} targetRef={targetRef} targetSelector={targetSelector} showReplay={showReplay} replay={() => setRun(current => current + 1)} />;
}
