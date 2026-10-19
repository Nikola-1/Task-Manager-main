interface CrackPoint { x: number; y: number; }

// Voronoi cells share exact edges, so every visible crack separates two independent pieces.
export function createCrackFragments(width: number, height: number) {
  const columns = Math.max(4, Math.min(8, Math.round(width / 60)));
  const rows = Math.max(3, Math.min(5, Math.round(height / 24)));
  const seeds: CrackPoint[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      const jitterX = Math.sin(index * 2.73 + 1.2) * 0.28;
      const jitterY = Math.cos(index * 3.91 + 0.7) * 0.28;
      seeds.push({
        x: (column + 0.5 + jitterX) * width / columns,
        y: (row + 0.5 + jitterY) * height / rows,
      });
    }
  }
  return seeds.map(seed => {
    let polygon: CrackPoint[] = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
    for (const neighbor of seeds) {
      if (neighbor === seed) continue;
      const dx = neighbor.x - seed.x, dy = neighbor.y - seed.y;
      const boundary = (neighbor.x ** 2 + neighbor.y ** 2 - seed.x ** 2 - seed.y ** 2) / 2;
      const distance = (point: CrackPoint) => point.x * dx + point.y * dy - boundary;
      const clipped: CrackPoint[] = [];
      for (let index = 0; index < polygon.length; index++) {
        const first = polygon[index], second = polygon[(index + 1) % polygon.length];
        const firstDistance = distance(first), secondDistance = distance(second);
        if (firstDistance <= 0) clipped.push(first);
        if ((firstDistance <= 0) !== (secondDistance <= 0)) {
          const fraction = firstDistance / (firstDistance - secondDistance);
          clipped.push({ x: first.x + (second.x - first.x) * fraction, y: first.y + (second.y - first.y) * fraction });
        }
      }
      polygon = clipped;
    }
    return {
      polygon,
      shape: polygon.map(point => point.x / width * 100 + '% ' + point.y / height * 100 + '%').join(', '),
      // Expand the positions of individual cells, opening a gap along every shared edge.
      offsetX: (seed.x / width - 0.5) * 32,
      offsetY: (seed.y / height - 0.5) * 22,
    };
  });
}

// Paint temporary fragments outside the list so neighboring tasks do not move until removal.
export async function shatterTask(element: HTMLElement | null, remove: () => Promise<void>): Promise<void> {
  if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await remove();
    return;
  }
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) { await remove(); return; }
  const originalVisibility = element.style.visibility;
  const fragments: HTMLDivElement[] = [];
  const animations: Animation[] = [];
  let removed = false;
  const pieces = createCrackFragments(rect.width, rect.height);
  try {
    for (const piece of pieces) {
      const fragment = document.createElement('div');
      fragment.setAttribute('aria-hidden', 'true');
      fragment.inert = true;
      Object.assign(fragment.style, {
        position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
        width: rect.width + 'px', height: rect.height + 'px',
        pointerEvents: 'none', zIndex: '120', clipPath: 'polygon(' + piece.shape + ')',
      });
      const copy = element.cloneNode(true) as HTMLElement;
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      Object.assign(copy.style, {
        width: '100%', height: '100%', margin: '0', visibility: 'visible',
        backgroundColor: window.getComputedStyle(element).backgroundColor === 'rgba(0, 0, 0, 0)'
          ? '#eff6ff' : window.getComputedStyle(element).backgroundColor,
      });
      fragment.append(copy);
      document.body.append(fragment);
      fragments.push(fragment);
      const crackedPosition = 'translate(' + piece.offsetX + 'px, ' + piece.offsetY + 'px)';
      const finalPosition = 'translate(' + piece.offsetX * 2 + 'px, ' + piece.offsetY * 2 + 'px)';
      animations.push(fragment.animate([
        { transform: 'translate(0, 0)', opacity: 1, offset: 0 },
        { transform: crackedPosition, opacity: 0.65, offset: 0.5 },
        { transform: finalPosition, opacity: 0, offset: 1 },
      ], { duration: 450, easing: 'linear', fill: 'forwards' }));
    }
    element.style.visibility = 'hidden';
    await Promise.all(animations.map(animation => animation.finished));
    await remove();
    removed = true;
  } finally {
    animations.forEach(animation => animation.cancel());
    fragments.forEach(fragment => fragment.remove());
    if (!removed) element.style.visibility = originalVisibility;
  }
}
