from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict

class RecommendationService:
    
    @staticmethod
    def get_ml_recommendations(current_article: Dict, all_articles: List[Dict], limit: int = 5) -> List[Dict]:
        if len(all_articles) < 2:
            return []
        
        current_text = f"{current_article['title']} {current_article['content']} {' '.join(current_article.get('keywords', []))}"
        
        articles_data = []
        for article in all_articles:
            if article['id'] != current_article['id']:
                text = f"{article['title']} {article['content']} {' '.join(article.get('keywords', []))}"
                articles_data.append({
                    'id': article['id'],
                    'title': article['title'],
                    'author': article['author'],
                    'publication': article['publication'],
                    'text': text
                })
        
        if not articles_data:
            return []
        
        all_texts = [current_text] + [a['text'] for a in articles_data]
        
        vectorizer = TfidfVectorizer(stop_words='english', max_features=50, min_df=1)
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        print(f"Similarities: {similarities}")
        
        top_indices = similarities.argsort()[-limit:][::-1]
        
        recommendations = []
        for idx in top_indices:
            if similarities[idx] > 0.01:
                article = articles_data[idx]
                recommendations.append({
                    'id': article['id'],
                    'title': article['title'],
                    'author': article['author'],
                    'publication': article['publication'],
                    'similarity': float(similarities[idx])
                })
        
        return recommendations
