// Base 3D scene with camera, lighting, grid, axes

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import styles from './Scene3D.module.css';

interface Props {
  children?: React.ReactNode;
  height?: number;
}

export default function Scene3D({ children, height }: Props) {
  const style = height !== undefined ? { height } : { flex: 1, minHeight: 0 };
  return (
    <div className={styles.canvas} style={style}>
      <Canvas
        camera={{ position: [5, 3, 5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        {/* Simple grid */}
        <gridHelper args={[10, 10, '#c5cfe8', '#d9e0f5']} />

        {/* World axes */}
        <axesHelper args={[2]} />

        {/* OrbitControls — makeDefault lets TransformControls disable it while dragging */}
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />

        {children}
      </Canvas>
    </div>
  );
}
