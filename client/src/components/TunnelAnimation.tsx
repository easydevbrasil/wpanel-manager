import { useEffect, useState } from 'react';
import { Monitor, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TunnelAnimationProps {
  isActive: boolean;
  className?: string;
}

export function TunnelAnimation({ isActive, className }: TunnelAnimationProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Dotted Line Connection */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-0.5 flex items-center justify-between px-6">
          {/* Dotted line with animation */}
          <div className={cn(
            "flex-1 h-0.5 border-t-2 border-dotted transition-colors duration-300",
            isActive 
              ? "border-blue-400 dark:border-blue-500" 
              : "border-gray-300 dark:border-gray-600"
          )}>
            {/* Moving dot animation */}
            {isActive && (
              <div className="relative w-full h-full overflow-hidden">
                <div className="absolute w-2 h-2 bg-blue-400 rounded-full -top-1 animate-tunnel-dot" />
                <div className="absolute w-2 h-2 bg-blue-400 rounded-full -top-1 animate-tunnel-dot" style={{ animationDelay: '0.5s' }} />
                <div className="absolute w-2 h-2 bg-blue-400 rounded-full -top-1 animate-tunnel-dot" style={{ animationDelay: '1s' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source Icon (Bolt) */}
      <div className="absolute left-0 z-10">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300",
          isActive 
            ? "bg-blue-500 shadow-lg shadow-blue-500/30" 
            : "bg-gray-400 dark:bg-gray-600"
        )}>
          <Zap className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Destination Icon (PC) */}
      <div className="absolute right-0 z-10">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300",
          isActive 
            ? "bg-green-500 shadow-lg shadow-green-500/30" 
            : "bg-gray-400 dark:bg-gray-600"
        )}>
          <Monitor className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Pulse effect when active */}
      {isActive && (
        <>
          <div className="absolute left-0 w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-20" />
          <div className="absolute right-0 w-6 h-6 bg-green-500 rounded-full animate-ping opacity-20" style={{ animationDelay: '0.5s' }} />
        </>
      )}
    </div>
  );
}