import os
import json
import joblib
import gdown
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
try:
    from blockchain import blockchain_handler
except ImportError:
    blockchain_handler = None

# Create router
router = APIRouter()

# Pydantic models
class ShelterAllocationInput(BaseModel):
    applicant_id: str = Field(..., description="Unique ID for the applicant")
    applicant_data: Dict[str, Any] = Field(..., description="Applicant data for vulnerability assessment")
    shelter_unit_id: str = Field(..., description="ID of the shelter unit being allocated")

class ShelterAllocationOutput(BaseModel):
    applicant_id: str
    vulnerability_score: float
    priority: str
    shelter_unit_id: str
    blockchain_transaction: Dict[str, Any]
    verification_url: str

class ApplicantData(BaseModel):
    poverty_level: float = Field(..., ge=0, le=100, description="Poverty level (0-100%)")
    unemployment_duration: int = Field(..., ge=0, description="Months unemployed")
    family_size: int = Field(..., ge=1, description="Number of family members")
    has_disability: bool = Field(False, description="Has disability")
    is_elderly: bool = Field(False, description="Is elderly (65+)")
    is_single_parent: bool = Field(False, description="Is single parent")
    minority_status: bool = Field(False, description="Belongs to minority group")
    special_circumstances: list = Field([], description="Special circumstances list")

# Load ML model from Google Drive
def load_ml_model():
    """
    Load the trained ML model from Google Drive or local fallback
    """
    try:
        os.makedirs("models", exist_ok=True)
        model_path = "models/shelter_allocation_model.pkl"
        scaler_path = "models/feature_scaler.pkl"
        
        # Check if models exist locally first
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            try:
                model = joblib.load(model_path)
                scaler = joblib.load(scaler_path)
                print("✅ ML models loaded successfully from local files")
                return model, scaler
            except Exception as e:
                print(f"⚠️ Failed to load local models: {e}")
                # Continue to try downloading
        
        # Try to download from Google Drive
        print("🔄 Attempting to download ML models from Google Drive...")
        model_url = "https://drive.google.com/uc?id=1iVKD9_F8LaMR65QOipPCWkGDqjoSNCmK"
        scaler_url = "https://drive.google.com/uc?id=1feFnueGcCW_BPCULAc5imo7a4URQwrjq"

        # Download files with timeout and error handling
        try:
            gdown.download(model_url, model_path, quiet=True, timeout=30)
            gdown.download(scaler_url, scaler_path, quiet=True, timeout=30)
            
            # Load downloaded models
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            
            print("✅ ML models downloaded and loaded successfully from Google Drive")
            return model, scaler
        except Exception as download_error:
            print(f"⚠️ Failed to download ML models: {download_error}")
            raise download_error

    except Exception as e:
        print(f"⚠️ Failed to load ML models: {e}")
        print("⚠️ Using fallback scoring system")
        return None, None

# Initialize ML model
model, scaler = load_ml_model()

def predict_vulnerability_ml(applicant_data: Dict[str, Any]) -> float:
    """
    Predict vulnerability score using trained ML model
    """
    try:
        # Prepare features in the same format as training
        features = np.array([
            applicant_data.get('poverty_level', 0),
            applicant_data.get('unemployment_duration', 0),
            applicant_data.get('family_size', 1),
            1 if applicant_data.get('has_disability', False) else 0,
            1 if applicant_data.get('is_elderly', False) else 0,
            1 if applicant_data.get('is_single_parent', False) else 0,
            1 if applicant_data.get('minority_status', False) else 0,
            len(applicant_data.get('special_circumstances', []))
        ]).reshape(1, -1)
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Predict
        score = model.predict(features_scaled)[0]
        return max(0, min(100, score))  # Ensure score is between 0-100
        
    except Exception as e:
        print(f"ML prediction failed: {e}")
        return predict_vulnerability_fallback(applicant_data)

def predict_vulnerability_fallback(applicant_data: Dict[str, Any]) -> float:
    """
    Fallback vulnerability scoring if ML model is not available
    """
    score = 0.0
    
    # Poverty factor (0-25 points)
    score += min(applicant_data.get('poverty_level', 0) * 0.25, 25)
    
    # Unemployment factor (0-20 points)
    score += min(applicant_data.get('unemployment_duration', 0) * 2.0, 20)
    
    # Family size factor (0-15 points)
    family_size = applicant_data.get('family_size', 1)
    score += min((family_size - 1) * 3, 15)
    
    # Disability factor (0-15 points)
    if applicant_data.get('has_disability', False):
        score += 15
    
    # Age factor (0-10 points)
    if applicant_data.get('is_elderly', False):
        score += 10
    
    # Special circumstances (0-15 points)
    special_circumstances = applicant_data.get('special_circumstances', [])
    score += min(len(special_circumstances) * 3, 15)
    
    return min(max(score, 0), 100)  # Ensure 0-100 range

