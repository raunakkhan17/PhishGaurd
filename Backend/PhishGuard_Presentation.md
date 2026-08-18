# PhishGuard — 7-Minute Presentation Script
### Team HGC | Prakhar Madharia · Raj Bhardwaj · Rahul Issar · Jai Kumar

---

## SLIDE 1 — HOOK (0:00 – 0:45)
**Title: "Every 11 Seconds. Someone Gets Phished."**

> **SPEAKER NOTES:**
> "Right now, as I'm speaking, a phishing attack is being launched somewhere in the world.
> Every 11 seconds. That's not a metaphor — that's the FBI's 2024 Internet Crime Report.
> Phishing is the #1 cyber threat globally — responsible for **91% of all data breaches**.
> Last year alone, it cost businesses **$17,700 every single minute**.
> And here's the scary part — the tools to defend against it are either too slow, too dumb, or too late."

**Key Stats on Slide:**
- 🔴 3.4 Billion phishing emails sent **per day**
- 🔴 91% of cyberattacks **start with phishing**
- 🔴 $17,700 lost **every minute** to phishing
- 🔴 **1 in 99** emails is a phishing attempt

---

## SLIDE 2 — THE PROBLEM (0:45 – 1:30)
**Title: "Why Existing Solutions Fail"**

> **SPEAKER NOTES:**
> "Traditional security tools use blocklists — static databases of known bad URLs.
> But phishing sites live for an average of just **4 hours and 54 minutes** before being taken down — often AFTER the damage is done.
> Blocklists can't keep up. Google Safe Browsing misses **25% of phishing pages** in real-time testing.
> And with **80–90% of phishing now happening through WhatsApp and SMS**, browser-only tools leave the most vulnerable surface completely unprotected.
> That gap is exactly what PhishGuard was built to close."

**Key Stats on Slide:**
- ⏱ Avg phishing site lifespan: **4 hrs 54 min**
- ❌ Google Safe Browsing misses **~25%** of new phishing pages
- 📱 **80–90%** of phishing attacks now via mobile messaging
- 👤 **97%** of users cannot identify a sophisticated phishing email

---

## SLIDE 3 — THE SOLUTION (1:30 – 2:15)
**Title: "PhishGuard — Real-Time. Multi-Layer. Everywhere."**

> **SPEAKER NOTES:**
> "PhishGuard is a real-time, multi-layer phishing detection engine that works across browsers AND mobile.
> Unlike blocklists that react, we PREDICT.
> We combine Machine Learning, LLM reasoning, external threat intelligence, and live behavioral analysis — all in real time.
> The result is a system that doesn't just check a list. It thinks."

**Diagram on Slide:**
```
User visits URL
      ↓
┌─────────────────────────────────────────┐
│  LAYER 1: ML Model + LLM Validation     │
│  LAYER 2: VirusTotal + WHOIS Intel      │
│  LAYER 3: Live Behavioral Monitoring    │
└─────────────────────────────────────────┘
      ↓
 Risk Score (0–20)  →  Verdict: Safe / Warn / Block
```

---

## SLIDE 4 — HOW IT WORKS: THE 3 LAYERS (2:15 – 4:00)
**Title: "Three Layers of Defense. One Verdict."**

> **SPEAKER NOTES:**
> "Let me walk you through how PhishGuard actually makes a decision.

> **Layer 1 — Local Intelligence.**
> Our ML model analyzes over **30 URL and HTML features** — things like subdomain depth, special character frequency, page title mismatch, and form actions.
> It outputs a phishing probability score. That score is then handed to a Gemini LLM, which validates the result with *reasoning* — not just pattern matching.
> Here's the key safety rule: if ML and LLM disagree — we default to phishing. Safety first. Always.

> **Layer 2 — External Intelligence.**
> We hit the VirusTotal API — a database of **over 70 antivirus engines** — to check domain reputation.
> We also run a WHOIS lookup. A domain registered 3 days ago claiming to be your bank? That's an automatic red flag.
> Young domain age + privacy-shielded registrar = high risk multiplier.

> **Layer 3 — Behavioral Monitoring.**
> This runs live inside the browser. We're watching for 6 real-time signals:
> external form actions, hidden iframes, insecure password fields, obfuscated scripts, redirect chains, and brand impersonation keywords.
> Each signal adds to a behavioral risk score.

> All three layers output a score from 0–10. They combine into a final score capped at 20:
> Green — 0 to 4: Legitimate.
> Yellow — 5 to 9: Suspicious. User gets a warning.
> Red — 10 and above: Phishing. Site is blocked."

**Key Details on Slide:**
- Layer 1: **30+ features** analyzed per URL
- Layer 2: **70+ AV engines** via VirusTotal
- Layer 3: **6 behavioral signals** monitored live
- Final Score: **0–20 scale** → 3-tier verdict
- Safety Rule: ML ≠ LLM → **Always flag as Phishing**

---

## SLIDE 5 — PLATFORM & REACH (4:00 – 5:00)
**Title: "One Engine. Three Surfaces."**

> **SPEAKER NOTES:**
> "PhishGuard isn't just a backend model. It's a complete ecosystem.

