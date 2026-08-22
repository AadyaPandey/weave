import React, { useEffect, useState } from "react";
import weaveBrand from "./assets/weave-brand.png";

export default function LandingPage({ onComplete }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 3000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`landing-page ${exiting ? "landing-exit" : ""}`}>
      <img src={weaveBrand} alt="Weave" className="landing-logo" />
    </div>
  );
}
