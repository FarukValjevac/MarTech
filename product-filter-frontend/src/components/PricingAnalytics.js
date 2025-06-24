import React from 'react';
import '../styles/analytics.css';

function PricingAnalytics({ data, onClose }) {
  if (!data || data.length === 0) {
    return null;
  }

  // Group products by price ranges (0.5 increments)
  const groupByPriceRange = () => {
    const ranges = {};
    
    data.forEach(product => {
      const price = parseFloat(product.db) || 0;
      const sold = parseInt(product.sold) || 0;
      
      // Round to nearest 0.5 (e.g., 7.23 -> 7.0, 7.67 -> 7.5)
      const rangeStart = Math.floor(price * 2) / 2;
      const rangeEnd = rangeStart + 0.5;
      const rangeKey = `${rangeStart.toFixed(1)}-${rangeEnd.toFixed(1)}`;
      
      if (!ranges[rangeKey]) {
        ranges[rangeKey] = {
          range: rangeKey,
          rangeStart,
          products: [],
          totalSales: 0,
          productCount: 0
        };
      }
      
      ranges[rangeKey].products.push({ price, sold });
      ranges[rangeKey].totalSales += sold;
      ranges[rangeKey].productCount += 1;
    });
    
    return Object.values(ranges).sort((a, b) => a.rangeStart - b.rangeStart);
  };

  const priceRanges = groupByPriceRange();
  
  // Find sweet spot (highest total sales)
  const sweetSpot = priceRanges.reduce((max, current) => 
    current.totalSales > max.totalSales ? current : max,
    priceRanges[0] || { totalSales: 0, range: 'N/A' }
  );

  // Calculate max sales for scaling bars
  const maxSales = Math.max(...priceRanges.map(range => range.totalSales));

  return (
    <div className="analytics-overlay">
      <div className="analytics-container">
        <div className="analytics-header">
          <h2>📊 Sweet Spot Pricing Analytics</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="analytics-content">
          <div className="sweet-spot-summary">
            <div className="sweet-spot-card">
              <h3>🎯 Sweet Spot Identified</h3>
              <div className="sweet-spot-details">
                <span className="price-range">€{sweetSpot.range}</span>
                <span className="sales-volume">{sweetSpot.totalSales} total sales</span>
                <span className="product-count">{sweetSpot.productCount} products in range</span>
              </div>
              <p className="recommendation">
                💡 <strong>Recommendation:</strong> Consider pricing new products in the €{sweetSpot.range} range for optimal sales volume.
              </p>
            </div>
          </div>

          <div className="chart-container">
            <h3>Sales Volume by Price Range</h3>
            <div className="bar-chart">
              {priceRanges.map((range, index) => (
                <div key={range.range} className="bar-group">
                  <div 
                    className={`bar ${range.range === sweetSpot.range ? 'sweet-spot' : ''}`}
                    style={{ 
                      height: `${(range.totalSales / maxSales) * 200}px`,
                      minHeight: '5px'
                    }}
                    title={`€${range.range}: ${range.totalSales} sales from ${range.productCount} products`}
                  >
                    <div className="bar-value">{range.totalSales}</div>
                  </div>
                  <div className="bar-label">€{range.range}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-insights">
            <h3>📈 Key Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Price Range Analysis</h4>
                <p><strong>{priceRanges.length}</strong> different price ranges</p>
                <p><strong>{data.length}</strong> total products analyzed</p>
              </div>
              <div className="insight-card">
                <h4>Average Performance</h4>
                <p><strong>{Math.round(sweetSpot.totalSales / sweetSpot.productCount)}</strong> avg sales per product</p>
                <p>in sweet spot range</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingAnalytics;