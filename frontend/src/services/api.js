// API service for backend communication
const API_BASE_URL = 'http://localhost:8000';

// Hospital Allocation API
export const hospitalAPI = {
  // Hospital Management
  createHospital: async (hospitalData) => {
    const response = await fetch(`${API_BASE_URL}/hospital/hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hospitalData)
    });
    return response.json();
  },

  getHospitals: async () => {
    const response = await fetch(`${API_BASE_URL}/hospital/hospitals`);
    return response.json();
  },

  getHospital: async (hospitalId) => {
    const response = await fetch(`${API_BASE_URL}/hospital/hospitals/${hospitalId}`);
    return response.json();
  },

  updateHospital: async (hospitalId, updateData) => {
    const response = await fetch(`${API_BASE_URL}/hospital/hospitals/${hospitalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return response.json();
  },

  deleteHospital: async (hospitalId) => {
    const response = await fetch(`${API_BASE_URL}/hospital/hospitals/${hospitalId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Doctor Management
  createDoctor: async (doctorData) => {
    const response = await fetch(`${API_BASE_URL}/hospital/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    return response.json();
  },

  getDoctors: async () => {
    const response = await fetch(`${API_BASE_URL}/hospital/doctors`);
    return response.json();
  },

  getDoctor: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/hospital/doctors/${doctorId}`);
    return response.json();
  },

  getDoctorsByHospital: async (hospitalId) => {
    const response = await fetch(`${API_BASE_URL}/hospital/doctors/hospital/${hospitalId}`);
    return response.json();
  },

  updateDoctorAvailability: async (doctorId, availableHours) => {
    const response = await fetch(`${API_BASE_URL}/hospital/doctors/${doctorId}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(availableHours)
    });
    return response.json();
  },

  updateDoctorStatus: async (doctorId, status) => {
    const response = await fetch(`${API_BASE_URL}/hospital/doctors/${doctorId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  // Patient Management
  createPatient: async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/hospital/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    return response.json();
  },

  getPatients: async () => {
    const response = await fetch(`${API_BASE_URL}/hospital/patients`);
    return response.json();
  },

  getPatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/hospital/patients/${patientId}`);
    return response.json();
  },

  // Hospital Finding
  findHospital: async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/hospital/find_hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    return response.json();
  },

  // Intelligent Hospital Finding with Gemini LLM
  findHospitalIntelligent: async (requestData) => {
    const response = await fetch(`${API_BASE_URL}/hospital/find_hospital_intelligent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Dashboard Analytics
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/hospital/dashboard/stats`);
    return response.json();
  },

  getOccupancyTrends: async () => {
    const response = await fetch(`${API_BASE_URL}/hospital/dashboard/occupancy-trends`);
    return response.json();
  },

  getSpecialtyDistribution: async () => {
    const response = await fetch(`${API_BASE_URL}/hospital/dashboard/specialty-distribution`);
    return response.json();
  }
};

