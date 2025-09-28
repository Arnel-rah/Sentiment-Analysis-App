from transformers import pipeline
import pandas as pd
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """Classe pour analyser les sentiments des avis."""
    
    def __init__(self, model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"):
        """
        Initialise l'analyseur de sentiment.
        
        Args:
            model_name: Nom du modèle HuggingFace à utiliser
        """
        try:
            self.pipeline = pipeline(
                "sentiment-analysis", 
                model=model_name,
                truncation=True
            )
            logger.info(f"Modèle {model_name} chargé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle: {e}")
            raise
    
    def analyze_single_review(self, review: str, confidence_threshold: float = 0.7) -> Dict[str, str]:
        """
        Analyse un seul avis.
        
        Args:
            review: Texte de l'avis à analyser
            confidence_threshold: Seuil de confiance pour le sentiment neutre
            
        Returns:
            Dict contenant le sentiment, la confiance et l'avis original
        """
        if not review or not isinstance(review, str):
            logger.warning("Avis vide ou non texte fourni")
            return {
                'sentiment': 'NEUTRAL', 
                'confidence': 0.0, 
                'review': review
            }
        
        try:
            result = self.pipeline(review[:512])[0]
            label = result['label'].lower()
            score = result['score']
            if score < confidence_threshold:
                label = 'NEUTRAL'
                
            return {
                'sentiment': label, 
                'confidence': score, 
                'review': review
            }
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de l'avis: {e}")
            return {
                'sentiment': 'NEUTRAL', 
                'confidence': 0.0, 
                'review': review
            }
    
    def analyze_csv_reviews(self, file_path: str, review_column: str = 'review') -> pd.DataFrame:
        """
        Analyse un CSV d'avis.
        
        Args:
            file_path: Chemin vers le fichier CSV
            review_column: Nom de la colonne contenant les avis
            
        Returns:
            DataFrame avec les résultats de l'analyse
        """
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Fichier {file_path} chargé avec {len(df)} lignes")
        except FileNotFoundError:
            logger.error(f"Fichier {file_path} non trouvé")
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la lecture du CSV: {e}")
            raise
        
        if review_column not in df.columns:
            raise ValueError(f"Le CSV doit avoir une colonne '{review_column}'")
        
        results = []
        for index, row in df.iterrows():
            if index % 100 == 0:
                logger.info(f"Traitement de l'avis {index + 1}/{len(df)}")
                
            analysis = self.analyze_single_review(str(row[review_column]))
            results.append({
                'original_review': row[review_column],
                'sentiment': analysis['sentiment'],
                'confidence': analysis['confidence']
            })
        
        analyzed_df = pd.DataFrame(results)
        logger.info(f"Analyse terminée: {len(analyzed_df)} avis traités")
        return analyzed_df
sentiment_analyzer = SentimentAnalyzer()

def analyze_single_review(review: str) -> Dict[str, str]:
    """Analyse un seul avis (fonction legacy)."""
    return sentiment_analyzer.analyze_single_review(review)

def analyze_csv_reviews(file_path: str) -> pd.DataFrame:
    """Analyse un CSV d'avis (fonction legacy)."""
    return sentiment_analyzer.analyze_csv_reviews(file_path)

if __name__ == "__main__":
    review = "This product is amazing!"
    result = sentiment_analyzer.analyze_single_review(review)
    print(f"Résultat: {result}")
    