> The **Browser Extension** silently scans every page you visit, displays a security badge, and blocks malicious sites before they load.

> The **Companion Web App** gives users a dashboard to manually submit suspicious URLs, browse a crowdsourced database of confirmed phishing domains, and engage with a security community forum.
> It also features a **Gemini-powered RAG chatbot** — you can ask it *why* a URL is dangerous, and it explains in plain English, pulling from our real threat database.

> And critically — the **React Native Mobile App** brings the same protection to WhatsApp and SMS links.
> Given that 80–90% of phishing now happens through messaging, this is arguably the most important surface we cover."

**Key Details on Slide:**
| Surface | Key Feature |
|---|---|
| Browser Extension | Auto-scan + block on every page load |
| Web Platform | Manual URL check + crowdsourced DB + RAG chatbot |
| Mobile App | WhatsApp/SMS link scanner + screenshot analysis |

---

## SLIDE 6 — WHAT MAKES US DIFFERENT (5:00 – 5:45)
**Title: "Not a Blocklist. A Brain."**

> **SPEAKER NOTES:**
> "Most tools ask: *'Have I seen this URL before?'*
> PhishGuard asks: *'Does this URL behave like a threat — right now?'*

> That distinction matters because phishing sites are designed to be invisible to blocklists — they're new, they're disposable, they live and die within hours.

> Our system has 3 advantages that competitors don't:
> First — **Zero-day coverage**: we detect threats that have never appeared on any blocklist.
> Second — **Explainability**: our LLM doesn't just say phishing — it tells you *why*.
> Third — **Mobile-first**: we protect the channel where 80–90% of attacks now happen."

**Differentiators on Slide:**
- ✅ Detects **zero-day** phishing (no blocklist needed)
- ✅ LLM explains the verdict in plain language
- ✅ Mobile messaging protection — **covers 80–90% of attack surface**
- ✅ Crowdsourced + AI-verified domain database
- ✅ Safety-first design: ambiguity = block

---

## SLIDE 7 — TECH STACK (5:45 – 6:15)
**Title: "Built with Production-Grade Tech"**

> **SPEAKER NOTES:**
> "Under the hood, PhishGuard is built on a robust, scalable stack.
> React and TailwindCSS on the frontend. Flask and Express on the backend. MongoDB for storage.
> Scikit-learn powers the ML model. Gemini API drives the LLM layer with RAG.
> VirusTotal and WHOIS provide external intelligence.
> And React Native brings it all to mobile — cross-platform, single codebase."

**Tech Stack Visual:**
```
Frontend    →  React + TailwindCSS + React Native
Backend     →  Flask (Python) + Express.js (Node)
Database    →  MongoDB
ML          →  Scikit-learn + Pandas (30+ features)
LLM/RAG     →  Gemini API + local embeddings
Intel APIs  →  VirusTotal (70+ engines) + WHOIS
```

---

## SLIDE 8 — FUTURE ROADMAP (6:15 – 6:40)
**Title: "Where We're Going"**

> **SPEAKER NOTES:**
> "We're not stopping here. Our roadmap includes blockchain integration for a tamper-proof, decentralized phishing registry — where records cannot be altered or taken down.
> A tokenized reporting system that rewards users and researchers for accurate threat reports.
> And Zero-Knowledge Proofs to share threat data privately, without exposing user information.
> This turns PhishGuard from a product into an ecosystem — a self-sustaining, incentive-aligned network fighting phishing at scale."

**Roadmap on Slide:**
- 🔗 Decentralized phishing DB on blockchain (tamper-proof)
- 🪙 Token rewards for verified threat reporting
- 🛡 Anti-phishing NFT certificates for verified domains
- 🔐 Zero-Knowledge Proofs for privacy-safe data sharing

---

## SLIDE 9 — CLOSING (6:40 – 7:00)
**Title: "PhishGuard — Detect. Warn. Block. Everywhere."**

> **SPEAKER NOTES:**
> "3.4 billion phishing attempts happen every single day.
> 91% of breaches start with one click.
> PhishGuard exists so that click never succeeds.
> Real-time. Multi-layer. Mobile-first. Built by Team HGC.
> Thank you."

**Closing Slide Stats:**
- 🌐 3.4B phishing attempts / day → PhishGuard runs in **real-time**
- 📱 80–90% mobile attack surface → **covered**
- 🧠 3 layers: ML + LLM + Behavioral → **nothing slips through**
- 🛡 Team HGC | PhishGuard

---

## TIMING BREAKDOWN
| Slide | Topic | Time |
|---|---|---|
| 1 | Hook — Phishing Stats | 0:45 |
| 2 | Why Existing Tools Fail | 0:45 |
| 3 | Solution Overview | 0:45 |
| 4 | 3-Layer Deep Dive | 1:45 |
| 5 | Platform & Reach | 1:00 |
| 6 | Differentiators | 0:45 |
| 7 | Tech Stack | 0:30 |
| 8 | Future Roadmap | 0:25 |
| 9 | Close | 0:20 |
| **Total** | | **~7:00** |
