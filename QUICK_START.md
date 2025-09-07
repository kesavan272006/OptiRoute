# OptiRoute - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Backend Server
```bash
cd backend
pip install -r requirements.txt
python main.py
```
**Backend will run on:** `http://localhost:8000`

### 2. Start the Frontend Server
```bash
cd frontend
npm install
npm run dev
```
**Frontend will run on:** `http://localhost:5173`

## 🧪 Testing the Integration

### Option 1: Automated Test
```bash
# From project root
node test-connections.js
```

### Option 2: Manual Testing
1. **Open browser**: Go to `http://localhost:5173`
2. **Test each module**:
   - **Hospital Resource Optimizer**: Click "Find Hospital for Patient"
   - **Hunger Waste Optimizer**: Click "Generate AI Plan" 
   - **Smart Shelter Allocation**: Click "Allocate Shelter"

## 🔧 Troubleshooting

### If you see 500 errors:

1. **Check backend logs** - Look for error messages in the terminal where you ran `python main.py`

2. **Missing dependencies**:
   ```bash
   cd backend
   pip install --upgrade langchain-google-genai langchain-core
   ```

3. **Gemini API issues**: The system will work in fallback mode if Gemini is unavailable

4. **CORS issues**: Already configured - should work automatically

5. **Port conflicts**: 
   - Backend uses port 8000
   - Frontend uses port 5173
   - Make sure no other services are using these ports

## 📊 What Should Work

✅ **Hospital Finder**: Both basic and intelligent modes  
✅ **Waste Optimizer**: AI plan generation  
✅ **Shelter Allocation**: Vulnerability assessment  
✅ **Real-time dashboards**: All charts and data  
✅ **CRUD operations**: Creating hospitals, doctors, patients  

## 🚨 Known Issues & Solutions

**Issue**: 500 error on intelligent hospital search  
**Solution**: System falls back to ML-only mode - still functional

**Issue**: Empty charts  
**Solution**: Backend might not be running - check `http://localhost:8000`

**Issue**: CORS errors  
**Solution**: Already configured - restart backend if needed

## 📋 API Endpoints

**Backend API**: `http://localhost:8000`
- Root: `GET /` - Server status
- Hospital: `/hospital/*` - All hospital endpoints  
- Waste: `/waste-optimizer/*` - Food distribution
- Shelter: `/shelter/*` - Housing allocation

**Swagger UI**: `http://localhost:8000/docs` - Interactive API documentation

---

**🎉 Everything should work out of the box with CORS properly configured!**
