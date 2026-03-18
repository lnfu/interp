
import styles from './SliderControl.module.css';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export default function SliderControl({
  label, value, onChange, min = 0, max = 1, step = 0.01,
  isPlaying, onTogglePlay,
}: Props) {
  return (
    <div className={styles.container}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.value}>{value.toFixed(3)}</span>
        {onTogglePlay && (
          <button
            onClick={onTogglePlay}
            className={`${styles.playBtn} ${isPlaying ? styles.active : ''}`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        )}
      </div>
    </div>
  );
}
