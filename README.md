# ⚔️ Founder's RPG
> **Turn the Grind into a Game.** > *Validate the struggle. Gamify the rest. Visualize the progress.*

![Status](https://img.shields.io/badge/Status-Phase_1:_Immediate_Action-critical)
![Stack](https://img.shields.io/badge/Stack-Expo_|_Supabase_|_Gemini-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## 📜 The Manifesto
[cite_start]Founders—especially solo devs—suffer from **"Invisible Progress Burnout."** You work 12 hours fixing bugs and tweaking UI, but if revenue doesn't go up, your brain registers the day as a failure ("Zero Day").

**Founder's RPG** is the painkiller.
* **Input:** Dump your raw, messy daily log.
* **Process:** AI acts as the "Dungeon Master," validating effort.
* [cite_start]**Output:** Visual proof of progress (XP, Stats, Levels) regardless of business outcome[cite: 12, 13].

**Core Philosophy:**
> [cite_start]"Effort > Outcome. We reward the attempt, not just the win." [cite: 15]

---

## 🗺️ Roadmap & Mechanics

### 🛡️ Phase 1: The XP Bank (The Vault)
[cite_start]*Current Objective: Generate FOMO & Sunk Cost Fallacy [cite: 20]*

A high-vibe "Vault" where users deposit daily work to be claimed later.
* [cite_start]**The Promise:** "Don't let your hard work evaporate. Bank your XP today." [cite: 24]
* **Auth:** **Key-Based System.** No emails. [cite_start]Users get a Secret Key (e.g., `FNDR-88X`) they must guard with their life[cite: 25, 27].
* **Visuals:** Encrypted data animations, "Days Stored" counter.

### ⚔️ Phase 2: The MVP (Single Player)
[cite_start]*Target: 2-3 Weeks Build [cite: 37]*

The core feedback loop.
1.  **The Onboarding:** Enter your **Vault Key**. [cite_start]The system processes all banked logs instantly -> User starts at Level 5-10[cite: 41, 43].
2.  [cite_start]**The Daily Loop:** * GPT-4o-mini analyzes logs for **Difficulty** and **Category**[cite: 47].
    * [cite_start]**Scoring:** Low (5 FP), Medium (15 FP), High (25 FP)[cite: 48, 49, 50].
    * [cite_start]**The Cap:** Hard limit of **100 FP/Day** to discourage burnout[cite: 51].
3.  **The Hexagon Stats:**
    * [cite_start]Engineering / Product / Design / Marketing / Mindset[cite: 58].

### 🔮 Phase 3: The Full Vision
* **Class System:**
    * 🛠️ **The Builder:** High Engineering stats.
    * 💸 **The Hustler:** High Sales/Marketing stats.
    * [cite_start]📐 **The Architect:** High Strategy/Design stats [cite: 63-66].
* [cite_start]**Boss Battles:** Tag huge tasks as "BOSS" for badge drops[cite: 74].
* [cite_start]**The Oracle:** AI burnout detection ("You are overheating. Quest: Walk 20 mins")[cite: 78].

---

## 🏗️ Technical Architecture

### Stack
* [cite_start]**Frontend:** React / Next.js (Tailwind CSS)[cite: 103].
* [cite_start]**Backend:** Supabase (PostgreSQL + Edge Functions)[cite: 104].
* [cite_start]**AI:** OpenAI API (`gpt-4o-mini` for speed/cost efficiency)[cite: 105].

### [cite_start]Database Schema (MVP) [cite: 106-109]
| Table | Key Fields | Purpose |
| :--- | :--- | :--- |
| `users` | `id`, `secret_key`, `level`, `stats_json` | Core player data. |
| `logs` | `raw_text`, `ai_analysis_json`, `fp_awarded` | The raw journal entries. |
| `daily_stats` | `user_id`, `date`, `total_fp` | Used to calculate the 100 FP Cap. |

### AI System Prompt Concept
> [cite_start]"You are a RPG Game Master. Analyze this journal entry. Identify tasks. Assign Focus Points (Max 25). Tag them. Detect Sentiment (Positive, Frustrated, Burned Out). Output JSON." [cite: 110]

---

## 💎 Monetization (The "Vibe" Economy)
[cite_start]*Strict Rule: Never monetize Core Progression (No Pay-to-Win).* [cite: 83]

1.  [cite_start]**Themes ($5-10):** Matrix/Terminal, Zen (E-ink), Cyberpunk[cite: 85].
2.  [cite_start]**Pro Tier ("The Strategist"):** Deep analytics ("You work best on Tuesdays") and auto-generated Investor Reports [cite: 92-94].
3.  [cite_start]**Hall of Fame:** "The Council of Builders" (Level 50+ only)[cite: 97].

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone [https://github.com/your-username/founders-rpg.git](https://github.com/your-username/founders-rpg.git)

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Required: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY

# Run the development server
npm start