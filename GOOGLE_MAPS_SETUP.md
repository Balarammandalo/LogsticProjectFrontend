# Google Maps Integration Setup Guide

## Overview
This logistics booking system now includes Google Maps integration for precise location selection within India. Users can click directly on the map to select pickup and drop locations, with automatic address resolution and distance calculation.

## Features Implemented

### ✅ Core Features
1. **India-Only Map Bounds** - Map is restricted to show only India, users cannot select locations outside India
2. **Interactive Location Selection** - Click on map to select pickup (green marker) and drop (red marker) locations
3. **Color-Coded Markers**:
   - 🟢 Green marker for pickup location
   - 🔴 Red marker for drop location
4. **Route Visualization** - Blue polyline drawn between pickup and drop points
5. **Automatic Address Resolution** - Latitude/longitude automatically converted to readable addresses
6. **Coordinate Display** - Lat/lng values shown in input field helper text
7. **Distance & Time Calculation** - Real-time distance and estimated travel time using Google Distance Matrix API

### 🎨 User Interface
- Smooth, responsive design
- Visual feedback when selecting locations
- Animated button states during selection mode
- Clean, modern Material-UI components
- Error handling for invalid selections

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required)
   - **Places API** (required)
   - **Distance Matrix API** (required for distance/time calculation)
   - **Geocoding API** (required for address resolution)

4. Create credentials:
   - Go to "Credentials" in the left sidebar
   - Click "Create Credentials" → "API Key"
   - Copy your API key

5. **Important**: Restrict your API key:
   - Click on your API key to edit
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:3000/*` for development)
   - Under "API restrictions", select "Restrict key"
   - Select only the APIs you enabled above

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file and add your API key:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. **Never commit your `.env` file to version control!**
   - Make sure `.env` is in your `.gitignore`

### 3. Install Dependencies (if needed)

The component uses Material-UI which should already be installed. If not:
```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

### 4. Start the Application

```bash
npm start
```

## How to Use

### For End Users

1. **Navigate to Booking Page**
   - Go to User Dashboard → "Book New Delivery"

2. **Select Pickup Location**
   - Click the "Set Pickup Location" button (green)
   - The button will animate to indicate selection mode
   - Click anywhere on the map within India
   - A green marker will appear at your selected location
   - The address and coordinates will auto-populate

3. **Select Drop Location**
   - Click the "Set Drop Location" button (red)
   - Click anywhere on the map within India
   - A red marker will appear at your selected location
   - The address and coordinates will auto-populate

4. **View Route Information**
   - Once both locations are selected:
     - A blue polyline connects the two points
     - Distance and estimated travel time appear below the map
     - Map automatically zooms to show both locations

5. **Confirm and Continue**
   - Verify the locations are correct
   - Fill in package weight and description
   - Click "Next" to proceed with vehicle selection

### Location Restrictions

- ✅ Only locations within India can be selected
- ❌ Clicking outside India shows an error message
- ✅ Addresses are verified to contain "India"
- ✅ Map bounds prevent scrolling outside India

## Component Architecture

### GoogleBookingMap Component
**Location**: `src/components/map/GoogleBookingMap.js`

**Props**:
- `onPickupSelect(location)` - Callback when pickup location is selected
  - Returns: `{ lat, lng, address }`
- `onDropSelect(location)` - Callback when drop location is selected
  - Returns: `{ lat, lng, address }`
- `pickupCoords` - Current pickup coordinates `{ lat, lng }`
- `dropCoords` - Current drop coordinates `{ lat, lng }`
- `height` - Map height in pixels (default: 500)
- `apiKey` - Google Maps API key

**Features**:
- Lazy loading of Google Maps script
- Automatic marker management
- Polyline drawing between points
- Distance Matrix API integration
- Geocoding for address resolution
- India bounds restriction
- Error handling

## API Usage & Costs

### Google Maps APIs Used

1. **Maps JavaScript API**
   - Used for: Map display and interaction
   - Cost: Free up to 28,000 loads/month

2. **Geocoding API**
   - Used for: Converting lat/lng to addresses
   - Cost: $5 per 1,000 requests (first $200/month free)

3. **Distance Matrix API**
   - Used for: Calculating distance and travel time
   - Cost: $5 per 1,000 requests (first $200/month free)

### Cost Optimization Tips

1. **Implement Caching**: Cache geocoding results for frequently used locations
2. **Debounce Requests**: Avoid excessive API calls
3. **Set Daily Limits**: Configure daily quotas in Google Cloud Console
4. **Monitor Usage**: Check Google Cloud Console regularly

## Troubleshooting

### Map Not Loading
- ✅ Check if API key is correctly set in `.env`
- ✅ Verify all required APIs are enabled in Google Cloud Console
- ✅ Check browser console for error messages
- ✅ Ensure API key restrictions allow your domain

### "Failed to load Google Maps" Error
- ✅ Verify API key is valid
- ✅ Check if Maps JavaScript API is enabled
- ✅ Clear browser cache and reload

### Cannot Select Locations Outside India
- ✅ This is intentional! The map is restricted to India only
- ✅ Error message will appear if you try to select outside bounds

### Distance/Time Not Showing
- ✅ Verify Distance Matrix API is enabled
- ✅ Check if both pickup and drop locations are selected
- ✅ Ensure locations are within India

### Markers Not Appearing
- ✅ Check browser console for errors
- ✅ Verify coordinates are valid
- ✅ Ensure map is fully loaded before clicking

## Security Best Practices

1. **Never expose API key in client-side code** (use environment variables)
2. **Restrict API key** to specific domains and APIs
3. **Set up billing alerts** in Google Cloud Console
4. **Monitor API usage** regularly
5. **Rotate API keys** periodically
6. **Use API key restrictions** (HTTP referrers, API restrictions)

## Future Enhancements

Potential improvements:
- 🔄 Search autocomplete for location names
- 🔄 Current location detection (GPS)
- 🔄 Save favorite locations
- 🔄 Multiple waypoints support
- 🔄 Traffic layer overlay
- 🔄 Alternative route suggestions
- 🔄 Street view integration

## Support

For issues or questions:
1. Check this documentation
2. Review Google Maps API documentation
3. Check browser console for errors
4. Contact development team

---

**Last Updated**: October 2025
**Version**: 1.0.0
