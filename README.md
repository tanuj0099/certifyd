# Certifyd 🚀

**Bangalore's #1 Certification ROI Calculator** — powered by Groq AI (llama3-70b-8192, ~500 tokens/sec).

Know your break-even, 5-year gain, and market demand before spending ₹25K on AWS certs.

---

## ⚡ Quick Start (4 commands)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env → add your VITE_GROQ_API_KEY from https://console.groq.com

# 3. Run dev server
npm run dev
# → http://localhost:5173

# 4. Deploy to Vercel
npm run build && vercel
```

---

## 🎯 Features

- **Live ROI sliders** — Salary (₹0–40L), Cert Cost, Expected Hike %
- **Student Mode** — Set salary to ₹0 → see path to first 4.8L offer
- **Groq AI Analysis** — "AWS Solutions Architect" → risks, break-even, Bangalore market context
- **Loss aversion chart** — "With Cert" (emerald) vs "Inaction" (grey dashed)
- **3 free guest queries** → Firebase Google Auth gate
- **Dark luxury UI** — #0B0E14 bg, glassmorphism cards, 60fps animations

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GROQ_API_KEY` | **Yes** | Free at [console.groq.com](https://console.groq.com) |
| `VITE_GUEST_FREE_LIMIT` | No | Free queries before auth (default: 3) |
| `VITE_FIREBASE_*` | No | For Google/Phone auth (see firebase.js) |

> **Without GROQ key:** App runs in demo mode with realistic mock responses.

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + CSS Variables |
| Animations | Framer Motion |
| Charts | Recharts |
| AI | Groq SDK (llama3-70b-8192) |
| Auth | Firebase (Google + Phone OTP) |
| Icons | Lucide React |

---

## 📁 Project Structure

```
certifyd/
├── src/
│   ├── components/
│   │   ├── Hero.jsx        ← Main calculator UI
│   │   └── Navigation.jsx  ← Top bar + auth buttons
│   ├── hooks/
│   │   ├── hooks.js        ← ROI calc, guest counter, utilities
│   │   └── useAuth.js      ← Firebase auth context
│   ├── services/
│   │   └── aiService.js    ← Groq API + response parser
│   ├── firebase.js         ← Firebase config template
│   └── tokens.js           ← Design tokens + cert data
```

---

## 🎨 Design System

```css
BG:      #0B0E14  (deep space)
Text:    #F8FAFC  (soft white, 7:1 contrast)
Glass:   rgba(18,24,38,0.88) + blur(20px)
Indigo:  #6366F1  (primary action)
Emerald: #10B981  (gain/positive)
Fonts:   Bebas Neue (headings) · Inter (body)
```

---

## 🔥 Firebase Setup (optional)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create project → Add Web App
3. Enable **Authentication** → Google + Phone
4. Copy config to `.env`

> Without Firebase config, auth UI shows but sign-in will fail gracefully.

---

## 📦 Deploy

```bash
# Vercel (recommended)
npm run build && vercel

# Netlify
npm run build && netlify deploy --prod --dir=dist
```

---

Made with ❤️ for Bangalore tech professionals who hate wasting money on the wrong certs. (Updated via Manus AI during testing)
