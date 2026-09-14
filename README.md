# TinDARhan POS

A Point-of-Sale (POS) system built for **TinDARhan** (*Gawang ARBO, Produktong
Batangueño*) — the DAR Batangas ARBO product stall.

**Version 2.0** adds a real backend: a login screen and a shared server-side
data store, so inventory, sales, and settings stay in sync no matter which
device or browser you log in from (e.g. your Railway deployment).

## ✨ Features

- **Login system** — the app is gated behind a login screen. Default account:
  - **Username:** `ADMIN`
  - **Password:** `ADMIN123`

  Change this after your first deploy (see [Changing the admin password](#changing-the-admin-password)).
- **Shared, server-side data** — items, sales, and settings are stored in a
  file on the server (not in the browser), so logging in from your phone,
  laptop, or a tablet at the stall all shows the exact same data.
- **Point of Sale** — tap a product to open a quick-add popup (icon, name,
  price, and a quantity stepper) so you confirm the quantity right there,
  instead of the item silently going into a cart you have to scroll down to
  see. A sticky mobile bar also shows the running item count and total at all
  times, with a "View Cart" shortcut.
- **Inventory management** — add, edit, and delete products (name, category,
  SKU, price, stock, low-stock threshold, emoji icon). Stock is validated and
  deducted **on the server** with every sale.
- **Low-stock indicators** in both the POS grid and inventory table.
- **Receipts** — every completed sale generates a clean, printable receipt.
- **Sales reports** — date-range filter, summary cards, top-selling-products
  chart, full transaction log, CSV export, printable report view.

## 🗂 Project structure

```
tindarhan-pos/
├── server.js              # Express backend: auth, API, serves the frontend
├── package.json
├── data/                  # Auto-created on first run — holds db.json (gitignored)
├── public/                # Everything the browser loads
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── storage.js      # API client (replaces old localStorage layer)
│       ├── ui.js
│       ├── pos.js           # Cart + quick-add popup + checkout
│       ├── inventory.js
│       ├── receipt.js
│       ├── reports.js
│       └── main.js          # Login flow, session check, tab navigation
├── LICENSE
└── README.md
```

## 🚀 Running locally

```bash
npm install
npm start
```

Then open `http://localhost:3000` and log in with `ADMIN` / `ADMIN123`.

A `data/db.json` file is created automatically on first run, seeded with a
starter catalog based on typical ARBO products. Delete this file to reset
everything back to the seed data.

## ☁️ Deploying on Railway

1. Push this repo to GitHub (see the section below for uploading from a
   phone).
2. In Railway, create a **New Project → Deploy from GitHub repo** and select
   this repository. Railway auto-detects Node.js from `package.json` and runs
   `npm install` then `npm start`.
3. Railway sets the `PORT` environment variable automatically — the app
   already reads it (`process.env.PORT`), so no config needed there.
4. **Important — persist your data across redeploys:** by default,
   `data/db.json` lives on the container's local disk, which Railway can wipe
   on a redeploy. To keep your inventory/sales permanently:
   - In your Railway service, go to **Volumes** and attach a new volume
     (e.g. mounted at `/data`).
   - Add an environment variable: `DATA_FILE=/data/db.json`.
   - Redeploy. From then on, all changes are saved to the volume and survive
     redeploys.
5. (Recommended) Add an environment variable `SESSION_SECRET` set to a long
   random string, so login sessions are signed with a secret only you know.

Once deployed, logging in with `ADMIN` / `ADMIN123` from *any* device will
show the same inventory, sales, and settings — because it's all read from the
one server, not from each device's local browser storage.

### Changing the admin password

There's a ready-made endpoint for this (`POST /api/change-password`), but no
UI button yet. Easiest way to change it right now: edit the seed function in
`server.js` (`buildSeedData`) to hash a different password, then delete your
existing `data/db.json` (or the Railway volume file) so it reseeds — or ask
me to add a "Change Password" screen and I'll wire it into the UI.

## 📤 Uploading this project to GitHub from a phone

GitHub's mobile web UI can't upload a whole folder at once, but it can create
files at any path (including inside folders) one at a time:

1. On github.com, open your repo → **Add file → Create new file**.
2. In the filename box, type the *full path*, e.g. `public/js/storage.js` —
   GitHub creates the `public` and `js` folders automatically.
3. Paste that file's content into the text box below, then **Commit changes**.
4. Repeat for every file: `server.js`, `package.json`, `public/index.html`,
   `public/css/style.css`, and each file under `public/js/`.

Faster alternative: open `https://github.dev/<your-username>/<your-repo>` in
your phone browser — it's a full VS Code-style editor where you can create
the folder structure and paste files in more comfortably, then commit/push
from the Source Control tab.

## 🔒 Data & security notes

- Data lives in a single JSON file on the server (`data/db.json` by default).
  This is intentionally simple — fine for one stall's day-to-day use, but not
  built for high concurrency or as a source of financial-audit truth. Export
  CSV reports regularly as a backup.
- Sessions are cookie-based and stored in server memory. Restarting the
  server logs everyone out (they just log back in).
- Change the default `ADMIN` / `ADMIN123` credentials and set a real
  `SESSION_SECRET` before relying on this for real transactions.

## 🛠 Customize

- **Branding**: header markup/colors in `public/index.html` / `public/css/style.css`
  (`--green-dark`, `--green`, `--gold` CSS variables).
- **Currency**: `UI.peso()` in `public/js/ui.js` formats amounts as PHP (₱).
- **Receipt footer / store info**: edit the template in `public/js/receipt.js`.

## 📄 License

MIT — see [LICENSE](LICENSE).
