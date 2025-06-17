import pandas as pd
import sys
import os

# take arguments from the frontend
db_threshold = float(sys.argv[1])
sold_threshold = int(sys.argv[2])

# db_threshold = 6
# sold_threshold = 50

script_dir = os.path.dirname(os.path.abspath(__file__))

# define paths
product_feed_path = os.path.join(script_dir, '../data/product_feed_hashed.csv')
sold_articles_path = os.path.join(script_dir, '../data/sold_articles_hashed.csv')
output_file_path = os.path.join(script_dir, '../data/filtered_products.csv')
unmapped_file_path = os.path.join(script_dir, '../data/unsold_products.csv')

# load the data
try:
    product_feed = pd.read_csv(product_feed_path)
    sold_articles = pd.read_csv(sold_articles_path)
except FileNotFoundError as e:
    print(f"Error loading data: {e}", file=sys.stderr)
    sys.exit(1) 

# merge the data on product column (inner join)
merged_df = pd.merge(product_feed, sold_articles, on='product', how='inner')

# Products in product_feed but not in sold_articles
products_not_sold = product_feed[~product_feed['product'].isin(sold_articles['product'])].copy()
products_not_sold['source'] = 'product'

# Products in sold_articles but not in product_feed
sold_not_in_feed = sold_articles[~sold_articles['product'].isin(product_feed['product'])].copy()
sold_not_in_feed['source'] = 'sold'

# Combine unmapped products
unmapped_products = pd.concat([products_not_sold, sold_not_in_feed], ignore_index=True)

# Save unmapped products to CSV
unmapped_products.to_csv(unmapped_file_path, index=False)

# do the wanted filter
filtered_df = merged_df[(merged_df['sold'] >= sold_threshold) & (merged_df['db'] >= db_threshold)]

# sort: first by sold then by db
sorted_df = filtered_df.sort_values(by=['sold', 'db'], ascending=[False, False])

# save filtered and sorted data
sorted_df.to_csv(output_file_path, index=False)

# Instead of just printing a message, print the content of the saved CSV
try:
    # Read the content of the newly saved CSV file
    with open(output_file_path, 'r') as f:
        csv_content = f.read()
    print(csv_content, end='') # Print the CSV content to stdout
    # Using end='' prevents adding an extra newline at the end

except FileNotFoundError:
    print(f"Error: Filtered output file not found at {output_file_path}", file=sys.stderr, flush=True)
    sys.exit(1)
except Exception as e:
    print(f"Error reading filtered output file: {e}", file=sys.stderr, flush=True)
    sys.exit(1)