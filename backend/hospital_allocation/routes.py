import os
import pickle
import pandas as pd
import numpy as np
from math import radians, cos, sin, asin, sqrt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
from huggingface_hub import hf_hub_download
from typing import List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
from .gemini_service import gemini_service

# Create an API Router for this module
router = APIRouter()

# --- Define the input data format using Pydantic ---
class PatientInput(BaseModel):
    patient_lon: float
    patient_lat: float
    severity: int

class DoctorInput(BaseModel):
    doctor_id: str
    name: str
    specialization: str
    available_hours: List[str]
    hospital_id: str
    experience_years: int

class HospitalInput(BaseModel):
    hospital_id: str
    name: str
    total_beds: int
    icu_beds: int
    available_beds: int
    available_icu_beds: int
    latitude: float
    longitude: float
    specialties: List[str]
    admin_id: str

class HospitalUpdateInput(BaseModel):
    available_beds: int
    available_icu_beds: int
    current_occupancy: int

# Role-specific data models
class DoctorProfileInput(BaseModel):
    hospital_name: str
    specialization: str
    experience_years: int
    contact_info: str = ""
    certifications: List[str] = []
    emergency_contact: str = ""

class AmbulanceDriverInput(BaseModel):
    license_number: str
    vehicle_id: str
    current_location_lat: float
    current_location_lon: float
    availability_status: str = "available"  # available, busy, off-duty
    case_severity: int = 1  # 1-5 scale
    estimated_arrival: str = ""
    patient_count: int = 0

class HospitalAdminProfileInput(BaseModel):
    hospital_name: str
    total_beds: int
    icu_beds: int
    available_beds: int
    available_icu_beds: int
    doctors_count: int
    specialties_available: List[str] = []
    emergency_capacity: int
    contact_info: str

class FarmerInput(BaseModel):
    farm_name: str
    location_lat: float
    location_lon: float
    crops_available: List[Dict[str, Any]]  # [{'crop_name': str, 'quantity': int, 'price_per_kg': float, 'harvest_date': str}]
    contact_info: str
    organic_certified: bool = False
    delivery_radius_km: float = 10.0

class LogisticsDriverInput(BaseModel):
    driver_name: str
    vehicle_type: str  # truck, van, motorcycle
    vehicle_capacity_kg: float
    license_number: str
    current_location_lat: float
    current_location_lon: float
    availability_status: str = "available"
    delivery_radius_km: float = 50.0
    contact_info: str

class NGOInput(BaseModel):
    organization_name: str
    registration_number: str
    focus_areas: List[str]  # disaster_relief, hunger, education, etc
    location_lat: float
    location_lon: float
    resources_available: List[Dict[str, Any]]
    volunteer_count: int
    contact_info: str
    operating_hours: List[str] = []

class ShelterManagerInput(BaseModel):
    shelter_name: str
    location_lat: float
    location_lon: float
    total_capacity: int
    available_capacity: int
    shelter_type: str  # emergency, temporary, permanent
    facilities_available: List[str]  # food, medical, education, etc
    contact_info: str
    operating_since: str

class WarehouseManagerInput(BaseModel):
    warehouse_name: str
    location_lat: float
    location_lon: float
    total_capacity_cubic_meters: float
    available_capacity_cubic_meters: float
    storage_types: List[str]  # dry, cold, frozen, hazardous
    inventory_items: List[Dict[str, Any]]
    contact_info: str

class HousingAuthorityInput(BaseModel):
    authority_name: str
    jurisdiction_area: str
    available_properties: List[Dict[str, Any]]  # [{'property_type': str, 'count': int, 'rent_range': str}]
    application_process: str
    contact_info: str
    eligibility_criteria: str

class LandlordInput(BaseModel):
    landlord_name: str
    properties_available: List[Dict[str, Any]]  # [{'address': str, 'type': str, 'rent': float, 'bedrooms': int}]
    preferred_tenant_type: str
    contact_info: str
    lease_terms: str
    pet_policy: str

class UserProfileUpdate(BaseModel):
    user_id: str
    role: str
    profile_data: Dict[str, Any]

