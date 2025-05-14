from movie_recommender import train_and_save_model

# Configure these paths
DATA_PATH = "data/movie_List.csv"  # Update this
MODEL_PATH = "data/movie_recommender_production.pkl"  # Model save location

if __name__ == "__main__":
    print("🚀 Starting model training...")
    train_and_save_model(DATA_PATH, MODEL_PATH)
    print("✅ Training completed successfully")