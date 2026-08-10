import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useExitPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const location = useLocation();

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
    // Attempt to close the PWA window directly. 
    // This is more reliable for exiting an installed PWA than navigating backwards,
    // which can accidentally just take the user to a previous page they visited in the app.
    window.close();
  };

  const cancelExit = () => {
    setShowPrompt(false);
  };

  return { showPrompt, confirmExit, cancelExit };
}
