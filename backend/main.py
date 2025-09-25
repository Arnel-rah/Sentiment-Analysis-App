from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import io
from sentiment_model import analyze_single_review, analyze_csv_reviews
import tempfile

app = FastAPI(title="API Analyse Sentiments")

# CORS pour Next.js (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-single")
async def analyze_single(review: str = Form(...)):
    """Analyse un seul avis."""
    result = analyze_single_review(review)
    return result

@app.post("/analyze-csv")
async def analyze_csv(file: UploadFile = File(...)):
    """Upload et analyse CSV, retourne JSON + CSV téléchargeable."""
    # Sauvegarde temporaire du fichier
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        analyzed_df = analyze_csv_reviews(tmp_path)
        
        # Stats pour le dashboard
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
        
        # Convertir en CSV pour export
        csv_buffer = io.StringIO()
        analyzed_df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue().encode('utf-8')
        
        return {
            'stats': stats,
            'analyzed_data': analyzed_df.to_dict('records'),  # Pour affichage
            'csv_download': True  # Frontend gérera le download
        }
    finally:
        import os
        os.unlink(tmp_path)  # Nettoyage

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)