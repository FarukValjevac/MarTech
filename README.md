# Product Filter & AI Web Application

This project provides a comprehensive web application with product filtering, machine learning predictions, and an AI chatbot. It features a React-based frontend, a NestJS backend, Python ML scripts, and integration with Ollama for local AI chat functionality.

---

## 1. What it Does

The web app provides three main features:

### 🔍 Product Filter

- **Input two numerical thresholds**: `DB Threshold` and `Sold Threshold`.
- **Start a data filtering process**.
- **View the filtered product data directly** in a structured table, just like an Excel spreadsheet.
- **Sort the results** by clicking on the DB or Sold column headers for ascending/descending order.
- **Download the filtered data** as a CSV file with a single click.
- **View Charts** to analyze filtered data with interactive visualizations and pricing analytics.

The filtering applies to local CSV files (`product_feed_hashed.csv` and `sold_articles_hashed.csv`), saves the result to `filtered_products.csv`, and then displays it. Additionally, products without matches are saved to `unmapped_products.csv`.

## Additional features

### 🤖 ML Predictions

- **Generate machine learning models** from your product data to predict sales based on pricing.
- **Input product prices** to get sales predictions and revenue forecasts.
- **Advanced Zero-Inflation Handling**: Uses a Two-Part (Hurdle) Model to properly handle the fact that 73% of products have zero sales.
- **Model training** uses scikit-learn with your existing product and sales data.

### 💬 XXXL Chatbot

- **AI-powered chatbot** using Llama3 running locally via Ollama.
- **Real-time conversations** with persistent chat history across page navigation.
- **Professional chat interface** with typing indicators and timestamp display.

---

## 2. Setup and Installation

To get this app running on your machine, follow these steps:

### Prerequisites

Make sure you have these installed:

