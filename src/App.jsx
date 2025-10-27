import React, { useMemo, useState } from "react";
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

/*
  Fake Andhra Pradesh districts data (sample).
*/
const AP_DATA = [
  { districtName: "Visakhapatnam", totalJobcards: 120000, totalWorkers: 310000, activeJobcards: 45000, activeWorkers: 125000, scWorkers: 15000, stWorkers: 5000, approvedLabourBudget: 12500000, persondaysCentral: 450000 },
  { districtName: "Vijayawada", totalJobcards: 95000, totalWorkers: 240000, activeJobcards: 32000, activeWorkers: 98000, scWorkers: 12000, stWorkers: 3000, approvedLabourBudget: 9800000, persondaysCentral: 320000 },
  { districtName: "Guntur", totalJobcards: 87000, totalWorkers: 210000, activeJobcards: 28000, activeWorkers: 87000, scWorkers: 11000, stWorkers: 2500, approvedLabourBudget: 8600000, persondaysCentral: 290000 },
  { districtName: "Nellore", totalJobcards: 72000, totalWorkers: 180000, activeJobcards: 22000, activeWorkers: 72000, scWorkers: 9000, stWorkers: 2000, approvedLabourBudget: 7200000, persondaysCentral: 240000 },
  { districtName: "Kurnool", totalJobcards: 65000, totalWorkers: 160000, activeJobcards: 19500, activeWorkers: 64000, scWorkers: 8500, stWorkers: 4000, approvedLabourBudget: 6800000, persondaysCentral: 210000 },
  { districtName: "Anantapur", totalJobcards: 60000, totalWorkers: 150000, activeJobcards: 18000, activeWorkers: 59000, scWorkers: 8000, stWorkers: 4200, approvedLabourBudget: 6500000, persondaysCentral: 200000 },
  { districtName: "Chittoor", totalJobcards: 58000, totalWorkers: 145000, activeJobcards: 17200, activeWorkers: 57000, scWorkers: 7700, stWorkers: 3500, approvedLabourBudget: 6300000, persondaysCentral: 190000 },
  { districtName: "Prakasam", totalJobcards: 52000, totalWorkers: 125000, activeJobcards: 15000, activeWorkers: 48000, scWorkers: 6000, stWorkers: 2200, approvedLabourBudget: 5200000, persondaysCentral: 160000 },
  { districtName: "Srikakulam", totalJobcards: 47000, totalWorkers: 115000, activeJobcards: 13700, activeWorkers: 42000, scWorkers: 5500, stWorkers: 1800, approvedLabourBudget: 4800000, persondaysCentral: 140000 },
  { districtName: "YSR Kadapa", totalJobcards: 44000, totalWorkers: 108000, activeJobcards: 12800, activeWorkers: 40000, scWorkers: 5200, stWorkers: 1600, approvedLabourBudget: 4600000, persondaysCentral: 130000 },
];

export default function App() {
  // main state
  const [data] = useState(AP_DATA);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("activeWorkers");
  const [sortDir, setSortDir] = useState("desc");
  const [minActiveWorkers, setMinActiveWorkers] = useState("");
  const [selectedState, setSelectedState] = useState("Andhra Pradesh");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  // location detect handler
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
          const district = address.county || address.district || "";

          setSelectedState(state);
          setSelectedDistrict(district);
          alert(`📍 Detected Location: ${district}, ${state}`);
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

  // derived filtered & sorted data
  const filtered = useMemo(() => {
    let arr = data.slice();

    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter((d) => d.districtName.toLowerCase().includes(s));
    }
    if (minActiveWorkers) {
      const n = Number(minActiveWorkers) || 0;
      arr = arr.filter((d) => d.activeWorkers >= n);
    }

    arr.sort((a, b) => {
      const av = a[sortBy] ?? 0;
      const bv = b[sortBy] ?? 0;
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sortDir === "asc" ? result : -result;
    });

    return arr;
  }, [data, search, sortBy, sortDir, minActiveWorkers]);

  // export CSV
  function handleExportCSV() {
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
    a.download = "ap_districts_mgnrega.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // small stats
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, d) => {
        acc.totalActiveWorkers += d.activeWorkers;
        acc.totalApprovedBudget += d.approvedLabourBudget;
        acc.count += 1;
        return acc;
      },
      { totalActiveWorkers: 0, totalApprovedBudget: 0, count: 0 }
    );
  }, [filtered]);

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
                          <MenuItem key={s} value={s}>{s}</MenuItem>
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
                          <MenuItem key={d} value={d}>{d}</MenuItem>
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
                    <Button variant="contained" startIcon={<ExportIcon />} onClick={handleExportCSV} fullWidth>
                      Export CSV
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Stats */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2">Districts shown</Typography>
                <Typography variant="h5">{totals.count}</Typography>
                <Box mt={2}>
                  <Typography variant="subtitle2">Total active workers</Typography>
                  <Typography variant="h6">{totals.totalActiveWorkers.toLocaleString()}</Typography>
                </Box>
                <Box mt={2}>
                  <Typography variant="subtitle2">Total approved budget</Typography>
                  <Typography variant="h6">₹ {totals.totalApprovedBudget.toLocaleString()}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Card style={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active workers by district</Typography>
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
                  <Typography variant="h6" gutterBottom>Persondays (central) vs Approved Budget</Typography>
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
                <Typography variant="h6" gutterBottom>District details</Typography>
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
                          <TableCell component="th" scope="row">{row.districtName}</TableCell>
                          <TableCell align="right">{row.totalJobcards.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.totalWorkers.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.activeJobcards.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.activeWorkers.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.scWorkers.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.stWorkers.toLocaleString()}</TableCell>
                          <TableCell align="right">₹ {row.approvedLabourBudget.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.persondaysCentral.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center">No districts match the filters.</TableCell>
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
