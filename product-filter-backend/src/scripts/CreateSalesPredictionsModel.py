import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, accuracy_score, classification_report
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
        
        # Legacy single model (for comparison)
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
        regression_results = {}
        
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
            
            regression_results[name] = {
                'model': pipeline,
                'rmse': rmse,
                'mae': mae,
                'r2': r2
            }
            
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
        
        return {
            'classification_results': {
                'best_model': self.classification_model,
                'best_model_name': self.classification_model_name,
                'accuracy': best_clf_score
            },
            'regression_results': regression_results,
            'combined_performance': {
                'rmse': combined_rmse,
                'mae': combined_mae,
                'r2': combined_r2,
                'predictions': y_pred_combined,
                'y_test': y_test
            }
        }
    
    def predict_sales(self, prices):
        """
        Predict sales for given prices using Two-Part (Hurdle) Model.
        
        Args:
            prices: Array of prices (db values)
            
        Returns:
            predictions: Predicted sales volumes
        """
        # Use Two-Part model if available, otherwise fall back to single model
        if self.classification_model is not None and self.regression_model is not None:
            return self._predict_hurdle_model(prices)
        elif self.best_model is not None:
            return self._predict_single_model(prices)
        else:
            raise ValueError("No model trained yet! Call fit() first.")
    
    def _predict_hurdle_model(self, prices):
        """Predict using Two-Part (Hurdle) Model."""
        # Ensure prices is 2D array
        if len(prices.shape) == 1:
            prices = prices.reshape(-1, 1)
        
        min_price, max_price = self.price_range
        print(f"Using Two-Part Model - Training price range: [{min_price:.2f}, {max_price:.2f}]")
        
        # Create enhanced features if using non-linear models
        if (self.classification_model_name in ['Random Forest Classifier'] or 
            self.regression_model_name in ['Random Forest', 'Gradient Boosting']):
            prices_for_model = self.create_features(prices)
        else:
            prices_for_model = prices
        
        # Part 1: Predict if it will sell (classification)
        will_sell_probs = self.classification_model.predict_proba(prices_for_model)[:, 1]  # Probability of selling
        will_sell = self.classification_model.predict(prices_for_model)  # Binary prediction
        
        # Part 2: Predict how much it will sell (regression)
        sales_amounts = self.regression_model.predict(prices_for_model)
        
        # Combine predictions: 
        # - If classified as "will sell", use regression amount weighted by probability
        # - Otherwise, predict 0
        predictions = np.where(will_sell, sales_amounts * will_sell_probs, 0)
        
        # Ensure non-negative predictions
        predictions = np.maximum(predictions, 0)
        
        # Print detailed prediction info for debugging
        for i, price in enumerate(prices.flatten()):
            print(f"Price {price:.2f}€: P(sell)={will_sell_probs[i]:.3f}, "
                  f"Amount={sales_amounts[i]:.1f}, Final={predictions[i]:.1f}")
        
        return predictions
    
    def _predict_single_model(self, prices):
        """Predict using single regression model (legacy)."""
        # Ensure prices is 2D array
        if len(prices.shape) == 1:
            prices = prices.reshape(-1, 1)
        
        min_price, max_price = self.price_range
        print(f"Using Single Model - Training price range: [{min_price:.2f}, {max_price:.2f}]")
        
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
        
        print(f"\n=== Data Overview ===")
        print(f"Total products: {len(y)}")
        print(f"Products with sales > 0: {np.sum(y > 0)} ({np.sum(y > 0)/len(y)*100:.1f}%)")
        print(f"Products with 0 sales: {np.sum(y == 0)} ({np.sum(y == 0)/len(y)*100:.1f}%)")
        print(f"Average sales (all products): {np.mean(y):.2f}")
        print(f"Average sales (non-zero only): {np.mean(y[y > 0]):.2f}")
        
        # Train Two-Part (Hurdle) Model - RECOMMENDED for zero-inflation
        print("\n" + "="*60)
        print("TRAINING TWO-PART (HURDLE) MODEL - ZERO-INFLATION SOLUTION")
        print("="*60)
        hurdle_results = self.train_hurdle_model(X_enhanced, y)
        
        # Train traditional single models for comparison
        print("\n" + "="*60)
        print("TRAINING TRADITIONAL SINGLE MODELS - FOR COMPARISON")
        print("="*60)
        
        print("\n=== Testing with simple features (price only) ===")
        results_simple, _, _, _, _ = self.train_models(X, y)
        
        print("\n=== Testing with enhanced features ===")
        results_enhanced, X_train, X_test, y_train, y_test = self.train_models(X_enhanced, y)
        
        # Use the better single model results for comparison
        if max(r['r2'] for r in results_enhanced.values()) > max(r['r2'] for r in results_simple.values()):
            single_model_results = results_enhanced
            print("\nBest single model uses enhanced features")
        else:
            single_model_results = results_simple
            print("\nBest single model uses simple features")
        
        # Compare performance
        print("\n" + "="*60)
        print("MODEL PERFORMANCE COMPARISON")
        print("="*60)
        
        single_model_r2 = max(r['r2'] for r in single_model_results.values())
        hurdle_model_r2 = hurdle_results['combined_performance']['r2']
        
        print(f"Single Model Best R²: {single_model_r2:.3f}")
        print(f"Two-Part Model R²:    {hurdle_model_r2:.3f}")
        
        if hurdle_model_r2 > single_model_r2:
            print("✅ Two-Part Model performs better! Using Hurdle Model.")
            recommended_model = "hurdle"
        else:
            print("❌ Single Model performs better. Using Single Model.")
            recommended_model = "single"
        
        return {
            'hurdle_results': hurdle_results,
            'single_model_results': single_model_results,
            'recommended_model': recommended_model,
            'data_stats': {
                'total_products': len(y),
                'zero_sales_count': np.sum(y == 0),
                'non_zero_sales_count': np.sum(y > 0),
                'zero_inflation_rate': np.sum(y == 0) / len(y)
            }
        }
    
    def save_model(self, filepath='sales_prediction_model.pkl'):
        """Save the trained model(s)."""
        import joblib
        
        # Prepare model data
        model_data = {
            'price_range': self.price_range
        }
        
        # Save Two-Part Model if available
        if self.classification_model is not None and self.regression_model is not None:
            model_data.update({
                'model_type': 'hurdle',
                'classification_model': self.classification_model,
                'regression_model': self.regression_model,
                'classification_model_name': self.classification_model_name,
                'regression_model_name': self.regression_model_name,
                'feature_type': 'enhanced' if (
                    self.classification_model_name in ['Random Forest Classifier'] or 
                    self.regression_model_name in ['Random Forest', 'Gradient Boosting']
                ) else 'simple'
            })
            print(f"Saving Two-Part (Hurdle) Model:")
            print(f"  Classification: {self.classification_model_name}")
            print(f"  Regression: {self.regression_model_name}")
        
        # Save single model as fallback if available
        elif self.best_model is not None:
            model_data.update({
                'model_type': 'single',
                'model': self.best_model,
                'model_name': self.best_model_name,
                'feature_type': 'enhanced' if self.best_model_name in ['Random Forest', 'Gradient Boosting'] else 'simple'
            })
            print(f"Saving Single Model: {self.best_model_name}")
        
        else:
            raise ValueError("No model to save! Train the model first.")
        
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
