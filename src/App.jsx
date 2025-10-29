import React, { useMemo, useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress,
} from "@mui/material";
import { SaveAlt as ExportIcon, MyLocation as LocationIcon } from "@mui/icons-material";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import statesData from "./data/states_districts.json";
import axios from "axios";

export default function App() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("activeWorkers");
  const [sortDir, setSortDir] = useState("desc");
  const [minActiveWorkers, setMinActiveWorkers] = useState("");
  const [selectedState, setSelectedState] = useState("Andhra Pradesh");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch data from backend
  useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      try {
        const res = await axios.get("https://mgnrega-backend-xn8h.onrender.com/api/mgnrega/all");
        const mapped = res.data.map((d) => ({
          districtName: d.districtName,
          totalJobcards: d.totalJobcardsIssued,
          totalWorkers: d.totalWorkers,
          activeJobcards: d.totalActiveJobcards,
          activeWorkers: d.totalActiveWorkers,
          scWorkers: d.scWorkersActive,
          stWorkers: d.stWorkersActive,
          approvedLabourBudget: d.approvedLabourBudget,
          persondaysCentral: d.persondaysCentralLiability,
        }));
        setData(mapped);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Failed to load district data from backend.");
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // 📍 Detect location and auto-set state + district + filter
  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
          const res = await axios.get(url);
          const address = res.data.address || {};
          const state = address.state || "Andhra Pradesh";
          const district = (address.county || address.district || "").toUpperCase();

          // Normalize and find best match
          const allDistricts = Object.values(statesData).flat().map((d) => d.toUpperCase());
          const matchedDistrict = allDistricts.find((d) =>
            district.includes(d) || d.includes(district)
          );

          setSelectedState(state);
          setSelectedDistrict(matchedDistrict || "");
          setSearch(matchedDistrict || ""); // ✅ auto-filter data
          alert(`📍 Detected Location: ${matchedDistrict || district}, ${state}`);
        } catch (err) {
          console.error(err);
          alert("Failed to detect location. Please try again.");
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        alert("Unable to retrieve your location.");
        setLoadingLocation(false);
      }
    );
  };

  // 🧮 Filter + sort logic (includes auto-filter by selectedDistrict)
  const filtered = useMemo(() => {
    let arr = data ? [...data] : [];

    if (selectedDistrict) {
      const s = selectedDistrict.toLowerCase();
      arr = arr.filter((d) => d.districtName?.toLowerCase().includes(s));
    } else if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter((d) => d.districtName?.toLowerCase().includes(s));
    }

    if (minActiveWorkers) {
      const n = Number(minActiveWorkers) || 0;
      arr = arr.filter((d) => (d.activeWorkers ?? 0) >= n);
    }

    arr.sort((a, b) => {
      const av = a?.[sortBy] ?? 0;
      const bv = b?.[sortBy] ?? 0;
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sortDir === "asc" ? result : -result;
    });

    return arr;
  }, [data, search, selectedDistrict, sortBy, sortDir, minActiveWorkers]);

  // 📤 Export CSV
  const handleExportCSV = () => {
    const headers = [
      "District",
      "Total Jobcards",
      "Total Workers",
      "Active Jobcards",
      "Active Workers",
      "SC Workers",
      "ST Workers",
      "Approved Labour Budget",
      "Persondays Central",
    ];
    const rows = filtered.map((r) => [
      r.districtName,
      r.totalJobcards,
      r.totalWorkers,
      r.activeJobcards,
      r.activeWorkers,
      r.scWorkers,
      r.stWorkers,
      r.approvedLabourBudget,
      r.persondaysCentral,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mgnrega_districts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🧾 Summary stats
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, d) => {
        acc.totalActiveWorkers += d.activeWorkers || 0;
        acc.totalApprovedBudget += d.approvedLabourBudget || 0;
        acc.count += 1;
        return acc;
      },
      { totalActiveWorkers: 0, totalApprovedBudget: 0, count: 0 }
    );
  }, [filtered]);

  if (loadingData)
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <CircularProgress />
        <Typography variant="h6" mt={2}>
          Loading MGNREGA data...
        </Typography>
      </Box>
    );

  if (error)
    return (
      <Box sx={{ textAlign: "center", mt: 10, color: "red" }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">MGNREGA — India Dashboard</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Controls */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>State</InputLabel>
                      <Select
                        value={selectedState}
                        label="State"
                        onChange={(e) => setSelectedState(e.target.value)}
                      >
                        {Object.keys(statesData).map((s) => (
                          <MenuItem key={s} value={s}>
                            {s}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>District</InputLabel>
                      <Select
                        value={selectedDistrict}
                        label="District"
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                      >
                        {(statesData[selectedState] || []).map((d) => (
                          <MenuItem key={d} value={d}>
                            {d}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <Button
                      variant="outlined"
                      startIcon={<LocationIcon />}
                      onClick={handleDetectLocation}
                      disabled={loadingLocation}
                      fullWidth
                    >
                      {loadingLocation ? <CircularProgress size={20} /> : "Detect"}
                    </Button>
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField
                      label="Search district"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <Button
                      variant="contained"
                      startIcon={<ExportIcon />}
                      onClick={handleExportCSV}
                      fullWidth
                    >
                      Export CSV
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Summary Stats */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2">Districts shown</Typography>
                <Typography variant="h5">{totals.count}</Typography>
                <Box mt={2}>
                  <Typography variant="subtitle2">Total active workers</Typography>
                  <Typography variant="h6">
                    {totals.totalActiveWorkers?.toLocaleString?.() ?? 0}
                  </Typography>
                </Box>
                <Box mt={2}>
                  <Typography variant="subtitle2">Total approved budget</Typography>
                  <Typography variant="h6">
                    ₹ {totals.totalApprovedBudget?.toLocaleString?.() ?? 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active workers by district
                </Typography>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={filtered}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="districtName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="activeWorkers" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Persondays (Central) vs Approved Budget
                  </Typography>
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={filtered}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="districtName" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="persondaysCentral" stroke="#8884d8" />
                        <Line type="monotone" dataKey="approvedLabourBudget" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  District details
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>District</TableCell>
                        <TableCell align="right">Total Jobcards</TableCell>
                        <TableCell align="right">Total Workers</TableCell>
                        <TableCell align="right">Active Jobcards</TableCell>
                        <TableCell align="right">Active Workers</TableCell>
                        <TableCell align="right">SC</TableCell>
                        <TableCell align="right">ST</TableCell>
                        <TableCell align="right">Approved Budget</TableCell>
                        <TableCell align="right">Persondays Central</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((row) => (
                        <TableRow key={row.districtName}>
                          <TableCell>{row.districtName || "N/A"}</TableCell>
                          <TableCell align="right">
                            {row.totalJobcards?.toLocaleString?.() ?? 0}
                          </TableCell>
                          <TableCell align="right">
                            {row.totalWorkers?.toLocaleString?.() ?? 0}
                          </TableCell>
                          <TableCell align="right">
                            {row.activeJobcards?.toLocaleString?.() ?? 0}
                          </TableCell>
                          <TableCell align="right">
                            {row.activeWorkers?.toLocaleString?.() ?? 0}
                          </TableCell>
                          <TableCell align="right">
                            {row.scWorkers?.toLocaleString?.() ?? 0}
                          </TableCell>
                          <TableCell align="right">
                            {row.stWorkers?.toLocaleString?.() ?? 0}
                          </TableCell>
                          <TableCell align="right">
                            ₹ {row.approvedLabourBudget?.toLocaleString?.() ?? 0}
                          </TableCell>
                          <TableCell align="right">
                            {row.persondaysCentral?.toLocaleString?.() ?? 0}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            No districts match the filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}
