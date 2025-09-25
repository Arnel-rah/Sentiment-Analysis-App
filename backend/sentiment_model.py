from transformers import pipeline
import pandas as pd
from typing import List, Dict

sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

def analyze_single_review(review: str) -> Dict[str, str]:
    """Analyse un seul avis."""
    result = sentiment_pipeline(review)[0]
    label = result['label'].lower()
    score = result['score']
    if score < 0.7:
        label = 'NEUTRAL'
    return {'sentiment': label, 'confidence': score, 'review': review}

def analyze_csv_reviews(file_path: str) -> pd.DataFrame:
    """Analyse un CSV d'avis (colonne 'review' attendue)."""
    df = pd.read_csv(file_path)
    if 'review' not in df.columns:
        raise ValueError("Le CSV doit avoir une colonne 'review'")
    
    results = []
    for _, row in df.iterrows():
        analysis = analyze_single_review(row['review'])
        results.append({
            'original_review': row['review'],
            'sentiment': analysis['sentiment'],
            'confidence': analysis['confidence']
        })
    
    analyzed_df = pd.DataFrame(results)
    return analyzed_df