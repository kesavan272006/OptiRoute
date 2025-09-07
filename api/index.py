# api/index.py

import sys
import os
from mangum import Mangum
# Ensure Python can find the backend folder
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

# Import the FastAPI app from backend/main.py
from backend.main import app

# Vercel needs a "handler" object to run the FastAPI app
handler = Mangum(app)