# Enhanced models for intelligent ranking
class AmbulanceLocationInput(BaseModel):
    lat: float
    lon: float
    ambulance_id: str = "AMB001"
    driver_id: str = ""

class IntelligentHospitalRankingInput(BaseModel):
    patient_info: PatientInput
    ambulance_location: AmbulanceLocationInput
    include_live_data: bool = True
    max_hospitals: int = 5
    radius_km: float = 50.0

class HospitalRankingResponse(BaseModel):
    rank: int
    hospital_name: str
    hospital_id: str
    distance_km: float
    ml_suitability_score: float
    real_time_score: float
    final_score: float
    reasoning: str
    estimated_wait_time_minutes: int
    bed_availability_status: str
    icu_availability: str
    specialist_match: str
    risk_level: str

class IntelligentRankingResponse(BaseModel):
    final_ranking: List[HospitalRankingResponse]
    critical_factors: List[str]
    recommendations: Dict[str, str]
    overall_assessment: str
    analysis_timestamp: str
    model_used: str

# --- Load all necessary data and models from your Model Hub repository ---
# This will run only once when the server starts
gbm = None
clf = None
infra = None

# Create mock data if models can't be loaded
def create_mock_hospital_data():
    """Create mock hospital data for testing when real data is unavailable"""
    mock_data = {
        'facility_name': [
            'Apollo Hospital Chennai',
            'Fortis Malar Hospital', 
            'MIOT International',
            'Global Health City',
            'Stanley Medical College'
        ],
        'total_beds': [500, 350, 300, 400, 450],
        'icu_beds': [50, 35, 30, 40, 45],
        'latitude': [13.0878, 13.0338, 13.0281, 13.1078, 13.0732],
        'longitude': [80.2785, 80.2619, 80.2428, 80.2082, 80.2609]
    }
    return pd.DataFrame(mock_data)

try:
    print("Attempting to load ML models from Hugging Face Hub...")
    # IMPORTANT: Replace "your-username" with your actual Hugging Face username
    repo_id = "kesavan2006/chennai-hospital-optimizer-models" 

    # Download each file and get its local path
    gbm_path = hf_hub_download(repo_id=repo_id, filename="hospital_nextday_lgbm.pkl")
    clf_path = hf_hub_download(repo_id=repo_id, filename="hospital_suitability_lgbm.pkl")
    infra_path = hf_hub_download(repo_id=repo_id, filename="chennai_infra_used.csv")
    
    # Load the models and data from the downloaded paths
    # Note: Using pickle since that's what was used to save them
    with open(gbm_path, "rb") as f:
        gbm = pickle.load(f)
    with open(clf_path, "rb") as f:
        clf = pickle.load(f)
    infra = pd.read_csv(infra_path)
    
    print("✅ ML models loaded successfully from Hugging Face Hub")

except Exception as e:
    print(f"⚠️ Error loading files from Hugging Face Hub: {e}")
    print("🔄 Using mock data for demo purposes...")
    
    # Create mock models and data for demonstration
    infra = create_mock_hospital_data()
    
    # Create simple mock models
    class MockModel:
        def predict(self, X):
            # Simple mock prediction based on distance (lower distance = higher score)
            if hasattr(X, 'iloc'):
                # DataFrame input
                if 'dist_km' in X.columns:
                    return np.random.uniform(0.3, 0.9, len(X))
                else:
                    return np.random.uniform(30, 80, len(X))
            else:
                # Array input
                return np.random.uniform(30, 80, len(X))
    
    gbm = MockModel()
    clf = MockModel()
    
    print("✅ Mock models and data created successfully")

