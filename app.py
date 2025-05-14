from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from movie_recommender import MovieRecommender
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import pickle
from datetime import datetime

load_dotenv('.env')

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "fallback-secret-key")

# Initialize MongoDB
try:
    client = MongoClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("DB_NAME")]
    user_ratings = db['user_ratings']
    user_history = db['user_history']
    print("✅ MongoDB connected successfully")
except Exception as e:
    print(f"❌ MongoDB connection failed: {str(e)}")
    raise

# Load Recommendation Model with enhanced validation
# [Your existing imports...]

# Load Recommendation Model
try:
    # Make sure you're importing from the correct module
    from movie_recommender import MovieRecommender
    
    # Verify the class has load_model method
    if not hasattr(MovieRecommender, 'load_model'):
        raise AttributeError("MovieRecommender class is missing load_model method")
    
    recommender = MovieRecommender.load_model('data/movie_recommender_production.pkl')
    print("✅ Model loaded successfully")
    
    # Test the loaded model
    test_result = recommender.get_recommendations("Dilwale Dulhania Le Jayenge")
    print("Test recommendation result:", test_result)
    
except Exception as e:
    print(f"❌ Model loading failed: {str(e)}")
    raise

# [Rest of your app.py remains the same...]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        # Ensure JSON data is received
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data received'}), 400

        title = data.get('title', '').strip()
        method = data.get('method', 'hybrid').strip().lower()

        if not title:
            return jsonify({'error': 'Title is required'}), 400

        # Log the search
        user_history.insert_one({
            'query': title,
            'method': method,
            'timestamp': datetime.now()
        })

        # Get recommendations
        results = recommender.get_recommendations(title, method=method)
        
        if 'error' in results:
            return jsonify(results), 200  # Changed to 200 to allow frontend handling
            
        return jsonify(results)

    except Exception as e:
        print(f"Error in recommendation: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)