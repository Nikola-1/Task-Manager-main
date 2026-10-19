export async function vacuumTasks(list: HTMLElement | null, bin: HTMLElement | null, remove: () => Promise<void>): Promise<void> {
  if (!list || !bin || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await remove();
    return;
  }
  const target = bin.getBoundingClientRect();
  const viewport = list.getBoundingClientRect();
  const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-task-card]'));
  const originals = cards.map(card => ({ card, visibility: card.style.visibility }));
  const copies: HTMLDivElement[] = [];
  const animations: Animation[] = [];
  let removed = false;
  try {
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.bottom <= viewport.top || rect.top >= viewport.bottom || !rect.width || !rect.height) continue;
      const copy = document.createElement('div');
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      Object.assign(copy.style, {
        position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
        width: rect.width + 'px', height: rect.height + 'px', zIndex: '110',
        pointerEvents: 'none', transformOrigin: 'center center',
        borderRadius: '10px', backgroundColor: '#eff6ff', boxShadow: '0 4px 16px rgb(30 58 138 / 12%)',
      });
      const content = card.cloneNode(true) as HTMLElement;
      content.removeAttribute('id');
      content.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      Object.assign(content.style, { transform: 'none', visibility: 'visible', width: '100%', height: '100%' });
      copy.append(content);
      document.body.append(copy);
      copies.push(copy);
      const x = target.left + target.width / 2 - (rect.left + rect.width / 2);
      const y = target.top + 14 - (rect.top + rect.height / 2);
      const side = copies.length % 2 ? -1 : 1;
      animations.push(copy.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
        { transform: 'translate(' + (x * 0.35 + side * 18) + 'px, ' + y * 0.22 + 'px) scale(.8) rotate(' + side * 6 + 'deg)', opacity: 1, offset: 0.35 },
        { transform: 'translate(' + x + 'px, ' + y + 'px) scale(.03)', opacity: 0, offset: 1 },
      ], { duration: 650, delay: Math.min((copies.length - 1) * 45, 270), easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'both' }));
    }
    originals.forEach(({ card }) => { card.style.visibility = 'hidden'; });
    await Promise.all(animations.map(animation => animation.finished));
    await remove();
    removed = true;
  } finally {
    animations.forEach(animation => animation.cancel());
    copies.forEach(copy => copy.remove());
    if (!removed) originals.forEach(({ card, visibility }) => { card.style.visibility = visibility; });
  }
}
