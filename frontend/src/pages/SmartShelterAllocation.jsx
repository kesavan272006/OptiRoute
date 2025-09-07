import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Typography, 
  Box,
  Paper,
  useTheme,
  Tooltip,
  IconButton,
  Fade,
  Container,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Chip,
  Slide
} from '@mui/material';
import {
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Autorenew as AutorenewIcon,
  PriorityHigh as PriorityHighIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

// Import shared components
import DashboardCard from '../components/shared/DashboardCard';
import ChartComponent from '../components/shared/ChartComponent';
import DataTable from '../components/shared/DataTable';

// Import API service
import { shelterAPI, handleApiError } from '../services/api';

const SmartShelterAllocation = () => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // API Data States
  const [systemStats, setSystemStats] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  
  // Shelter Allocation Dialog
  const [openAllocationDialog, setOpenAllocationDialog] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    applicant_id: '',
    shelter_unit_id: '',
    applicant_data: {
      poverty_level: 50,
      unemployment_duration: 6,
      family_size: 2,
      has_disability: false,
      is_elderly: false,
      is_single_parent: false,
      minority_status: false,
      special_circumstances: []
    }
  });
  const [allocationResult, setAllocationResult] = useState(null);
  const [allocating, setAllocating] = useState(false);
  
  // Vulnerability Assessment Dialog
  const [openAssessmentDialog, setOpenAssessmentDialog] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    poverty_level: 50,
    unemployment_duration: 6,
    family_size: 2,
    has_disability: false,
    is_elderly: false,
    is_single_parent: false,
    minority_status: false,
    special_circumstances: []
  });
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessing, setAssessing] = useState(false);

  useEffect(() => {
    loadData();
    setIsLoaded(true);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        statsData,
        modelData
      ] = await Promise.all([
        shelterAPI.getStats(),
        shelterAPI.getModelStatus()
      ]);
      
      setSystemStats(statsData);
      setModelStatus(modelData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleShelterAllocation = async () => {
    try {
      setAllocating(true);
      const result = await shelterAPI.allocateShelter(applicationForm);
      setAllocationResult(result);
    } catch (error) {
      console.error('Allocation error:', error);
      setError(`Allocation failed: ${error.message}`);
    } finally {
      setAllocating(false);
    }
  };

  const handleVulnerabilityAssessment = async () => {
    try {
      setAssessing(true);
      const result = await shelterAPI.testPrediction(assessmentForm);
      setAssessmentResult(result);
    } catch (error) {
      console.error('Assessment error:', error);
      setError(`Assessment failed: ${error.message}`);
    } finally {
      setAssessing(false);
    }
  };

  const handleSpecialCircumstanceChange = (circumstance) => {
    const currentCircumstances = assessmentForm.special_circumstances;
    const updatedCircumstances = currentCircumstances.includes(circumstance)
      ? currentCircumstances.filter(c => c !== circumstance)
      : [...currentCircumstances, circumstance];
    
    setAssessmentForm(prev => ({
      ...prev,
      special_circumstances: updatedCircumstances
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '#f44336';
      case 'HIGH': return '#ff9800';
      case 'MEDIUM': return '#2196f3';
      case 'LOW': return '#4caf50';
      default: return '#666';
    }
  };

  const specialCircumstancesOptions = [
    'Domestic Violence Survivor',
    'Homeless for 6+ months',
    'Veteran',
    'Recent Refugee',
    'Medical Emergency',
    'Natural Disaster Victim',
    'Job Loss due to COVID-19'
  ];

  // Real-time housing availability by district
  const housingAvailabilityData = {
    labels: ['Downtown', 'Northside', 'Southside', 'Eastside', 'Westside', 'Central'],
    datasets: [
      {
        label: 'Available Units',
        data: [45, 38, 52, 28, 41, 35],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.3)',
        fill: true,
      },
      {
        label: 'Occupied Units',
        data: [180, 165, 195, 120, 155, 140],
        borderColor: '#42a5f5',
        backgroundColor: 'rgba(66, 165, 245, 0.3)',
        fill: true,
      },
      {
        label: 'Under Maintenance',
        data: [12, 8, 15, 6, 10, 9],
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.3)',
        fill: true,
      }
    ]
  };

  // Housing waiting list by priority
  const waitingListData = {
    labels: ['Emergency', 'High Priority', 'Medium Priority', 'Low Priority', 'General'],
    datasets: [
      {
        label: 'Current Wait List',
        data: [25, 45, 80, 120, 200],
        backgroundColor: '#1976d2',
      },
      {
        label: 'Average Wait Time (days)',
        data: [5, 15, 45, 90, 180],
        backgroundColor: '#42a5f5',
      }
    ]
  };

  // Housing unit types distribution
  const unitTypesData = {
    labels: ['Studio', '1BR', '2BR', '3BR', '4BR+', 'Accessible'],
    datasets: [
      {
        label: 'Available Units',
        data: [15, 45, 60, 25, 10, 20],
        backgroundColor: [
          '#1976d2',
          '#42a5f5',
          '#1976d2',
          '#42a5f5',
          '#1976d2',
          '#4caf50',
        ],
        hoverOffset: 4
      }
    ]
  };

  // Housing applications and assignments
  const housingApplicationsColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'applicantName', headerName: 'Applicant Name', width: 180 },
    { field: 'familySize', headerName: 'Family Size', width: 120, type: 'number' },
    { field: 'priorityLevel', headerName: 'Priority Level', width: 130 },
    { field: 'waitTime', headerName: 'Wait Time (days)', width: 150, type: 'number' },
    { field: 'assignedUnit', headerName: 'Assigned Unit', width: 150 },
    { field: 'status', headerName: 'Status', width: 120 },
  ];

  const housingApplicationsRows = [
    { id: 1, applicantName: 'John Smith', familySize: 3, priorityLevel: 'High', waitTime: 15, assignedUnit: '2BR-205', status: 'Assigned' },
    { id: 2, applicantName: 'Maria Garcia', familySize: 2, priorityLevel: 'Medium', waitTime: 45, assignedUnit: '1BR-108', status: 'Assigned' },
    { id: 3, applicantName: 'Robert Johnson', familySize: 4, priorityLevel: 'High', waitTime: 8, assignedUnit: '3BR-312', status: 'Assigned' },
    { id: 4, applicantName: 'Sarah Wilson', familySize: 1, priorityLevel: 'Low', waitTime: 90, assignedUnit: 'Studio-45', status: 'Waiting' },
    { id: 5, applicantName: 'Michael Brown', familySize: 2, priorityLevel: 'Emergency', waitTime: 2, assignedUnit: '1BR-89', status: 'Assigned' },
  ];

  return (
    <Box sx={{ 
      p: 3,
      background: '#0a1929',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(66, 165, 245, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(25, 118, 210, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={isLoaded} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ 
              mb: 2,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}>
              Smart Shelter Allocation System
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 400,
              maxWidth: '600px',
              mx: 'auto',
              mb: 3
            }}>
              AI-powered housing allocation and blockchain-verified transparency
            </Typography>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={() => setOpenAllocationDialog(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                  }
                }}
              >
                Allocate Shelter
              </Button>
              <Button
                variant="contained"
                startIcon={<PsychologyIcon />}
                onClick={() => setOpenAssessmentDialog(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #388e3c, #4caf50)'
                  }
                }}
              >
                Test Vulnerability Assessment
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Refresh Data
              </Button>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}>
                {error}
              </Alert>
            )}

            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <CircularProgress sx={{ color: '#1976d2' }} />
              </Box>
            )}

            {/* System Stats */}
            {(systemStats || modelStatus) && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
                {systemStats?.blockchain_stats && (
                  <Chip 
                    label={`${systemStats.blockchain_stats} Allocations on Blockchain`} 
                    color="primary" 
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
                )}
                {modelStatus && (
                  <Chip 
                    label={modelStatus.ml_model_loaded ? `${modelStatus.model_type} Ready` : 'Fallback Mode'} 
                    color={modelStatus.ml_model_loaded ? 'success' : 'warning'} 
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
                )}
                {systemStats?.system_status && (
                  <Chip 
                    label={`System ${systemStats.system_status}`} 
                    color="info" 
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Fade>

        <Grid container spacing={4}>
          {/* Feature cards */}
          <Grid item xs={12} md={6} lg={3}>
            <DashboardCard 
              title="Demand Forecasting" 
              subtitle="AI predicts future housing needs"
              icon={<AssessmentIcon />}
            >
              <Typography variant="body2" color="text.secondary">
                Using migration, population, and income trends
              </Typography>
            </DashboardCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <DashboardCard 
              title="Dynamic Allocation" 
              subtitle="ML reallocates units as needs change"
              icon={<AutorenewIcon />}
            >
              <Typography variant="body2" color="text.secondary">
                Adapts as families' needs or occupancy patterns change
              </Typography>
            </DashboardCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <DashboardCard 
              title="Needs-Based Prioritization" 
              subtitle="AI ranks applicants by multiple factors"
              icon={<PriorityHighIcon />}
            >
              <Typography variant="body2" color="text.secondary">
                Considers vulnerability, family size, and proximity to essentials
              </Typography>
            </DashboardCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <DashboardCard 
              title="Impact Optimization" 
              subtitle="System simulates allocation scenarios"
              icon={<TrendingUpIcon />}
            >
              <Typography variant="body2" color="text.secondary">
                Maximizes occupancy, cuts waiting times, and improves satisfaction
              </Typography>
            </DashboardCard>
          </Grid>

          {/* Charts and tables */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%', minHeight: '280px', backgroundColor: '#273e6b', color: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Housing Availability by District</Typography>
                <Tooltip title="Real-time housing availability, occupancy, and maintenance status by district">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <ChartComponent 
                type="line" 
                data={housingAvailabilityData} 
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Housing Units'
                      }
                    }
                  }
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%', minHeight: '280px', backgroundColor: '#273e6b', color: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Housing Wait List by Priority</Typography>
                <Tooltip title="Current wait list numbers and average wait times by priority level">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <ChartComponent 
                type="bar" 
                data={waitingListData} 
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Units'
                      }
                    }
                  }
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%', minHeight: '280px', backgroundColor: '#273e6b', color: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Available Unit Types</Typography>
                <Tooltip title="Current distribution of available housing unit types">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <ChartComponent 
                type="pie" 
                data={unitTypesData} 
                options={{
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          return `${label}: ${(value * 100).toFixed(0)}%`;
                        }
                      }
                    }
                  }
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%', minHeight: '280px', backgroundColor: '#273e6b', color: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Housing Applications & Assignments</Typography>
                <Tooltip title="Current housing applications, assignments, and wait times">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ height: 400 }}>
                <DataTable 
                  rows={housingApplicationsRows} 
                  columns={housingApplicationsColumns} 
                  pageSize={5}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Shelter Allocation Dialog */}
      <Dialog open={openAllocationDialog} onClose={() => setOpenAllocationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <HomeIcon />
          AI-Powered Shelter Allocation
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Applicant ID"
                value={applicationForm.applicant_id}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, applicant_id: e.target.value }))}
                helperText="Unique identifier for the applicant"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shelter Unit ID"
                value={applicationForm.shelter_unit_id}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, shelter_unit_id: e.target.value }))}
                helperText="ID of the shelter unit to allocate"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Poverty Level (%)"
                type="number"
                value={applicationForm.applicant_data.poverty_level}
                onChange={(e) => setApplicationForm(prev => ({
                  ...prev,
                  applicant_data: { ...prev.applicant_data, poverty_level: parseInt(e.target.value) }
                }))}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unemployment Duration (months)"
                type="number"
                value={applicationForm.applicant_data.unemployment_duration}
                onChange={(e) => setApplicationForm(prev => ({
                  ...prev,
                  applicant_data: { ...prev.applicant_data, unemployment_duration: parseInt(e.target.value) }
                }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Family Size"
                type="number"
                value={applicationForm.applicant_data.family_size}
                onChange={(e) => setApplicationForm(prev => ({
                  ...prev,
                  applicant_data: { ...prev.applicant_data, family_size: parseInt(e.target.value) }
                }))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applicationForm.applicant_data.has_disability}
                      onChange={(e) => setApplicationForm(prev => ({
                        ...prev,
                        applicant_data: { ...prev.applicant_data, has_disability: e.target.checked }
                      }))}
                    />
                  }
                  label="Has Disability"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applicationForm.applicant_data.is_elderly}
                      onChange={(e) => setApplicationForm(prev => ({
                        ...prev,
                        applicant_data: { ...prev.applicant_data, is_elderly: e.target.checked }
                      }))}
                    />
                  }
                  label="Is Elderly (65+)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applicationForm.applicant_data.is_single_parent}
                      onChange={(e) => setApplicationForm(prev => ({
                        ...prev,
                        applicant_data: { ...prev.applicant_data, is_single_parent: e.target.checked }
                      }))}
                    />
                  }
                  label="Single Parent"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applicationForm.applicant_data.minority_status}
                      onChange={(e) => setApplicationForm(prev => ({
                        ...prev,
                        applicant_data: { ...prev.applicant_data, minority_status: e.target.checked }
                      }))}
                    />
                  }
                  label="Minority Status"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Allocation Results */}
          {allocationResult && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 3, bgcolor: 'rgba(25, 118, 210, 0.05)', border: '2px solid rgba(25, 118, 210, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Allocation Complete
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Applicant ID:</strong> {allocationResult.applicant_id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Shelter Unit:</strong> {allocationResult.shelter_unit_id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Vulnerability Score:</strong> {allocationResult.vulnerability_score}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Chip 
                      label={allocationResult.priority} 
                      sx={{ 
                        backgroundColor: getPriorityColor(allocationResult.priority),
                        color: 'white',
                        mb: 1
                      }}
                    />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Blockchain TX:</strong> Recorded
                    </Typography>
                    {allocationResult.verification_url && (
                      <Typography variant="body2">
                        <strong>Verification:</strong> Available
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
          <Button onClick={() => {
            setOpenAllocationDialog(false);
            setAllocationResult(null);
          }}>
            Close
          </Button>
          <Button 
            onClick={handleShelterAllocation} 
            variant="contained"
            disabled={allocating || !applicationForm.applicant_id || !applicationForm.shelter_unit_id}
            startIcon={allocating ? <CircularProgress size={20} /> : <HomeIcon />}
            sx={{
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #1976d2)'
              }
            }}
          >
            {allocating ? 'Allocating...' : 'Allocate Shelter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vulnerability Assessment Dialog */}
      <Dialog open={openAssessmentDialog} onClose={() => setOpenAssessmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <PsychologyIcon />
          AI Vulnerability Assessment Test
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Poverty Level (%)"
                type="number"
                value={assessmentForm.poverty_level}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, poverty_level: parseInt(e.target.value) }))}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unemployment Duration (months)"
                type="number"
                value={assessmentForm.unemployment_duration}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, unemployment_duration: parseInt(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Family Size"
                type="number"
                value={assessmentForm.family_size}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, family_size: parseInt(e.target.value) }))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Personal Circumstances:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={assessmentForm.has_disability}
                      onChange={(e) => setAssessmentForm(prev => ({ ...prev, has_disability: e.target.checked }))}
                    />
                  }
                  label="Has Disability"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={assessmentForm.is_elderly}
                      onChange={(e) => setAssessmentForm(prev => ({ ...prev, is_elderly: e.target.checked }))}
                    />
                  }
                  label="Is Elderly (65+)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={assessmentForm.is_single_parent}
                      onChange={(e) => setAssessmentForm(prev => ({ ...prev, is_single_parent: e.target.checked }))}
                    />
                  }
                  label="Single Parent"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={assessmentForm.minority_status}
                      onChange={(e) => setAssessmentForm(prev => ({ ...prev, minority_status: e.target.checked }))}
                    />
                  }
                  label="Minority Status"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Special Circumstances:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {specialCircumstancesOptions.map(circumstance => (
                  <Chip
                    key={circumstance}
                    label={circumstance}
                    clickable
                    color={assessmentForm.special_circumstances.includes(circumstance) ? 'primary' : 'default'}
                    onClick={() => handleSpecialCircumstanceChange(circumstance)}
                    variant={assessmentForm.special_circumstances.includes(circumstance) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>

          {/* Assessment Results */}
          {assessmentResult && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 3, bgcolor: 'rgba(76, 175, 80, 0.05)', border: '2px solid rgba(76, 175, 80, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PsychologyIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Vulnerability Assessment Results
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h4" sx={{ 
                      color: getPriorityColor(assessmentResult.priority),
                      fontWeight: 'bold',
                      mb: 1
                    }}>
                      {assessmentResult.vulnerability_score}/100
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Vulnerability Score
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Chip 
                      label={assessmentResult.priority} 
                      sx={{ 
                        backgroundColor: getPriorityColor(assessmentResult.priority),
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        px: 2,
                        py: 1
                      }}
                    />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      Priority Level
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Prediction Method:</strong> {assessmentResult.prediction_method}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
          <Button onClick={() => {
            setOpenAssessmentDialog(false);
            setAssessmentResult(null);
          }}>
            Close
          </Button>
          <Button 
            onClick={handleVulnerabilityAssessment} 
            variant="contained"
            disabled={assessing}
            startIcon={assessing ? <CircularProgress size={20} /> : <PsychologyIcon />}
            sx={{
              background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
              '&:hover': {
                background: 'linear-gradient(45deg, #388e3c, #4caf50)'
              }
            }}
          >
            {assessing ? 'Assessing...' : 'Run Assessment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartShelterAllocation;
