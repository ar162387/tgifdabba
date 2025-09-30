// Global time configuration for the application
// Modify these values to test different scenarios

export const TIME_CONFIG = {
  // Time when ordering stops for the day (in 24-hour format)
  ORDERING_STOP_HOUR:16, // 12 PM
  ORDERING_STOP_MINUTE: 0,
  
  // Time when ordering starts for the next day (in 24-hour format)
  ORDERING_START_HOUR: 18, // 2 PM
  ORDERING_START_MINUTE: 0,
  
  // Duration of the ordering restriction window (in hours)
  RESTRICTION_DURATION_HOURS: 2,
  
  // Enable/disable time-based restrictions for testing
  ENABLE_TIME_RESTRICTIONS: true,
  
  // Timezone for consistent ordering windows
  TIMEZONE: 'Asia/Karachi' // Pakistan timezone for testing
};

// Utility functions for time calculations
export const getCurrentTime = () => {
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_CONFIG.TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(now);
  
  return {
    hour: parseInt(time.find(part => part.type === 'hour').value),
    minute: parseInt(time.find(part => part.type === 'minute').value),
    timeInMinutes: parseInt(time.find(part => part.type === 'hour').value) * 60 + parseInt(time.find(part => part.type === 'minute').value)
  };
};

export const getMenuDay = () => {
  const currentTime = getCurrentTime();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  // If it's past the stop time, show tomorrow's menu
  if (currentTime.timeInMinutes >= (TIME_CONFIG.ORDERING_STOP_HOUR * 60 + TIME_CONFIG.ORDERING_STOP_MINUTE)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  }
  
  return today;
};

export const isOrderingDisabled = () => {
  if (!TIME_CONFIG.ENABLE_TIME_RESTRICTIONS) {
    return { disabled: false, message: '' };
  }

  const currentTime = getCurrentTime();
  const stopTimeInMinutes = TIME_CONFIG.ORDERING_STOP_HOUR * 60 + TIME_CONFIG.ORDERING_STOP_MINUTE;
  const startTimeInMinutes = TIME_CONFIG.ORDERING_START_HOUR * 60 + TIME_CONFIG.ORDERING_START_MINUTE;
  
  // Check if we're in the restriction window
  if (currentTime.timeInMinutes >= stopTimeInMinutes && currentTime.timeInMinutes < startTimeInMinutes) {
    const timeUntilStart = startTimeInMinutes - currentTime.timeInMinutes;
    const hoursUntilStart = Math.floor(timeUntilStart / 60);
    const minutesUntilStart = timeUntilStart % 60;
    
    let message = '';
    if (hoursUntilStart > 0) {
      message = `Ordering will resume in ${hoursUntilStart}h ${minutesUntilStart}m `;
    } else {
      message = `Ordering will resume in ${minutesUntilStart} minutes `;
    }
    
    return { disabled: true, message };
  }
  
  return { disabled: false, message: '' };
};
