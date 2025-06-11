import pandas as pd
import sys
import os

# take arguments from the frontend
db_threshold = float(sys.argv[1])
sold_threshold = int(sys.argv[2])

script_dir = os.path.dirname(os.path.abspath(__file__))

# define paths
product_feed_path = os.path.join(script_dir, '../data/product_feed_hashed.csv')
sold_articles_path = os.path.join(script_dir, '../data/sold_articles_hashed.csv')
output_file_path = os.path.join(script_dir, '../data/filtered_products.csv')

# load the data
try:
    product_feed = pd.read_csv(product_feed_path)
    sold_articles = pd.read_csv(sold_articles_path)
except FileNotFoundError as e:
    print(f"Error loading data: {e}", file=sys.stderr)
    sys.exit(1) 

# merge the data on product column
merged_df = pd.merge(product_feed, sold_articles, on='product')

# do the wanted filter
filtered_df = merged_df[(merged_df['db'] >= db_threshold) & (merged_df['sold'] >= db_threshold)]

# sort: first by db then by sold
sorted_df = filtered_df.sort_values(by=['db', 'sold'], ascending=[False, False])

# save filtered and sorted data
sorted_df.to_csv(output_file_path, index=False)

print("All filtered data are saved in 'data/filtered_products.csv'")