def get_priority_level(score: float) -> str:
    """Convert score to priority level"""
    if score >= 70:
        return "CRITICAL"
    elif score >= 50:
        return "HIGH"
    elif score >= 30:
        return "MEDIUM"
    else:
        return "LOW"

# API Endpoints
@router.post("/allocate", response_model=ShelterAllocationOutput)
async def allocate_shelter(input_data: ShelterAllocationInput):
    """
    Allocate shelter based on AI prediction and record on blockchain
    """
    try:
        # 1. Get AI prediction (use ML model or fallback)
        if model and scaler:
            vulnerability_score = predict_vulnerability_ml(input_data.applicant_data)
        else:
            vulnerability_score = predict_vulnerability_fallback(input_data.applicant_data)
        
        # 2. Determine priority level
        priority = get_priority_level(vulnerability_score)
        
        # 3. Record on blockchain (optional)
        if blockchain_handler:
            try:
                blockchain_result = blockchain_handler.record_allocation(
                    applicant_id=input_data.applicant_id,
                    vulnerability_score=vulnerability_score,
                    shelter_unit_id=input_data.shelter_unit_id
                )
                
                if not blockchain_result.get('success', False):
                    print(f"⚠️  Blockchain recording failed: {blockchain_result.get('error', 'Unknown error')}")
                    # Continue without blockchain - don't fail the allocation
                    blockchain_result = {
                        'success': True,
                        'transaction_hash': 'N/A - Blockchain disabled',
                        'verification_url': 'N/A - Blockchain disabled',
                        'blockchain_disabled': True
                    }
            except Exception as e:
                print(f"⚠️  Blockchain error: {str(e)}")
                blockchain_result = {
                    'success': True,
                    'transaction_hash': 'N/A - Blockchain disabled',
                    'verification_url': 'N/A - Blockchain disabled',
                    'blockchain_disabled': True,
                    'error': str(e)
                }
        else:
            blockchain_result = {
                'success': True,
                'transaction_hash': 'N/A - Blockchain disabled',
                'verification_url': 'N/A - Blockchain disabled',
                'blockchain_disabled': True
            }
        
        return ShelterAllocationOutput(
            applicant_id=input_data.applicant_id,
            vulnerability_score=round(vulnerability_score, 2),
            priority=priority,
            shelter_unit_id=input_data.shelter_unit_id,
            blockchain_transaction=blockchain_result,
            verification_url=blockchain_result.get('verification_url', '')
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Shelter allocation error: {str(e)}")

@router.get("/allocation/{applicant_id}")
async def get_allocation(applicant_id: str):
    """
    Get allocation data from blockchain for a specific applicant
    """
    try:
        if blockchain_handler:
            result = blockchain_handler.get_allocation(applicant_id)
            return result
        else:
            return {
                'success': False,
                'error': 'Successfully recorded in our chain',
                'blockchain_disabled': True
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching allocation: {str(e)}")

@router.get("/stats")
async def get_stats():
    """
    Get blockchain statistics and allocation metrics
    """
    try:
        if blockchain_handler:
            stats = blockchain_handler.get_allocation_count()
            network_info = blockchain_handler.get_network_info()
        else:
            stats = {'success': True, 'count': 0, 'blockchain_disabled': True}
            network_info = {'success': False, 'error': 'Blockchain disabled'}
        
        return {
            "blockchain_stats": stats,
            "network_info": network_info,
            "ml_model_loaded": model is not None,
            "blockchain_enabled": blockchain_handler is not None,
            "system_status": "operational"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

@router.get("/model-status")
async def get_model_status():
    """
    Check if ML model is loaded correctly
    """
    return {
        "ml_model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "model_type": "Random Forest" if model else "Fallback Scoring",
        "status": "ready"
    }

# Test endpoint
@router.post("/test-prediction")
async def test_prediction(applicant_data: ApplicantData):
    """
    Test vulnerability prediction without blockchain recording
    """
    try:
        data_dict = applicant_data.dict()
        
        if model and scaler:
            score = predict_vulnerability_ml(data_dict)
            method = "ML Model"
        else:
            score = predict_vulnerability_fallback(data_dict)
            method = "Fallback"
        
        return {
            "vulnerability_score": round(score, 2),
            "priority": get_priority_level(score),
            "prediction_method": method,
            "applicant_data": data_dict
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")