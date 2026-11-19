import { useEffect, ReactNode } from "react";

const OrientationLock = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    // Try to lock orientation using Screen Orientation API
    const lockOrientation = async () => {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock("portrait");
        }
      } catch {
        // Browsers may reject orientation locking outside fullscreen/mobile contexts.
      }
    };

    lockOrientation();

    // Cleanup: unlock orientation when component unmounts
    return () => {
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (error) {
        // Silently handle unlock errors
      }
    };
  }, []);

  return (
    <>
      {children}
      <style>{`
        /* Force portrait mode on mobile/tablet devices */
        @media screen and (orientation: landscape) and (max-width: 1024px) and (hover: none) and (pointer: coarse) {
          html {
            transform: rotate(-90deg);
            transform-origin: left top;
            width: 100vh;
            height: 100vw;
            overflow-x: hidden;
            position: absolute;
            top: 100%;
            left: 0;
          }
        }
      `}</style>
    </>
  );
};

export default OrientationLock;
