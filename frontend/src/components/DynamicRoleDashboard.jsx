import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Alert, CircularProgress, Button } from '@mui/material';

// Import role-specific dashboards
import DoctorDashboard from './role/DoctorDashboard';
import HospitalAdminDashboard from './role/HospitalAdminDashboard';
import AmbulanceDriverDashboard from './role/AmbulanceDriverDashboard';
import FarmerDashboard from './role/FarmerDashboard';
import NGODashboard from './role/NGODashboard';
import HousingAuthorityDashboard from './role/HousingAuthorityDashboard';
import LandlordDashboard from './role/LandlordDashboard';
import ReliefVolunteerDashboard from './role/ReliefVolunteerDashboard';

// Import icons for each role
import {
  LocalHospital as HospitalIcon,
  PersonAdd as PersonAddIcon,
  LocalShipping as TruckIcon,
  MedicalServices as MedicalIcon,
  VolunteerActivism as VolunteerIcon,
  Business as BusinessIcon,
  Agriculture as AgricultureIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Storage as WarehouseIcon,
  DirectionsCar as AmbulanceIcon,
  LocalShipping as LogisticsIcon
} from '@mui/icons-material';

const DynamicRoleDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#0a1929'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ 
        p: 3, 
        background: '#0a1929', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="error" sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }}>
          User not authenticated. Please log in to continue.
        </Alert>
      </Box>
    );
  }

  const renderRoleDashboard = () => {
    switch (user.role) {
      case 'doctor':
        return <DoctorDashboard user={user} />;
      
      case 'hospital_admin':
        return <HospitalAdminDashboard user={user} />;
      
      case 'ambulance_driver':
        return <AmbulanceDriverDashboard user={user} />;
      
      case 'farmer':
        return <FarmerDashboard user={user} />;
      
      case 'ngo':
        return <NGODashboard user={user} />;
      
      case 'logistics_driver':
        return <LogisticsDriverDashboard user={user} />;
      
      case 'shelter_manager':
        return <ShelterManagerDashboard user={user} />;
      
      case 'warehouse_manager':
        return <WarehouseManagerDashboard user={user} />;
      
      case 'housing_authority':
        return <HousingAuthorityDashboard user={user} />;
      
      case 'landlord':
        return <LandlordDashboard user={user} />;
      
      case 'relief_volunteer':
        return <ReliefVolunteerDashboard user={user} />;
      
      case 'normal_user':
      default:
        return <DefaultUserDashboard user={user} />;
    }
  };

  return renderRoleDashboard();
};

// Default dashboard for normal users and fallback
const DefaultUserDashboard = ({ user }) => {
  const mainFeatures = [
    {
      title: 'Smart Shelter Allocation',
      subtitle: 'AI-powered housing allocation system',
      icon: <HomeIcon sx={{ fontSize: 28 }} />,
      route: '/shelter-allocation',
      description: 'Forecast demand, dynamically allocate units, prioritize needs, and optimize impact',
      gradient: 'linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)'
    },
    {
      title: 'Hospital Resource Optimizer',
      subtitle: 'AI-driven hospital resource management',
      icon: <HospitalIcon sx={{ fontSize: 28 }} />,
      route: '/hospital-optimizer',
      description: 'Optimize bed allocation, patient routing, staff scheduling, and ensure equity',
      gradient: 'linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)'
    },
    {
      title: 'Disaster Relief Optimizer',
      subtitle: 'AI-powered disaster response planning',
      icon: <VolunteerIcon sx={{ fontSize: 28 }} />,
      route: '/disaster-relief',
      description: 'Forecast needs, optimize delivery routes, avoid duplication, and detect community needs',
      gradient: 'linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)'
    },
    {
      title: 'Hunger & Waste Optimizer',
      subtitle: 'AI-driven food distribution system',
      icon: <BusinessIcon sx={{ fontSize: 28 }} />,
      route: '/hunger-waste',
      description: 'Forecast demand, match surplus to need, optimize perishables, and maximize impact',
      gradient: 'linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)'
    },
  ];

  return (
    <Box sx={{ p: 3, background: '#0a1929', minHeight: '100vh' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{
          mb: 2,
          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700
        }}>
          Welcome to OptiRoute
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
          Hello {user?.name || user?.displayName || 'User'}!
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
          Access our AI-powered optimization tools to help with resource allocation and planning.
        </Typography>
      </Box>

      {/* Main Feature Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ 
          color: 'white', 
          mb: 3, 
          textAlign: 'center',
          fontWeight: 600
        }}>
          Available Optimization Tools
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
          {mainFeatures.map((feature, index) => (
            <Box
              key={feature.route}
              sx={{
                p: 3,
                background: feature.gradient,
                border: '1px solid rgba(25, 118, 210, 0.2)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
                  border: '1px solid rgba(25, 118, 210, 0.5)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.2), transparent 40%)',
                  zIndex: 0
                }
              }}
              onClick={() => window.location.href = feature.route}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    color: '#1976d2', 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: 'rgba(25, 118, 210, 0.1)'
                  }}>
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 0.5 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {feature.subtitle}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  lineHeight: 1.6,
                  mb: 2
                }}>
                  {feature.description}
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = feature.route;
                  }}
                >
                  Access Tool
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Additional Information */}
      <Box sx={{ 
        p: 3, 
        background: 'rgba(39, 62, 107, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(25, 118, 210, 0.2)',
        borderRadius: 3
      }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          About OptiRoute
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.7 }}>
          OptiRoute is an advanced AI-powered platform designed to optimize resource allocation across multiple domains. 
          Our platform leverages machine learning algorithms to provide data-driven solutions for hospitals, disaster relief operations, 
          food distribution networks, and housing allocation systems. Each tool is specifically designed to address unique challenges 
          in resource allocation, helping organizations maximize efficiency, reduce waste, and ensure equitable distribution of critical resources.
        </Typography>
      </Box>
    </Box>
  );
};

// Placeholder components for roles not yet implemented
const LogisticsDriverDashboard = ({ user }) => (
  <PlaceholderDashboard user={user} role="Logistics Driver" />
);

const ShelterManagerDashboard = ({ user }) => (
  <PlaceholderDashboard user={user} role="Shelter Manager" />
);

const WarehouseManagerDashboard = ({ user }) => (
  <PlaceholderDashboard user={user} role="Warehouse Manager" />
);


const PlaceholderDashboard = ({ user, role }) => (
  <Box sx={{ p: 3, background: '#0a1929', minHeight: '100vh' }}>
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Typography variant="h4" sx={{
        mb: 2,
        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 700
      }}>
        {role} Dashboard
      </Typography>
      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
        Welcome, {user?.name || user?.displayName}!
      </Typography>
    </Box>
    
    <Alert severity="info" sx={{ backgroundColor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3', mb: 3 }}>
      The {role} dashboard is currently under development. 
      More features will be available soon!
    </Alert>

    <Box sx={{ 
      p: 3, 
      background: 'rgba(39, 62, 107, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(25, 118, 210, 0.2)',
      borderRadius: 3
    }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Coming Soon:
      </Typography>
      <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        • Role-specific data management<br />
        • Custom workflow tools<br />
        • Real-time updates and notifications<br />
        • Advanced analytics and reporting<br />
        • Integration with other system components
      </Typography>
    </Box>
  </Box>
);

export default DynamicRoleDashboard;
