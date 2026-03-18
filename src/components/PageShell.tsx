import React from 'react';
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


  return (
    <div className={styles.page}>
      {/* Title */}
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.badge} style={{ background: badgeColor + '22', color: badgeColor, borderColor: badgeColor + '55' }}>
          {badge}
        </span>
      </div>

      {/* Formula section */}
      {formulas && (
        <section className={styles.section}>
          <div className={styles.formulaContent}>{formulas}</div>
        </section>
      )}

      {/* Visualization */}
      <section className={styles.section}>
        {visualization}
      </section>

      {/* Controls */}
      <section className={styles.section}>
        <div className={styles.controls}>{controls}</div>
      </section>

      {/* Numerics */}
      <section className={styles.section}>
        <div className={styles.numerics}>{numerics}</div>
      </section>
    </div>
  );
}
