## Firebase Auth + Roles Setup

This project now supports:
- `admin`: can add/update/delete data
- `user`: read-only access

### 1. Enable Email/Password Auth
1. Open Firebase Console.
2. Go to **Authentication > Sign-in method**.
3. Enable **Email/Password**.

### 2. Create login accounts
1. In **Authentication > Users**, create your admin and normal user accounts.
2. Copy each user `UID`.

### 3. Create role documents
Create documents in Firestore collection `users` using UID as document ID:

Admin example (`users/<ADMIN_UID>`):
```json
{
  "email": "admin@example.com",
  "role": "admin",
  "name": "Main Admin"
}
```

User example (`users/<USER_UID>`):
```json
{
  "email": "user@example.com",
  "role": "user",
  "name": "Viewer User"
}
```

### 4. Publish Firestore rules
Use the `firestore.rules` file in this project.

If using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into **Firestore Database > Rules** and publish.

### Notes
- Without proper rules, client-side role checks alone are not secure.
- If a user has no role document, the app auto-creates `users/<uid>` with `role: "user"` and stays read-only.
- To make someone admin, update `users/<uid>.role` to `admin` from Firebase Console.
