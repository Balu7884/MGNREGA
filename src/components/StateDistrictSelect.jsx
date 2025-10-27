import React, { useState } from "react";
import statesData from "../data/states_districts.json";

export default function StateDistrictSelect({ onSelect }) {
  const [selectedState, setSelectedState] = useState("");
  const [districts, setDistricts] = useState([]);

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setDistricts(statesData[state] || []);
  };

  return (
    <div className="dropdowns">
      <select onChange={handleStateChange}>
        <option value="">Select State</option>
        {Object.keys(statesData).map((state) => (
          <option key={state} value={state}>{state}</option>
        ))}
      </select>

      {districts.length > 0 && (
        <select onChange={(e) => onSelect(e.target.value)}>
          <option value="">Select District</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}
    </div>
  );
}
