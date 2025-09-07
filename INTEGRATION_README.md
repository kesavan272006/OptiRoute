# OptiRoute: Complete Backend-Frontend Integration

## 🚀 Overview

This project now has **complete integration** between the backend APIs and frontend components with **CORS properly configured**. All endpoints are connected and functional across three main modules:

1. **Hospital Resource Allocation** (`/hospital`)
2. **Hunger & Waste Optimizer** (`/waste-optimizer`) 
3. **Smart Shelter Allocation** (`/shelter`)

## 🏗️ Architecture

### Backend Structure
```
backend/
├── main.py                    # FastAPI main server with CORS setup
├── hospital_allocation/
│   ├── routes.py              # Hospital & doctor management, AI predictions
│   └── gemini_service.py      # Gemini LLM integration
├── waste-optimizer/
│   └── routes.py              # Food distribution & waste reduction AI
├── shelter_allocation/
│   └── routes.py              # Shelter allocation with ML & blockchain
└── blockchain/
    └── contract_abi.json      # Blockchain integration
```

### Frontend Structure
```
frontend/src/
├── services/
│   └── api.js                 # Complete API integration layer
├── pages/
│   ├── HospitalResourceOptimizer.jsx  # Hospital management UI
│   ├── HungerWasteOptimizer.jsx       # Food distribution UI
│   └── SmartShelterAllocation.jsx     # Shelter allocation UI
└── components/shared/         # Reusable components
```

## 🔗 CORS Configuration

CORS is configured in `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],          # Allows all HTTP methods
    allow_headers=["*"],          # Allows all headers
)
```

**Frontend Dev Server**: `http://localhost:5173`
**Backend API Server**: `http://localhost:8000`

## 🏥 Hospital Resource Allocation

### Backend Endpoints (`/hospital`)

#### Dashboard Analytics
- `GET /hospital/dashboard/stats` - System statistics
- `GET /hospital/dashboard/occupancy-trends` - 24h occupancy data
- `GET /hospital/dashboard/specialty-distribution` - Doctor specialties

#### Hospital Management
- `POST /hospital/hospitals` - Create hospital
- `GET /hospital/hospitals` - List all hospitals
- `GET /hospital/hospitals/{id}` - Get hospital details
- `PUT /hospital/hospitals/{id}` - Update hospital
- `DELETE /hospital/hospitals/{id}` - Delete hospital

#### Doctor Management
- `POST /hospital/doctors` - Create doctor
- `GET /hospital/doctors` - List all doctors
- `GET /hospital/doctors/{id}` - Get doctor details
- `GET /hospital/doctors/hospital/{hospital_id}` - Doctors by hospital
- `PUT /hospital/doctors/{id}/availability` - Update availability
- `PUT /hospital/doctors/{id}/status` - Update status

#### Patient Management
- `POST /hospital/patients` - Create patient
- `GET /hospital/patients` - List all patients
- `GET /hospital/patients/{id}` - Get patient details

#### AI Hospital Finding
- `POST /hospital/find_hospital` - Basic ML hospital recommendations
- `POST /hospital/find_hospital_intelligent` - **Enhanced AI with Gemini LLM**

### Frontend Integration

**Component**: `HospitalResourceOptimizer.jsx`

**Features**:
- ✅ Real-time dashboard with API data
- ✅ Interactive charts from backend analytics
- ✅ Hospital finder with **dual modes**:
  - Basic ML model predictions
  - **Intelligent mode with Gemini LLM analysis**
- ✅ Complete CRUD operations for hospitals/doctors/patients
- ✅ Live bed occupancy tracking
- ✅ Emergency case management

**AI Modes**:
1. **Basic Mode**: Uses ML models for hospital suitability scoring
2. **Intelligent Mode**: Combines ML + live data + **Gemini LLM reasoning**

## 🍽️ Hunger & Waste Optimizer

### Backend Endpoints (`/waste-optimizer`)

#### Data Management
- `GET /waste-optimizer/inventory` - Current food inventory
- `GET /waste-optimizer/demand` - Community food demands
- `GET /waste-optimizer/logistics` - Available vehicles
- `GET /waste-optimizer/storage` - Storage facilities
- `GET /waste-optimizer/farmers` - Farmer information
- `GET /waste-optimizer/system_status` - System health

#### Dashboard Analytics
- `GET /waste-optimizer/dashboard/stats` - Key metrics
- `GET /waste-optimizer/dashboard/inventory-flow` - Weekly flow data
- `GET /waste-optimizer/dashboard/network-status` - Food bank status
- `GET /waste-optimizer/dashboard/waste-reduction` - Waste reduction metrics

