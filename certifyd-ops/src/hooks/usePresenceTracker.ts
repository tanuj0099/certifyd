'use client';

import { useEffect, useRef, useState } from 'react';
import { recordHeartbeatAction } from '@/actions/attendanceActions';

export function usePresenceTracker() {
  const [isActive, setIsActive] = useState(true);
  const lastActivityTime = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_THRESHOLD_MS = 7 * 60 * 1000; // 7 minutes
  const PING_INTERVAL_MS = 60 * 1000; // 60 seconds
  const activeTimeSinceLastPing = useRef<number>(0);

  useEffect(() => {
    function resetActivity() {
      lastActivityTime.current = Date.now();
      if (!isActive) {
        setIsActive(true);
      }
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      idleTimeoutRef.current = setTimeout(() => {
        setIsActive(false);
      }, IDLE_THRESHOLD_MS);
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetActivity, { passive: true });
    });

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetActivity();
      } else {
        // Option to immediately set inactive when hidden, but typically we let the timeout handle it
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resetActivity();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [isActive, IDLE_THRESHOLD_MS]);

  useEffect(() => {
    let lastTick = Date.now();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastTick) / 1000);
      lastTick = now;

      if (isActive && document.visibilityState === 'visible') {
        activeTimeSinceLastPing.current += deltaSeconds;
      }

      // Check if it's been roughly a minute
      if (activeTimeSinceLastPing.current >= 60) {
        const secondsToLog = activeTimeSinceLastPing.current;
        activeTimeSinceLastPing.current = 0;
        
        recordHeartbeatAction(secondsToLog).catch(err => {
          console.error("Failed to record heartbeat", err);
          // If it fails, we add it back so we can try again next tick
          activeTimeSinceLastPing.current += secondsToLog;
        });
      }
    }, 5000); // Check every 5 seconds, send every 60 accumulated seconds

    return () => clearInterval(interval);
  }, [isActive]);

  return { isActive };
}
