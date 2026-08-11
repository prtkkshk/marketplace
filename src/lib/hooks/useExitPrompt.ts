import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useExitPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [exitFallback, setExitFallback] = useState(false);
  const location = useLocation();
  // Set right before we intentionally navigate past the trap on confirmed exit,
  // so the popstate handler below knows not to re-arm the trap for that pop.
  const isExitingRef = useRef(false);

  useEffect(() => {
    // Only apply the trap on the root feed screen
    if (location.pathname !== '/') {
      return;
    }

    // Push a dummy state if we don't already have one
    if (!window.history.state?.exitTrap) {
      window.history.pushState({ ...window.history.state, exitTrap: true }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      // If this pop is the one we triggered from confirmExit, let it proceed
      // (don't show the prompt again, don't re-arm the trap).
      if (isExitingRef.current) {
        return;
      }
      // When the user presses back, the browser pops the exitTrap state.
      // Now the state no longer has exitTrap.
      if (!event.state?.exitTrap) {
        // Show the prompt
        setShowPrompt(true);
        // Immediately push the trap back so the NEXT back button press doesn't exit the app
        window.history.pushState({ ...window.history.state, exitTrap: true }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname]);

  const confirmExit = () => {
    setShowPrompt(false);
    setExitFallback(false);
    isExitingRef.current = true;
    
    console.debug('Exit flow: trap armed, first back() firing');
    window.history.back(); // Pop the trap

    // Wait for the first pop to process, then pop again to exit
    setTimeout(() => {
      console.debug('Exit flow: second back() firing');
      window.history.back();

      // Fallback: try window.close() as a harmless best-effort
      setTimeout(() => {
        console.debug('Exit flow: close() attempted');
        window.close();
        
        // Visible fallback if app is still open
        setTimeout(() => {
          if (document.visibilityState !== 'hidden') {
            console.debug('Exit flow: fallback triggered');
            setExitFallback(true);
            setShowPrompt(true);
            isExitingRef.current = false;
            // The history state might be at the root now, so we re-arm the trap
            window.history.pushState({ ...window.history.state, exitTrap: true }, '');
          }
        }, 300);
      }, 50);
    }, 100);
  };

  const cancelExit = () => {
    setShowPrompt(false);
    setExitFallback(false);
  };

  return { showPrompt, exitFallback, confirmExit, cancelExit };
}
