# Quick Start: Google Maps Integration

## 🚀 Get Started in 3 Steps

### Step 1: Get Your Google Maps API Key (5 minutes)

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Distance Matrix API
   - Geocoding API
4. Go to Credentials → Create Credentials → API Key
5. Copy your API key

### Step 2: Configure Your Application (1 minute)

1. Create a `.env` file in the `frontend` folder:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Edit `.env` and paste your API key:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### Step 3: Run the Application

```bash
npm start
```

## ✨ Features You'll Get

### 🗺️ Interactive Map
- **India-Only Bounds**: Map restricted to India, cannot select outside
- **Click to Select**: Simply click on the map to choose locations
- **Visual Markers**: 
  - 🟢 Green for pickup
  - 🔴 Red for drop
- **Route Line**: Blue polyline connecting both points

### 📍 Location Details
- **Auto Address**: Lat/lng automatically converted to readable address
- **Coordinates Display**: See exact coordinates in input fields
- **Distance & Time**: Real-time calculation using Google's routing

### 🎯 User Experience
- Clean, modern interface
- Responsive design
- Smooth animations
- Error handling
- Visual feedback

## 📱 How Users Will Use It

1. **Book Delivery** → Click "Book New Delivery"
2. **Set Pickup** → Click green button → Click on map
3. **Set Drop** → Click red button → Click on map
4. **View Route** → See distance, time, and route line
5. **Continue** → Fill package details → Select vehicle → Pay

## 🔒 Security Tips

**Important**: Restrict your API key!

1. In Google Cloud Console → Credentials
2. Click your API key
3. Add restrictions:
   - **Application restrictions**: HTTP referrers
   - Add: `localhost:3000/*` (for development)
   - Add: `yourdomain.com/*` (for production)
4. **API restrictions**: Select only the 4 APIs you need

## 💰 Cost Estimate

With Google's free tier ($200/month credit):
- **Free**: ~40,000 map loads/month
- **Free**: ~40,000 geocoding requests/month
- **Free**: ~40,000 distance calculations/month

Most small to medium apps stay within free tier!

## 🐛 Troubleshooting

### Map not loading?
```
✓ Check .env file has correct API key
✓ Restart development server (npm start)
✓ Clear browser cache
✓ Check browser console for errors
```

### "This page can't load Google Maps correctly"?
```
✓ Verify API key is enabled
✓ Check if all 4 APIs are enabled in Google Cloud
✓ Remove any API key restrictions temporarily to test
```

### Can't select locations?
```
✓ Click the "Set Pickup/Drop Location" button first
✓ Only click within India boundaries
✓ Check if map has finished loading
```

## 📚 Full Documentation

See `GOOGLE_MAPS_SETUP.md` for complete documentation including:
- Detailed API setup
- Component architecture
- Advanced features
- Cost optimization
- Security best practices

## 🎉 You're All Set!

Your logistics booking system now has professional-grade Google Maps integration with India-specific features!

---

**Need Help?** Check the full documentation or contact the development team.
