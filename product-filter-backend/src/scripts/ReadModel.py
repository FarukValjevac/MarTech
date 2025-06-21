#!/usr/bin/env python3
"""
Simple script to make sales predictions using the saved model.
Usage: python ReadModel.py 
"""

import numpy as np
import joblib
import sys
import os

def load_model(model_path='data/sales_prediction_model.pkl'):
    """Load the saved model."""
    if not os.path.exists(model_path):
        print(f"Error: Model file '{model_path}' not found!")
        print("Please run the training script first to create the model.")
        sys.exit(1)
    
    try:
        model_data = joblib.load(model_path)
        return model_data['model'], model_data['model_name'], model_data.get('feature_type', 'simple')
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

def predict_sales(model, prices, feature_type='simple'):
    """Make predictions for given prices."""
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
    print("Sales Prediction Tool")
    print("=" * 50)
    
    # Load the model
    model, model_name, feature_type = load_model()
    print(f"Loaded model: {model_name}")
    print(f"Feature type: {feature_type}")
    
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
        new_prices = np.array([5])
    
    # Make predictions
    print("\nMaking predictions...")
    predictions = predict_sales(model, new_prices, feature_type)
    
    # Display results
    print("\nPrice -> Predicted Sales")
    print("-" * 50)
    
    for price, sales in zip(new_prices, predictions):
        revenue = price * sales
        print(f"€{price:6.2f} -> {sales:8.0f} units | Revenue: ${revenue:10.2f}")

if __name__ == "__main__":
    main()