# --- Helper Function for Haversine Distance ---
def haversine(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return 6371 * c

# --- The API endpoint using the Router decorator ---
@router.post("/find_hospital")
def find_hospital(patient: PatientInput):
    if gbm is None or clf is None or infra is None:
        return {"error": "Models or data not loaded."}, 500
        
    req_icu = True if patient.severity >= 4 else False
    
    # Simulating real-time data for the prediction logic
    latest_rows_data = infra.copy()
    latest_rows_data['occupied'] = np.random.randint(10, 80, size=len(latest_rows_data))
    
    X_live = pd.DataFrame({
        'occ_lag1': latest_rows_data['occupied'],
        'occ_lag7': latest_rows_data['occupied'].shift(7).fillna(latest_rows_data['occupied'] * 0.95),
        'occ_roll7': latest_rows_data['occupied'].rolling(window=7, min_periods=1).mean().shift(1).fillna(0),
        'adm_roll7': np.random.uniform(0, 10, size=len(infra)),
        'adm_lag1': np.random.uniform(0, 10, size=len(infra)),
        'dis_lag1': np.random.uniform(0, 10, size=len(infra)),
        'dow': pd.to_datetime('today').dayofweek,
        'total_beds': infra['total_beds']
    })
    
    features = ['occ_lag1','occ_lag7','occ_roll7','adm_roll7','adm_lag1','dis_lag1','dow','total_beds']
    X_live = X_live[features].fillna(0)
    
    pred_next_occ = gbm.predict(X_live)
    latest_rows_data['pred_next_occupied'] = pred_next_occ
    latest_rows_data['pred_beds_available'] = latest_rows_data['total_beds'] - latest_rows_data['pred_next_occupied']
    latest_rows_data['staffed_rate'] = np.random.uniform(0.8,1.2,size=len(latest_rows_data))
    latest_rows_data['wait_time_est'] = latest_rows_data['pred_next_occupied'] / (latest_rows_data['total_beds'] * latest_rows_data['staffed_rate'] + 1e-6)
    
    rows = []
    for idx, h in latest_rows_data.iterrows():
        dist = haversine(patient.patient_lon, patient.patient_lat, h['longitude'], h['latitude'])
        
        suit_features_dict = {
            "dist_km": dist,
            "pred_beds_available": max(0, h['pred_beds_available']),
            "wait_time_est": h['wait_time_est'],
            "severity": patient.severity,
            "req_icu": int(req_icu),
            "hospital_total_beds": h['total_beds'],
            "hospital_icu_beds": h['icu_beds']
        }
        rows.append(suit_features_dict)

    candidates_df = pd.DataFrame(rows)
    
    suit_features = ['dist_km','pred_beds_available','wait_time_est','severity','req_icu','hospital_total_beds','hospital_icu_beds']
    candidates_df['ml_prob'] = clf.predict(candidates_df[suit_features])
    
    ranked_hospitals = candidates_df.sort_values('ml_prob', ascending=False).head(5)
    
    output = []
    for _, row in ranked_hospitals.iterrows():
        hospital_info = infra.loc[row.name]
        output.append({
            "hospital_name": hospital_info['facility_name'],
            "distance_km": round(row['dist_km'], 2),
            "predicted_beds_available": int(max(0, round(row['pred_beds_available']))),
            "suitability_score": round(row['ml_prob'], 3),
            "hospital_latitude": hospital_info['latitude'],
            "hospital_longitude": hospital_info['longitude']
        })
    
    return output

# --- Enhanced Intelligent Hospital Ranking Endpoint ---
@router.post("/find_hospital_intelligent", response_model=IntelligentRankingResponse)
async def find_hospital_intelligent(request: IntelligentHospitalRankingInput):
    """Find hospitals using ML model + live data + Gemini LLM analysis"""
    try:
        # Models and data should now be loaded (either real or mock)
        print(f"🔍 Processing intelligent hospital ranking request...")
        print(f"Models status: gbm={gbm is not None}, clf={clf is not None}, infra={infra is not None}")
        
        patient = request.patient_info
        ambulance_location = request.ambulance_location
        
        # Step 1: Get ML model rankings (same as find_hospital)
        req_icu = True if patient.severity >= 4 else False
        
        # Simulating real-time data for the prediction logic
        latest_rows_data = infra.copy()
        latest_rows_data['occupied'] = np.random.randint(10, 80, size=len(latest_rows_data))
        
        X_live = pd.DataFrame({
            'occ_lag1': latest_rows_data['occupied'],
            'occ_lag7': latest_rows_data['occupied'].shift(7).fillna(latest_rows_data['occupied'] * 0.95),
            'occ_roll7': latest_rows_data['occupied'].rolling(window=7, min_periods=1).mean().shift(1).fillna(0),
            'adm_roll7': np.random.uniform(0, 10, size=len(infra)),
            'adm_lag1': np.random.uniform(0, 10, size=len(infra)),
            'dis_lag1': np.random.uniform(0, 10, size=len(infra)),
            'dow': pd.to_datetime('today').dayofweek,
            'total_beds': infra['total_beds']
        })
        
        features = ['occ_lag1','occ_lag7','occ_roll7','adm_roll7','adm_lag1','dis_lag1','dow','total_beds']
        X_live = X_live[features].fillna(0)
        
        pred_next_occ = gbm.predict(X_live)
        latest_rows_data['pred_next_occupied'] = pred_next_occ
        latest_rows_data['pred_beds_available'] = latest_rows_data['total_beds'] - latest_rows_data['pred_next_occupied']
        latest_rows_data['staffed_rate'] = np.random.uniform(0.8,1.2,size=len(latest_rows_data))
        latest_rows_data['wait_time_est'] = latest_rows_data['pred_next_occupied'] / (latest_rows_data['total_beds'] * latest_rows_data['staffed_rate'] + 1e-6)
        
        rows = []
        for idx, h in latest_rows_data.iterrows():
            dist = haversine(patient.patient_lon, patient.patient_lat, h['longitude'], h['latitude'])
            
            # Filter by radius if specified
            if request.radius_km > 0 and dist > request.radius_km:
                continue
                
            suit_features_dict = {
                "dist_km": dist,
                "pred_beds_available": max(0, h['pred_beds_available']),
                "wait_time_est": h['wait_time_est'],
                "severity": patient.severity,
                "req_icu": int(req_icu),
                "hospital_total_beds": h['total_beds'],
                "hospital_icu_beds": h['icu_beds']
            }
            rows.append(suit_features_dict)

        candidates_df = pd.DataFrame(rows)
        
        if candidates_df.empty:
            raise HTTPException(status_code=404, detail="No hospitals found within specified radius")
        
        suit_features = ['dist_km','pred_beds_available','wait_time_est','severity','req_icu','hospital_total_beds','hospital_icu_beds']
        candidates_df['ml_prob'] = clf.predict(candidates_df[suit_features])
        
        ranked_hospitals = candidates_df.sort_values('ml_prob', ascending=False).head(request.max_hospitals)
        
        # Step 2: Format ML rankings for LLM
        ml_rankings = []
        for _, row in ranked_hospitals.iterrows():
            hospital_info = infra.loc[row.name]
            ml_rankings.append({
                "hospital_name": hospital_info['facility_name'],
                "hospital_id": str(row.name),
                "distance_km": round(row['dist_km'], 2),
                "predicted_beds_available": int(max(0, round(row['pred_beds_available']))),
                "suitability_score": round(row['ml_prob'], 3),
                "hospital_latitude": hospital_info['latitude'],
                "hospital_longitude": hospital_info['longitude'],
                "total_beds": int(hospital_info['total_beds']),
                "icu_beds": int(hospital_info['icu_beds']),
                "wait_time_estimate": round(row['wait_time_est'], 2)
            })
        
        # Step 3: Gather live hospital data if requested
        live_hospital_data = {
            "hospitals": list(hospitals_db.values()) if request.include_live_data else [],
            "doctors": list(doctors_db.values()) if request.include_live_data else [],
            "patients": list(patients_db.values()) if request.include_live_data else []
        }
        
        # Step 4: Prepare ambulance location and patient info for LLM
        ambulance_location_dict = {
            "lat": ambulance_location.lat,
            "lon": ambulance_location.lon
        }
        
        patient_info_dict = {
            "patient_lat": patient.patient_lat,
            "patient_lon": patient.patient_lon,
            "severity": patient.severity
        }
        
        # Step 5: Get intelligent ranking from Gemini LLM
        llm_result = await gemini_service.get_intelligent_hospital_ranking(
            ml_rankings=ml_rankings,
            live_hospital_data=live_hospital_data,
            ambulance_location=ambulance_location_dict,
            patient_info=patient_info_dict
        )
        
        # Step 6: Format response according to Pydantic model
        formatted_rankings = []
        for hospital_ranking in llm_result.get('final_ranking', []):
            formatted_rankings.append(HospitalRankingResponse(
                rank=hospital_ranking.get('rank', 0),
                hospital_name=hospital_ranking.get('hospital_name', 'Unknown Hospital'),
                hospital_id=hospital_ranking.get('hospital_id', 'unknown'),
                distance_km=hospital_ranking.get('distance_km', 0.0),
                ml_suitability_score=hospital_ranking.get('ml_suitability_score', 0.0),
                real_time_score=hospital_ranking.get('real_time_score', 0.0),
                final_score=hospital_ranking.get('final_score', 0.0),
                reasoning=hospital_ranking.get('reasoning', 'No reasoning provided'),
                estimated_wait_time_minutes=hospital_ranking.get('estimated_wait_time_minutes', 0),
                bed_availability_status=hospital_ranking.get('bed_availability_status', 'Unknown'),
                icu_availability=hospital_ranking.get('icu_availability', 'Unknown'),
                specialist_match=hospital_ranking.get('specialist_match', 'Unknown'),
                risk_level=hospital_ranking.get('risk_level', 'Medium')
            ))
        
        return IntelligentRankingResponse(
            final_ranking=formatted_rankings,
            critical_factors=llm_result.get('critical_factors', []),
            recommendations=llm_result.get('recommendations', {}),
            overall_assessment=llm_result.get('overall_assessment', 'Analysis completed'),
            analysis_timestamp=llm_result.get('analysis_timestamp', datetime.now().isoformat()),
            model_used=llm_result.get('model_used', 'gemini-pro')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in intelligent hospital ranking: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# --- In-memory storage for demo purposes (in production, use a database) ---
hospitals_db = {}
doctors_db = {}
patients_db = {}

# --- Hospital Management Endpoints ---
@router.post("/hospitals")
def create_hospital(hospital: HospitalInput):
    """Create a new hospital entry"""
    hospitals_db[hospital.hospital_id] = {
        **hospital.dict(),
        "created_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }
    return {"message": "Hospital created successfully", "hospital_id": hospital.hospital_id}

@router.get("/hospitals")
def get_all_hospitals():
    """Get all hospitals"""
    return {"hospitals": list(hospitals_db.values())}

@router.get("/hospitals/{hospital_id}")
def get_hospital(hospital_id: str):
    """Get specific hospital details"""
    if hospital_id not in hospitals_db:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospitals_db[hospital_id]

@router.put("/hospitals/{hospital_id}")
def update_hospital(hospital_id: str, update_data: HospitalUpdateInput):
    """Update hospital availability"""
    if hospital_id not in hospitals_db:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    hospitals_db[hospital_id].update({
        **update_data.dict(),
        "last_updated": datetime.now().isoformat()
    })
    return {"message": "Hospital updated successfully"}

@router.delete("/hospitals/{hospital_id}")
def delete_hospital(hospital_id: str):
    """Delete a hospital"""
    if hospital_id not in hospitals_db:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    del hospitals_db[hospital_id]
    return {"message": "Hospital deleted successfully"}

# --- Doctor Management Endpoints ---
@router.post("/doctors")
def create_doctor(doctor: DoctorInput):
    """Create a new doctor entry"""
    doctors_db[doctor.doctor_id] = {
        **doctor.dict(),
        "created_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat(),
        "status": "available"
    }
    return {"message": "Doctor created successfully", "doctor_id": doctor.doctor_id}

@router.get("/doctors")
def get_all_doctors():
    """Get all doctors"""
    return {"doctors": list(doctors_db.values())}

@router.get("/doctors/{doctor_id}")
def get_doctor(doctor_id: str):
    """Get specific doctor details"""
    if doctor_id not in doctors_db:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctors_db[doctor_id]

@router.get("/doctors/hospital/{hospital_id}")
def get_doctors_by_hospital(hospital_id: str):
    """Get all doctors in a specific hospital"""
    hospital_doctors = [doc for doc in doctors_db.values() if doc["hospital_id"] == hospital_id]
    return {"doctors": hospital_doctors}

@router.put("/doctors/{doctor_id}/availability")
def update_doctor_availability(doctor_id: str, available_hours: List[str]):
    """Update doctor's available hours"""
    if doctor_id not in doctors_db:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    doctors_db[doctor_id]["available_hours"] = available_hours
    doctors_db[doctor_id]["last_updated"] = datetime.now().isoformat()
    return {"message": "Doctor availability updated successfully"}

@router.put("/doctors/{doctor_id}/status")
def update_doctor_status(doctor_id: str, status: str):
    """Update doctor's status (available, busy, off-duty)"""
    if doctor_id not in doctors_db:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    valid_statuses = ["available", "busy", "off-duty"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    doctors_db[doctor_id]["status"] = status
    doctors_db[doctor_id]["last_updated"] = datetime.now().isoformat()
    return {"message": "Doctor status updated successfully"}

# --- Patient Management Endpoints ---
@router.post("/patients")
def create_patient(patient: PatientInput):
    """Create a new patient entry"""
    patient_id = f"P{len(patients_db) + 1:06d}"
    patients_db[patient_id] = {
        **patient.dict(),
        "patient_id": patient_id,
        "created_at": datetime.now().isoformat(),
        "status": "waiting",
        "assigned_hospital": None,
        "assigned_doctor": None
    }
    return {"message": "Patient created successfully", "patient_id": patient_id}

@router.get("/patients")
def get_all_patients():
    """Get all patients"""
    return {"patients": list(patients_db.values())}

@router.get("/patients/{patient_id}")
def get_patient(patient_id: str):
    """Get specific patient details"""
    if patient_id not in patients_db:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patients_db[patient_id]

# --- Analytics and Dashboard Endpoints ---
@router.get("/dashboard/stats")
def get_dashboard_stats():
    """Get dashboard statistics"""
    total_hospitals = len(hospitals_db)
    total_doctors = len(doctors_db)
    total_patients = len(patients_db)
    
    available_beds = sum(h["available_beds"] for h in hospitals_db.values())
    total_beds = sum(h["total_beds"] for h in hospitals_db.values())
    occupancy_rate = ((total_beds - available_beds) / total_beds * 100) if total_beds > 0 else 0
    
    available_doctors = len([d for d in doctors_db.values() if d["status"] == "available"])
    busy_doctors = len([d for d in doctors_db.values() if d["status"] == "busy"])
    
    waiting_patients = len([p for p in patients_db.values() if p["status"] == "waiting"])
    
    return {
        "total_hospitals": total_hospitals,
        "total_doctors": total_doctors,
        "total_patients": total_patients,
        "available_beds": available_beds,
        "total_beds": total_beds,
        "occupancy_rate": round(occupancy_rate, 2),
        "available_doctors": available_doctors,
        "busy_doctors": busy_doctors,
        "waiting_patients": waiting_patients
    }

@router.get("/dashboard/occupancy-trends")
def get_occupancy_trends():
    """Get occupancy trends for the last 24 hours"""
    # Simulate hourly data for the last 24 hours
    hours = []
    occupancy_data = []
    
    for i in range(24):
        hour = (datetime.now() - timedelta(hours=23-i)).strftime("%H:00")
        hours.append(hour)
        # Simulate realistic occupancy data
        base_occupancy = 60 + random.randint(-10, 20)
        occupancy_data.append(max(0, min(100, base_occupancy)))
    
    return {
        "hours": hours,
        "occupancy_percentages": occupancy_data
    }

@router.get("/dashboard/specialty-distribution")
def get_specialty_distribution():
    """Get doctor distribution by specialty"""
    specialty_count = {}
    for doctor in doctors_db.values():
        specialty = doctor["specialization"]
        specialty_count[specialty] = specialty_count.get(specialty, 0) + 1
    
    return {
        "specialties": list(specialty_count.keys()),
        "counts": list(specialty_count.values())
    }

# --- Role-specific profile management ---
user_profiles_db = {}  # Store role-specific user profiles

@router.post("/profiles/update")
def update_user_profile(profile_update: UserProfileUpdate):
    """Update user profile with role-specific data"""
    user_profiles_db[profile_update.user_id] = {
        "user_id": profile_update.user_id,
        "role": profile_update.role,
        "profile_data": profile_update.profile_data,
        "created_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }
    return {"message": "Profile updated successfully", "user_id": profile_update.user_id}

@router.get("/profiles/{user_id}")
def get_user_profile(user_id: str):
    """Get user profile by ID"""
    if user_id not in user_profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    return user_profiles_db[user_id]

@router.get("/profiles/role/{role}")
def get_profiles_by_role(role: str):
    """Get all profiles by role"""
    role_profiles = [profile for profile in user_profiles_db.values() if profile["role"] == role]
    return {"profiles": role_profiles}

# Role-specific endpoints
@router.post("/ambulance/update-status")
def update_ambulance_status(driver_data: AmbulanceDriverInput):
    """Update ambulance driver status and current case"""
    # This could be integrated with the user profile system
    return {"message": "Ambulance status updated", "data": driver_data.dict()}

@router.post("/farmer/update-crops")
def update_farmer_crops(farmer_data: FarmerInput):
    """Update farmer's available crops and pricing"""
    return {"message": "Farmer crops updated", "data": farmer_data.dict()}

@router.get("/farmer/nearby")
def get_nearby_farmers(lat: float, lon: float, radius_km: float = 10.0):
    """Get farmers within specified radius"""
    nearby_farmers = []
    for profile in user_profiles_db.values():
        if profile["role"] == "farmer":
            farmer_data = profile["profile_data"]
            if "location_lat" in farmer_data and "location_lon" in farmer_data:
                distance = haversine(lon, lat, farmer_data["location_lon"], farmer_data["location_lat"])
                if distance <= radius_km:
                    nearby_farmers.append({
                        **profile,
                        "distance_km": round(distance, 2)
                    })
    
    return {"farmers": sorted(nearby_farmers, key=lambda x: x["distance_km"])}

@router.post("/logistics/update-availability")
def update_logistics_availability(logistics_data: LogisticsDriverInput):
    """Update logistics driver availability and location"""
    return {"message": "Logistics availability updated", "data": logistics_data.dict()}

@router.get("/logistics/nearby")
def get_nearby_logistics_drivers(lat: float, lon: float, radius_km: float = 50.0):
    """Get available logistics drivers within specified radius"""
    nearby_drivers = []
    for profile in user_profiles_db.values():
        if profile["role"] == "logistics_driver":
            driver_data = profile["profile_data"]
            if ("current_location_lat" in driver_data and 
                "current_location_lon" in driver_data and
                driver_data.get("availability_status") == "available"):
                distance = haversine(lon, lat, driver_data["current_location_lon"], driver_data["current_location_lat"])
                if distance <= radius_km:
                    nearby_drivers.append({
                        **profile,
                        "distance_km": round(distance, 2)
                    })
    
    return {"drivers": sorted(nearby_drivers, key=lambda x: x["distance_km"])}

@router.post("/shelter/update-capacity")
def update_shelter_capacity(shelter_data: ShelterManagerInput):
    """Update shelter capacity and facilities"""
    return {"message": "Shelter capacity updated", "data": shelter_data.dict()}

@router.get("/shelter/available")
def get_available_shelters(lat: float = None, lon: float = None, radius_km: float = 25.0):
    """Get available shelters, optionally filtered by location"""
    available_shelters = []
    for profile in user_profiles_db.values():
        if profile["role"] == "shelter_manager":
            shelter_data = profile["profile_data"]
            if shelter_data.get("available_capacity", 0) > 0:
                shelter_info = {**profile}
                if lat and lon and "location_lat" in shelter_data and "location_lon" in shelter_data:
                    distance = haversine(lon, lat, shelter_data["location_lon"], shelter_data["location_lat"])
                    if distance <= radius_km:
                        shelter_info["distance_km"] = round(distance, 2)
                        available_shelters.append(shelter_info)
                else:
                    available_shelters.append(shelter_info)
    
    if lat and lon:
        available_shelters = sorted(available_shelters, key=lambda x: x.get("distance_km", float('inf')))
    
    return {"shelters": available_shelters}

@router.post("/warehouse/update-inventory")
def update_warehouse_inventory(warehouse_data: WarehouseManagerInput):
    """Update warehouse inventory and capacity"""
    return {"message": "Warehouse inventory updated", "data": warehouse_data.dict()}

@router.get("/warehouse/search-inventory")
def search_warehouse_inventory(item_name: str = None, lat: float = None, lon: float = None, radius_km: float = 50.0):
    """Search for specific items in warehouses"""
    matching_warehouses = []
    for profile in user_profiles_db.values():
        if profile["role"] == "warehouse_manager":
            warehouse_data = profile["profile_data"]
            # Check if item is in inventory
            if item_name:
                inventory_items = warehouse_data.get("inventory_items", [])
                has_item = any(item_name.lower() in item.get("name", "").lower() for item in inventory_items)
                if not has_item:
                    continue
            
            warehouse_info = {**profile}
            if lat and lon and "location_lat" in warehouse_data and "location_lon" in warehouse_data:
                distance = haversine(lon, lat, warehouse_data["location_lon"], warehouse_data["location_lat"])
                if distance <= radius_km:
                    warehouse_info["distance_km"] = round(distance, 2)
                    matching_warehouses.append(warehouse_info)
            else:
                matching_warehouses.append(warehouse_info)
    
    if lat and lon:
        matching_warehouses = sorted(matching_warehouses, key=lambda x: x.get("distance_km", float('inf')))
    
    return {"warehouses": matching_warehouses}

@router.post("/housing-authority/update-properties")
def update_housing_authority_properties(housing_data: HousingAuthorityInput):
    """Update available properties from housing authority"""
    return {"message": "Housing authority properties updated", "data": housing_data.dict()}

@router.get("/housing-authority/properties")
def get_available_properties(property_type: str = None, max_rent: float = None):
    """Get available properties from housing authorities"""
    available_properties = []
    for profile in user_profiles_db.values():
        if profile["role"] == "housing_authority":
            housing_data = profile["profile_data"]
            properties = housing_data.get("available_properties", [])
            
            for prop in properties:
                if property_type and prop.get("property_type") != property_type:
                    continue
                if max_rent and prop.get("rent", float('inf')) > max_rent:
                    continue
                
                available_properties.append({
                    **prop,
                    "authority_name": housing_data.get("authority_name"),
                    "contact_info": housing_data.get("contact_info")
                })
    
    return {"properties": available_properties}

@router.post("/landlord/update-properties")
def update_landlord_properties(landlord_data: LandlordInput):
    """Update landlord's available properties"""
    return {"message": "Landlord properties updated", "data": landlord_data.dict()}

@router.get("/landlord/properties")
def get_landlord_properties(max_rent: float = None, min_bedrooms: int = None, pet_friendly: bool = None):
    """Get available properties from landlords"""
    available_properties = []
    for profile in user_profiles_db.values():
        if profile["role"] == "landlord":
            landlord_data = profile["profile_data"]
            properties = landlord_data.get("properties_available", [])
            
            for prop in properties:
                if max_rent and prop.get("rent", float('inf')) > max_rent:
                    continue
                if min_bedrooms and prop.get("bedrooms", 0) < min_bedrooms:
                    continue
                if pet_friendly is not None:
                    pet_policy = landlord_data.get("pet_policy", "").lower()
                    if pet_friendly and "no pets" in pet_policy:
                        continue
                    if not pet_friendly and "pets allowed" not in pet_policy:
                        continue
                
                available_properties.append({
                    **prop,
                    "landlord_name": landlord_data.get("landlord_name"),
                    "contact_info": landlord_data.get("contact_info"),
                    "pet_policy": landlord_data.get("pet_policy")
                })
    
    return {"properties": available_properties}

@router.post("/ngo/update-resources")
def update_ngo_resources(ngo_data: NGOInput):
    """Update NGO resources and volunteer information"""
    return {"message": "NGO resources updated", "data": ngo_data.dict()}

@router.get("/ngo/by-focus-area/{focus_area}")
def get_ngos_by_focus_area(focus_area: str):
    """Get NGOs working in a specific focus area"""
    matching_ngos = []
    for profile in user_profiles_db.values():
        if profile["role"] == "ngo":
            ngo_data = profile["profile_data"]
            focus_areas = ngo_data.get("focus_areas", [])
            if focus_area.lower() in [area.lower() for area in focus_areas]:
                matching_ngos.append(profile)
    
    return {"ngos": matching_ngos}
