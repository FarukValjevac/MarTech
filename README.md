# Product Filter Web Application

This project provides a simple web application to filter product data based on user-defined thresholds for "DB" (Deckungsbeitrag) and "Sold" quantities (Verkaufte Artikel). It features a React-based frontend, a NestJS backend, and a Python script for the core data processing.

---

## 1. What it Does

The web app lets users:

- **Input two numerical thresholds**: `DB Threshold` and `Sold Threshold`.
- **Start a data filtering process**.
- **View the filtered product data directly** in a structured table, just like an Excel spreadsheet.
- **Sort the results** by clicking on the DB or Sold column headers for ascending/descending order.
- **Download the filtered data** as a CSV file with a single click.

The filtering applies to local CSV files (`product_feed_hashed.csv` and `sold_articles_hashed.csv`), saves the result to `filtered_products.csv`, and then displays it. Additionally, products without matches are saved to `unmapped_products.csv`.

---

## 2. Setup and Installation

To get this app running on your machine, follow these steps:

### Prerequisites

Make sure you have these installed:

- **Node.js (LTS version recommended)**: Get it from [nodejs.org](https://nodejs.org/).
- **npm** (comes with Node.js) [npm.com](https://www.npmjs.com/).
- **Python 3**: Download from [python.org/downloads](https://www.python.org/downloads/).
- **pandas library**: Install it using pip:
  ```bash
  pip install pandas
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

1.  Make sure both the NestJS backend and React frontend are running (`localhost:3000` and `localhost:3001`).
2.  Open your browser and go to `http://localhost:3001`.
3.  Enter numbers for "DB Threshold" and "Sold Threshold".
    - **Example**: Try `7` for `DB Threshold` and `50` for `Sold Threshold`.
4.  Click the "**Generate Filtered Data**" button.
5.  With valid inputs, the app will talk to the backend. After processing, the filtered product data will appear as a table below the button.

### Interactive Features:

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