// Waste Optimizer API
export const wasteOptimizerAPI = {
  // Generate allocation plan
  generatePlan: async (inputData) => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/generate_plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData)
    });
    return response.json();
  },

  // System status
  getSystemStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/system_status`);
    return response.json();
  },

  // Data endpoints
  getInventory: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/inventory`);
    return response.json();
  },

  getDemand: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/demand`);
    return response.json();
  },

  getLogistics: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/logistics`);
    return response.json();
  },

  getStorage: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/storage`);
    return response.json();
  },

  getFarmers: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/farmers`);
    return response.json();
  },

  // Dashboard Analytics
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/dashboard/stats`);
    return response.json();
  },

  getInventoryFlow: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/dashboard/inventory-flow`);
    return response.json();
  },

  getNetworkStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/dashboard/network-status`);
    return response.json();
  },

  getWasteReduction: async () => {
    const response = await fetch(`${API_BASE_URL}/waste-optimizer/dashboard/waste-reduction`);
    return response.json();
  }
};

import { database } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const addDoctorInfoToFirebase = async (uid, doctorInfo) => {
  try {
    await setDoc(doc(database, 'doctors', uid), doctorInfo, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addHospitalInfoToFirebase = async (uid, hospitalInfo) => {
  try {
    await setDoc(doc(database, 'hospitals', uid), hospitalInfo, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addFarmerInfoToFirebase = async (uid, farmerInfo) => {
  try {
    await setDoc(doc(database, 'farmers', uid), farmerInfo, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addWarehouseInfoToFirebase = async (uid, warehouseInfo) => {
  try {
    await setDoc(doc(database, 'warehouses', uid), warehouseInfo, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addLogisticsInfoToFirebase = async (uid, logisticsInfo) => {
  try {
    await setDoc(doc(database, 'logistics', uid), logisticsInfo, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// NGO Management API
export const ngoAPI = {
  // Profile Management
  updateProfile: async (userId, profileData) => {
    const response = await fetch(`${API_BASE_URL}/hospital/profiles/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        role: 'ngo',
        profile_data: profileData
      })
    });
    return response.json();
  },

  getProfile: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/hospital/profiles/${userId}`);
    return response.json();
  },

  getProfilesByRole: async (role = 'ngo') => {
    const response = await fetch(`${API_BASE_URL}/hospital/profiles/role/${role}`);
    return response.json();
  },

  // Resource Management
  updateResources: async (ngoData) => {
    const response = await fetch(`${API_BASE_URL}/hospital/ngo/update-resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ngoData)
    });
    return response.json();
  },

  // NGO Discovery
  getNGOsByFocusArea: async (focusArea) => {
    const response = await fetch(`${API_BASE_URL}/hospital/ngo/by-focus-area/${focusArea}`);
    return response.json();
  },

  // Location-based Services
  getNearbyNGOs: async (lat, lon, radius = 25.0) => {
    const profiles = await ngoAPI.getProfilesByRole('ngo');
    if (!profiles.profiles) return { ngos: [] };
    
    const nearbyNGOs = profiles.profiles.filter(ngo => {
      const ngoData = ngo.profile_data;
      if (ngoData.location_lat && ngoData.location_lon) {
        const distance = calculateDistance(lat, lon, ngoData.location_lat, ngoData.location_lon);
        return distance <= radius;
      }
      return false;
    }).map(ngo => ({
      ...ngo,
      distance_km: calculateDistance(lat, lon, ngo.profile_data.location_lat, ngo.profile_data.location_lon)
    }));

    return { ngos: nearbyNGOs.sort((a, b) => a.distance_km - b.distance_km) };
  },

  // Operation Management
  createOperation: async (operationData) => {
    // Mock implementation - in real scenario this would be a backend endpoint
    const operations = JSON.parse(localStorage.getItem('ngo_operations') || '[]');
    const newOperation = {
      ...operationData,
      id: `OP${String(operations.length + 1).padStart(3, '0')}`,
      created_at: new Date().toISOString(),
      status: 'active'
    };
    operations.push(newOperation);
    localStorage.setItem('ngo_operations', JSON.stringify(operations));
    return { success: true, operation: newOperation };
  },

  getOperations: async (userId) => {
    const operations = JSON.parse(localStorage.getItem('ngo_operations') || '[]');
    return { operations: operations.filter(op => op.ngo_id === userId) };
  },

  updateOperation: async (operationId, updateData) => {
    const operations = JSON.parse(localStorage.getItem('ngo_operations') || '[]');
    const operationIndex = operations.findIndex(op => op.id === operationId);
    if (operationIndex !== -1) {
      operations[operationIndex] = { ...operations[operationIndex], ...updateData };
      localStorage.setItem('ngo_operations', JSON.stringify(operations));
      return { success: true, operation: operations[operationIndex] };
    }
    return { success: false, error: 'Operation not found' };
  },

  // Volunteer Management
  getVolunteers: async (ngoId) => {
    const volunteers = JSON.parse(localStorage.getItem(`ngo_volunteers_${ngoId}`) || '[]');
    return { volunteers };
  },

  addVolunteer: async (ngoId, volunteerData) => {
    const volunteers = JSON.parse(localStorage.getItem(`ngo_volunteers_${ngoId}`) || '[]');
    const newVolunteer = {
      ...volunteerData,
      id: volunteers.length + 1,
      joined_date: new Date().toISOString(),
      status: 'active'
    };
    volunteers.push(newVolunteer);
    localStorage.setItem(`ngo_volunteers_${ngoId}`, JSON.stringify(volunteers));
    return { success: true, volunteer: newVolunteer };
  },

  updateVolunteerStatus: async (ngoId, volunteerId, status) => {
    const volunteers = JSON.parse(localStorage.getItem(`ngo_volunteers_${ngoId}`) || '[]');
    const volunteerIndex = volunteers.findIndex(v => v.id === volunteerId);
    if (volunteerIndex !== -1) {
      volunteers[volunteerIndex].status = status;
      localStorage.setItem(`ngo_volunteers_${ngoId}`, JSON.stringify(volunteers));
      return { success: true };
    }
    return { success: false, error: 'Volunteer not found' };
  },

  // Analytics
  getAnalytics: async (ngoId) => {
    const operations = JSON.parse(localStorage.getItem('ngo_operations') || '[]');
    const volunteers = JSON.parse(localStorage.getItem(`ngo_volunteers_${ngoId}`) || '[]');
    const profile = await ngoAPI.getProfile(ngoId);
    
    const ngoOperations = operations.filter(op => op.ngo_id === ngoId);
    const activeOperations = ngoOperations.filter(op => op.status === 'active');
    const completedOperations = ngoOperations.filter(op => op.status === 'completed');
    const activeVolunteers = volunteers.filter(v => v.status === 'active');
    
    return {
      total_operations: ngoOperations.length,
      active_operations: activeOperations.length,
      completed_operations: completedOperations.length,
      total_volunteers: volunteers.length,
      active_volunteers: activeVolunteers.length,
      average_operation_progress: ngoOperations.length > 0 
        ? ngoOperations.reduce((sum, op) => sum + (op.progress || 0), 0) / ngoOperations.length 
        : 0
    };
  }
};

// Utility function for distance calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Shelter Allocation API
export const shelterAPI = {
  // Shelter allocation
  allocateShelter: async (inputData) => {
    const response = await fetch(`${API_BASE_URL}/shelter/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Get allocation by applicant ID
  getAllocation: async (applicantId) => {
    const response = await fetch(`${API_BASE_URL}/shelter/allocation/${applicantId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Get system stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/shelter/stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Get model status
  getModelStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/shelter/model-status`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Test prediction
  testPrediction: async (applicantData) => {
    const response = await fetch(`${API_BASE_URL}/shelter/test-prediction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicantData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

// Utility function for error handling
export const handleApiError = (error) => {
  console.error('API Error:', error);
  return {
    success: false,
    error: error.message || 'An unexpected error occurred'
  };
};
