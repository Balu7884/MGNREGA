import React, { useState, useEffect } from "react";
import { fetchByDistrict } from "../services/api";
import LocationButton from "../components/LocationButton";
import StateDistrictSelect from "../components/StateDistrictSelect";

export default function HomePage() {
  const [district, setDistrict] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    if (district) {
      fetchByDistrict(district).then((res) => setData(res.data)).catch(() => setData([]));
    }
  }, [district]);

  return (
    <div className="container">
      <h1>MGNREGA Data Dashboard</h1>
      <LocationButton onDetect={setDistrict} />
      <StateDistrictSelect onSelect={setDistrict} />

      <h2>{district ? `Showing data for ${district}` : "Select or detect your location"}</h2>
      <div className="data-container">
        {data.length > 0 ? (
          <table border="1">
            <thead>
              <tr>
                <th>District</th>
                <th>Total Jobcards</th>
                <th>Total Workers</th>
                <th>Active Jobcards</th>
                <th>Active Workers</th>
                <th>Women Persondays</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{row.districtName}</td>
                  <td>{row.totalJobcardsIssued}</td>
                  <td>{row.totalWorkers}</td>
                  <td>{row.totalActiveJobcards}</td>
                  <td>{row.totalActiveWorkers}</td>
                  <td>{row.womenPersondays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
}
