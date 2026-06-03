# ⚡ FoundersMode

> **Turn the Grind into a Game.** > _Validate the struggle. Gamify the rest. Visualize the progress._

![Status](https://img.shields.io/badge/Status-Phase_1:_Immediate_Action-critical)
![Stack](https://img.shields.io/badge/Stack-Expo_|_Supabase_|_Gemini-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## 📜 The Manifesto

Founders especially solo devs suffer from **"Invisible Progress Burnout."** You work 12 hours fixing bugs and tweaking UI, but if revenue doesn't go up, your brain registers the day as a failure ("Zero Day").

**FoundersMode** is the painkiller.

- **Input:** Dump your raw, messy daily log.
- **Process:** AI acts as the "Dungeon Master," validating effort.
- **Output:** Visual proof of progress (XP, Stats, Levels) regardless of business outcome.

**Core Philosophy:**

> "Effort > Outcome. We reward the attempt, not just the win."

---

## 🗺️ Roadmap & Mechanics

### 🛡️ Phase 1: The XP Bank (The Vault)

Completed Objective: Generate FOMO & Sunk Cost Fallacy_

A high-vibe "Vault" where users deposit daily work to be claimed later.

- **The Promise:** "Don't let your hard work evaporate. Bank your XP today."
- **Auth:** **Key-Based System.** No emails. Users get a Secret Key (e.g., `FNDR-88X`) they must guard with their life.
- **Visuals:** Encrypted data animations, "Days Stored" counter.

### ⚔️ Phase 2: The MVP (Single Player)

_Target: 2-3 Weeks Build_

The core feedback loop.

1.  **The Onboarding:** Enter your **Vault Key**. The system processes all banked logs instantly -> User starts at Level 5-10.
2.  **The Daily Loop:** \* GPT-4o-mini analyzes logs for **Difficulty** and **Category**.
    - **Scoring:** Low (5 FP), Medium (15 FP), High (25 FP).
    - **The Cap:** Hard limit of **100 FP/Day** to discourage burnout.
3.  **The Hexagon Stats:**
    - Engineering / Product / Design / Marketing / Mindset.

### 🔮 Phase 3: The Full Vision

- **Class System:**
  - 🛠️ **The Builder:** High Engineering stats.
  - 💸 **The Hustler:** High Sales/Marketing stats.
  - 📐 **The Architect:** High Strategy/Design stats
- **The MP Guage:** AI burnout detection ("You are overheating. Rest Now").

---

## 🏗️ Technical Architecture

### Stack

- **Frontend:** React Native Expo (Nativewind CSS).
- **Backend:** Supabase.
- **AI:** Gemini API (`2.5-flash-lite` for speed/cost efficiency).


### AI System Prompt Concept

> "You are a RPG Game Master. Analyze this journal entry. Identify tasks. Assign Focus Points (Max 25). Tag them. Detect Sentiment (Positive, Frustrated, Burned Out). Output JSON."

---

## Future Monetization (The "Vibe" Economy)

_Strict Rule: Never monetize Core Progression (No Pay-to-Win)._

1.  **Themes ($5-10):** Matrix/Terminal, Zen (E-ink), Cyberpunk.
2.  **Pro Tier ("The Strategist"):** Deep analytics ("You work best on Tuesdays") and auto-generated Investor Reports
3.  **Hall of Fame:** "The Council of Builders" (Level 50+ only).

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/HarmishTervadiya/FoundersMode.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Required: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY

# Run the development server
npm start
```
