from fastapi import FastAPI
from fastapi.responses import JSONResponse
from mangum import Mangum  # converts FastAPI to serverless handler

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Backend is running on Vercel!"}

@app.get("/hello")
async def hello(name: str = "world"):
    return JSONResponse(content={"message": f"Hello, {name}!"})

# Vercel expects a handler
handler = Mangum(app)
