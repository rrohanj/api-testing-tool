from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import httpx
import time
import api.models as models  # Updated import path for Vercel
import api.database as database 

# Create tables if they don't exist (Note: SQLite is ephemeral on Vercel)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CHANGED TO GET: To match your frontend's request style shown in the screenshot
@app.get("/api/run-test")
async def run_api_test(
    url: str = Query(...), 
    method: str = "GET", 
    threshold: float = 500.0, 
    db: Session = Depends(get_db)
):
    start_time = time.perf_counter()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(method.upper(), url, timeout=10.0)
            
        end_time = time.perf_counter()
        duration = (end_time - start_time) * 1000 
        
        new_result = models.APITestResult(
            url=url,
            method=method.upper(),
            status_code=response.status_code,
            response_time_ms=round(duration, 2),
            threshold_ms=threshold,
            is_slow=duration > threshold
        )
        
        # In Vercel, this only saves to temporary memory
        db.add(new_result)
        db.commit()
        db.refresh(new_result)
        
        return new_result

    except Exception as e:
        # Returns a 200 with error info so the frontend doesn't crash
        return {"error": str(e), "status_code": 400}

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(models.APITestResult).order_by(models.APITestResult.timestamp.desc()).limit(50).all()