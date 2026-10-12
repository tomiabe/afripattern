export type PatternKind = 'woven' | 'diamonds' | 'resist' | 'stars' | 'check' | 'waves' | 'petals' | 'kuba';
export type Symmetry = 'free' | 'mirror-v' | 'mirror-h' | 'quarter' | 'radial-4' | 'radial-6' | 'radial-8' | 'radial-12' | 'offset';
export type Motion = 'drift' | 'ripple' | 'turn' | 'pulse' | 'color';

export type PatternOptions = {
  colors: string[];
  pattern: PatternKind;
  density: number;
  scale: number;
  symmetry: Symmetry;
  seed: number;
  animate: boolean;
  motion: Motion;
  speed: number;
};

const background = '#1c0f0f';
let symmetryCanvas: HTMLCanvasElement | null = null;
const randomAt = (seed: number, row: number, col: number) => {
  let n = (seed ^ Math.imul(row + 101, 374761393) ^ Math.imul(col + 17, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

function star(ctx: CanvasRenderingContext2D, x: number, y: number, points: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + i * Math.PI / points;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawMotif(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, colors: string[], kind: PatternKind, scale: number, row: number, col: number, seed: number, time: number, motion: Motion, speed: number, animate: boolean) {
  const count = colors.length;
  const baseIndex = Math.floor(randomAt(seed, row, col) * count);
  const index = animate && motion === 'color' ? (baseIndex + Math.floor(time * speed * 1.8)) % count : baseIndex;
  const a = colors[index];
  const b = colors[(index + 1) % count];
  const c = colors[(index + 2) % count];
  const pad = size * 0.045;
  const edge = size - pad * 2;
  const center = size / 2;
  const motif = Math.max(7, size * scale / 100);
  const phase = time * speed;
  const distance = Math.hypot(col - 5, row - 5);
  let dx = 0, dy = 0, angle = 0, pulse = 1;
  if (animate) {
    if (motion === 'drift') { dx = Math.sin(phase + row * .59 + col * .21) * size * .13; dy = Math.cos(phase * .82 + col * .52) * size * .1; }
    if (motion === 'ripple') pulse = 1 + Math.sin(phase * 1.55 - distance * .72) * .24;
    if (motion === 'turn') angle = Math.sin(phase + (row + col) * .27) * .43;
    if (motion === 'pulse') pulse = .72 + (Math.sin(phase * 1.65 + row * .31 + col * .23) + 1) * .2;
  }
  ctx.save();
  ctx.translate(x + center + dx, y + center + dy);
  ctx.rotate(angle);
  ctx.scale(pulse, pulse);
  ctx.translate(-center, -center);
  ctx.fillStyle = a;
  ctx.fillRect(pad, pad, edge, edge);
  ctx.lineJoin = 'round';
  switch (kind) {
    case 'woven': {
      const band = edge / 4;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[(index + i + 1) % count];
        ctx.fillRect(pad + i * band, pad, band * .48, edge);
        ctx.fillRect(pad, pad + i * band, edge, band * .19);
      }
      ctx.fillStyle = a;
      ctx.fillRect(center - motif * .22, center - motif * .22, motif * .44, motif * .44);
      break;
    }
    case 'diamonds':
      ctx.fillStyle = b; ctx.beginPath(); ctx.moveTo(center, center - motif * .57); ctx.lineTo(center + motif * .57, center); ctx.lineTo(center, center + motif * .57); ctx.lineTo(center - motif * .57, center); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, size * .025); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(center, center - motif * .2); ctx.lineTo(center + motif * .2, center); ctx.lineTo(center, center + motif * .2); ctx.lineTo(center - motif * .2, center); ctx.closePath(); ctx.fill();
      break;
    case 'resist':
      for (let i = 4; i >= 0; i--) { ctx.beginPath(); ctx.fillStyle = colors[(index + i + 1) % count]; ctx.arc(center, center, motif * (.12 + i * .085), 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.fillStyle = a; ctx.arc(center, center, motif * .12, 0, Math.PI * 2); ctx.fill();
      break;
    case 'stars':
      ctx.fillStyle = b; star(ctx, center, center, 8, motif * .5, motif * .25); ctx.fill();
      ctx.fillStyle = c; star(ctx, center, center, 8, motif * .23, motif * .1); ctx.fill();
      break;
    case 'check': {
      const unit = edge / 4;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = colors[(index + i + j) % count]; ctx.fillRect(pad + i * unit, pad + j * unit, unit + .5, unit + .5); }
      ctx.strokeStyle = a; ctx.lineWidth = Math.max(1.5, size * .06); ctx.strokeRect(pad + edge * .25, pad + edge * .25, edge * .5, edge * .5);
      break;
    }
    case 'waves':
      for (let band = 0; band < 4; band++) {
        ctx.beginPath(); ctx.strokeStyle = colors[(index + band + 1) % count]; ctx.lineWidth = Math.max(2, size * .07);
        for (let step = 0; step <= 24; step++) { const px = pad + edge * step / 24; const py = pad + edge * (band + .5) / 4 + Math.sin(step * .62 + phase + band) * edge * .09; if (!step) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.stroke();
      }
      break;
    case 'petals':
      ctx.save(); ctx.translate(center, center);
      for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.fillStyle = colors[(index + i + 1) % count]; ctx.ellipse(0, -motif * .22, motif * .15, motif * .3, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.fillStyle = c; ctx.arc(0, 0, motif * .16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      break;
    case 'kuba': {
      const unit = edge / 4;
      for (let i = 0; i < 4; i++) { const x0 = pad + i * unit; ctx.fillStyle = colors[(index + i + 1) % count]; ctx.fillRect(x0, pad, unit * .5, edge); ctx.beginPath(); ctx.moveTo(x0, pad + edge * .35); ctx.lineTo(x0 + unit * .5, pad + edge * .17); ctx.lineTo(x0 + unit, pad + edge * .35); ctx.lineTo(x0 + unit * .5, pad + edge * .53); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = a; ctx.lineWidth = Math.max(1.5, size * .045); ctx.strokeRect(pad + edge * .2, pad + edge * .2, edge * .6, edge * .6);
      break;
    }
  }
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, options: PatternOptions, time: number) {
  const rows = Math.max(4, Math.round(options.density));
  const cols = Math.ceil(rows * width / height);
  const cellW = width / cols, cellH = height / rows, size = Math.min(cellW, cellH) * 1.04;
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const offset = options.symmetry === 'offset' && row % 2 ? cellW * .5 : 0;
    drawMotif(ctx, col * cellW - offset, row * cellH, size, options.colors, options.pattern, options.scale, row, col, options.seed, time, options.motion, options.speed, options.animate);
  }
}

function drawMirrored(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement, width: number, height: number, mode: Symmetry) {
  const copies = mode === 'quarter' ? 4 : 2;
  for (let i = 0; i < copies; i++) {
    ctx.save();
    if (mode === 'mirror-v') {
      if (i === 0) ctx.beginPath(), ctx.rect(0, 0, width / 2, height), ctx.clip();
      else { ctx.translate(width, 0); ctx.scale(-1, 1); ctx.beginPath(); ctx.rect(0, 0, width / 2, height); ctx.clip(); }
    } else if (mode === 'mirror-h') {
      if (i === 0) { ctx.beginPath(); ctx.rect(0, 0, width, height / 2); ctx.clip(); }
      else { ctx.translate(0, height); ctx.scale(1, -1); ctx.beginPath(); ctx.rect(0, 0, width, height / 2); ctx.clip(); }
    } else {
      if (i === 0) { ctx.beginPath(); ctx.rect(0, 0, width / 2, height / 2); ctx.clip(); }
      if (i === 1) { ctx.translate(width, 0); ctx.scale(-1, 1); ctx.beginPath(); ctx.rect(0, 0, width / 2, height / 2); ctx.clip(); }
      if (i === 2) { ctx.translate(width, height); ctx.scale(-1, -1); ctx.beginPath(); ctx.rect(0, 0, width / 2, height / 2); ctx.clip(); }
      if (i === 3) { ctx.translate(0, height); ctx.scale(1, -1); ctx.beginPath(); ctx.rect(0, 0, width / 2, height / 2); ctx.clip(); }
    }
    ctx.drawImage(source, 0, 0);
    ctx.restore();
  }
}

function drawRadial(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement, width: number, height: number, count: number) {
  const radius = Math.hypot(width, height);
  const half = Math.PI / count;
  for (let i = 0; i < count; i++) {
    ctx.save(); ctx.translate(width / 2, height / 2); ctx.rotate(i * Math.PI * 2 / count);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(radius * Math.cos(-half), radius * Math.sin(-half)); ctx.lineTo(radius * Math.cos(half), radius * Math.sin(half)); ctx.closePath(); ctx.clip();
    ctx.drawImage(source, -width / 2, -height / 2);
    ctx.restore();
  }
}

export function renderPattern(ctx: CanvasRenderingContext2D, width: number, height: number, options: PatternOptions, time: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
  if (options.symmetry === 'free' || options.symmetry === 'offset') drawGrid(ctx, width, height, options, time);
  else {
    const source = symmetryCanvas ?? (symmetryCanvas = document.createElement('canvas'));
    if (source.width !== width) source.width = width;
    if (source.height !== height) source.height = height;
    const sourceCtx = source.getContext('2d');
    if (!sourceCtx) return;
    sourceCtx.clearRect(0, 0, width, height);
    sourceCtx.fillStyle = background; sourceCtx.fillRect(0, 0, width, height);
    drawGrid(sourceCtx, width, height, options, time);
    if (options.symmetry === 'mirror-v' || options.symmetry === 'mirror-h' || options.symmetry === 'quarter') {
      drawMirrored(ctx, source, width, height, options.symmetry);
      return;
    }
    const count = options.symmetry === 'radial-4' ? 4 : options.symmetry === 'radial-6' ? 6 : options.symmetry === 'radial-8' ? 8 : 12;
    drawRadial(ctx, source, width, height, count);
  }
}
