import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
}

export function useScreenOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: ''
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || '';
      const width = window.innerWidth;
      
      // More accurate device detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
                       (width <= 768 && 'ontouchstart' in window);
      
      const isTablet = /iPad|Android/i.test(userAgent) && 
                       width >= 768 && width <= 1024 && 
                       'ontouchstart' in window;
      
      const isDesktop = width >= 1024 && !('ontouchstart' in window);

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        userAgent
      });
    };

    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detect device type first
      detectDevice();
      
      // Consider small screens as mobile/tablet (width < 1024px) 
      // but be more lenient for tablets in landscape
      const isSmallDevice = width < 1024 || deviceInfo.isMobile || deviceInfo.isTablet;
      setIsSmallScreen(isSmallDevice);
      
      // Determine orientation
      if (width > height) {
        setOrientation('landscape');
      } else {
        setOrientation('portrait');
      }
    };

    // Check on mount
    checkOrientation();

    // Listen for orientation/resize changes
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(checkOrientation, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', checkOrientation);

    // Also listen for screen orientation API if available
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', checkOrientation);
      
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, [deviceInfo.isMobile, deviceInfo.isTablet]);

  return {
    orientation,
    isSmallScreen,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    shouldRotate: (deviceInfo.isMobile || deviceInfo.isTablet || isSmallScreen) && orientation === 'portrait',
    deviceInfo
  };
}