import axios from "axios";

const API_BASE = "http://localhost:8080/api/mgnrega";

export const fetchAll = () => axios.get(`${API_BASE}/all`);
export const fetchByDistrict = (district) => axios.get(`${API_BASE}/district/${district}`);
export const fetchByState = (state) => axios.get(`${API_BASE}/mgnrega?state=${state}`);
