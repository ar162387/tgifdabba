const MAPS_CO_API_KEY = '68c692aae889a231477847lie2512cb';

/**
 * Validate postal code using maps.co geocoding API
 * Simply checks if the postal code starts with BR1-BR7 (our delivery areas)
 */
export async function validatePostalCode(postalCode) {
  try {
    // Clean the postal code
    const cleanPostalCode = postalCode.trim().toUpperCase().replace(/\s/g, '');
    
    // First, do a simple pattern check for BR1-BR7
    const postalCodeMatch = cleanPostalCode.match(/^(BR[1-7])/i);
    const isBRPostalCode = postalCodeMatch !== null;
    
    if (isBRPostalCode) {
      // If it matches our pattern, get the address details from the API
      const searchUrl = `https://geocode.maps.co/search?q=${encodeURIComponent(cleanPostalCode)}&api_key=${MAPS_CO_API_KEY}`;
      
      try {
        const response = await fetch(searchUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            
            return {
              success: true,
              message: 'We deliver to your area!',
              inDeliveryRange: true,
              coordinates: { lat, lon },
              address: result.display_name,
              areaCode: postalCodeMatch[1]
            };
          }
        }
      } catch (apiError) {
        console.warn('API call failed, using pattern validation:', apiError);
      }
      
      // If API fails but pattern matches, still return valid
      return {
        success: true,
        message: 'We deliver to your area!',
        inDeliveryRange: true,
        coordinates: null,
        address: null,
        areaCode: postalCodeMatch[1],
        fallback: true
      };
    }
    
    // If it doesn't match our BR1-BR7 pattern, it's not in our delivery area
    return {
      success: true,
      message: 'Sorry, we don\'t deliver to this area',
      inDeliveryRange: false,
      coordinates: null,
      address: null,
      areaCode: null
    };
    
  } catch (error) {
    console.error('Postal code validation error:', error);
    
    // Fallback to simple postal code validation
    const cleanPostalCode = postalCode.trim().toUpperCase().replace(/\s/g, '');
    const isValidBRPostalCode = /^(BR[1-7])/i.test(cleanPostalCode);
    
    return {
      success: true,
      message: isValidBRPostalCode ? 'We deliver to your area!' : 'Sorry, we don\'t deliver to this area',
      inDeliveryRange: isValidBRPostalCode,
      coordinates: null,
      address: null,
      areaCode: isValidBRPostalCode ? cleanPostalCode.substring(0, 3) : null,
      fallback: true
    };
  }
}

/**
 * Get delivery area information
 */
export function getDeliveryAreaInfo() {
  return {
    areas: ['BR1', 'BR2', 'BR3', 'BR4', 'BR5', 'BR6', 'BR7'],
    location: 'Orpington, London',
    minimumOrder: 20,
    deliveryFee: 3.0
  };
}
