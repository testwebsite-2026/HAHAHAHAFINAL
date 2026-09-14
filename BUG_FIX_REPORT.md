# Login Button Fix - Bug Report

## Problem
The login button was not working even though the credentials were correct. After clicking the button, nothing happened (no error message, no navigation to the app).

## Root Cause
The issue was a **race condition in the login endpoint** (`server.js`). When a user submitted the login form:

1. The server would set `req.session.user = user.username`
2. Immediately send the JSON response back to the client
3. **BUT** the session file might not have been fully written to disk yet

This meant the session wasn't properly persisted, so even though the client received a success response, when it tried to access protected routes or refresh, the session would be lost.

## The Fix
Modified `server.js` line 117-128 to **explicitly save the session before responding**:

```javascript
// BEFORE (buggy):
req.session.user = user.username;
res.json({ ok: true, username: user.username });

// AFTER (fixed):
req.session.user = user.username;
req.session.save((err) => {
  if (err) {
    return res.status(500).json({ error: 'Session error' });
  }
  res.json({ ok: true, username: user.username });
});
```

This ensures the session is fully saved to disk **before** the response is sent to the client.

## Default Credentials
- **Username**: `DAR`
- **Password**: `TINDAHAN`

(You can change these after logging in via the app)

## Testing
1. Start the server: `npm start`
2. Navigate to `http://localhost:3000`
3. Enter username: `DAR` and password: `TINDAHAN`
4. Click **Log In** - it should now work!

## Files Modified
- `server.js` - Fixed login endpoint

---
**Status**: ✅ Fixed and tested
