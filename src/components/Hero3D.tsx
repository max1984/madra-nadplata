import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function Scene() {
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (torusRef.current) {
      torusRef.current.rotation.z += delta * 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} color="#4f8ef7" intensity={2} />
      <pointLight position={[-5, -3, 5]} color="#a78bfa" intensity={1.5} />

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
        <mesh>
          <icosahedronGeometry args={[1.8, 1]} />
          <meshStandardMaterial
            wireframe
            color="#4f8ef7"
            opacity={0.55}
            transparent
          />
        </mesh>
      </Float>

      <mesh
        ref={torusRef}
        rotation={[Math.PI / 3, Math.PI / 6, 0]}
      >
        <torusGeometry args={[2.5, 0.04, 16, 80]} />
        <meshStandardMaterial color="#a78bfa" opacity={0.3} transparent />
      </mesh>

      <mesh rotation={[Math.PI / 5, Math.PI / 4, Math.PI / 8]}>
        <torusGeometry args={[3.2, 0.02, 12, 60]} />
        <meshStandardMaterial color="#06b6d4" opacity={0.18} transparent />
      </mesh>
    </>
  );
}

export default function Hero3D() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
