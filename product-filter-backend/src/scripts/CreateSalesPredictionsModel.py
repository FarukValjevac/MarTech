import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.pipeline import Pipeline
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
np.random.seed(42)

class ProductSalesPredictor:
    def __init__(self, product_feed_path, sold_articles_path):
        """
        Initialize the sales predictor with paths to data files.
        
        Args:
            product_feed_path: Path to product_feed_hashed.csv
            sold_articles_path: Path to sold_articles_hashed.csv
        """
        self.product_feed_path = product_feed_path
        self.sold_articles_path = sold_articles_path
        self.best_model = None
        self.best_model_name = None
        self.scaler = StandardScaler()
        
    def load_and_merge_data(self):
        """Load and merge the two CSV files on the product column."""
        print("Loading data...")
        
        # Load the data
        product_feed = pd.read_csv(self.product_feed_path)
        sold_articles = pd.read_csv(self.sold_articles_path)
        
        print(f"Product feed shape: {product_feed.shape}")
        print(f"Sold articles shape: {sold_articles.shape}")
        
        # Merge on product column
        merged_data = pd.merge(product_feed, sold_articles, on='product', how='inner')
        
        print(f"Merged data shape: {merged_data.shape}")
        print(f"Columns: {merged_data.columns.tolist()}")
        
        # Basic data validation
        if merged_data.empty:
            raise ValueError("No matching products found between the two files!")
        
        return merged_data
    
    def preprocess_data(self, data):
        """
        Preprocess the data for ML modeling.
        
        Args:
            data: Merged dataframe
            
        Returns:
            X: Features (db/price)
            y: Target (sold quantity)
        """
        print("\nPreprocessing data...")
        
        # Handle missing values
        data = data.dropna()
        
        # Extract features and target
        X = data[['db']].values  # Price/margin as feature
        y = data['sold'].values   # Sales quantity as target
        
        # Store the price range for later use in predictions
        self.price_range = (np.min(X), np.max(X))
        
        # Basic statistics
        print(f"\nPrice (db) statistics:")
        print(f"  Mean: {np.mean(X):.2f}")
        print(f"  Std: {np.std(X):.2f}")
        print(f"  Min: {np.min(X):.2f}")
        print(f"  Max: {np.max(X):.2f}")
        print(f"  Training price range: [{self.price_range[0]:.2f}, {self.price_range[1]:.2f}]")
        
        print(f"\nSales (sold) statistics:")
        print(f"  Mean: {np.mean(y):.2f}")
        print(f"  Std: {np.std(y):.2f}")
        print(f"  Min: {np.min(y):.0f}")
        print(f"  Max: {np.max(y):.0f}")
        
        return X, y, data
    
    def create_features(self, X):
        """
        Create additional features for better prediction.
        
        Args:
            X: Original features
            
        Returns:
            X_enhanced: Enhanced feature set
        """
        # Add polynomial features
        X_enhanced = np.column_stack([
            X,                    # Original price
            X**2,                # Squared price (for non-linear relationships)
            np.log1p(X),         # Log of price (for exponential relationships)
            1/np.maximum(X, 0.1) # Inverse price (for inverse relationships)
        ])
        
        return X_enhanced
    
    def train_models(self, X, y):
        """
        Train multiple models and select the best one.
        
        Args:
            X: Features
            y: Target
            
        Returns:
            results: Dictionary with model performance
        """
        print("\nTraining models...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Define models to test
        models = {
            'Linear Regression': LinearRegression(),
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42)
        }
        
        results = {}
        best_score = -np.inf
        
        for name, model in models.items():
            # Create pipeline with scaling
            pipeline = Pipeline([
                ('scaler', StandardScaler()),
                ('model', model)
            ])
            
            # Train model
            pipeline.fit(X_train, y_train)
            
            # Make predictions
            y_pred = pipeline.predict(X_test)
            
            # Calculate metrics
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            # Cross-validation score
            cv_scores = cross_val_score(pipeline, X, y, cv=5, 
                                      scoring='neg_mean_squared_error')
            cv_rmse = np.sqrt(-cv_scores.mean())
            
            results[name] = {
                'model': pipeline,
                'rmse': rmse,
                'mae': mae,
                'r2': r2,
                'cv_rmse': cv_rmse,
                'predictions': y_pred,
                'y_test': y_test
            }
            
            print(f"\n{name}:")
            print(f"  RMSE: {rmse:.2f}")
            print(f"  MAE: {mae:.2f}")
            print(f"  R²: {r2:.3f}")
            print(f"  CV RMSE: {cv_rmse:.2f}")
            
            # Track best model
            if r2 > best_score:
                best_score = r2
                self.best_model = pipeline
                self.best_model_name = name
        
        print(f"\nBest model: {self.best_model_name} with R² = {best_score:.3f}")
        
        return results, X_train, X_test, y_train, y_test
    

    
    def predict_sales(self, prices):
        """
        Predict sales for given prices.
        
        Args:
            prices: Array of prices (db values)
            
        Returns:
            predictions: Predicted sales volumes
        """
        if self.best_model is None:
            raise ValueError("Model not trained yet! Call fit() first.")
        
        # Ensure prices is 2D array
        if len(prices.shape) == 1:
            prices = prices.reshape(-1, 1)
        
        min_price, max_price = self.price_range
        print(f"Training price range: [{min_price:.2f}, {max_price:.2f}]")
        
        # Create enhanced features if using non-linear model
        if self.best_model_name in ['Random Forest', 'Gradient Boosting']:
            prices_for_model = self.create_features(prices)
        else:
            prices_for_model = prices
        
        # Make predictions
        predictions = self.best_model.predict(prices_for_model)
        
        # Ensure non-negative predictions
        predictions = np.maximum(predictions, 0)
        
        return predictions
    
    def fit(self):
        """Main method to load data, train models, and visualize results."""
        # Load and merge data
        data = self.load_and_merge_data()
        
        # Preprocess data
        X, y, processed_data = self.preprocess_data(data)
        
        # Create enhanced features for non-linear models
        X_enhanced = self.create_features(X)
        
        # Train models with both simple and enhanced features
        print("\n=== Testing with simple features (price only) ===")
        results_simple, _, _, _, _ = self.train_models(X, y)
        
        print("\n=== Testing with enhanced features ===")
        results_enhanced, X_train, X_test, y_train, y_test = self.train_models(X_enhanced, y)
        
        # Use the better results
        if max(r['r2'] for r in results_enhanced.values()) > max(r['r2'] for r in results_simple.values()):
            results = results_enhanced
            print("\nUsing enhanced features for final model")
        else:
            results = results_simple
            print("\nUsing simple features for final model")

        
        return results
    
    def save_model(self, filepath='sales_prediction_model.pkl'):
        """Save the trained model."""
        import joblib
        
        if self.best_model is None:
            raise ValueError("No model to save! Train the model first.")
        
        model_data = {
            'model': self.best_model,
            'model_name': self.best_model_name,
            'feature_type': 'enhanced' if self.best_model_name in ['Random Forest', 'Gradient Boosting'] else 'simple',
            'price_range': self.price_range  # Save the training data price range
        }
        
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    


# Example usage
if __name__ == "__main__":
    print("Training sales prediction model...")
    
    # Initialize predictor
    predictor = ProductSalesPredictor(
        product_feed_path='../data/product_feed_hashed.csv',
        sold_articles_path='../data/sold_articles_hashed.csv'
    )
    
    # Train models
    results = predictor.fit()
    
    # Save the model
    predictor.save_model('data/sales_prediction_model.pkl')
    
    print("\nModel training complete!")
    print("Files created:")
    print("  - sales_prediction_model.pkl (trained model)")
