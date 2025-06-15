import { useEffect, useState } from 'react';
import { Monitor, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TunnelAnimationProps {
  isActive: boolean;
  className?: string;
}

export function TunnelAnimation({ isActive, className }: TunnelAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number }>>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Create particles with random delays
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 0.2
    }));
    
    setParticles(newParticles);
  }, [isActive]);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Tunnel Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-2 bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-800 to-transparent rounded-full opacity-30" />
        <div className="absolute w-20 h-1 bg-gradient-to-r from-transparent via-blue-300 dark:via-blue-700 to-transparent rounded-full" />
      </div>

      {/* Data Particles */}
      {isActive && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400 rounded-full animate-tunnel"
          style={{
            animationDelay: `${particle.delay}s`,
            animationDuration: '1.5s',
            animationIterationCount: 'infinite',
            left: '20%',
          }}
        />
      ))}

      {/* Source Icon (Bolt) */}
      <div className="absolute left-0">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Destination Icon (PC) */}
      <div className="absolute right-0">
        <div className="w-6 h-6 bg-gray-600 dark:bg-gray-400 rounded-full flex items-center justify-center">
          <Monitor className="w-3 h-3 text-white dark:text-gray-800" />
        </div>
      </div>

      {/* Tunnel Rings */}
      {isActive && (
        <>
          <div className="absolute w-4 h-4 border border-blue-300 dark:border-blue-600 rounded-full animate-ping opacity-20" style={{ animationDelay: '0s' }} />
          <div className="absolute w-6 h-6 border border-blue-300 dark:border-blue-600 rounded-full animate-ping opacity-20" style={{ animationDelay: '0.3s' }} />
          <div className="absolute w-8 h-8 border border-blue-300 dark:border-blue-600 rounded-full animate-ping opacity-20" style={{ animationDelay: '0.6s' }} />
        </>
      )}
    </div>
  );
}