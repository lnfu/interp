import { useState, useRef, useCallback, useEffect } from 'react';
import PageShell from '../components/PageShell';
import FormulaBlock from '../components/FormulaBlock';
import SliderControl from '../components/SliderControl';
import MatrixDisplay from '../components/MatrixDisplay';
import ResetButton from '../components/ResetButton';
import NumericPanel from '../components/NumericPanel';
import SO3Scene from '../components/SO3Scene';
import { so3MatrixSlerp, so3GeodesicAngle } from '../math/so3';
import { identity } from '../math/utils';

// Default start: identity
// Default end: 90° around Y axis
const DEG90 = Math.PI / 2;
const DEFAULT_R0 = identity(3);
const DEFAULT_R1 = [
  Math.cos(DEG90), 0, Math.sin(DEG90),
  0, 1, 0,
  -Math.sin(DEG90), 0, Math.cos(DEG90),
];

export default function SO3MatrixPage() {
  const [R0, setR0] = useState<number[]>(DEFAULT_R0);
  const [R1, setR1] = useState<number[]>(DEFAULT_R1);
  const [s, setS] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dirRef = useRef(1);

  const Rs = so3MatrixSlerp(R0, R1, s);
  const theta = so3GeodesicAngle(R0, R1);

  const reset = useCallback(() => {
    setR0(DEFAULT_R0);
    setR1(DEFAULT_R1);
    setS(0);
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    dirRef.current = 1;
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    setS((prev) => {
      const step = (dt / 2000) * dirRef.current;
      let next = prev + step;
      if (next >= 1) { next = 1; dirRef.current = -1; }
      else if (next <= 0) { next = 0; dirRef.current = 1; }
      return next;
    });
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      setIsPlaying(false);
    } else {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(animate);
      setIsPlaying(true);
    }
  }, [isPlaying, animate]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return (
    <PageShell
      title="SO(3) — Rotation Matrix SLERP"
      badge="SO(3)"
      badgeColor="var(--accent-purple)"
      formulas={
        <>
          <FormulaBlock latex={String.raw`\Delta R = R_0^\top R_1`} />
          <FormulaBlock latex={String.raw`\theta = \arccos\!\left(\frac{\operatorname{tr}(\Delta R) - 1}{2}\right)`} />
          <FormulaBlock latex={String.raw`[\hat{\omega}]_\times = \frac{\Delta R - \Delta R^\top}{2\sin\theta}`} />
          <FormulaBlock latex={String.raw`R(s) = R_0\!\left(I + \sin(s\theta)[\hat{\omega}]_\times + (1-\cos(s\theta))[\hat{\omega}]_\times^2\right)`} />
        </>
      }
      visualization={
        <SO3Scene R0={R0} R1={R1} Rs={Rs} onR0Change={setR0} onR1Change={setR1} />
      }
      controls={
        <>
          <SliderControl label="Interpolation parameter s" value={s} onChange={setS} isPlaying={isPlaying} onTogglePlay={togglePlay} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ResetButton onClick={reset} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Geodesic angle θ = {(theta * 180 / Math.PI).toFixed(1)}°
            </span>
          </div>
        </>
      }
      numerics={
        <>
          <NumericPanel label="R₀ (start)" color="var(--accent-blue)">
            <MatrixDisplay matrix={R0} rows={3} cols={3} />
          </NumericPanel>
          <NumericPanel label="R₁ (end)" color="var(--accent-red)">
            <MatrixDisplay matrix={R1} rows={3} cols={3} />
          </NumericPanel>
          <NumericPanel label={`R(s=${s.toFixed(2)})`} color="var(--accent-green)">
            <MatrixDisplay matrix={Rs} rows={3} cols={3} />
          </NumericPanel>
        </>
      }
    />
  );
}
