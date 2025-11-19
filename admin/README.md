# Admin Panel - JSON File Storage

The admin panel now stores product availability in a **shared JSON file** using a free JSON storage service (jsonstorage.net). This means:

✅ **Changes made by admin will be visible to ALL users on ALL devices**  
✅ **No PHP or backend server required**  
✅ **Uses free JSON storage API**

## How It Works

1. **First Save**: When you save changes for the first time, the system creates a new JSON storage and gets a unique storage ID
2. **Storage ID**: This ID is saved in your browser's localStorage
3. **All Devices**: All users (including you on other devices) read from the same JSON file URL
4. **Real-time Updates**: Changes are immediately available to all users

## Setup Instructions

1. **Login to Admin Panel**: Go to `/admin/index.html`
   - Username: `admin`
   - Password: `admin123`

2. **Make Changes**: Toggle product availability and click "Save All Changes"

3. **First Save**: On first save, a JSON storage will be created automatically
   - A Storage ID will be displayed in the dashboard
   - This ID is saved in your browser

4. **Share Storage ID** (if needed): If you want other admins to use the same storage:
   - Copy the Storage ID shown in the dashboard
   - In another browser/device, open browser console
   - Run: `localStorage.setItem('slfarmer_json_storage_id', 'YOUR_STORAGE_ID')`

## Notes

- The JSON file is stored on jsonstorage.net (free service)
- localStorage is used as a backup if the JSON file is unavailable
- Changes sync across all devices automatically
- No database or PHP required!

## Troubleshooting

If JSON storage doesn't work:
1. Check browser console for errors
2. Make sure CORS is enabled (modern browsers handle this automatically)
3. localStorage will still work as a backup for single-device use

