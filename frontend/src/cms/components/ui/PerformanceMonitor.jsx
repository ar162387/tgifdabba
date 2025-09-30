import React, { useState, useEffect, useRef } from 'react';

// Simple performance monitoring component for debugging real-time updates
const PerformanceMonitor = ({ orders, realtimeConnectionStatus }) => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [updateHistory, setUpdateHistory] = useState([]);
  const prevOrdersRef = useRef([]);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    
    // Track when orders actually change
    const currentOrderIds = orders.map(order => order._id).sort();
    const prevOrderIds = prevOrdersRef.current.map(order => order._id).sort();
    
    if (JSON.stringify(currentOrderIds) !== JSON.stringify(prevOrderIds)) {
      const now = Date.now();
      setLastUpdateTime(now);
      
      setUpdateHistory(prev => {
        const newHistory = [...prev, {
          timestamp: now,
          orderCount: orders.length,
          change: orders.length > prevOrdersRef.current.length ? 'added' : 
                 orders.length < prevOrdersRef.current.length ? 'removed' : 'updated'
        }].slice(-10); // Keep only last 10 updates
        return newHistory;
      });
      
      prevOrdersRef.current = orders;
    }
  }, [orders]);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg max-w-xs">
      <div className="font-bold mb-2">Performance Monitor</div>
      <div>Renders: {renderCount}</div>
      <div>Orders: {orders.length}</div>
      <div>Connection: {realtimeConnectionStatus}</div>
      <div>Last Update: {new Date(lastUpdateTime).toLocaleTimeString()}</div>
      
      {updateHistory.length > 0 && (
        <div className="mt-2">
          <div className="font-semibold">Recent Updates:</div>
          {updateHistory.slice(-5).reverse().map((update, index) => (
            <div key={index} className="text-xs opacity-75">
              {update.change} - {update.orderCount} orders - {new Date(update.timestamp).toLocaleTimeString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
