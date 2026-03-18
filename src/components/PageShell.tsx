import React, { useState } from 'react';
import styles from './PageShell.module.css';

interface Props {
  title: string;
  badge: string;
  badgeColor?: string;
  formulas?: React.ReactNode;
  visualization: React.ReactNode;
  controls: React.ReactNode;
  numerics: React.ReactNode;
}

export default function PageShell({
  title, badge, badgeColor = 'var(--accent-blue)',
  formulas, visualization, controls, numerics,
}: Props) {
  const [showFormulas, setShowFormulas] = useState(false);
  const [showNumerics, setShowNumerics] = useState(false);

  return (
    <div className={styles.page}>
      {/* Visualization fills all available space */}
      <div className={styles.vizWrapper}>
        <div className={styles.vizContent}>{visualization}</div>

        {/* Title + badge overlay (top-left) */}
        <div className={styles.titleOverlay}>
          <span className={styles.title}>{title}</span>
          <span className={styles.badge} style={{ background: badgeColor + '22', color: badgeColor, borderColor: badgeColor + '55' }}>
            {badge}
          </span>
        </div>

        {/* Toggle buttons (top-right) */}
        <div className={styles.toggleBtns}>
          {formulas && (
            <button
              className={`${styles.toggleBtn} ${showFormulas ? styles.toggleActive : ''}`}
              onClick={() => setShowFormulas(v => !v)}
              title="Toggle formulas"
            >
              ƒ(x)
            </button>
          )}
          <button
            className={`${styles.toggleBtn} ${showNumerics ? styles.toggleActive : ''}`}
            onClick={() => setShowNumerics(v => !v)}
            title="Toggle numeric values"
          >
            123
          </button>
        </div>

        {/* Formula floating panel */}
        {showFormulas && formulas && (
          <div className={styles.formulaPanel}>{formulas}</div>
        )}

        {/* Numerics floating panel */}
        {showNumerics && (
          <div className={styles.numericsPanel}>{numerics}</div>
        )}
      </div>

      {/* Compact controls bar */}
      <div className={styles.controlsBar}>{controls}</div>
    </div>
  );
}
