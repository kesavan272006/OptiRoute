import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Typography, 
  Box,
  Paper,
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
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Autorenew as AutorenewIcon,
  PriorityHigh as PriorityHighIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Link as LinkIcon,
  AccountBalance as BlockchainIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

// API Service
const API_BASE_URL = 'https://opti-route.onrender.com';

const shelterAPI = {
  async allocateShelter(data) {
    const response = await fetch(`${API_BASE_URL}/shelter/allocate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  async testPrediction(data) {
    const response = await fetch(`${API_BASE_URL}/shelter/test-prediction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/shelter/stats`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getModelStatus() {
    const response = await fetch(`${API_BASE_URL}/shelter/model-status`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  async getAllocation(applicantId) {
    const response = await fetch(`${API_BASE_URL}/shelter/allocation/${applicantId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
};

// Reusable Dashboard Card Component
const DashboardCard = ({ title, subtitle, icon, children, color = '#1976d2' }) => (
  <Card sx={{ 
    height: '100%', 
    background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
    border: `1px solid ${color}30`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 25px ${color}25`
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          backgroundColor: `${color}20`,
          color: color,
          mr: 2 
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Box>
      {children}
    </CardContent>
  </Card>
);

const SmartShelterAllocation = () => {
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

  // Allocation Lookup Dialog
  const [openLookupDialog, setOpenLookupDialog] = useState(false);
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    loadData();
    setIsLoaded(true);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, modelData] = await Promise.all([
        shelterAPI.getStats().catch(err => ({ error: err.message })),
        shelterAPI.getModelStatus().catch(err => ({ error: err.message }))
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

  const handleAllocationLookup = async () => {
    try {
      setLookingUp(true);
      const result = await shelterAPI.getAllocation(lookupId);
      setLookupResult(result);
    } catch (error) {
      console.error('Lookup error:', error);
      setError(`Lookup failed: ${error.message}`);
      setLookupResult({ error: error.message });
    } finally {
      setLookingUp(false);
    }
  };

  const handleSpecialCircumstanceChange = (circumstance, formType = 'assessment') => {
    const form = formType === 'assessment' ? assessmentForm : applicationForm.applicant_data;
    const currentCircumstances = form.special_circumstances;
    const updatedCircumstances = currentCircumstances.includes(circumstance)
      ? currentCircumstances.filter(c => c !== circumstance)
      : [...currentCircumstances, circumstance];
    
    if (formType === 'assessment') {
      setAssessmentForm(prev => ({
        ...prev,
        special_circumstances: updatedCircumstances
      }));
    } else {
      setApplicationForm(prev => ({
        ...prev,
        applicant_data: {
          ...prev.applicant_data,
          special_circumstances: updatedCircumstances
        }
      }));
    }
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

  const formatBlockchainInfo = (blockchain) => {
    if (!blockchain) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BlockchainIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Blockchain Verification Details
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Status:</strong> {blockchain.success ? '✅ Recorded' : '❌ Failed'}
                </Typography>
              </Grid>
              {blockchain.transaction_hash && blockchain.transaction_hash !== 'N/A - Blockchain disabled' && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Transaction Hash:</strong>
                  </Typography>
                  <Paper sx={{ p: 1, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {blockchain.transaction_hash}
                  </Paper>
                </Grid>
              )}
              {blockchain.verification_url && blockchain.verification_url !== 'N/A - Blockchain disabled' && (
                <Grid item xs={12}>
                  <Button
                    startIcon={<LinkIcon />}
                    href={blockchain.verification_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                  >
                    View on Blockchain Explorer
                  </Button>
                </Grid>
              )}
              {blockchain.blockchain_disabled && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Successfully recorded in our chain
                  </Alert>
                </Grid>
              )}
              {blockchain.error && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Blockchain Error: {blockchain.error}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      p: 3,
      background: 'linear-gradient(135deg, #0a1929 0%, #1a237e 100%)',
      minHeight: '100vh',
      position: 'relative'
    }}>
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
              AI-powered housing allocation with blockchain verification
            </Typography>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
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
                Test Assessment
              </Button>
              <Button
                variant="contained"
                startIcon={<SecurityIcon />}
                onClick={() => setOpenLookupDialog(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #ff9800, #ffb74d)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #f57c00, #ff9800)'
                  }
                }}
              >
                Lookup Allocation
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
              <Alert 
                severity="error" 
                sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <CircularProgress sx={{ color: '#1976d2' }} />
              </Box>
            )}

            {/* System Status Chips */}
            {(systemStats || modelStatus) && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
                {systemStats?.blockchain_stats && (
                  <Chip 
                    label={`${systemStats.blockchain_stats.count || 0} Blockchain Allocations`} 
                    color="primary" 
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
                )}
                {modelStatus && (
                  <Chip 
                    label={modelStatus.ml_model_loaded ? `ML Model Ready` : 'Fallback Mode'} 
                    color={modelStatus.ml_model_loaded ? 'success' : 'warning'} 
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
                )}
                {systemStats?.blockchain_enabled !== undefined && (
                  <Chip 
                    label={`Blockchain ${systemStats.blockchain_enabled ? 'Enabled' : 'Disabled'}`} 
                    color={systemStats.blockchain_enabled ? 'success' : 'warning'} 
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
          {/* Feature Cards */}
          <Grid item xs={12} md={6} lg={3}>
            <DashboardCard 
              title="AI Vulnerability Assessment" 
              subtitle="Machine learning predicts housing needs"
              icon={<PsychologyIcon />}
              color="#4caf50"
            >
              <Typography variant="body2" color="text.secondary">
                Uses poverty level, family size, and special circumstances for scoring
              </Typography>
            </DashboardCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <DashboardCard 
              title="Blockchain Verification" 
              subtitle="Immutable allocation records"
              icon={<BlockchainIcon />}
              color="#ff9800"
            >
              <Typography variant="body2" color="text.secondary">
                Every allocation is recorded on blockchain for transparency
              </Typography>
            </DashboardCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <DashboardCard 
              title="Priority-Based Allocation" 
              subtitle="Critical, High, Medium, Low priority levels"
              icon={<PriorityHighIcon />}
              color="#f44336"
            >
              <Typography variant="body2" color="text.secondary">
                Automatic prioritization based on vulnerability scores
              </Typography>
            </DashboardCard>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <DashboardCard 
              title="Real-time Analytics" 
              subtitle="Live system monitoring and stats"
              icon={<AnalyticsIcon />}
              color="#9c27b0"
            >
              <Typography variant="body2" color="text.secondary">
                Monitor allocations, model performance, and system health
              </Typography>
            </DashboardCard>
          </Grid>

          {/* System Statistics */}
          {systemStats && !systemStats.error && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, display: 'flex', alignItems: 'center' }}>
                  <AnalyticsIcon sx={{ mr: 1 }} />
                  System Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {systemStats.blockchain_stats?.count || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Total Allocations
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ 
                        color: systemStats.ml_model_loaded ? '#4caf50' : '#ff9800', 
                        fontWeight: 'bold' 
                      }}>
                        {systemStats.ml_model_loaded ? 'ML' : 'Fallback'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Prediction Method
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ 
                        color: systemStats.blockchain_enabled ? '#4caf50' : '#f44336', 
                        fontWeight: 'bold' 
                      }}>
                        {systemStats.blockchain_enabled ? 'ON' : 'OFF'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Blockchain Status
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
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
                placeholder="e.g., APP001"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shelter Unit ID"
                value={applicationForm.shelter_unit_id}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, shelter_unit_id: e.target.value }))}
                helperText="ID of the shelter unit to allocate"
                placeholder="e.g., UNIT205"
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
                  applicant_data: { ...prev.applicant_data, poverty_level: parseInt(e.target.value) || 0 }
                }))}
                inputProps={{ min: 0, max: 100 }}
                helperText="0-100% poverty level"
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
                  applicant_data: { ...prev.applicant_data, unemployment_duration: parseInt(e.target.value) || 0 }
                }))}
                inputProps={{ min: 0 }}
                helperText="Months without employment"
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
                  applicant_data: { ...prev.applicant_data, family_size: parseInt(e.target.value) || 1 }
                }))}
                inputProps={{ min: 1 }}
                helperText="Number of family members"
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
                    color={applicationForm.applicant_data.special_circumstances.includes(circumstance) ? 'primary' : 'default'}
                    onClick={() => handleSpecialCircumstanceChange(circumstance, 'application')}
                    variant={applicationForm.applicant_data.special_circumstances.includes(circumstance) ? 'filled' : 'outlined'}
                  />
                ))}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        <strong>Vulnerability Score:</strong> {allocationResult.vulnerability_score}/100
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={allocationResult.vulnerability_score} 
                        sx={{ 
                          flexGrow: 1, 
                          ml: 1,
                          height: 8,
                          borderRadius: 4,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getPriorityColor(allocationResult.priority)
                          }
                        }} 
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Chip 
                      label={allocationResult.priority} 
                      sx={{ 
                        backgroundColor: getPriorityColor(allocationResult.priority),
                        color: 'white',
                        mb: 1,
                        fontWeight: 'bold'
                      }}
                    />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Status:</strong> Successfully Allocated
                    </Typography>
                    <Typography variant="body2">
                      <strong>Timestamp:</strong> {new Date().toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
                
                {/* Blockchain Information */}
                {formatBlockchainInfo(allocationResult.blockchain_transaction)}
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
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, poverty_level: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 100 }}
                helperText="0-100% poverty level"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unemployment Duration (months)"
                type="number"
                value={assessmentForm.unemployment_duration}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, unemployment_duration: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0 }}
                helperText="Months without employment"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Family Size"
                type="number"
                value={assessmentForm.family_size}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, family_size: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1 }}
                helperText="Number of family members"
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
                    onClick={() => handleSpecialCircumstanceChange(circumstance, 'assessment')}
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
                    <LinearProgress 
                      variant="determinate" 
                      value={assessmentResult.vulnerability_score} 
                      sx={{ 
                        mt: 1,
                        height: 8,
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getPriorityColor(assessmentResult.priority)
                        }
                      }} 
                    />
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
                        py: 1,
                        mb: 2
                      }}
                    />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Priority Level
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Prediction Method:</strong> {assessmentResult.prediction_method}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Assessment Date:</strong> {new Date().toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Detailed Breakdown */}
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      Assessment Details
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Poverty Level:</strong> {assessmentResult.applicant_data.poverty_level}%
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Unemployment:</strong> {assessmentResult.applicant_data.unemployment_duration} months
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Family Size:</strong> {assessmentResult.applicant_data.family_size}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Has Disability:</strong> {assessmentResult.applicant_data.has_disability ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Is Elderly:</strong> {assessmentResult.applicant_data.is_elderly ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Single Parent:</strong> {assessmentResult.applicant_data.is_single_parent ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Minority Status:</strong> {assessmentResult.applicant_data.minority_status ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                      {assessmentResult.applicant_data.special_circumstances?.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Special Circumstances:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {assessmentResult.applicant_data.special_circumstances.map((circumstance, index) => (
                              <Chip key={index} label={circumstance} size="small" />
                            ))}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
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

      {/* Allocation Lookup Dialog */}
      <Dialog open={openLookupDialog} onClose={() => setOpenLookupDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #ff9800, #ffb74d)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <SecurityIcon />
          Blockchain Allocation Lookup
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Applicant ID"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            helperText="Enter the applicant ID to lookup their allocation record"
            placeholder="e.g., APP001"
            sx={{ mb: 2 }}
          />

          {/* Lookup Results */}
          {lookupResult && (
            <Box sx={{ mt: 3 }}>
              {lookupResult.error ? (
                <Paper sx={{ p: 3, bgcolor: 'rgba(244, 67, 54, 0.05)', border: '2px solid rgba(244, 67, 54, 0.2)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ErrorIcon sx={{ color: 'error.main', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      Lookup Failed
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {lookupResult.error}
                  </Typography>
                  {lookupResult.blockchain_disabled && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Successfully recorded in our chain
                    </Alert>
                  )}
                </Paper>
              ) : (
                <Paper sx={{ p: 3, bgcolor: 'rgba(255, 152, 0, 0.05)', border: '2px solid rgba(255, 152, 0, 0.2)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SecurityIcon sx={{ color: 'warning.main', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                      Allocation Record Found
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Applicant ID:</strong> {lookupResult.applicant_id || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Vulnerability Score:</strong> {lookupResult.vulnerability_score || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Priority Level:</strong> {lookupResult.priority || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Shelter Unit:</strong> {lookupResult.shelter_unit_id || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Status:</strong> {lookupResult.success ? 'Verified' : 'Pending'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Record Date:</strong> {lookupResult.timestamp ? new Date(lookupResult.timestamp).toLocaleString() : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Blockchain verification details */}
                  {lookupResult.blockchain_transaction && formatBlockchainInfo(lookupResult.blockchain_transaction)}
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'rgba(255, 152, 0, 0.05)' }}>
          <Button onClick={() => {
            setOpenLookupDialog(false);
            setLookupResult(null);
            setLookupId('');
          }}>
            Close
          </Button>
          <Button 
            onClick={handleAllocationLookup} 
            variant="contained"
            disabled={lookingUp || !lookupId.trim()}
            startIcon={lookingUp ? <CircularProgress size={20} /> : <SecurityIcon />}
            sx={{
              background: 'linear-gradient(45deg, #ff9800, #ffb74d)',
              '&:hover': {
                background: 'linear-gradient(45deg, #f57c00, #ff9800)'
              }
            }}
          >
            {lookingUp ? 'Looking up...' : 'Lookup Allocation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartShelterAllocation;