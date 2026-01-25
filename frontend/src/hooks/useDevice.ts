import { useState, useEffect } from 'react';

export type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP';
export type Orientation = 'PORTRAIT' | 'LANDSCAPE';

export function useDevice() {
    const [deviceType, setDeviceType] = useState<DeviceType>('DESKTOP');
    const [orientation, setOrientation] = useState<Orientation>('PORTRAIT');

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Device Type Detection
            if (width < 768) {
                setDeviceType('MOBILE');
            } else if (width >= 768 && width < 1024) {
                setDeviceType('TABLET');
            } else {
                setDeviceType('DESKTOP');
            }

            // Orientation Detection
            if (width > height) {
                setOrientation('LANDSCAPE');
            } else {
                setOrientation('PORTRAIT');
            }
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        window.addEventListener('orientationchange', checkDevice);

        return () => {
            window.removeEventListener('resize', checkDevice);
            window.removeEventListener('orientationchange', checkDevice);
        };
    }, []);

    return {
        deviceType,
        orientation,
        isMobile: deviceType === 'MOBILE',
        isTablet: deviceType === 'TABLET',
        isDesktop: deviceType === 'DESKTOP',
        isLandscape: orientation === 'LANDSCAPE',
        isPortrait: orientation === 'PORTRAIT'
    };
}
