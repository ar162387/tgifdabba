// Shop location (BR2 8AS)
const SHOP_POSTCODE = 'BR2 8AS';
const SHOP_COORDINATES = {
  lat: 51.389686,
  lon: 0.051126
};

// Calculate road distance using OpenRouteService API
async function calculateRoadDistance(lat1, lon1, lat2, lon2) {
  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFjNTMyYzgzNWYzMTQ2NjdiMTY1MDVjNzk2ZjA2YmNmIiwiaCI6Im11cm11cjY0In0=`;
    
    const requestBody = {
      coordinates: [[lon1, lat1], [lon2, lat2]],
      units: 'mi', // miles
      format: 'json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      
      // Debug: Log the response structure (remove in production)
      console.log('OpenRouteService response:', JSON.stringify(data, null, 2));
      
      // Check for routes in the response
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Check different possible structures for distance
        if (route.summary && typeof route.summary.distance === 'number') {
          return route.summary.distance; // Distance in miles
        }
        
        // Check segments array for distance (OpenRouteService v2 structure)
        if (route.segments && route.segments.length > 0) {
          const totalDistance = route.segments.reduce((sum, segment) => {
            return sum + (typeof segment.distance === 'number' ? segment.distance : 0);
          }, 0);
          if (totalDistance >= 0) {
            return totalDistance; // Distance in miles
          }
        }
        
        // Alternative structure: check if distance is directly on route
        if (typeof route.distance === 'number') {
          return route.distance; // Distance in miles
        }
        
        // Check if there's a properties object
        if (route.properties && typeof route.properties.distance === 'number') {
          return route.properties.distance; // Distance in miles
        }
        
        // Log the route structure for debugging
        console.log('Route structure:', JSON.stringify(route, null, 2));
      }
      
      // If we get here, the response was OK but didn't contain valid route data
      console.error('OpenRouteService API returned invalid data:', data);
      throw new Error('OpenRouteService API returned invalid route data');
    }
    
    // Log the response for debugging
    const responseText = await response.text();
    console.error('OpenRouteService API failed:', response.status, responseText);
    throw new Error(`OpenRouteService API failed: ${response.status}`);
  } catch (error) {
    console.error('Road distance calculation failed:', error);
    
    // Fallback: Calculate straight-line distance as last resort
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const fallbackDistance = R * c;
    
    console.warn(`Using fallback distance calculation: ${fallbackDistance.toFixed(2)} miles`);
    return fallbackDistance;
  }
}

// Get postcode data from postcodes.io
async function getPostcodeData(postcode) {
  try {
    const cleanPostcode = postcode.trim().toUpperCase().replace(/\s/g, '');
    const url = `https://api.postcodes.io/postcodes/${cleanPostcode}`;
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 200 && data.result) {
        return {
          postcode: data.result.postcode,
          lat: data.result.latitude,
          lon: data.result.longitude,
          address: `${data.result.admin_district}, ${data.result.region}`,
          displayName: `${data.result.postcode}, ${data.result.admin_district}, ${data.result.region}`,
          areaCode: data.result.outcode
        };
      }
    }
    
    throw new Error(`Postcode ${postcode} not found`);
  } catch (error) {
    console.error('Postcode lookup failed:', error);
    throw error;
  }
}

/**
 * Validate postal code using postcodes.io API and calculate road distance
 */
export async function validatePostalCode(postalCode) {
  try {
    // Get postcode data from postcodes.io
    const postcodeData = await getPostcodeData(postalCode);
    
    // Check if it's in our delivery area (BR1-BR7)
    const isBRPostalCode = /^BR[1-7]/.test(postcodeData.areaCode);
    
    if (!isBRPostalCode) {
      return {
        success: true,
        message: 'Sorry, we don\'t deliver to this area',
        inDeliveryRange: false,
        distance: null,
        coordinates: null,
        address: null,
        areaCode: null
      };
    }
    
    // Calculate road distance from shop
    const distance = await calculateRoadDistance(
      SHOP_COORDINATES.lat, 
      SHOP_COORDINATES.lon, 
      postcodeData.lat, 
      postcodeData.lon
    );
    
    // Check if within 3.5 miles
    const inDeliveryRange = distance <= 3.5;
    
    return {
      success: true,
      message: inDeliveryRange 
        ? 'We deliver to your area! FREE delivery within 3.5 miles (road distance).' 
        : `We deliver to your area! Road distance: ${distance.toFixed(1)} miles. Orders £30+ get FREE delivery.`,
      inDeliveryRange: inDeliveryRange,
      distance: distance,
      coordinates: { lat: postcodeData.lat, lon: postcodeData.lon },
      address: postcodeData.address,
      displayName: postcodeData.displayName,
      areaCode: postcodeData.areaCode
    };
    
  } catch (error) {
    console.error('Postal code validation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Error checking delivery availability. Please try again.';
    
    if (error.message.includes('Postcode')) {
      errorMessage = 'Invalid postcode. Please check and try again.';
    } else if (error.message.includes('OpenRouteService')) {
      errorMessage = 'Unable to calculate delivery distance. Please try again.';
    }
    
    return {
      success: false,
      message: errorMessage,
      inDeliveryRange: false,
      distance: null,
      coordinates: null,
      address: null,
      areaCode: null,
      error: error.message
    };
  }
}

/**
 * Search for postcode suggestions using postcodes.io API
 */
export async function searchPostcodeSuggestions(query) {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const cleanQuery = query.trim().toUpperCase().replace(/\s/g, '');
    
    // Use postcodes.io autocomplete endpoint
    const url = `https://api.postcodes.io/postcodes/${cleanQuery}/autocomplete`;
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 200 && data.result && data.result.length > 0) {
        // Filter and process suggestions
        const suggestions = [];
        
        for (const postcode of data.result.slice(0, 10)) { // Get more results to filter
          try {
            // Only process if it looks like a complete postcode (has space or is 7+ chars)
            if (postcode.includes(' ') || postcode.length >= 7) {
              const postcodeData = await getPostcodeData(postcode);
              
              // Only include BR1-BR7 postcodes
              if (/^BR[1-7]/.test(postcodeData.areaCode)) {
                suggestions.push({
                  postcode: postcodeData.postcode,
                  displayName: postcodeData.displayName,
                  address: postcodeData.address,
                  lat: postcodeData.lat,
                  lon: postcodeData.lon,
                  areaCode: postcodeData.areaCode,
                  placeId: postcodeData.postcode // Use full postcode as unique identifier
                });
                
                // Stop when we have 5 valid suggestions
                if (suggestions.length >= 5) break;
              }
            }
          } catch (error) {
            console.warn(`Failed to get data for ${postcode}:`, error);
            continue;
          }
        }
        
        return suggestions;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching postcode suggestions:', error);
    return [];
  }
}

/**
 * Get delivery area information
 */
export function getDeliveryAreaInfo() {
  return {
    areas: ['BR1', 'BR2', 'BR3', 'BR4', 'BR5', 'BR6', 'BR7'],
    location: 'Bromley, London',
    shopPostcode: SHOP_POSTCODE,
    freeDeliveryRadius: 3.5, // miles (road distance)
    freeDeliveryThreshold: 30, // £30 for orders outside 3.5 miles
    deliveryFee: 2.0 // £2 delivery fee for orders under £30 outside 3.5 miles
  };
}
