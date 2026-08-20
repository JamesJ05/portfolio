# Security notes

## Secrets

Do not place private API keys, passwords, service-account JSON, or private keys in browser JavaScript or commit them to Git. Store local script values in `.env` (ignored by Git) and production server secrets in a secret manager.

The Firebase web configuration in `js/firebase-config.js` is intentionally delivered to browsers. It identifies the Firebase project; it is not a credential. Restrict its API key in Google Cloud Console to this project's Firebase APIs and your deployed site origins. Do not use it for server/admin APIs.

## Data access

Firestore rules are the enforcement boundary for this no-cost version. Deploy the checked-in rules after reviewing them:

```powershell
npx firebase-tools deploy --only firestore:rules
```

User email addresses are private: clients can sign in only with email and password. Usernames are stored only as private, immutable reservations so they cannot be enumerated or used as an email directory.

Images are static repository files in `assets/images/`; Firebase Storage is not configured, so no billing account is needed for uploads.

## Immediate follow-up

An admin password and Firebase web key were previously present in repository scripts. Change the admin password in Firebase Authentication, rotate the Firebase API key if it was exposed publicly, and remove the old password from any password manager or shared notes.
