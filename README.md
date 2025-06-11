# Product Filter Web Application

This project provides a simple web application to filter product data based on user-defined thresholds for "DB" (Deckungsbeitrag) and "Sold" quantities (Verkaute Artikel). It features a React-based frontend, a NestJS backend, and a Python script for the core data processing.

---

## 1. What it Does

The web app lets users:

- **Input two numerical thresholds**: `DB Threshold` and `Sold Threshold`.
- **Start a data filtering process**.
- **View the filtered product data directly** in a structured table, just like an Excel spreadsheet.

The filtering applies to local CSV files (`product_feed_hashed.csv` and `sold_articles_hashed.csv`), saves the result to `filtered_products.csv`, and then displays it.

---

## 2. How it Works (Architecture)

This application uses a client-server setup with a clear separation of roles:

- **Frontend (React):**

  - Provides the user interface for inputs and starting the filter.
  - **Validates empty input fields** right in the browser for instant feedback.
  - Sends a `POST` request with the thresholds to the NestJS backend.
  - Receives the filtered CSV data (as a text string) from the backend.
  - Parses this CSV string into a structured array of objects.
  - Renders the parsed data as an interactive HTML table.

- **Backend (NestJS):**

  - A robust Node.js framework handling server-side logic.
  - Exposes a `/filter` `POST` endpoint.
  - Receives `db` and `sold` thresholds from the frontend.
  - **Launches a separate Python process** to do the heavy data work.
  - Captures all output from the Python script (both regular messages and errors).
  - Sends the captured regular output (which contains the filtered CSV data) back to the frontend.
  - Manages potential errors from the Python script or internal server issues, sending clear error messages.
  - **Configured with CORS** to allow secure communication from the frontend (which runs on a different port).

- **Python Script (`filter_script.py`):**
  - Written in Python, using the `pandas` library for efficient data handling.
  - Gets `db_threshold` and `sold_threshold` as command-line arguments from NestJS.
  - Loads two local CSV files (`product_feed_hashed.csv` and `sold_articles_hashed.csv`) from the `data` directory. These paths are relative to the script's own location, making it self-contained.
  - Merges the loaded dataframes on a common 'product' column.
  - Applies the filtering logic using the provided thresholds (e.g., `db` >= `db_threshold` AND `sold` >= `sold_threshold`).
  - Sorts the filtered data by 'db' (descending) then 'sold' (descending).
  - Saves the final filtered and sorted data to `filtered_products.csv` in the `data` directory.
  - **Reads this newly saved `filtered_products.csv` and prints its entire content to standard output**, which NestJS then captures.

---

## 3. Setup and Installation

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

## 4. Usage

1.  Make sure both the NestJS backend and React frontend are running (`localhost:3000` and `localhost:3001`).
2.  Open your browser and go to `http://localhost:3001`.
3.  Enter numbers for "DB Threshold" and "Sold Threshold".
    - **Example**: Try `5` for `DB Threshold` and `50` for `Sold Threshold`.
4.  Click the "**Generate Filtered Data**" button.
5.  With valid inputs, the app will talk to the backend. After processing, the filtered product data will appear as a table below the button.

---

## 5. Important Notes

- **CORS Configuration**: The NestJS backend is set up to allow requests from `http://localhost:3001` in `src/main.ts`. If your frontend uses a different port or domain, you'll need to update the `origin` in `src/main.ts`'s CORS settings.
- **Python Script Paths**: The Python script (`scripts/TopMatchesSkript.py`) uses smart self-referencing paths (`os.path.abspath(__file__)`) to find its data files (`../data/`). This ensures it works correctly no matter where the Node.js app runs from.
- **Error Handling**: We've included basic error handling: client-side input checks, server-side promise rejections with proper `Error` objects, and Python script exits with specific error codes for easier debugging.
- **Scalability**: For production, consider robust solutions for big CSVs (like streaming data), long Python tasks (maybe message queues like RabbitMQ), and more advanced logging.

---
