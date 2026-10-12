import { useEffect, useMemo, useRef, useState } from 'react';
import { countries, Country } from './countries';
import { PatternCanvas } from './PatternCanvas';
import { Motion, PatternKind, PatternOptions, Symmetry } from './pattern-engine';

const patternNames: Record<PatternKind, string> = {
  woven: 'Woven bands', diamonds: 'Stepping diamonds', resist: 'Resist circles', stars: 'North star grid', check: 'Interlaced checks', waves: 'River lines', petals: 'Petal medallions', kuba: 'Kuba geometry',
};
const symmetryHelp: Record<Symmetry, string> = {
  free: 'Each tile finds its own arrangement.',
  'mirror-v': 'The left half reflects across a vertical line.',
  'mirror-h': 'The upper half reflects across a horizontal line.',
  quarter: 'One quadrant repeats in four mirrored directions.',
  'radial-4': 'One wedge repeats 4 times around the center.',
  'radial-6': 'One wedge repeats 6 times around the center.',
  'radial-8': 'One wedge repeats 8 times around the center.',
  'radial-12': 'One wedge repeats 12 times around the center.',
  offset: 'Alternate rows shift to form a half-drop repeat.',
};
const motionNames: Record<Motion, string> = { drift: 'Drift', ripple: 'Ripple', turn: 'Turn', pulse: 'Pulse', color: 'Color tide' };
const emptyOptions: PatternOptions = { colors: ['#ce1126', '#fcd116', '#006b3f', '#000000'], pattern: 'woven', density: 12, scale: 46, symmetry: 'free', seed: 2741, animate: false, motion: 'drift', speed: 1 };
type SavedPattern = { id: string; title: string; country: string; options: PatternOptions; image: string };

function countryFor(code: string) { return countries.find((country) => country.code === code) ?? countries[0]; }

