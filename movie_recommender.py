import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer
from fuzzywuzzy import process
import pickle
import re
from datetime import datetime
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import warnings
from typing import Dict, List, Optional, Union

warnings.filterwarnings("ignore")

class MovieRecommender:
    def __init__(self, data_path: str = None, df: pd.DataFrame = None):
        """
        Enhanced movie recommendation system with MongoDB integration
        
        Args:
            data_path (str): Path to CSV file containing movie data (data/Movie_List.csv)
            df (DataFrame): Existing DataFrame with movie data
        """
        load_dotenv('.env')
        self._init_mongodb()
        
        if data_path:
            self.df = self._load_data(data_path)
        elif df is not None:
            self.df = df.copy()
        else:
            raise ValueError("Either data_path or df must be provided")

        self._preprocess_data()
        self._create_indices()
        self._vectorize_features()
        
        # Model metadata
        self.model_version = "2.1"
        self.created_at = datetime.now()

    def _init_mongodb(self):
        """Initialize MongoDB connection with error handling"""
        try:
            self.client = MongoClient(os.getenv("MONGO_URI"))
            self.db = self.client[os.getenv("DB_NAME")]
            self.user_ratings = self.db['user_ratings']
            self.user_history = self.db['user_history']
            print("✅ MongoDB connection established")
        except Exception as e:
            raise ConnectionError(f"❌ MongoDB connection failed: {str(e)}")

    def _load_data(self, data_path: str) -> pd.DataFrame:
        """Enhanced data loading with validation"""
        try:
            df = pd.read_csv(data_path, encoding='windows-1252')
            
            # Validate required columns
            required_columns = {'Movie_ID', 'Title', 'Year', 'Genre'}
            missing = required_columns - set(df.columns)
            if missing:
                raise ValueError(f"Missing required columns: {missing}")
                
            # Basic data validation
            if df.empty:
                raise ValueError("Dataset is empty")
                
            return df
            
        except Exception as e:
            raise ValueError(f"Data loading error: {str(e)}")

    def _preprocess_data(self):
        """Enhanced data preprocessing pipeline"""
        # Handle missing values
        self.df['Genre'] = self.df['Genre'].fillna('Unknown')
        
        # Clean text data
        self.df['Title'] = self.df['Title'].str.strip()
        self.df['Genre'] = self.df['Genre'].str.lower()
        
        # Advanced genre cleaning
        self.df['Genre'] = self.df['Genre'].apply(
            lambda x: re.sub(r'[^\w\s,]', '', x) if isinstance(x, str) else 'unknown'
        )
        
        # Create genre lists
        self.df['genre_list'] = self.df['Genre'].str.split(',').apply(
            lambda x: [g.strip() for g in x if g.strip()]
        )
        
        # Filter rare genres
        all_genres = [g for sublist in self.df['genre_list'] for g in sublist]
        genre_counts = pd.Series(all_genres).value_counts()
        common_genres = set(genre_counts[genre_counts >= 5].index)
        
        self.df['filtered_genres'] = self.df['genre_list'].apply(
            lambda x: [g for g in x if g in common_genres] or ['unknown']
        )
        
        # MultiLabelBinarizer for genres
        self.mlb = MultiLabelBinarizer()
        self.genre_matrix = self.mlb.fit_transform(self.df['filtered_genres'])
        self.genre_names = self.mlb.classes_
        
        # Create combined features (critical for recommendations)
        self.df['combined_features'] = (
            self.df['Title'] + ' ' +
            self.df['Year'].astype(str) + ' ' +
            self.df['Genre'].str.replace(',', ' ')
        )

    def _create_indices(self):
        """Create efficient lookup indices"""
        self.title_to_index = pd.Series(
            self.df.index,
            index=self.df['Title'].str.lower()
        ).drop_duplicates()
        
        self.index_to_movie = self.df[['Title', 'Year', 'Genre']].to_dict('index')

    def _vectorize_features(self):
        """Enhanced feature vectorization"""
        self.tfidf = TfidfVectorizer(
            stop_words='english',
            max_features=10000,
            ngram_range=(1, 2),
            min_df=3,
            max_df=0.8,
            analyzer='word'
        )
        self.tfidf_matrix = self.tfidf.fit_transform(self.df['combined_features'])

    def _get_movie_index(self, title: str) -> Optional[int]:
        """Improved fuzzy matching with better error handling"""
        if not isinstance(title, str) or not title.strip():
            return None

        title = title.lower().strip()
        
        # First try exact match
        if title in self.title_to_index:
            return self.title_to_index[title]
        
        try:
            # Use extractBests with higher threshold
            matches = process.extractBests(
                title,
                choices=self.df['Title'].str.lower().tolist(),
                score_cutoff=75,
                limit=3
            )
            return self.title_to_index[matches[0][0].lower()] if matches else None
        except Exception:
            return None

    def get_recommendations(self, title: str, method: str = 'hybrid', 
                          top_n: int = 10, diversity: float = 0.5) -> Dict:
        """
        Get movie recommendations with enhanced error handling
        
        Args:
            title: Movie title to get recommendations for
            method: 'content', 'genre', or 'hybrid'
            top_n: Number of recommendations to return
            diversity: Diversity factor (0-1)
            
        Returns:
            Dictionary with recommendations or error message
        """
        try:
            # Input validation
            if not isinstance(title, str) or len(title.strip()) < 2:
                return {'error': 'Title must be a string with at least 2 characters'}
                
            title = title.strip()
            
            # Get movie index
            idx = self._get_movie_index(title)
            if idx is None:
                matches = process.extractBests(
                    title,
                    choices=self.df['Title'].str.lower().tolist(),
                    score_cutoff=60,
                    limit=5
                )
                return {
                    'error': f"Movie '{title}' not found",
                    'suggestions': [m[0] for m in matches] if matches else []
                }

            # Compute similarities
            content_sim = cosine_similarity(
                self.tfidf.transform([self.df.iloc[idx]['combined_features']]),
                self.tfidf_matrix
            ).flatten()
            
            genre_sim = cosine_similarity(
                self.genre_matrix[idx:idx+1],
                self.genre_matrix
            ).flatten()
            
            # Combine based on method
            if method == 'content':
                sim_scores = content_sim
            elif method == 'genre':
                sim_scores = genre_sim
            else:
                sim_scores = 0.6 * content_sim + 0.4 * genre_sim  # Adjusted weights

            # Get top N recommendations with diversity
            valid_indices = np.where(sim_scores > 0.1)[0]  # Filter low scores
            valid_indices = valid_indices[valid_indices != idx]  # Remove self
            
            if len(valid_indices) == 0:
                return {'error': 'No similar movies found'}
                
            step = max(1, int(len(valid_indices) / top_n))
            selected_indices = valid_indices[::step][:top_n]

            # Prepare results
            recommendations = []
            for i in selected_indices:
                movie_data = self.index_to_movie[i]
                recommendations.append({
                    'title': movie_data['Title'],
                    'year': int(movie_data['Year']),
                    'genres': movie_data['Genre'],
                    'similarity_score': float(sim_scores[i])
                })
                
            return {'movies': recommendations}
            
        except Exception as e:
            return {'error': f'Recommendation failed: {str(e)}'}

    def save_model(self, filepath: str):
        """Save model with ALL required components"""
        model_data = {
            'tfidf': self.tfidf,
            'mlb': self.mlb,
            'genre_matrix': self.genre_matrix,
            'title_to_index': self.title_to_index,
            'index_to_movie': self.index_to_movie,
            'df': self.df[['Title', 'Year', 'Genre', 'combined_features']],
            'genre_names': self.genre_names,
            'tfidf_matrix': self.tfidf_matrix,  # Now including the matrix
            'model_version': '2.2',
            'timestamp': datetime.now()
        }
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f, protocol=pickle.HIGHEST_PROTOCOL)

    @classmethod
    def load_model(cls, filepath: str):
        """Properly implemented load_model class method"""
        try:
            if not os.path.exists(filepath):
                raise FileNotFoundError(f"Model file not found at {filepath}")
                
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            # Validate required components
            required_keys = {
                'tfidf', 'mlb', 'genre_matrix', 'title_to_index',
                'index_to_movie', 'df', 'genre_names', 'tfidf_matrix'
            }
            missing = required_keys - set(model_data.keys())
            if missing:
                raise ValueError(f"Model missing required data: {missing}")
                
            # Create instance without __init__
            instance = cls.__new__(cls)
            
            # Restore all attributes
            for key, value in model_data.items():
                setattr(instance, key, value)
                
            # Reinitialize MongoDB
            load_dotenv('.env')
            instance._init_mongodb()
            
            return instance
            
        except Exception as e:
            raise ValueError(f"Model loading failed: {str(e)}")
        
def train_and_save_model(data_path="data/Movie_List.csv", 
                        save_path="data/movie_recommender_production.pkl"):
    """Complete training pipeline"""
    print("🚀 Training model...")
    try:
        recommender = MovieRecommender(data_path)
        recommender.save_model(save_path)
        print(f"✅ Model saved to {save_path}")
        print(f"📊 Contains {len(recommender.df)} movies")
        
        # Test the model
        test_result = recommender.get_recommendations("Dilwale Dulhania Le Jayenge")
        print("🧪 Test recommendation:", test_result)
        
        return recommender
    except Exception as e:
        print(f"❌ Training failed: {str(e)}")
        raise
if __name__ == "__main__":
    train_and_save_model()