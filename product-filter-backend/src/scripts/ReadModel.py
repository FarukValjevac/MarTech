import numpy as np
import joblib
import sys
import os

def load_model(model_path='data/sales_prediction_model.pkl'):
    """Load the saved model (supports both single and Two-Part models)."""
    if not os.path.exists(model_path):
        print(f"Error: Model file '{model_path}' not found!")
        print("Please run the training script first to create the model.")
        sys.exit(1)
    
    try:
        model_data = joblib.load(model_path)
        return model_data
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)

def create_features(prices, feature_type):
    """Create features based on the model type."""
    if feature_type == 'enhanced':
        # Add polynomial features
        return np.column_stack([
            prices,                    # Original price
            prices**2,                # Squared price
            np.log1p(prices),         # Log of price
            1/np.maximum(prices, 0.1) # Inverse price
        ])
    return prices

def predict_sales_hurdle(classification_model, regression_model, prices, feature_type='simple'):
    """Make predictions using Two-Part (Hurdle) Model."""
    # Ensure prices is 2D array
    if len(prices.shape) == 1:
        prices = prices.reshape(-1, 1)
    
    # Create features if needed
    if feature_type == 'enhanced':
        prices_for_model = create_features(prices, feature_type)
    else:
        prices_for_model = prices
    
    # Part 1: Predict if it will sell (classification)
    will_sell_probs = classification_model.predict_proba(prices_for_model)[:, 1]
    
    # Part 2: Predict how much it will sell (regression)
    sales_amounts = regression_model.predict(prices_for_model)
    
    # Combine predictions: probability-weighted expected value
    predictions = will_sell_probs * sales_amounts
    
    # Ensure non-negative predictions
    predictions = np.maximum(predictions, 0)
    
    # Print detailed prediction info
    for i, price in enumerate(prices.flatten()):
        print(f"Price €{price:.2f}: P(sell)={will_sell_probs[i]:.3f}, "
              f"Amount={sales_amounts[i]:.1f}, Expected={predictions[i]:.1f}")
    
    return predictions

def predict_sales_single(model, prices, feature_type='simple'):
    """Make predictions using single regression model."""
    # Ensure prices is 2D array
    if len(prices.shape) == 1:
        prices = prices.reshape(-1, 1)
    
    # Create features if needed
    if feature_type == 'enhanced':
        prices = create_features(prices, feature_type)
    
    # Make predictions
    predictions = model.predict(prices)
    
    # Ensure non-negative predictions
    return np.maximum(predictions, 0)

def main():
    """Main function to run predictions."""
    print("Advanced Sales Prediction Tool (Zero-Inflation Aware)")
    print("=" * 60)
    
    # Load the model data
    model_data = load_model()
    model_type = model_data.get('model_type', 'single')
    feature_type = model_data.get('feature_type', 'simple')
    
    print(f"Model type: {model_type.upper()}")
    print(f"Feature type: {feature_type}")
    
    if model_type == 'hurdle':
        print(f"Classification model: {model_data['classification_model_name']}")
        print(f"Regression model: {model_data['regression_model_name']}")
    else:
        print(f"Single model: {model_data['model_name']}")
    
    # Get price from command line argument or use default
    if len(sys.argv) > 1:
        try:
            price = float(sys.argv[1])
            new_prices = np.array([price])
        except ValueError:
            print(f"Error: Invalid price '{sys.argv[1]}'. Please provide a numeric value.")
            sys.exit(1)
    else:
        # Default price if none provided
        new_prices = np.array([6])
    
    # Make predictions based on model type
    print(f"\nMaking predictions for price(s): {new_prices}")
    print("-" * 40)
    
    if model_type == 'hurdle':
        # Use Two-Part (Hurdle) Model
        predictions = predict_sales_hurdle(
            model_data['classification_model'],
            model_data['regression_model'],
            new_prices,
            feature_type
        )
        print(f"\nUsing Two-Part (Hurdle) Model - Handles Zero-Inflation")
    else:
        # Use single model
        predictions = predict_sales_single(
            model_data['model'],
            new_prices,
            feature_type
        )
        print(f"\nUsing Single Model - May be biased by zero-inflation")
    
    # Display final results
    print("\n" + "=" * 60)
    print("FINAL PREDICTIONS")
    print("=" * 60)
    print("Price       -> Predicted Sales    |     Estimated Revenue")
    print("-" * 60)
    
    for price, sales in zip(new_prices, predictions):
        sales_rounded = round(sales)
        revenue = price * sales_rounded
        print(f"€{price:6.2f}     -> {sales_rounded:8.0f} units     | €{revenue:8.0f}")
    
    print("=" * 60)

if __name__ == "__main__":
    main()