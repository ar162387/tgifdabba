# Time Configuration

## Global Time Settings

All time-related functionality in the application is controlled by the global configuration in `timeConfig.js`.

### Configuration Options

```javascript
export const TIME_CONFIG = {
  // Time when ordering stops for the day (in 24-hour format)
  ORDERING_STOP_HOUR: 12, // 12 PM
  ORDERING_STOP_MINUTE: 0,
  
  // Time when ordering starts for the next day (in 24-hour format)
  ORDERING_START_HOUR: 14, // 2 PM
  ORDERING_START_MINUTE: 0,
  
  // Duration of the ordering restriction window (in hours)
  RESTRICTION_DURATION_HOURS: 2,
  
  // Enable/disable time-based restrictions for testing
  ENABLE_TIME_RESTRICTIONS: true,
  
  // Timezone for consistent ordering windows
  TIMEZONE: 'Asia/Karachi' // Pakistan timezone for testing
};
```

### Testing Different Scenarios

To test different scenarios, simply modify the values in `timeConfig.js`:

#### 1. Disable Time Restrictions Completely
```javascript
ENABLE_TIME_RESTRICTIONS: false,
```

#### 2. Test Ordering Disabled State
```javascript
ORDERING_STOP_HOUR: 10,    // 10 AM
ORDERING_START_HOUR: 16,   // 4 PM
```

#### 3. Test Different Time Windows
```javascript
ORDERING_STOP_HOUR: 11,    // 11 AM
ORDERING_START_HOUR: 13,   // 1 PM
```

#### 4. Change Timezone
```javascript
TIMEZONE: 'Europe/London'  // UK timezone
TIMEZONE: 'America/New_York'  // US Eastern timezone
```

### Available Utility Functions

- `getCurrentTime()` - Get current time in the configured timezone
- `getMenuDay()` - Determine which day's menu to show based on current time
- `isOrderingDisabled()` - Check if ordering is currently disabled

### Usage

Import the configuration and utilities in any component:

```javascript
import { TIME_CONFIG, getCurrentTime, getMenuDay, isOrderingDisabled } from '../config/timeConfig';
```

### Benefits

- **Single Source of Truth**: All time logic is centralized
- **Easy Testing**: Change one file to test different scenarios
- **Consistent Behavior**: All components use the same time calculations
- **Maintainable**: No more duplicate time configuration across components