export default function App() {
  const [countryCode, setCountryCode] = useState('GH');
  const country = useMemo(() => countryFor(countryCode), [countryCode]);
  const [options, setOptions] = useState<PatternOptions>(emptyOptions);
  const [activeColors, setActiveColors] = useState<string[]>(countryFor('GH').colors);
  const [saved, setSaved] = useState<SavedPattern[]>(() => {
    try { return JSON.parse(localStorage.getItem('afripatterns-saved-v2') || '[]') as SavedPattern[]; } catch { return []; }
  });
  const [toast, setToast] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const displayedOptions = useMemo(() => ({ ...options, colors: activeColors.length > 1 ? activeColors : country.colors }), [options, activeColors, country]);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };

  useEffect(() => {
    if (galleryOpen && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!galleryOpen && dialogRef.current?.open) dialogRef.current.close();
  }, [galleryOpen]);

  const changeCountry = (code: string) => {
    const nextCountry = countryFor(code);
    setCountryCode(code);
    setActiveColors([...nextCountry.colors]);
    setOptions((current) => ({ ...current, seed: current.seed + 1 }));
  };
  const setOption = <K extends keyof PatternOptions>(key: K, value: PatternOptions[K]) => setOptions((current) => ({ ...current, [key]: value }));
  const randomize = () => {
    const nextCountry = countries[Math.floor(Math.random() * countries.length)];
    const patterns = Object.keys(patternNames) as PatternKind[];
    const symmetries: Symmetry[] = ['free', 'mirror-v', 'mirror-h', 'quarter', 'radial-4', 'radial-6', 'radial-8', 'radial-12', 'offset'];
    setCountryCode(nextCountry.code);
    setActiveColors([...nextCountry.colors]);
    setOptions((current) => ({ ...current, pattern: patterns[Math.floor(Math.random() * patterns.length)], symmetry: symmetries[Math.floor(Math.random() * symmetries.length)], density: 8 + Math.floor(Math.random() * 12), scale: 36 + Math.floor(Math.random() * 34), seed: Math.floor(Math.random() * 9999999) }));
    showToast(`${nextCountry.name} colors, ready for a new arrangement.`);
  };
  const savePattern = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const entry: SavedPattern = { id: `${Date.now()}`, title: `${country.name}, ${patternNames[options.pattern]}`, country: countryCode, options: { ...displayedOptions }, image: canvas.toDataURL('image/png') };
    const next = [entry, ...saved].slice(0, 24);
    setSaved(next);
    localStorage.setItem('afripatterns-saved-v2', JSON.stringify(next));
    showToast('Saved to My patterns on this device.');
  };
  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement('a');
    anchor.download = `${country.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-pattern.png`;
    anchor.href = canvas.toDataURL('image/png');
    anchor.click();
    showToast('Your pattern is downloading as a PNG.');
  };
  const restorePattern = (entry: SavedPattern) => {
    setCountryCode(entry.country);
    setActiveColors(entry.options.colors);
    setOptions({ ...entry.options, animate: false });
    setGalleryOpen(false);
    requestAnimationFrame(() => document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' }));
  };

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="AfriPattern home"><span className="brand-mark"><i className="ph-fill ph-shapes" /></span><span>afri<span className="brand-light">pattern</span></span></a>
      <nav className="main-nav" aria-label="Main navigation"><a href="#studio">Studio</a><a href="#stories">Stories</a><button type="button" onClick={() => setGalleryOpen(true)}>My patterns <span className="saved-count">{saved.length}</span></button></nav>
      <button className="button button-dark button-small" onClick={randomize}><i className="ph-fill ph-shuffle" /> Surprise me</button>
    </header>

    <main id="top">
      <section className="intro">
        <div className="intro-copy">
          <h1>A flag is a beginning.<br /><span>A pattern is yours.</span></h1>
          <p className="intro-text">Choose a country, gather its colors, and turn them into something only you could make.</p>
          <a className="text-link" href="#studio">Start making <i className="ph-fill ph-arrow-down-right" /></a>
        </div>
        <div className="intro-art"><PatternCanvas options={{ ...emptyOptions, colors: ['#fcd116', '#ce1126', '#006b3f', '#e9b944', '#fff8e6'], seed: 8402, density: 5, symmetry: 'free' }} label="A composition of African flag colors" className="hero-pattern" /><span className="art-caption">Colors move. Stories stay.</span><span className="art-index">{String(countries.findIndex((item) => item.code === countryCode) + 1).padStart(2, '0')} / 54</span></div>
      </section>

      <section className="studio-section" id="studio">
        <div className="section-heading"><div><h2>The pattern studio</h2></div><p className="studio-note">Start with a flag. Change the rhythm.<br />Keep the colors in conversation.</p></div>
        <div className="studio-layout">
          <aside className="control-panel" aria-label="Pattern controls">
            <div className="control-block country-block"><label className="control-label" htmlFor="country-select">Choose a country</label><div className="select-wrap"><span className="select-flag">{country.flag}</span><select id="country-select" value={countryCode} onChange={(event) => changeCountry(event.target.value)}>{countries.map((item) => <option value={item.code} key={item.code}>{item.flag}　{item.name}</option>)}</select><i className="ph-fill ph-caret-down select-caret" /></div><p className="country-story">{country.story}</p></div>
            <div className="control-block"><div className="label-row"><span className="control-label">Flag colors</span><button className="quiet-button" type="button" onClick={() => setActiveColors([...country.colors])}>Use all</button></div><div className="swatches" aria-label="Toggle flag colors">{country.colors.map((color, index) => <button key={`${country.code}-${color}-${index}`} type="button" className={`swatch${activeColors.includes(color) ? ' selected' : ''}`} style={{ backgroundColor: color }} aria-label={`Toggle color ${color}`} aria-pressed={activeColors.includes(color)} title={color} onClick={() => { if (activeColors.includes(color) && activeColors.length <= 2) { showToast('Keep at least two colors in the composition.'); return; } setActiveColors((active) => active.includes(color) ? active.filter((entry) => entry !== color) : [...active, color]); }} />)}</div></div>
            <div className="control-block"><label className="control-label" htmlFor="pattern-select">Pattern language</label><div className="select-wrap plain-select"><select id="pattern-select" value={options.pattern} onChange={(event) => setOption('pattern', event.target.value as PatternKind)}>{Object.entries(patternNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select><i className="ph-fill ph-caret-down select-caret" /></div></div>
            <Slider label="Repeat" value={options.density} min={5} max={24} left="Open" right="Dense" onChange={(value) => setOption('density', value)} />
            <Slider label="Motif size" value={options.scale} min={22} max={76} left="Fine" right="Bold" onChange={(value) => setOption('scale', value)} />
            <div className="control-block symmetry-block"><label className="control-label" htmlFor="symmetry-select">Symmetry</label><div className="select-wrap plain-select"><select id="symmetry-select" value={options.symmetry} onChange={(event) => setOption('symmetry', event.target.value as Symmetry)}><option value="free">Freeform</option><option value="mirror-v">Vertical mirror</option><option value="mirror-h">Horizontal mirror</option><option value="quarter">Four-way mirror</option><option value="radial-4">Radial, 4 parts</option><option value="radial-6">Radial, 6 parts</option><option value="radial-8">Radial, 8 parts</option><option value="radial-12">Radial, 12 parts</option><option value="offset">Half-drop repeat</option></select><i className="ph-fill ph-caret-down select-caret" /></div><p className="control-hint symmetry-hint">{symmetryHelp[options.symmetry]}</p></div>
            <div className="animation-row"><div><span className="control-label">Movement</span><span className="control-hint">See the pattern change over time</span></div><button className="toggle" type="button" role="switch" aria-checked={options.animate} aria-label="Enable movement" onClick={() => setOption('animate', !options.animate)}><span /></button></div>
            {options.animate && <div className="animation-options"><label className="control-label" htmlFor="motion-select">Movement style</label><div className="select-wrap plain-select"><select id="motion-select" value={options.motion} onChange={(event) => setOption('motion', event.target.value as Motion)}>{Object.entries(motionNames).map(([value, name]) => <option value={value} key={value}>{name}</option>)}</select><i className="ph-fill ph-caret-down select-caret" /></div><Slider label="Pace" value={Math.round(options.speed * 10)} min={3} max={24} left="Slow" right="Quick" display={`${options.speed.toFixed(1)}×`} onChange={(value) => setOption('speed', value / 10)} /></div>}
            <button className="button button-gold create-button" type="button" onClick={randomize}><i className="ph-fill ph-arrows-clockwise" /> Make a new pattern</button>
          </aside>

          <div className="pattern-stage"><div className="stage-topline"><span>{country.name}</span><span className="stage-separator">/</span><span>{patternNames[options.pattern]}</span><span className={`stage-live${options.animate ? ' moving' : ''}`}><span />{options.animate ? motionNames[options.motion] : 'Still'}</span></div><div className="canvas-frame"><PatternCanvas options={displayedOptions} label={`${country.name} flag color pattern, ${patternNames[options.pattern]}, ${options.symmetry}`} onCanvas={(canvas) => { canvasRef.current = canvas; }} /><div className="canvas-overlay"><button className="icon-button" type="button" onClick={download} aria-label="Download pattern as PNG" title="Download PNG"><i className="ph-fill ph-download-simple" /></button><button className="icon-button" type="button" onClick={savePattern} aria-label="Save pattern" title="Save to My patterns"><i className="ph-fill ph-heart" /></button></div></div><div className="stage-footer"><span>{country.name}, {patternNames[options.pattern]}</span><span>Made by you <i className="ph-fill ph-sparkle" /></span></div></div>
        </div>
      </section>

      <section className="story-section" id="stories"><div className="story-visual"><PatternCanvas options={{ ...emptyOptions, colors: ['#1c0f0f', '#d4af37', '#ffdd44', '#f5f5f5', '#b03b22', '#24694b'], seed: 113, density: 6, symmetry: 'radial-6', pattern: 'petals' }} label="Radial pattern in gold, red, green, and cream" /><span className="story-visual-label">A living archive</span></div><div className="story-copy"><h2>The cloth holds a conversation.</h2><p>Across the continent, cloth can mark a gathering, carry a proverb, or show the hand of the person who made it. AfriPattern is a place to explore visual languages with curiosity and care.</p><p className="story-small">Start with a flag. Follow the colors. Make a new arrangement.</p><a className="text-link" href="#studio">Return to your canvas <i className="ph-fill ph-arrow-up-right" /></a></div></section>
    </main>
    <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><i className="ph-fill ph-shapes" /></span><span>afri<span className="brand-light">pattern</span></span></a><p>Made with curiosity, color, and respect.</p><a href="#studio">Back to studio <i className="ph-fill ph-arrow-up" /></a></footer>

    <dialog className="gallery-dialog" ref={dialogRef} onClose={() => setGalleryOpen(false)} onClick={(event) => { if (event.target === dialogRef.current) setGalleryOpen(false); }}><div className="dialog-head"><div><h2>My patterns</h2><p>Your saved designs live on this device.</p></div><button className="icon-button close-dialog" type="button" aria-label="Close gallery" onClick={() => setGalleryOpen(false)}><i className="ph-fill ph-x" /></button></div>{saved.length ? <div className="gallery-grid">{saved.map((entry) => <button type="button" className="gallery-card" key={entry.id} onClick={() => restorePattern(entry)}><img src={entry.image} alt="" /><span>{entry.title}</span></button>)}</div> : <p className="gallery-empty">Your next pattern can start here. Save a design from the studio to keep it close.</p>}</dialog>
    <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
  </div>;
}

function Slider({ label, value, min, max, left, right, display, onChange }: { label: string; value: number; min: number; max: number; left: string; right: string; display?: string; onChange: (value: number) => void }) {
  const id = `slider-${label.toLowerCase().replace(/\s/g, '-')}`;
  return <div className="control-block slider-block"><div className="label-row"><label className="control-label" htmlFor={id}>{label}</label><output htmlFor={id}>{display ?? value}</output></div><input id={id} type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /><div className="range-ends"><span>{left}</span><span>{right}</span></div></div>;
}
