import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useExitPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
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
    isExitingRef.current = true;
    // window.close() only works on a window/tab that was opened via script
    // (window.open). A tab the user navigated to directly, or a PWA launched
    // from the home screen, was never opened that way, so browsers silently
    // block window.close() there - that was the bug: "Leave" did nothing.
    //
    // Instead, pop past our own history trap (the trap entry + the entry
    // before it) so the back navigation actually leaves the app's history.
    // On Android this exits/minimizes an installed PWA to the home screen;
    // on iOS it exits the standalone PWA the same way. We still try
    // window.close() afterwards as a harmless best-effort for the contexts
    // where it does work (e.g. a script-opened window).
    window.history.go(-2);
    setTimeout(() => window.close(), 50);
  };

  const cancelExit = () => {
    setShowPrompt(false);
  };

  return { showPrompt, confirmExit, cancelExit };
}
