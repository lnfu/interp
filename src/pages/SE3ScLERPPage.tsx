import { useState, useRef, useCallback, useEffect } from 'react';
import PageShell from '../components/PageShell';
import FormulaBlock from '../components/FormulaBlock';
import SliderControl from '../components/SliderControl';
import MatrixDisplay from '../components/MatrixDisplay';
import ResetButton from '../components/ResetButton';
import NumericPanel from '../components/NumericPanel';
import SE3Scene from '../components/SE3Scene';
import { se3ScLERP, extractRT } from '../math/se3';

// Default: X0 at origin identity, X1 at (2, 0, 0) rotated 90° around Y
const DEFAULT_X0 = [
  1, 0, 0, -2,
  0, 1, 0,  0,
  0, 0, 1,  0,
  0, 0, 0,  1,
];
const DEG90 = Math.PI / 2;
const DEFAULT_X1 = [
  Math.cos(DEG90),  0, Math.sin(DEG90),  2,
  0,                1, 0,                0,
  -Math.sin(DEG90), 0, Math.cos(DEG90),  0,
  0,                0, 0,                1,
];

function fmt4(n: number) { return n.toFixed(4); }

export default function SE3ScLERPPage() {
  const [X0, setX0] = useState<number[]>(DEFAULT_X0);
  const [X1, setX1] = useState<number[]>(DEFAULT_X1);
  const [s, setS] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dirRef = useRef(1);

  const Xs = se3ScLERP(X0, X1, s);
  const { p: ps } = extractRT(Xs);

  const reset = useCallback(() => {
    setX0(DEFAULT_X0); setX1(DEFAULT_X1); setS(0);
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    dirRef.current = 1;
  }, []);

  const animate = useCallback((ts: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = ts;
    const dt = ts - lastTimeRef.current;
    lastTimeRef.current = ts;
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
      title="SE(3) — ScLERP via Matrix"
      badge="SE(3)"
      badgeColor="var(--accent-green)"
      formulas={
        <>
          <FormulaBlock latex={String.raw`X(s) = X_0 \begin{pmatrix} \Delta R(s) & \Delta p(s) \\ 0 & 1 \end{pmatrix}`} />
          <FormulaBlock latex={String.raw`\Delta p(s) = G(s\theta) \cdot s \cdot v, \quad v = G(\theta)^{-1} \Delta p`} />
          <FormulaBlock latex={String.raw`G(\theta) = I - \frac{1-\cos\theta}{\theta}[\hat\omega]_\times + \frac{\theta - \sin\theta}{\theta}[\hat\omega]_\times^2`} />
          <FormulaBlock latex={String.raw`\Delta R(s) = I + \sin(s\theta)[\hat\omega]_\times + (1-\cos(s\theta))[\hat\omega]_\times^2`} />
        </>
      }
      visualization={
        <SE3Scene X0={X0} X1={X1} Xs={Xs} onX0Change={setX0} onX1Change={setX1} />
      }
      controls={
        <>
          <SliderControl label="Interpolation parameter s" value={s} onChange={setS} isPlaying={isPlaying} onTogglePlay={togglePlay} />
          <ResetButton onClick={reset} />
        </>
      }
      numerics={
        <>
          <NumericPanel label="X₀ (start)" color="var(--accent-blue)">
            <MatrixDisplay matrix={X0} rows={4} cols={4} />
          </NumericPanel>
          <NumericPanel label="X₁ (end)" color="var(--accent-red)">
            <MatrixDisplay matrix={X1} rows={4} cols={4} />
          </NumericPanel>
          <NumericPanel label={`X(s=${s.toFixed(2)})`} color="var(--accent-green)">
            <MatrixDisplay matrix={Xs} rows={4} cols={4} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              p(s) = [{ps.map(fmt4).join(', ')}]
            </div>
          </NumericPanel>
        </>
      }
    />
  );
}
