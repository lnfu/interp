import { useState, useRef, useCallback, useEffect } from 'react';
import PageShell from '../components/PageShell';
import FormulaBlock from '../components/FormulaBlock';
import SliderControl from '../components/SliderControl';
import MatrixDisplay from '../components/MatrixDisplay';
import ResetButton from '../components/ResetButton';
import NumericPanel from '../components/NumericPanel';
import SE3Scene from '../components/SE3Scene';
import {
  dualQuatScLERP,
  poseToUnitDualQuat,
  unitDualQuatToPose,
} from '../math/dualQuaternion';
import { matrixToQuaternion, quaternionToMatrix } from '../math/quaternion';
import { buildSE3, extractRT } from '../math/se3';

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

function se3ToDQ(X: number[]) {
  const { R, p } = extractRT(X);
  const q = matrixToQuaternion(R);
  return poseToUnitDualQuat(q, p);
}

function dqToSE3(dq: number[]): number[] {
  const { quaternion, translation } = unitDualQuatToPose(dq);
  const R = quaternionToMatrix(quaternion);
  return buildSE3(R, translation);
}

function fmt4(n: number) { return n.toFixed(4); }

export default function SE3DualQuatPage() {
  const [X0, setX0] = useState<number[]>(DEFAULT_X0);
  const [X1, setX1] = useState<number[]>(DEFAULT_X1);
  const [s, setS] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dirRef = useRef(1);

  const dq0 = se3ToDQ(X0);
  const dq1 = se3ToDQ(X1);
  const dqs = dualQuatScLERP(dq0, dq1, s);
  const Xs = dqToSE3(dqs);

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

  const DQRow = ({ label, dq, color }: { label: string; dq: number[]; color: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontSize: '0.72rem', color, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-primary)' }}>
        r: [{dq.slice(0,4).map(fmt4).join(', ')}]
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
        d: [{dq.slice(4,8).map(fmt4).join(', ')}]
      </div>
    </div>
  );

  return (
    <PageShell
      title="SE(3) — ScLERP via Dual Quaternion"
      badge="TS³"
      badgeColor="var(--accent-red)"
      formulas={
        <>
          <FormulaBlock latex={String.raw`\hat{q} = q_r + \varepsilon q_d, \quad \varepsilon^2 = 0`} />
          <FormulaBlock latex={String.raw`\hat{q}(s) = \hat{q}_0 \cdot \exp\!\left(s \cdot \log(\hat{q}_0^* \cdot \hat{q}_1)\right)`} />
          <FormulaBlock latex={String.raw`\hat{q} = q_r + \varepsilon \tfrac{1}{2} t \cdot q_r \quad \text{(pose encoding)}`} />
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
          <NumericPanel label="Dual Quaternions" color="var(--text-secondary)">
            <DQRow label="q̂₀" dq={dq0} color="var(--accent-blue)" />
            <DQRow label="q̂₁" dq={dq1} color="var(--accent-red)" />
            <DQRow label={`q̂(s=${s.toFixed(2)})`} dq={dqs} color="var(--accent-green)" />
          </NumericPanel>
          <NumericPanel label="X₀ (start)" color="var(--accent-blue)">
            <MatrixDisplay matrix={X0} rows={4} cols={4} />
          </NumericPanel>
          <NumericPanel label="X₁ (end)" color="var(--accent-red)">
            <MatrixDisplay matrix={X1} rows={4} cols={4} />
          </NumericPanel>
          <NumericPanel label={`X(s=${s.toFixed(2)})`} color="var(--accent-green)">
            <MatrixDisplay matrix={Xs} rows={4} cols={4} />
          </NumericPanel>
        </>
      }
    />
  );
}
