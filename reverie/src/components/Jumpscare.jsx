import { useEffect, useState } from "react";

export default function Jumpscare({ candles }) {
  const [show, setShow] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!candles || candles.length < 6) return;

    // Check if the last 4 *completed* candles are all red (close < open)
    const completedCandles = candles.slice(-5, -1);
    const isPersistentDowntrend = completedCandles.every((c) => c.close < c.open);

    if (isPersistentDowntrend && !hasTriggered) {
      setShow(true);
      setHasTriggered(true);
      
      // Hide after animation finishes
      setTimeout(() => {
        setShow(false);
      }, 2500);
    } else if (!isPersistentDowntrend && hasTriggered) {
      // Reset trigger if trend breaks
      setHasTriggered(false);
    }
  }, [candles, hasTriggered]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        animation: "jumpscare 2.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      }}
    >
      <style>
        {`
          @keyframes jumpscare {
            0% {
              transform: scale(0.1) translateY(50vh);
              opacity: 0;
            }
            15% {
              transform: scale(1.5) translateY(0);
              opacity: 1;
            }
            20% {
              transform: scale(1.2) translateY(0) rotate(-5deg);
              opacity: 1;
            }
            25% {
              transform: scale(1.3) translateY(0) rotate(5deg);
              opacity: 1;
            }
            30% {
              transform: scale(1.2) translateY(0) rotate(0deg);
              opacity: 1;
            }
            80% {
              transform: scale(1.2) translateY(0);
              opacity: 1;
            }
            100% {
              transform: scale(4) translateY(50vh);
              opacity: 0;
            }
          }
        `}
      </style>
      <div style={{ fontSize: "20rem", filter: "drop-shadow(0 0 100px rgba(239, 68, 68, 1))" }}>
        😭
      </div>
    </div>
  );
}
