# JHAZZ — Developer Portfolio

A static, Firebase-powered portfolio: dark navy + electric blue theme, animated
network background, a Firestore-backed projects section you manage from a
private dashboard, and a contact form that emails you directly.

## Folder structure

```
portfolio/
├── index.html              → the public site (about, skills, projects, contact)
├── css/
│   ├── style.css           → theme tokens, layout, components
│   └── animations.css      → keyframes + scroll-reveal
├── js/
│   ├── firebase-config.js  → YOUR Firebase project keys go here
│   ├── main.js             → nav, scroll reveal, particle background
│   ├── projects.js         → reads projects from Firestore → public grid
│   ├── contact.js          → EmailJS: forwards contact form to your inbox
│   ├── auth.js              → login/signup logic (admin/login.html)
│   └── admin-dashboard.js  → CRUD logic (admin/dashboard.html)
├── admin/
│   ├── login.html          → owner-only login / first-time signup
│   └── dashboard.html      → add / edit / delete projects, upload images
├── assets/
│   ├── images/              → put profile.jpg here (see below)
│   └── icons/
└── README.md
```

Everything is plain HTML/CSS/JS — no build step. Open `index.html` directly,
or deploy as-is to any static host.

## 1. Add your photo

Drop your headshot in as **`assets/images/profile.jpg`**. If that file
doesn't exist, the About section automatically falls back to a styled "JS"
monogram, so the site still looks right until you add it.

## 2. Set up Firebase (auth + database)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Project settings → General → Your apps → Add app → Web (`</>`)**. Copy the
   `firebaseConfig` object it gives you into **`js/firebase-config.js`**.
3. **Authentication → Sign-in method** → enable **Email/Password**.
4. **Firestore Database → Create database** → start in **production mode**.
5. **Storage → Get started** (used for project image uploads from the dashboard).

### Firestore security rules
Paste into **Firestore → Rules**. This lets anyone *read* your projects
(so the public site works) but only *your* logged-in account can write:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage security rules
Paste into **Storage → Rules**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /project-images/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Create your admin account
1. Open `admin/login.html` in the browser → **"Create your admin account"**.
2. Sign up once with your own email/password. That's now your login.
3. **Lock signup afterward** so no one else can register: in Firebase console
   go to **Authentication → Settings → User actions** and disable new sign-ups,
   or simply delete the "Create account" link from `admin/login.html` once
   your account exists.

## 3. Set up the contact form (auto-email)

Static sites can't send email directly, so the form uses **EmailJS** (free
tier: 200 emails/month) to forward submissions to
**jamesstephen.m.jason@gmail.com**.

1. Create a free account at [emailjs.com](https://www.emailjs.com).
2. **Email Services → Add New Service** → connect Gmail (your address).
3. **Email Templates → Create New Template**. Use variables `{{from_name}}`,
   `{{reply_to}}`, `{{message}}` in the body, and set the "To" field to your
   own email.
4. **Account → General** → copy your **Public Key**. Copy the **Service ID**
   and **Template ID** from the service/template you just made.
5. Paste all three into the top of **`js/contact.js`**.

## 4. Run it locally

No build tools needed — just serve the folder so browser security rules
don't block Firebase requests:

```bash
cd portfolio
python3 -m http.server 5500
# then open http://localhost:5500
```

## 5. Deploy

**Firebase Hosting (recommended, pairs with the same project):**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # public directory = portfolio (this folder)
firebase deploy
```

**Or Netlify / Vercel / GitHub Pages:** drag-and-drop or connect the repo —
it's a static site, so any of them work with zero config changes.

## Managing projects day-to-day

Go to `yoursite.com/admin/login.html` → log in → you land on the dashboard.
Fill in title, description, tech stack, links, and drop in an image — it
uploads to Firebase Storage and the project appears on the public site
immediately. Edit or delete any project from the same screen.

## Notes / things to customize

- Swap the placeholder copy in `index.html` (about paragraph, stats) with
  anything you want to change.
- `js/firebase-config.js`, `js/contact.js` (EmailJS keys), and
  `assets/images/profile.jpg` are the three things you must fill in before
  this is fully live — everything else works out of the box.
