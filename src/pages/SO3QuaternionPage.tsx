import { useState, useRef, useCallback, useEffect } from 'react';
import PageShell from '../components/PageShell';
import FormulaBlock from '../components/FormulaBlock';
import SliderControl from '../components/SliderControl';
import MatrixDisplay from '../components/MatrixDisplay';
import ResetButton from '../components/ResetButton';
import NumericPanel from '../components/NumericPanel';
import SO3Scene from '../components/SO3Scene';
import { quaternionSlerp, quaternionToMatrix, matrixToQuaternion, quaternionAngle } from '../math/quaternion';
import { identity } from '../math/utils';

const DEG90 = Math.PI / 2;
const DEFAULT_R0 = identity(3);
const DEFAULT_R1 = [
  Math.cos(DEG90), 0, Math.sin(DEG90),
  0, 1, 0,
  -Math.sin(DEG90), 0, Math.cos(DEG90),
];

function fmt4(n: number) { return n.toFixed(4); }

export default function SO3QuaternionPage() {
  const [R0, setR0] = useState<number[]>(DEFAULT_R0);
  const [R1, setR1] = useState<number[]>(DEFAULT_R1);
  const [s, setS] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dirRef = useRef(1);

  const q0 = matrixToQuaternion(R0);
  const q1 = matrixToQuaternion(R1);
  const qs = quaternionSlerp(q0, q1, s);
  const Rs = quaternionToMatrix(qs);
  const Omega = quaternionAngle(q0, q1);

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

  const QuatRow = ({ label, q, color }: { label: string; q: number[]; color: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: '0.75rem', color, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
        [{q.map(fmt4).join(', ')}]
      </div>
    </div>
  );

  return (
    <PageShell
      title="SO(3) — Quaternion SLERP"
      badge="S³"
      badgeColor="var(--accent-yellow)"
      formulas={
        <>
          <FormulaBlock latex={String.raw`\cos\Omega = q_0 \cdot q_1 = w_0w_1 + x_0x_1 + y_0y_1 + z_0z_1`} />
          <FormulaBlock latex={String.raw`q(s) = q_0 \frac{\sin((1-s)\Omega)}{\sin\Omega} + q_1 \frac{\sin(s\Omega)}{\sin\Omega}`} />
          <FormulaBlock latex={String.raw`\text{If } \Omega \approx 0: \quad q(s) = \frac{(1-s)q_0 + sq_1}{\|(1-s)q_0 + sq_1\|} \quad \text{(NLERP fallback)}`} />
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
              Ω = {(Omega * 180 / Math.PI).toFixed(1)}°
            </span>
          </div>
        </>
      }
      numerics={
        <>
          <NumericPanel label="Quaternions" color="var(--text-secondary)">
            <QuatRow label="q₀ [w,x,y,z]" q={q0} color="var(--accent-blue)" />
            <QuatRow label="q₁ [w,x,y,z]" q={q1} color="var(--accent-red)" />
            <QuatRow label={`q(s=${s.toFixed(2)})`} q={qs} color="var(--accent-green)" />
          </NumericPanel>
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
