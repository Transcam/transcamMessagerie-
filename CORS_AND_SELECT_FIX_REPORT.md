# CORS and Select Component Fix Report

**Date:** January 2025  
**Status:** ✅ Completed

---

## Summary

Fixed two critical issues preventing the frontend from communicating with the backend API and causing React component errors:

1. **CORS (Cross-Origin Resource Sharing) Error** - Backend was blocking requests from frontend
2. **Radix UI Select Component Error** - Empty string values not allowed in Select components

---

## Issue 1: CORS Policy Error

### Problem
```
Access to XMLHttpRequest at 'http://localhost:3000/api/shipments?limit=20' 
from origin 'http://localhost:8080' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Root Cause
The Express backend server was not configured to allow cross-origin requests from the frontend (running on `http://localhost:8080`).

### Solution Implemented

#### 1. Installed CORS Package
```bash
cd backend
npm install cors @types/cors
```

**Packages Added:**
- `cors` (v2.8.5) - Express CORS middleware
- `@types/cors` (v2.8.17) - TypeScript type definitions

#### 2. Updated `backend/src/server.ts`

**Changes Made:**
- Added `import cors from "cors";` at the top
- Added CORS middleware **before** other Express middleware:
  ```typescript
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  }));
  ```

**Configuration:**
- `origin`: Allows requests from frontend URL (configurable via `FRONTEND_URL` env var, defaults to `http://localhost:8080`)
- `credentials: true`: Allows cookies and authentication headers to be sent

### Result
✅ Backend now accepts requests from the frontend origin  
✅ API calls from frontend will no longer be blocked by CORS policy

---

## Issue 2: Radix UI Select Component Error

### Problem
```
Uncaught Error: A <Select.Item /> must have a value prop that is not an empty string. 
This is because the Select value can be set to an empty string to clear the selection 
and show the placeholder.
```

### Root Cause
Radix UI's Select component does not allow empty string (`""`) as a value for `SelectItem`. The code was using empty strings to represent "All" or "no filter" options.

### Solution Implemented

#### Updated `frontend/src/pages/ShipmentListPage.tsx`

**Changes Made:**

1. **Status Filter Select (Lines 133-146)**
   - Changed `value={filters.status}` to `value={filters.status || "all"}`
   - Changed `onValueChange` handler to convert `"all"` back to empty string: `value === "all" ? "" : value`
   - Changed `<SelectItem value="">` to `<SelectItem value="all">`

2. **Route Filter Select (Lines 150-165)**
   - Changed `value={filters.route}` to `value={filters.route || "all"}`
   - Changed `onValueChange` handler to convert `"all"` back to empty string: `value === "all" ? "" : value`
   - Changed `<SelectItem value="">` to `<SelectItem value="all">`

**Implementation Strategy:**
- **Display Layer**: Uses `"all"` as the Select value (Radix UI compliant)
- **State Layer**: Still uses empty string `""` internally (for API filtering)
- **Conversion**: Automatically converts between `"all"` ↔ `""` when user selects/deselects

### Result
✅ Select components no longer throw errors  
✅ Filter functionality remains unchanged (empty string = no filter)  
✅ User experience improved (clear "All" option visible)

---

## Files Modified

### Backend
1. **`backend/package.json`**
   - Added `cors` dependency
   - Added `@types/cors` dev dependency

2. **`backend/src/server.ts`**
   - Added CORS import
   - Added CORS middleware configuration

### Frontend
1. **`frontend/src/pages/ShipmentListPage.tsx`**
   - Fixed Status filter Select component
   - Fixed Route filter Select component

---

## Testing Instructions

### 1. Restart Backend Server
```bash
cd backend
npm run dev
```

**Expected Output:**
- Server starts without errors
- CORS middleware is active
- Server accepts requests from `http://localhost:8080`

### 2. Refresh Frontend
- Open browser console (F12)
- Navigate to Shipment List page
- Check for errors

**Expected Results:**
- ✅ No CORS errors in console
- ✅ No Select component errors
- ✅ API calls succeed (if backend is running)
- ✅ Filter dropdowns work correctly

### 3. Test API Calls
Open browser DevTools → Network tab:
- Navigate to Shipment List page
- Check for successful API requests to `/api/shipments`
- Verify response headers include `Access-Control-Allow-Origin: http://localhost:8080`

---

## Environment Variables (Optional)

To configure a custom frontend URL, add to `backend/.env`:
```env
FRONTEND_URL=http://localhost:8080
```

If not set, defaults to `http://localhost:8080`.

---

## Next Steps

1. ✅ **CORS Configuration** - Complete
2. ✅ **Select Component Fix** - Complete
3. ⏳ **Test with Real Authentication** - When colleague implements auth middleware
4. ⏳ **Production CORS Configuration** - Update `FRONTEND_URL` for production deployment

---

## Notes

- CORS middleware is placed **before** other middleware to ensure it processes all requests
- The Select component fix maintains backward compatibility with existing filter logic
- Both fixes are production-ready and follow best practices

---

## Verification Checklist

- [x] CORS package installed
- [x] CORS middleware added to server
- [x] Select components fixed (Status filter)
- [x] Select components fixed (Route filter)
- [x] No linter errors
- [x] TypeScript compilation successful
- [ ] Backend server restarted (manual step)
- [ ] Frontend tested in browser (manual step)

---

**Report Generated:** January 2025  
**All fixes implemented and ready for testing**



