import { useState, useEffect, useCallback } from 'react';

// Assume window.aistudio is available in the execution context
// FIX: Define AIStudio interface to avoid type conflicts with global declarations.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}

export const useVeoApiKey = () => {
  const [isKeyAvailable, setIsKeyAvailable] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const checkKey = useCallback(async () => {
    if (window.aistudio) {
      setIsChecking(true);
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeyAvailable(hasKey);
      } catch (error) {
        console.error("Error checking for API key:", error);
        setIsKeyAvailable(false);
      } finally {
        setIsChecking(false);
      }
    } else {
        console.warn("aistudio context not found. Assuming key is available via environment variable.");
        // Fallback for environments where aistudio is not present
        setIsKeyAvailable(true); 
        setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkKey();
  }, [checkKey]);

  const selectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Assume success after opening dialog to avoid race conditions
        // and immediately allow the user to proceed. The API call will
        // ultimately fail if no key was selected.
        setIsKeyAvailable(true);
      } catch (error) {
        console.error("Error opening key selection dialog:", error);
      }
    }
  };

  const resetKeyState = useCallback(() => {
    setIsKeyAvailable(false);
  }, []);

  return { isKeyAvailable, isChecking, selectKey, resetKeyState };
};