#### AI Plan Generation
- `POST /waste-optimizer/generate_plan` - **AI-powered allocation planning**

### Frontend Integration

**Component**: `HungerWasteOptimizer.jsx`

**Features**:
- ✅ Real-time inventory and demand tracking
- ✅ Interactive food distribution charts
- ✅ **AI-powered allocation plan generation**
- ✅ Waste reduction analytics
- ✅ Role-based forms (farmer, warehouse manager, logistics)
- ✅ Multi-modal logistics optimization
- ✅ Environmental impact calculations

**AI Features**:
- **Gemini-powered allocation agent** with contextual reasoning
- Smart matching of surplus to demand
- Perishability-aware routing
- Economic and environmental optimization

## 🏠 Smart Shelter Allocation

### Backend Endpoints (`/shelter`)

#### Core Functions
- `POST /shelter/allocate` - **AI shelter allocation with blockchain recording**
- `GET /shelter/allocation/{applicant_id}` - Get allocation details
- `POST /shelter/test-prediction` - Test vulnerability assessment
- `GET /shelter/stats` - System statistics
- `GET /shelter/model-status` - ML model status

### Frontend Integration

**Component**: `SmartShelterAllocation.jsx`

**Features**:
- ✅ **AI vulnerability assessment** with ML scoring
- ✅ **Blockchain-verified allocations**
- ✅ Interactive priority-based allocation
- ✅ Real-time housing availability tracking
- ✅ Comprehensive applicant evaluation
- ✅ Multiple assessment factors:
  - Poverty level
  - Unemployment duration
  - Family size
  - Special circumstances
  - Vulnerability scoring

**AI Features**:
- **Random Forest ML model** for vulnerability prediction
- **Fallback scoring system** when ML unavailable
- Priority classification (CRITICAL, HIGH, MEDIUM, LOW)
- **Blockchain transparency** for all allocations

## 🔧 API Integration Layer

**File**: `frontend/src/services/api.js`

**Features**:
- ✅ Complete API coverage for all endpoints
- ✅ Error handling and loading states
- ✅ CORS-compatible requests
- ✅ TypeScript-like JSDoc comments
- ✅ Modular API organization:
  - `hospitalAPI` - Hospital resource management
  - `wasteOptimizerAPI` - Food distribution & waste
  - `shelterAPI` - Shelter allocation
  - `ngoAPI` - NGO management

## 🧪 Testing the Integration

### Prerequisites
```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py  # Starts on http://localhost:8000

# Frontend
cd frontend  
npm install
npm run dev     # Starts on http://localhost:5173
```

### Automated Testing
```bash
# Install test dependencies
npm install node-fetch

# Run connection tests
node test-connections.js
```

### Manual Testing
1. **Open frontend**: `http://localhost:5173`
2. **Navigate to each page**:
   - Hospital Resource Optimizer
   - Hunger Waste Optimizer  
   - Smart Shelter Allocation
3. **Test key features**:
   - Data loading from APIs
   - Interactive forms and dialogs
   - AI-powered features
   - Real-time updates

## 🌟 Key Features Implemented

### 🏥 Hospital Module
- **Dual-mode AI hospital finder** (ML + Gemini LLM)
- Real-time bed availability tracking
- Doctor scheduling and management
- Emergency case prioritization
- Comprehensive analytics dashboard

### 🍽️ Waste Optimizer Module
- **AI allocation agent** with contextual reasoning
- Multi-stakeholder role management
- Perishability-aware logistics
- Environmental impact tracking
- Economic optimization

### 🏠 Shelter Module  
- **ML vulnerability assessment**
- **Blockchain-verified allocations**
- Priority-based housing assignment
- Special circumstances handling
- Transparent allocation history

## 🚨 Important Notes

1. **CORS is configured** to allow all origins (`allow_origins=["*"]`)
2. **All endpoints are tested** and functional
3. **Error handling** is implemented throughout
4. **Loading states** provide user feedback
5. **Real-time data** updates from backend APIs

## 🔮 AI/ML Features Summary

- **Hospital AI**: ML suitability scoring + Gemini LLM analysis
- **Waste AI**: Multi-agent food distribution optimization
- **Shelter AI**: Random Forest vulnerability prediction + blockchain verification

## 📊 Dashboard Features

Each module includes:
- Real-time statistics and KPIs
- Interactive charts and data visualization
- Historical trend analysis
- Role-based data filtering
- Export and reporting capabilities

---

**🎉 Integration Complete!** All backend endpoints are now properly connected to their respective frontend components with CORS enabled for seamless communication.
