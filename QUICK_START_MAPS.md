# 🚀 Quick Start: Google Maps Setup

## ⚡ 3-Minute Setup

### 1. Get API Key (2 minutes)
1. Go to: https://console.cloud.google.com/
2. Create a new project
3. Enable these 4 APIs:
   - Maps JavaScript API
   - Geocoding API
   - Distance Matrix API
   - Places API
4. Create API Key in Credentials
5. Copy the key

### 2. Configure App (1 minute)
1. Open: `frontend/.env`
2. Replace `YOUR_API_KEY_HERE` with your key:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Save file

### 3. Restart Server
```bash
# Stop server (Ctrl + C)
# Then restart:
cd frontend
npm start
```

### 4. Test
- Open: http://localhost:3000/user/book-logistics
- Click "Select Pickup on Map" → Click map
- Click "Select Drop on Map" → Click map
- See distance and route! ✅

---

## 📋 Checklist

- [ ] Created Google Cloud project
- [ ] Enabled 4 APIs (Maps, Geocoding, Distance Matrix, Places)
- [ ] Created API Key
- [ ] Added key to `frontend/.env`
- [ ] Restarted development server
- [ ] Tested map on booking page

---

## ✨ Features Ready to Use

✅ Click map to select pickup/drop locations  
✅ Type addresses with autocomplete  
✅ Green marker (pickup) & Red marker (drop)  
✅ Purple route line between locations  
✅ Distance & travel time display  
✅ Reset Map button  
✅ India-only restriction  

---

## 🆘 Quick Fixes

**Map not showing?**
- Check API key is in `.env` file
- Restart server with `npm start`

**"Can't load Google Maps correctly"?**
- Enable billing in Google Cloud (free tier available)
- Verify all 4 APIs are enabled

---

**Need detailed help?** See `GOOGLE_MAPS_SETUP.md` in the root folder.
