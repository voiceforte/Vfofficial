# Admin panel (CMS) setup

Admin URL: `/secure-admin/vf-control-2026.html` (not indexed by search engines). No password is stored in the code.

1. Firebase Console > Project settings > Your apps > Web app: copy the config values into `js/firebase-config.js`.
2. Build > Authentication > Sign-in method: enable **Email/Password**. Users tab: **Add user** (your email + your own password).
3. Build > Firestore Database: create the database (no Storage / paid plan needed, images are stored compressed in Firestore).
4. Open `firestore.rules`, replace `YOUR_ADMIN_EMAIL` with the email from step 2, paste into Firestore > Rules, Publish.
5. Authentication > Settings > Authorized domains: add `voiceforte.com` and `www.voiceforte.com`.
6. Log in to the admin URL.

What you can manage: all text on every page, logo, header/hero image of every page, team (photo, name, title, bio, order), and Insights (LinkedIn articles).

Notes
- Until step 1 is done the site shows its original content, nothing breaks.
- Insights: LinkedIn offers no free automatic feed for newsletters, so paste each article link, title and summary in the Insights tab. It then appears on the site immediately.
- Page text fields are numbered by position (`tools/tag_pages.py`). If you change page structure in HTML, re-run it and re-check saved text.
