from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import httpx
import time
import models, database # We'll create database.py next

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Essential for React to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/run-test")
async def run_api_test(url: str, method: str, threshold: float = 500.0, db: Session = Depends(get_db)):
    start_time = time.perf_counter()
    
    try:
        async with httpx.AsyncClient() as client:
            # We use a 10s timeout to prevent the app from hanging
            response = await client.request(method.upper(), url, timeout=10.0)
            
        end_time = time.perf_counter()
        duration = (end_time - start_time) * 1000 # Convert to ms
        
        # Create DB record
        new_result = models.APITestResult(
            url=url,
            method=method.upper(),
            status_code=response.status_code,
            response_time_ms=round(duration, 2),
            threshold_ms=threshold,
            is_slow=duration > threshold
        )
        
        db.add(new_result)
        db.commit()
        db.refresh(new_result)
        
        return new_result

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Request failed: {str(e)}")

@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    # Returns last 50 tests for the dashboard visualization
    return db.query(models.APITestResult).order_by(models.APITestResult.timestamp.desc()).limit(50).all()