- **Node.js (LTS version recommended)**: Get it from [nodejs.org](https://nodejs.org/).
- **npm** (comes with Node.js) [npm.com](https://www.npmjs.com/).
- **Python 3**: Download from [python.org/downloads](https://www.python.org/downloads/).
- **Python ML libraries**: Install using pip:
  ```bash
  pip install -r requirements.txt
  ```
- **Ollama** (for AI chatbot): Download from [ollama.ai](https://ollama.ai/) and install Llama3:
  ```bash
  ollama pull llama3
  ```

### Backend Setup (NestJS)

1.  **Go to your backend's root directory**: This is where your NestJS `package.json` file is.

    ```bash
    cd product-filter-backend
    ```

2.  **Install NestJS dependencies**:

    ```bash
    npm install
    ```

3.  **Check data files**:
    Make sure `product_feed_hashed.csv` and `sold_articles_hashed.csv` are in the `data/` directory relative to your project root.

4.  **Run the Backend**:
    ```bash
    npm run start:dev
    ```
    Your NestJS backend should start on `http://localhost:3000`. You'll see logs confirming it's ready.

### Frontend Setup (React)

1.  **Go to your frontend's root directory**:
    If your frontend is in a `frontend` folder:

    ```bash
    cd product-filter-frontend
    ```

    You'll run the next steps from `product-filter-frontend`.

2.  **Install frontend dependencies**:

    ```bash
    npm install
    ```

3.  **Run the Frontend**:
    ```bash
    npm start
    ```
    Your React development server should open the app in your browser at `http://localhost:3001`.

---

## 3. Usage

### Starting the Application

1. **Start Ollama** (for chatbot functionality):

   ```bash
   ollama run llama3
   ```

2. **Start the backend** (in `product-filter-backend/`):

   ```bash
   npm run start:dev
   ```

3. **Start the frontend** (in `product-filter-frontend/`):

   ```bash
   npm start
   ```

4. Open your browser and go to `http://localhost:3001`.

## 4. Testing

### Running Tests

**Backend Tests:**

```bash
cd product-filter-backend
npm test              # Unit tests
npm run test:cov       # Test coverage
```

**Frontend Tests:**

```bash
cd product-filter-frontend
npm test              # Component tests
npm run test:coverage # Test coverage
```

### Test Coverage

- **Controllers**: API endpoint functionality
- **Components**: React component rendering and interactions
- **Validation**: Form validation and error handling

---

### Using the Features

#### 🔍 Product Filter

1. Navigate to the "Product Filter" tab
2. Enter numbers for "DB Threshold" and "Sold Threshold"
   - **Example**: Try `7` for `DB Threshold` and `50` for `Sold Threshold`
3. Click "**Generate Filtered Data**"
4. View and interact with the filtered results table

#### 🤖 ML Predictions

1. Navigate to the "ML Predictions" tab
2. Click "**Generate Model**" to create the ML model from your data
3. Enter a product price (e.g., `2.5`)
4. Click "**Predict Sales**" to get sales forecasts and revenue estimates

#### 💬 XXXL Chatbot

1. Navigate to the "XXXL Chatbot" tab
2. Type any question or message in the text input
3. Press Enter or click "Send" to chat with the AI
4. Chat history persists when switching between tabs

### Interactive Features:

#### Product Filter Features:

- **Sorting**: Click on the "db" or "sold" column headers to sort:
  - First click: Ascending order (▴)
  - Second click: Descending order (▾)
  - The current sort status is displayed above the table
- **Scrolling**: The table automatically shows a scrollbar when results exceed ~12-15 rows
  - Headers remain fixed at the top while scrolling
- **Download**: Click the small download button (⬇) in the top-right corner of the table to:
  - Download the currently displayed data as a CSV file
  - The download respects any sorting you've applied
  - File is automatically named with the current date (e.g., `filtered_products_2024-01-15.csv`)
- **View Charts**: Click the "View Charts" button to access interactive analytics:
  - Visual charts and graphs of your filtered product data
  - Pricing analytics and data insights
  - Interactive visualizations for better data understanding

#### Chatbot Features:

- **Persistent Chat**: Messages are saved when switching between tabs
- **Real-time Responses**: Powered by local Llama3 model via Ollama
- **Professional Interface**: Chat bubbles, timestamps, and typing indicators
- **Keyboard Shortcuts**: Press Enter to send messages

---

## 5. Advanced ML Implementation - Zero-Inflation Solution

### The Problem: Zero-Inflation in Sales Data

Traditional machine learning models struggle with real-world e-commerce data because:

- **73% of products have zero sales**
- Standard regression models become biased toward predicting very low sales

### The Solution: Two-Part (Hurdle) Model

This application implements a **best practice Two-Part (Hurdle) Model** to properly handle zero-inflation:

#### Part 1: Classification Model

- **Question**: "Will this product sell at all?"
- **Output**: Binary prediction (0 sales vs >0 sales)
- **Algorithm**: Random Forest Classifier
- **Accuracy**: 73.8% on validation data

#### Part 2: Regression Model

- **Question**: "IF it sells, how much will it sell?"
- **Training Data**: Only products with actual sales (>0)
- **Algorithm**: Linear Regression with enhanced features
- **Features**: Price, price², log(price), 1/price

#### Combined Prediction Process

1. **Classification**: Predict probability that product will sell
2. **Regression**: Predict sales volume (if it sells)
3. **Final Prediction**: `P(sell) × Predicted_Amount` (Expected Value)

This approach gives the mathematically correct **expected value** for a single product: P(sell) × Amount_if_sold = Expected_units_per_product and rounded to the nearest whole number.

#### Results Comparison

| Price | Hurdle Model (Expected Value) |
| ----- | ----------------------------- |
| 1.5€  | 3 units (21.8% sell prob.)    |
| 7.0€  | 6 units (51.9% sell prob.)    |

### Implementation Details

- **Model Training**: `CreateSalesPredictionsModel.py` - Trains both classification and regression models
- **Prediction Engine**: `ReadModel.py` - Loads and uses the Two-Part model for predictions
- **Model Persistence**: Joblib saves both models with metadata
- **API Integration**: NestJS backend seamlessly integrates with the Python ML pipeline

This approach provides **realistic, business-relevant predictions** that account for the high percentage of zero-sales products in real e-commerce datasets.

---

## 6. Technical Architecture

- **Frontend**: React with component-based architecture
- **Backend**: NestJS with modular structure
- **Data Processing**: Python scripts with pandas and scikit-learn
- **ML Innovation**: Two-Part (Hurdle) Model for zero-inflation handling
- **AI Integration**: Ollama API for local LLM inference
- **Data Storage**: CSV files for product and sales data
- **ML Models**: Joblib for model persistence

---

## 7. API Endpoints

- `POST /filter` - Product filtering
- `GET /ml/create-model` - Generate ML model
- `POST /ml/predict` - Get sales predictions
- `POST /api/chatbot/chat` - Chat with AI

---

## 8. Data Privacy & Security

- **Local Processing**: All AI chat processing happens locally via Ollama
- **Data Hashing**: Product data is pre-hashed for privacy
- **No External APIs**: No data sent to external services
- **CSV Storage**: Data stored locally in CSV format
