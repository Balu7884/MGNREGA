import axios from "axios";

// ✅ Automatically switch between local and deployed backend
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://mgnrega-backend-xn8h.onrender.com/api/mgnrega" // <-- replace with your real deployed URL
    : "http://localhost:8080/api/mgnrega";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ✅ Helper to clean & normalize numeric values safely
function safeNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value) || 0;
}

// ✅ Convert backend response → frontend format
function mapMetric(d) {
  return {
    stateName: d.stateName,
    districtName: d.districtName,
    totalJobcards: safeNumber(d.totalJobcardsIssued),
    totalWorkers: safeNumber(d.totalWorkers),
    activeJobcards: safeNumber(d.totalActiveJobcards),
    activeWorkers: safeNumber(d.totalActiveWorkers),
    scWorkers: safeNumber(d.scWorkersActive),
    stWorkers: safeNumber(d.stWorkersActive),
    approvedLabourBudget: safeNumber(d.approvedLabourBudget),
    persondaysCentral: safeNumber(d.persondaysCentralLiability),
  };
}

export const MgnregaAPI = {
  /** 🟢 Fetch all records */
  async getAll() {
    try {
      const res = await api.get("/all");
      return res.data.map(mapMetric);
    } catch (err) {
      console.error("❌ Error fetching all MGNREGA data:", err);
      throw new Error("Failed to load all data from backend.");
    }
  },

  /** 🔵 Fetch by state */
  async getByState(state) {
    try {
      const res = await api.get("/", { params: { state } });
      return res.data.map(mapMetric);
    } catch (err) {
      console.error(`❌ Error fetching data for state: ${state}`, err);
      throw new Error("Failed to load state data.");
    }
  },

  /** 🟣 Fetch by district */
  async getByDistrict(district) {
    try {
      const res = await api.get("/", { params: { district } });
      return res.data.map(mapMetric);
    } catch (err) {
      console.error(`❌ Error fetching data for district: ${district}`, err);
      throw new Error("Failed to load district data.");
    }
  },

  /** 🔍 Fuzzy district search (partial match) */
  async getByDistrictFuzzy(district) {
    try {
      const res = await api.get("/", { params: { district, fuzzy: true } });
      return res.data.map(mapMetric);
    } catch (err) {
      console.error(`❌ Error fetching fuzzy district data: ${district}`, err);
      throw new Error("Failed to load fuzzy district data.");
    }
  },

  /** 🔹 Fetch specific district by name (if backend supports `/district/{name}`) */
  async getDistrictData(districtName) {
    try {
      const res = await api.get(`/district/${districtName}`);
      return mapMetric(res.data);
    } catch (err) {
      console.error(`❌ Error fetching data for ${districtName}:`, err);
      throw new Error("Failed to load district details.");
    }
  },
};
