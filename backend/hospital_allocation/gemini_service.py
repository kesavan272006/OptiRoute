import os
import json
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GeminiHospitalRankingService:
    def __init__(self):
        """Initialize the Gemini service with API key from environment"""
        try:
            self.api_key = os.getenv("GEMINI_API_KEY")
            if not self.api_key:
                print("Warning: GEMINI_API_KEY not found in environment variables")
                self.llm = None
                return
            
            # Initialize the Gemini model
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",  # Use a more stable model
                google_api_key=self.api_key,
                temperature=0.3,
                max_tokens=2048
            )
            print("Gemini service initialized successfully")
        except Exception as e:
            print(f"Error initializing Gemini service: {e}")
            self.llm = None

    def create_ranking_prompt(self, 
                            ml_rankings: List[Dict[str, Any]], 
                            live_hospital_data: Dict[str, List[Dict[str, Any]]], 
                            ambulance_location: Dict[str, float],
                            patient_info: Dict[str, Any]) -> str:
        """Create a detailed prompt for the LLM to analyze and rank hospitals"""
        
        prompt = f"""
You are an advanced AI hospital allocation specialist with expertise in emergency medicine, hospital operations, and resource optimization. Your task is to analyze machine learning predictions combined with real-time hospital data to provide the most optimal hospital ranking for emergency patient allocation.

## PATIENT INFORMATION:
- Location: Latitude {patient_info.get('patient_lat', 'Unknown')}, Longitude {patient_info.get('patient_lon', 'Unknown')}
- Severity Level: {patient_info.get('severity', 'Unknown')}/5 (1=low, 5=critical)
- ICU Required: {'Yes' if patient_info.get('severity', 0) >= 4 else 'No'}

## AMBULANCE LOCATION:
- Current Position: Latitude {ambulance_location.get('lat', 'Unknown')}, Longitude {ambulance_location.get('lon', 'Unknown')}

## MACHINE LEARNING MODEL PREDICTIONS:
The following hospitals have been ranked by our trained ML model based on historical data, distance, predicted bed availability, and suitability scores:

{json.dumps(ml_rankings, indent=2)}

## REAL-TIME HOSPITAL DATA FROM USERS:
This is live data provided by hospital administrators, doctors, and staff through our application:

### Hospital Updates:
{json.dumps(live_hospital_data.get('hospitals', []), indent=2)}

### Doctor Availability:
{json.dumps(live_hospital_data.get('doctors', []), indent=2)}

### Current Patient Load:
{json.dumps(live_hospital_data.get('patients', []), indent=2)}

## ANALYSIS REQUIREMENTS:

Please analyze this data comprehensively and provide:

1. **FINAL RANKING**: Rerank the hospitals from 1-5 (best to worst) considering BOTH the ML predictions AND real-time data
2. **REASONING**: For each hospital, explain why it's ranked at that position
3. **CRITICAL FACTORS**: Identify the most important factors that influenced your decision
4. **RECOMMENDATIONS**: Specific recommendations for patient transport and hospital preparation
5. **RISK ASSESSMENT**: Any potential risks or concerns for each option

## DECISION CRITERIA (in order of priority):
1. Patient safety and survival probability
2. Appropriate care level for severity
3. Real-time bed/ICU availability
4. Distance and transport time
5. Specialist availability matching patient needs
6. Current hospital load and capacity
7. Historical performance and reliability

## OUTPUT FORMAT:
Provide your response as a structured JSON with the following format:
```json
{{
    "final_ranking": [
        {{
            "rank": 1,
            "hospital_name": "Hospital Name",
            "hospital_id": "ID if available",
            "distance_km": 0.0,
            "ml_suitability_score": 0.0,
            "real_time_score": 0.0,
            "final_score": 0.0,
            "reasoning": "Detailed explanation for this ranking",
            "estimated_wait_time_minutes": 0,
            "bed_availability_status": "Available/Limited/Full",
            "icu_availability": "Available/Not Available",
            "specialist_match": "Perfect/Good/Fair/Poor",
            "risk_level": "Low/Medium/High"
        }}
    ],
    "critical_factors": [
        "Factor 1: explanation",
        "Factor 2: explanation"
    ],
    "recommendations": {{
        "primary_choice": "Hospital name and specific instructions",
        "backup_plan": "Alternative hospital and conditions for switching",
        "transport_notes": "Special transport considerations",
        "hospital_prep": "What the receiving hospital should prepare"
    }},
    "overall_assessment": "Summary of the situation and confidence in recommendation"
}}
```

Analyze carefully and provide the most clinically sound and operationally optimal ranking.
"""
        return prompt

    async def get_intelligent_hospital_ranking(self, 
                                             ml_rankings: List[Dict[str, Any]], 
                                             live_hospital_data: Dict[str, List[Dict[str, Any]]], 
                                             ambulance_location: Dict[str, float],
                                             patient_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get intelligent hospital ranking using Gemini LLM
        
        Args:
            ml_rankings: Rankings from the trained ML model
            live_hospital_data: Real-time data from hospital users
            ambulance_location: Current ambulance coordinates
            patient_info: Patient severity and location data
            
        Returns:
            Enhanced ranking with LLM analysis
        """
        # If Gemini service is not available, return fallback response
        if self.llm is None:
            return self._create_error_response(ml_rankings, "Gemini LLM service not available")
            
        try:
            # Create the prompt
            prompt = self.create_ranking_prompt(
                ml_rankings, 
                live_hospital_data, 
                ambulance_location, 
                patient_info
            )
            
            # Create the chat template
            chat_template = ChatPromptTemplate.from_messages([
                SystemMessage(content="You are an expert AI hospital allocation specialist. Analyze all provided data carefully and provide the most optimal hospital ranking for emergency patient care."),
                HumanMessage(content=prompt)
            ])
            
            # Get response from Gemini
            response = await self.llm.ainvoke(chat_template.format_messages())
            
            # Extract JSON from response
            response_text = response.content
            
            # Try to extract JSON from the response
            try:
                # Find JSON block in the response
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    result = json.loads(json_str)
                else:
                    # If no JSON found, create a structured response
                    result = self._create_fallback_response(ml_rankings, response_text)
                
                # Add metadata
                result['llm_response_raw'] = response_text
                result['analysis_timestamp'] = self._get_timestamp()
                result['model_used'] = 'gemini-pro'
                
                return result
                
            except json.JSONDecodeError as e:
                # If JSON parsing fails, create a fallback response
                print(f"JSON parsing error: {e}")
                return self._create_fallback_response(ml_rankings, response_text)
                
        except Exception as e:
            print(f"Error in Gemini ranking service: {e}")
            return self._create_error_response(ml_rankings, str(e))

    def _create_fallback_response(self, ml_rankings: List[Dict[str, Any]], llm_text: str) -> Dict[str, Any]:
        """Create a fallback response when LLM response can't be parsed"""
        
        # Use ML rankings as base and enhance with fallback logic
        enhanced_rankings = []
        for i, hospital in enumerate(ml_rankings):
            enhanced_rankings.append({
                "rank": i + 1,
                "hospital_name": hospital.get('hospital_name', f'Hospital {i+1}'),
                "hospital_id": hospital.get('hospital_id', 'unknown'),
                "distance_km": hospital.get('distance_km', 0),
                "ml_suitability_score": hospital.get('suitability_score', 0),
                "real_time_score": 0.8,  # Default score
                "final_score": hospital.get('suitability_score', 0) * 0.9,  # Slight adjustment
                "reasoning": f"ML model recommendation with fallback analysis. Distance: {hospital.get('distance_km', 0)}km, Predicted beds: {hospital.get('predicted_beds_available', 0)}",
                "estimated_wait_time_minutes": max(5, int(hospital.get('distance_km', 0) * 3)),
                "bed_availability_status": "Available" if hospital.get('predicted_beds_available', 0) > 5 else "Limited",
                "icu_availability": "Available",
                "specialist_match": "Good",
                "risk_level": "Medium"
            })
        
        return {
            "final_ranking": enhanced_rankings,
            "critical_factors": [
                "ML model predictions based on historical data",
                "Distance and accessibility",
                "Predicted bed availability"
            ],
            "recommendations": {
                "primary_choice": enhanced_rankings[0]['hospital_name'] if enhanced_rankings else "No hospitals available",
                "backup_plan": enhanced_rankings[1]['hospital_name'] if len(enhanced_rankings) > 1 else "Contact emergency services",
                "transport_notes": "Standard emergency transport protocol",
                "hospital_prep": "Standard emergency preparation"
            },
            "overall_assessment": "Recommendation based on ML model with fallback analysis",
            "llm_response_raw": llm_text,
            "analysis_timestamp": self._get_timestamp(),
            "model_used": 'gemini-pro-fallback',
            "note": "LLM response could not be parsed, using enhanced ML rankings"
        }

    def _create_error_response(self, ml_rankings: List[Dict[str, Any]], error_msg: str) -> Dict[str, Any]:
        """Create an error response when LLM service fails"""
        
        # Fall back to ML rankings with error indication
        basic_rankings = []
        for i, hospital in enumerate(ml_rankings):
            basic_rankings.append({
                "rank": i + 1,
                "hospital_name": hospital.get('hospital_name', f'Hospital {i+1}'),
                "hospital_id": hospital.get('hospital_id', 'unknown'),
                "distance_km": hospital.get('distance_km', 0),
                "ml_suitability_score": hospital.get('suitability_score', 0),
                "real_time_score": 0.5,  # Default score
                "final_score": hospital.get('suitability_score', 0),
                "reasoning": f"ML model recommendation (LLM analysis unavailable). Error: {error_msg}",
                "estimated_wait_time_minutes": max(5, int(hospital.get('distance_km', 0) * 3)),
                "bed_availability_status": "Unknown",
                "icu_availability": "Unknown",
                "specialist_match": "Unknown",
                "risk_level": "Medium"
            })
        
        return {
            "final_ranking": basic_rankings,
            "critical_factors": [
                f"LLM service error: {error_msg}",
                "Falling back to ML model predictions only"
            ],
            "recommendations": {
                "primary_choice": basic_rankings[0]['hospital_name'] if basic_rankings else "Contact emergency services",
                "backup_plan": "Manual verification of hospital availability recommended",
                "transport_notes": "Verify hospital capacity before transport",
                "hospital_prep": "Call ahead to confirm availability"
            },
            "overall_assessment": f"LLM analysis failed ({error_msg}). Recommendation based on ML model only.",
            "analysis_timestamp": self._get_timestamp(),
            "model_used": 'ml-model-only',
            "error": error_msg
        }

    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()

# Create a safe service instance
try:
    gemini_service = GeminiHospitalRankingService()
except Exception as e:
    print(f"Failed to create Gemini service: {e}")
    # Create a dummy service that always returns fallback responses
    class FallbackGeminiService:
        def __init__(self):
            self.llm = None
        
        async def get_intelligent_hospital_ranking(self, ml_rankings, live_hospital_data, ambulance_location, patient_info):
            return {
                "final_ranking": [
                    {
                        "rank": i + 1,
                        "hospital_name": hospital.get('hospital_name', f'Hospital {i+1}'),
                        "hospital_id": hospital.get('hospital_id', 'unknown'),
                        "distance_km": hospital.get('distance_km', 0),
                        "ml_suitability_score": hospital.get('suitability_score', 0),
                        "real_time_score": 0.7,
                        "final_score": hospital.get('suitability_score', 0),
                        "reasoning": f"ML model recommendation. Distance: {hospital.get('distance_km', 0)}km",
                        "estimated_wait_time_minutes": max(10, int(hospital.get('distance_km', 0) * 2)),
                        "bed_availability_status": "Available",
                        "icu_availability": "Available",
                        "specialist_match": "Good",
                        "risk_level": "Medium"
                    }
                    for i, hospital in enumerate(ml_rankings[:5])
                ],
                "critical_factors": ["ML model predictions", "Distance optimization"],
                "recommendations": {
                    "primary_choice": ml_rankings[0]['hospital_name'] if ml_rankings else "No hospitals",
                    "backup_plan": "Contact emergency services",
                    "transport_notes": "Standard transport",
                    "hospital_prep": "Standard preparation"
                },
                "overall_assessment": "Fallback mode - ML predictions only",
                "analysis_timestamp": __import__('datetime').datetime.now().isoformat(),
                "model_used": "fallback-service"
            }
    
    gemini_service = FallbackGeminiService()
