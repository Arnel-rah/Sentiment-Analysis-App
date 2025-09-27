from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import io
import os
from sentiment_model import analyze_single_review, analyze_csv_reviews
from pydantic import BaseModel
from typing import Dict
import tempfile
import logging

app = FastAPI(title="Sentiment Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SingleReviewRequest(BaseModel):
    review: str

class AnalysisResponse(BaseModel):
    stats: Dict
    analyzed_data: list
    csv_download: bool

@app.post("/analyze-single")
async def analyze_single(request: SingleReviewRequest):
    try:
        result = analyze_single_review(request.review)
        return result
    except Exception as e:
        logger.error(f"Error analyzing single review: {str(e)}")
        raise HTTPException(status_code=500, detail="Error analyzing review")

@app.post("/analyze-csv", response_model=AnalysisResponse)
async def analyze_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        analyzed_df = analyze_csv_reviews(tmp_path)
        
        total = len(analyzed_df)
        sentiments = analyzed_df['sentiment'].value_counts()
        pos_pct = (sentiments.get('POSITIVE', 0) / total * 100) if total > 0 else 0
        neg_pct = (sentiments.get('NEGATIVE', 0) / total * 100) if total > 0 else 0
        neu_pct = (sentiments.get('NEUTRAL', 0) / total * 100) if total > 0 else 0
        
        stats = {
            'total_reviews': total,
            'positive_pct': round(pos_pct, 2),
            'negative_pct': round(neg_pct, 2),
            'neutral_pct': round(neu_pct, 2),
            'sentiments_count': sentiments.to_dict()
        }
        
        csv_buffer = io.StringIO()
        analyzed_df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue().encode('utf-8')
        
        response = AnalysisResponse(
            stats=stats,
            analyzed_data=analyzed_df.to_dict('records'),
            csv_download=True
        )
        
        return StreamingResponse(
            io.BytesIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=analyzed_reviews.csv"}
        )
    except Exception as e:
        logger.error(f"Error processing CSV: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing CSV")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)