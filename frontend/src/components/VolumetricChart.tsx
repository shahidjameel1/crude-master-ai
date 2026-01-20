import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

function Candle3D({ data, index, minPrice, priceRange, chartHeight }: { data: CandleData, index: number, minPrice: number, priceRange: number, chartHeight: number }) {
    const isBullish = data.close >= data.open;
    const color = isBullish ? '#10B981' : '#EF4444';

    const yCenter = ((data.open + data.close) / 2 - minPrice) / priceRange * chartHeight;
    const height = Math.max(Math.abs(data.close - data.open) / priceRange * chartHeight, 0.1);
    const wickHeight = (data.high - data.low) / priceRange * chartHeight;
    const wickY = (data.low - minPrice) / priceRange * chartHeight + (wickHeight / 2);

    const x = index * 1.5;

    return (
        <group position={[x, 0, 0]}>
            {/* Body */}
            <mesh position={[0, yCenter, 0]}>
                <boxGeometry args={[1, height, 1]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
            </mesh>

            {/* Wick */}
            <mesh position={[0, wickY, 0]}>
                <boxGeometry args={[0.1, wickHeight, 0.1]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    );
}

function ChartScene({ candles }: { candles: CandleData[] }) {
    const groupRef = useRef<THREE.Group>(null);
    const { viewport } = useThree();

    const visibleCandles = useMemo(() => (candles || []).slice(-50), [candles]);
    const minPrice = useMemo(() => Math.min(...visibleCandles.map(c => c.low)), [visibleCandles]);
    const maxPrice = useMemo(() => Math.max(...visibleCandles.map(c => c.high)), [visibleCandles]);
    const priceRange = useMemo(() => maxPrice - minPrice || 1, [maxPrice, minPrice]);

    // Scale chart to fit viewport height with some padding
    const chartHeight = viewport.height * 0.6;

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.y = -(chartHeight / 2) + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={[-(visibleCandles.length * 1.5) / 2, 0, 0]}>
            {visibleCandles.map((candle, i) => (
                <Candle3D
                    key={i}
                    data={candle}
                    index={i}
                    minPrice={minPrice}
                    priceRange={priceRange}
                    chartHeight={chartHeight}
                />
            ))}
        </group>
    );
}

export function VolumetricChart({ data, symbol = "CRUDEOIL", timeframe = "15m" }: any) {
    return (
        <div className="flex flex-col h-full w-full relative group overflow-hidden bg-black/5 rounded-lg">
            {/* Mobile Header Info */}
            <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex flex-col gap-1">
                <div className="glass-dark px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3 border border-white/10 shadow-blue-glow">
                    <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-success animate-pulse shadow-success-glow" />
                    <span className="text-[10px] md:text-sm font-bold tracking-widest text-white font-heading">{symbol}</span>
                    <span className="text-[8px] md:text-[10px] text-text-tertiary bg-white/5 px-1 md:px-2 py-0.5 rounded uppercase">{timeframe}</span>
                </div>
            </div>

            <div className="w-full h-full">
                <Canvas
                    shadows
                    camera={{ position: [0, 0, 45], fov: 40 }}
                    dpr={[1, 2]} // Support high-DPI screens
                    resize={{ scroll: false }} // Better responsiveness
                >
                    <ambientLight intensity={0.4} />
                    <pointLight position={[10, 10, 10]} intensity={1} color="#3B82F6" />
                    <pointLight position={[-10, 10, 10]} intensity={0.5} color="#8B5CF6" />
                    <ChartScene candles={data} />
                    <fog attach="fog" args={['#0A0E1A', 35, 120]} />
                </Canvas>
            </div>

            {/* Desktop Status Indicators */}
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 text-[8px] md:text-[10px] text-text-tertiary font-mono pointer-events-none hidden xs:flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-success rounded-sm" /> BULLISH</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-error rounded-sm" /> BEARISH</div>
                <span className="opacity-50">• {data?.length || 0} PERSISTED</span>
            </div>
        </div>
    );
}
