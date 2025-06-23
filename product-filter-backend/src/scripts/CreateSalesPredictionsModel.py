import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, accuracy_score
from sklearn.pipeline import Pipeline
import joblib
import warnings
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
np.random.seed(42)

class ProductSalesPredictor:
    def __init__(self, product_feed_path, sold_articles_path):
        """
        Initialize the sales predictor with paths to data files.
        Uses a Two-Part (Hurdle) Model to handle zero-inflation:
        1. Classification model: Will this product sell? (binary: 0 or >0)
        2. Regression model: If it sells, how much? (only on non-zero sales)
        
        Args:
            product_feed_path: Path to product_feed_hashed.csv
            sold_articles_path: Path to sold_articles_hashed.csv
        """
        self.product_feed_path = product_feed_path
        self.sold_articles_path = sold_articles_path
        
        # Two-part model components
        self.classification_model = None  # Predicts if sales > 0
        self.regression_model = None      # Predicts sales amount (for non-zero cases)
        self.classification_model_name = None
        self.regression_model_name = None
        
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
        
        return X, y
    
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
            X,                   # Original price
            X**2,                # Squared price (for non-linear relationships)
            np.log1p(X),         # Log of price (for exponential relationships)
            1/np.maximum(X, 0.1) # Inverse price (for inverse relationships)
        ])
        
        return X_enhanced
    
    def train_hurdle_model(self, X, y):
        """
        Train the Two-Part (Hurdle) Model for zero-inflation handling.
        
        Args:
            X: Features
            y: Target
            
        Returns:
            results: Dictionary with model performance
        """
        print("\n=== Training Two-Part (Hurdle) Model ===")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Part 1: Classification (Will it sell? Binary: 0 vs >0)
        print("\nPart 1: Training Classification Model (Will it sell?)")
        y_binary_train = (y_train > 0).astype(int)
        y_binary_test = (y_test > 0).astype(int)
        
        classification_models = {
            'Logistic Regression': LogisticRegression(random_state=42),
            'Random Forest Classifier': RandomForestClassifier(n_estimators=100, random_state=42)
        }
        
        best_clf_score = -np.inf
        for name, model in classification_models.items():
            pipeline = Pipeline([
                ('scaler', StandardScaler()),
                ('model', model)
            ])
            
            pipeline.fit(X_train, y_binary_train)
            y_pred_binary = pipeline.predict(X_test)
            accuracy = accuracy_score(y_binary_test, y_pred_binary)
            
            print(f"  {name}: Accuracy = {accuracy:.3f}")
            
            if accuracy > best_clf_score:
                best_clf_score = accuracy
                self.classification_model = pipeline
                self.classification_model_name = name
        
        print(f"Best Classification Model: {self.classification_model_name} (Accuracy: {best_clf_score:.3f})")
        
        # Part 2: Regression (How much will it sell? Only on non-zero sales)
        print("\nPart 2: Training Regression Model (How much will it sell?)")
        
        # Filter to only non-zero sales for regression training
        non_zero_mask_train = y_train > 0
        non_zero_mask_test = y_test > 0
        
        X_train_nonzero = X_train[non_zero_mask_train]
        y_train_nonzero = y_train[non_zero_mask_train]
        X_test_nonzero = X_test[non_zero_mask_test]
        y_test_nonzero = y_test[non_zero_mask_test]
        
        print(f"Training regression on {len(X_train_nonzero)} non-zero sales (out of {len(X_train)} total)")
        
        regression_models = {
            'Linear Regression': LinearRegression(),
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42)
        }
        
        best_reg_score = -np.inf
        
        for name, model in regression_models.items():
            pipeline = Pipeline([
                ('scaler', StandardScaler()),
                ('model', model)
            ])
            
            pipeline.fit(X_train_nonzero, y_train_nonzero)
            y_pred_nonzero = pipeline.predict(X_test_nonzero)
            
            # Calculate metrics only on non-zero sales
            mse = mean_squared_error(y_test_nonzero, y_pred_nonzero)
            rmse = np.sqrt(mse)
            mae = mean_absolute_error(y_test_nonzero, y_pred_nonzero)
            r2 = r2_score(y_test_nonzero, y_pred_nonzero)
            
            print(f"  {name}: RMSE = {rmse:.2f}, MAE = {mae:.2f}, R² = {r2:.3f}")
            
            if r2 > best_reg_score:
                best_reg_score = r2
                self.regression_model = pipeline
                self.regression_model_name = name
        
        print(f"Best Regression Model: {self.regression_model_name} (R²: {best_reg_score:.3f})")
        
        # Evaluate combined model performance
        print("\n=== Combined Two-Part Model Performance ===")
        
        # Get classification predictions (will it sell?)
        y_will_sell = self.classification_model.predict(X_test)
        
        # Get regression predictions (how much?)
        y_pred_amounts = self.regression_model.predict(X_test)
        
        # Combine predictions: if classified as "will sell", use regression amount, else 0
        y_pred_combined = np.where(y_will_sell, y_pred_amounts, 0)
        
        # Ensure non-negative predictions
        y_pred_combined = np.maximum(y_pred_combined, 0)
        
        # Calculate combined metrics
        combined_mse = mean_squared_error(y_test, y_pred_combined)
        combined_rmse = np.sqrt(combined_mse)
        combined_mae = mean_absolute_error(y_test, y_pred_combined)
        combined_r2 = r2_score(y_test, y_pred_combined)
        
        print(f"Combined Model Performance:")
        print(f"  RMSE: {combined_rmse:.2f}")
        print(f"  MAE: {combined_mae:.2f}")
        print(f"  R²: {combined_r2:.3f}")
        
        # Calculate predictions for non-zero cases only (for comparison)
        non_zero_predictions = y_pred_combined[non_zero_mask_test]
        non_zero_actual = y_test[non_zero_mask_test]
        
        if len(non_zero_predictions) > 0:
            nonzero_mae = mean_absolute_error(non_zero_actual, non_zero_predictions)
            nonzero_r2 = r2_score(non_zero_actual, non_zero_predictions)
            print(f"Performance on non-zero sales only:")
            print(f"  MAE: {nonzero_mae:.2f}")
            print(f"  R²: {nonzero_r2:.3f}")
    
    def fit(self):
        """Main method to load data, train models, and visualize results."""
        # Load and merge data
        data = self.load_and_merge_data()
        
        # Preprocess data
        X, y = self.preprocess_data(data)
        
        # Create enhanced features for non-linear models
        X_enhanced = self.create_features(X)
        
        print(f"\n=== Data Overview ===")
        print(f"Total products: {len(y)}")
        print(f"Products with sales > 0: {np.sum(y > 0)} ({np.sum(y > 0)/len(y)*100:.1f}%)")
        print(f"Products with 0 sales: {np.sum(y == 0)} ({np.sum(y == 0)/len(y)*100:.1f}%)")
        print(f"Average sales (all products): {np.mean(y):.2f}")
        print(f"Average sales (non-zero only): {np.mean(y[y > 0]):.2f}")
        
        # Train Two-Part (Hurdle) Model 
        print("\n" + "="*60)
        print("TRAINING TWO-PART (HURDLE) MODEL FOR ZERO-INFLATION HANDLING")
        print("="*60)
        self.train_hurdle_model(X_enhanced, y)
        
        print("\n" + "="*60)
        print("MODEL TRAINING COMPLETE")
        print("="*60)
        print("✅ Two-Part (Hurdle) Model trained successfully")
        print(f"   Zero-inflation rate: {np.sum(y == 0) / len(y):.1%}")
        
        return {
            'data_stats': {
                'total_products': len(y),
                'zero_sales_count': np.sum(y == 0),
                'non_zero_sales_count': np.sum(y > 0),
                'zero_inflation_rate': np.sum(y == 0) / len(y)
            }
        }
    
    def save_model(self, filepath='sales_prediction_model.pkl'):
        """Save the trained hurdle model."""
        
        # Check if models are trained
        if self.classification_model is None or self.regression_model is None:
            raise ValueError("No hurdle model available to save! Train the model first.")
        
        # Prepare model data
        model_data = {
            'price_range': self.price_range,
            'model_type': 'hurdle',
            'classification_model': self.classification_model,
            'regression_model': self.regression_model,
            'classification_model_name': self.classification_model_name,
            'regression_model_name': self.regression_model_name,
            'feature_type': 'enhanced' if (
                self.classification_model_name in ['Random Forest Classifier'] or 
                self.regression_model_name in ['Random Forest', 'Gradient Boosting']
            ) else 'simple'
        }
        
        joblib.dump(model_data, filepath)
        
        print(f"\nModel saved to {filepath}")
        print(f"  Classification: {self.classification_model_name}")
        print(f"  Regression: {self.regression_model_name}")


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
    
    # Save the hurdle model
    predictor.save_model('MLmodel/sales_prediction_model.pkl')
    
    print("\nModel training complete!")
    print("Files created:")
    print("  - sales_prediction_model.pkl (Two-Part Hurdle Model)")
    
    # Print summary
    print(f"\nModel Summary:")
    print(f"  Model type: Two-Part (Hurdle) Model")
    print(f"  Zero-inflation rate: {results['data_stats']['zero_inflation_rate']:.1%}")
    print(f"  Classification model: {predictor.classification_model_name}")
    print(f"  Regression model: {predictor.regression_model_name}")