import React from "react";
import { detectLocation } from "../services/locationService";

export default function LocationButton({ onDetect }) {
  const handleDetect = async () => {
    try {
      const district = await detectLocation();
      alert(`Detected: ${district}`);
      onDetect(district);
    } catch (err) {
      alert("Unable to detect location: " + err);
    }
  };

  return (
    <button onClick={handleDetect} className="location-btn">
      📍 Detect My Location
    </button>
  );
}
