import { useState, useRef, useCallback, useEffect } from 'react';
import PageShell from '../components/PageShell';
import FormulaBlock from '../components/FormulaBlock';
import SliderControl from '../components/SliderControl';
import MatrixDisplay from '../components/MatrixDisplay';
import CircleDragInput from '../components/CircleDragInput';
import ResetButton from '../components/ResetButton';
import NumericPanel from '../components/NumericPanel';
import { so2Slerp } from '../math/so2';
import styles from './SO2Page.module.css';

const DEFAULT_THETA0 = -Math.PI / 3;
const DEFAULT_THETA1 = (2 * Math.PI) / 3;

function toDeg(r: number) {
  return ((r * 180) / Math.PI).toFixed(1) + '°';
}

export default function SO2Page() {
  const [theta0, setTheta0] = useState(DEFAULT_THETA0);
  const [theta1, setTheta1] = useState(DEFAULT_THETA1);
  const [s, setS] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dirRef = useRef(1);

  const result = so2Slerp(theta0, theta1, s) as { angle: number; matrix: number[]; deltaTheta: number };
  const { angle, matrix, deltaTheta } = result;

  const handleAngleChange = useCallback((index: number, a: number) => {
    if (index === 0) setTheta0(a);
    else setTheta1(a);
  }, []);

  const reset = useCallback(() => {
    setTheta0(DEFAULT_THETA0);
    setTheta1(DEFAULT_THETA1);
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
      title="SO(2) — De Moivre Interpolation"
      badge="SO(2)"
      badgeColor="var(--accent-blue)"
      formulas={
        <>
          <FormulaBlock latex={String.raw`R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}`} />
          <FormulaBlock latex={String.raw`R(s) = R(\theta_0 + s \cdot \Delta\theta), \quad \Delta\theta = \theta_1 - \theta_0 \in [-\pi, \pi]`} />
          <FormulaBlock latex={String.raw`\text{De Moivre: } e^{i(s\theta)} = \cos(s\theta) + i\sin(s\theta)`} />
        </>
      }
      visualization={
        <div className={styles.vizRow}>
          <CircleDragInput
            handles={[
              { angle: theta0, color: 'var(--accent-blue)', label: 'θ₀' },
              { angle: theta1, color: 'var(--accent-red)', label: 'θ₁' },
            ]}
            onAngleChange={handleAngleChange}
            interpolatedAngle={angle}
            size={300}
          />
          <div className={styles.vizInfo}>
            <div className={styles.infoRow}>
              <span style={{ color: 'var(--accent-blue)' }}>θ₀</span>
              <span className={styles.monoVal}>{toDeg(theta0)}</span>
            </div>
            <div className={styles.infoRow}>
              <span style={{ color: 'var(--accent-red)' }}>θ₁</span>
              <span className={styles.monoVal}>{toDeg(theta1)}</span>
            </div>
            <div className={styles.infoRow}>
              <span style={{ color: 'var(--text-secondary)' }}>Δθ</span>
              <span className={styles.monoVal}>{toDeg(deltaTheta)}</span>
            </div>
            <div className={styles.infoRow}>
              <span style={{ color: 'var(--accent-green)' }}>θ(s)</span>
              <span className={styles.monoVal}>{toDeg(angle)}</span>
            </div>
            <div className={styles.hint}>
              Drag the handles on the circle to set start (blue) and end (red) angles.
              The green arrow shows the interpolated orientation.
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <SliderControl
            label="Interpolation parameter s"
            value={s}
            onChange={setS}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
          />
          <ResetButton onClick={reset} />
        </>
      }
      numerics={
        <>
          <NumericPanel label="R₀ (start)" color="var(--accent-blue)">
            <MatrixDisplay matrix={so2Slerp(theta0, theta1, 0).matrix} rows={2} cols={2} />
          </NumericPanel>
          <NumericPanel label="R₁ (end)" color="var(--accent-red)">
            <MatrixDisplay matrix={so2Slerp(theta0, theta1, 1).matrix} rows={2} cols={2} />
          </NumericPanel>
          <NumericPanel label={`R(s=${s.toFixed(2)})`} color="var(--accent-green)">
            <MatrixDisplay matrix={matrix} rows={2} cols={2} />
          </NumericPanel>
        </>
      }
    />
  );
}
