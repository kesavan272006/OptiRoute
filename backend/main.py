from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from hospital_allocation.routes import router as hospital_router
from shelter_allocation.routes import router as shelter_router
# Dynamically import waste-optimizer.routes as waste_optimizer_router
try:
    import sys
    import importlib.util
    import os
    waste_optimizer_path = os.path.join(os.path.dirname(__file__), 'waste-optimizer')
    if waste_optimizer_path not in sys.path:
        sys.path.insert(0, waste_optimizer_path)
    spec = importlib.util.spec_from_file_location("waste_optimizer.routes", os.path.join(waste_optimizer_path, "routes.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    waste_optimizer_router = module.router
    waste_optimizer_enabled = True
except Exception as e:
    print(f"⚠️ Could not load waste optimizer: {e}")
    waste_optimizer_router = None
    waste_optimizer_enabled = False

# Create the main FastAPI application instance
app = FastAPI(
    title="Food & Supply Chain Optimizer API",
    description="API for optimizing food distribution and reducing waste.",
    version="1.0.0"
)

# CORS setup for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the hospital allocation router with a clear prefix
app.include_router(hospital_router, prefix="/hospital", tags=["HospitalAllocation"])

# Include the waste optimizer router if available
if waste_optimizer_enabled and waste_optimizer_router:
    app.include_router(waste_optimizer_router, prefix="/waste-optimizer", tags=["WasteOptimizer"])
    print("✅ Waste optimizer routes enabled")
else:
    print("⚠️ Waste optimizer routes disabled due to import errors")

app.include_router(shelter_router, prefix="/shelter", tags=["ShelterAllocation"])

@app.get("/")
def root():
    return {"message": "Food & Supply Chain Optimizer API is running successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)