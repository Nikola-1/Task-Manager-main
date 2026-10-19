// Temporary viewport overlays keep the list still until deletion succeeds.
export async function marioDeleteTask(element: HTMLElement | null, remove: () => Promise<void>) {
  if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await remove();
    return;
  }
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) { await remove(); return; }
  const visibility = element.style.visibility;
  const animations: Animation[] = [];
  const card = document.createElement('div');
  const mario = document.createElement('div');
  let removed = false;
  try {
    for (const overlay of [card, mario]) {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.inert = true;
      Object.assign(overlay.style, { position: 'fixed', pointerEvents: 'none', zIndex: '120' });
    }
    Object.assign(card.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    const copy = element.cloneNode(true) as HTMLElement;
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    Object.assign(copy.style, { width: '100%', height: '100%', margin: '0', visibility: 'visible', backgroundColor: '#fff', color: '#40537f' });
    card.append(copy);
    // A small code-native pixel sprite: cap, moustache, raised glove and overalls.
    const pixels = [
      '          WWWW  ',
      '          WWWW  ',
      '          WSSW  ',
      '    RRRRR  RR   ',
      '   RRRRRRRRRR   ',
      '   BBBSSBS RR   ',
      '  BSBS SBSSRR   ',
      '  BSBSSSBSSSR   ',
      '  BBSSSBBBBRR   ',
      '    SSSSSSRRR   ',
      '  RRRURRUURR    ',
      ' SRRRUYUUYU     ',
      ' WWS UUUUUUU    ',
      ' WW  UUU UUU    ',
      '    BBB   UUBB  ',
      '   BBBB    BBB  ',
    ];
    const colors: Record<string, string> = { R: '#bb2424', B: '#57351f', S: '#ffc28a', U: '#2454a0', W: '#fff8e9', Y: '#ffdc73', O: '#2454a0' };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '64');
    svg.setAttribute('height', '64');
    svg.setAttribute('shape-rendering', 'crispEdges');
    pixels.forEach((row, y) => [...row].forEach((pixel, x) => {
      if (!colors[pixel]) return;
      const square = document.createElementNS(svg.namespaceURI, 'rect');
      for (const [name, value] of Object.entries({ x: String(x), y: String(y), width: '1', height: '1', fill: colors[pixel] })) square.setAttribute(name, value);
      svg.append(square);
    }));
    mario.append(svg);
    Object.assign(mario.style, { left: `${rect.left + rect.width / 2 - 32}px`, top: `${rect.bottom + 6}px`, width: '64px', height: '64px' });
    document.body.append(card, mario);
    element.style.visibility = 'hidden';
    const fall = Math.max(220, window.innerHeight - rect.top + 120);
    animations.push(mario.animate([
      { transform: 'translateY(120px)', opacity: 0, offset: 0 },
      { transform: 'translateY(64px)', opacity: 1, offset: 0.12 },
      { transform: 'translateY(-6px)', opacity: 1, offset: 0.28 },
      { transform: 'translateY(-100px)', opacity: 1, offset: 0.42, easing: 'ease-out' },
      { transform: 'translateY(-120px)', opacity: 1, offset: 0.5, easing: 'ease-in' },
      { transform: `translateY(${fall}px) rotate(16deg)`, opacity: 1, offset: 1 },
    ], { duration: 1050, easing: 'linear', fill: 'forwards' }));
    animations.push(card.animate([
      { transform: 'translateY(0)', offset: 0 },
      { transform: 'translateY(0)', offset: 0.28, easing: 'ease-out' },
      { transform: 'translateY(-140px) rotate(-6deg)', offset: 0.44, easing: 'ease-out' },
      { transform: 'translateY(-155px) rotate(-3deg)', offset: 0.5, easing: 'ease-in' },
      { transform: `translateY(${fall}px) rotate(12deg)`, offset: 1 },
    ], { duration: 1050, easing: 'linear', fill: 'forwards' }));
    await Promise.all(animations.map(animation => animation.finished));
    await remove();
    removed = true;
  } finally {
    animations.forEach(animation => animation.cancel());
    card.remove();
    mario.remove();
    if (!removed) element.style.visibility = visibility;
  }
}
