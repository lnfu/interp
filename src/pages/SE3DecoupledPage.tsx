import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import PageShell from '../components/PageShell';
import FormulaBlock from '../components/FormulaBlock';
import SliderControl from '../components/SliderControl';
import MatrixDisplay from '../components/MatrixDisplay';
import ResetButton from '../components/ResetButton';
import NumericPanel from '../components/NumericPanel';
import SE3Scene from '../components/SE3Scene';
import { decoupledLerpSlerp } from '../math/lerpSlerp';
import { se3ScLERP, extractRT } from '../math/se3';
import { matrixToQuaternion, quaternionToMatrix } from '../math/quaternion';
import { buildSE3 } from '../math/se3';
import { arrayToQuaternion, quaternionToArray } from '../utils/threeConversions';

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

function se3ToQP(X: number[]): { q: THREE.Quaternion; p: THREE.Vector3 } {
  const { R, p } = extractRT(X);
  const qArr = matrixToQuaternion(R);
  return {
    q: arrayToQuaternion(qArr),
    p: new THREE.Vector3(p[0], p[1], p[2]),
  };
}

function qpToSE3(q: THREE.Quaternion, p: THREE.Vector3): number[] {
  const qArr = quaternionToArray(q);
  const R = quaternionToMatrix(qArr);
  return buildSE3(R, [p.x, p.y, p.z]);
}

export default function SE3DecoupledPage() {
  const [X0, setX0] = useState<number[]>(DEFAULT_X0);
  const [X1, setX1] = useState<number[]>(DEFAULT_X1);
  const [s, setS] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScLERP, setShowScLERP] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dirRef = useRef(1);

  const { q: q0, p: p0 } = se3ToQP(X0);
  const { q: q1, p: p1 } = se3ToQP(X1);
  const { quaternion: qs, position: ps } = decoupledLerpSlerp(q0, p0, q1, p1, s);
  const Xs = qpToSE3(qs, ps);

  // ScLERP overlay for comparison
  const XsScLERP = showScLERP ? se3ScLERP(X0, X1, s) : null;

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
      title="SE(3) — Decoupled LERP + SLERP"
      badge="Decoupled"
      badgeColor="var(--accent-yellow)"
      formulas={
        <>
          <FormulaBlock latex={String.raw`p(s) = (1-s)\,p_0 + s\,p_1 \quad \text{(linear interpolation)}`} />
          <FormulaBlock latex={String.raw`q(s) = \text{THREE.Quaternion.slerp}(q_0, q_1, s) \quad \text{(built-in SLERP)}`} />
          <FormulaBlock latex={String.raw`\text{This decouples rotation and translation — NOT a geodesic on SE(3)}`} />
        </>
      }
      visualization={
        <SE3Scene
          X0={X0} X1={X1} Xs={Xs}
          onX0Change={setX0} onX1Change={setX1}
          overlayXs={XsScLERP}
          overlayColor="#ffd43b"
        />
      }
      controls={
        <>
          <SliderControl label="Interpolation parameter s" value={s} onChange={setS} isPlaying={isPlaying} onTogglePlay={togglePlay} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <ResetButton onClick={reset} />
            <button
              className={showScLERP ? 'active' : ''}
              onClick={() => setShowScLERP(v => !v)}
              style={{ fontSize: '0.8rem' }}
            >
              {showScLERP ? '✓' : '○'} Overlay ScLERP (yellow wireframe)
            </button>
          </div>
          {showScLERP && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '4px 0' }}>
              <span style={{ color: '#ffd43b', fontWeight: 600 }}>Yellow wireframe</span> = SE(3) ScLERP path.{' '}
              <span style={{ color: 'var(--accent-green)' }}>Green solid</span> = Decoupled LERP+SLERP.
              Notice how they differ — decoupled interpolation does not travel the geodesic!
            </div>
          )}
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
          <NumericPanel label={`X(s=${s.toFixed(2)}) — decoupled`} color="var(--accent-green)">
            <MatrixDisplay matrix={Xs} rows={4} cols={4} />
          </NumericPanel>
          {showScLERP && XsScLERP && (
            <NumericPanel label={`X(s=${s.toFixed(2)}) — ScLERP`} color="#ffd43b">
              <MatrixDisplay matrix={XsScLERP} rows={4} cols={4} />
            </NumericPanel>
          )}
        </>
      }
    />
  );
}
