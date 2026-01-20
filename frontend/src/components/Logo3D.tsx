import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function AnimatedTorus() {
    const meshRef = useRef<any>();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.5;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
            meshRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.5;
        }
    });

    return (
        <mesh ref={meshRef}>
            <torusGeometry args={[2.5, 0.4, 16, 100]} />
            <meshStandardMaterial color="#3B82F6" metalness={0.8} roughness={0.2} />
        </mesh>
    );
}

export function Logo3D() {
    return (
        <div className="w-10 h-10">
            <Canvas camera={{ position: [0, 0, 8], fov: 40 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#3B82F6" />
                <AnimatedTorus />
            </Canvas>
        </div>
    );
}
