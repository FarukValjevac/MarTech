import numpy as np
import joblib
import sys
import os

def load_model(model_path='MLmodel/sales_prediction_model.pkl'):
    """Load the saved hurdle model."""
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

def create_features(prices):
    """Create features based on the model type."""
    return np.column_stack([
        prices,                    # Original price
        prices**2,                 # Squared price
        np.log1p(prices),          # Log of price
        1/np.maximum(prices, 0.1)  # Inverse price
    ])

def predict_sales(classification_model, regression_model, prices, feature_type='simple'):
    """Make predictions using Two-Part (Hurdle) Model."""
    # Ensure prices is 2D array
    if len(prices.shape) == 1:
        prices = prices.reshape(-1, 1)
    
    # Create features if needed
    if feature_type == 'enhanced':
        prices_for_model = create_features(prices)
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
              f"Amount if sold={sales_amounts[i]:.1f}, Expected sales={predictions[i]:.1f}")
    
    return predictions

def main():
    """Main function to run predictions."""
    print("Sales Prediction Tool - Two-Part (Hurdle) Model")
    print("=" * 50)
    
    # Load the model data
    model_data = load_model()
    feature_type = model_data.get('feature_type', 'simple')
    
    print(f"Model type: Two-Part (Hurdle) Model")
    print(f"Feature type: {feature_type}")
    print(f"Classification model: {model_data['classification_model_name']}")
    print(f"Regression model: {model_data['regression_model_name']}")
    
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
        new_prices = np.array([7])
    
    # Make predictions
    print(f"\nMaking predictions for price(s): €{new_prices[0]:.2f}")
    print("-" * 50)
    predictions = predict_sales(
        model_data['classification_model'],
        model_data['regression_model'],
        new_prices,
        feature_type
    )
    
    # Display final results
    print("\nPrice -> Predicted Sales")
    print("-" * 50)
    
    for price, sales in zip(new_prices, predictions):
        sales_rounded = round(sales)
        revenue = price * sales_rounded
        print(f"€{price:6.2f} -> {sales:8.0f} units | Revenue: €{revenue:10.2f}")

if __name__ == "__main__":
    main()