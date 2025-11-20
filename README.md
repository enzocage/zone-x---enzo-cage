# zone-x---enzo-cage

zone x atari xl (new implementation)

The following `README.md` provides a comprehensive guide to **Zone X**, an action-arcade maze game for the Atari 8-bit family (XL/XE).

***

# Zone X (Atari XL/XE)

**Developer:** Gremlin Graphics  
**Original Designer:** Derek Johnston  
**HTML AI Port: Felix Schmidt
**Release Year:** 1985  
**Genre:** Arcade / Maze / Action  
**Platform:** Atari 8-bit Family (XL/XE)

---

## 📖 Introduction

**Zone X** is a frantic, top-down arcade maze game that challenges your reflexes and strategic planning. You play as a lone operative sent into a highly radioactive mining complex infiltrated by subversives. Your mission is critical: the facility is leaking deadly radiation, and plutonium canisters have been scattered throughout the treacherous zones.

You must navigate complex mazes, avoid erratic security robots, and secure all radioactive material before your protective suit fails. With a dwindling radiation shield acting as your lifeline, every second counts.

---

## 🕹️ Gameplay & Objectives

The core loop of Zone X revolves to **collection**, **survival**, and **escape**.

### The Mission

1. **Collect Plutonium:** Locate the flashing plutonium canisters scattered across the map.
2. **Deposit Safely:** Carry the plutonium to the designated **Lead Containers** (often marked as square receptacles).
3. **Escape:** Once all plutonium in a zone is secured, the **Exit Door** will unlock. Find it to warp to the next zone.

### The Radiation Shield

Your character is equipped with a radiation suit.

* **Health/Timer:** Your "life" is represented by the suit's shielding level.
* **Decay:** The shield depletes slowly over time due to ambient radiation.
* **Accelerated Decay:** Carrying plutonium causes your shield to drain much faster. Deposit it quickly!
* **Replenishment:** Collecting **Clock icons** will replenish your shield energy and extend your time.

---

## 🎮 Controls

Zone X is played primarily with a Joystick.

| Control | Action |
| :--- | :--- |
| **Joystick** | Move character Up, Down, Left, Right |
| **Fire Button** | **Use/Drop Item** (e.g., Place a Mat to block enemies) |
| **Start** | Begin Game / Pause (varies by version) |
| **Option** | Select Difficulty / Zone (on Title Screen) |
| **Reset** | Restart Game |

> **Note on Item Usage:** The game features context-sensitive actions. For example, if you have collected a **Mat**, pressing Fire will drop it behind you to block a pursuer. If you have a **Shovel**, walking into a crumbling wall will automatically dig through it.

---

## 💥 Enemies & Hazards

The mines are far from abandoned. You will face resistance from automated defenses and environmental hazards.

* **Security Robots:** The primary antagonists. They patrol the corridors in various patterns.
  * *Random Walkers:* Move erratically and are hard to predict.
  * *Trackers:* Some robots may actively home in on your position.
  * *Contact:* Touching a robot is instantly fatal.
* **Laser Doors:** Gates that intermittently flash on and off. Timing is key—pass through only when the beam is deactivated.
* **Crumbling Walls:** Weak sections of the maze that look like debris. These can be dug through if you have found a **Shovel**.
* **Radiation:** The invisible killer. If your shield meter reaches zero, your suit fails, and you lose a life.

---

## 🎒 Items & Power-ups

Scattered throughout the zones are various items to aid your survival.

| Item | Appearance | Function |
| :--- | :--- | :--- |
| **Plutonium** | Flashing Debris | The main objective. Collect and carry to a container. |
| **Container** | Square Bin | Deposit plutonium here to clear it from your inventory. |
| **Key** | Key Icon | Unlocks specific colored doors (usually green) blocking your path. |
| **Shovel** | Spade Icon | Allows you to dig through "crumbly" rock walls to create shortcuts. |
| **Mat** | Rug/Pad | Can be dropped (Fire Button) to create a barrier that robots cannot pass. **Warning:** It blocks you too! |
| **Clock** | Clock Face | Replenishes your radiation suit's energy (Time/Health). |
| **Bonus** | Question Mark (?) | Awards varying bonus points. |

---

## 🏆 Scoring System

Points are awarded for efficiency and collection:

* **Plutonium Deposit:** Points awarded for successfully securing radioactive material.
* **Bonus Items:** Collecting `?` marks provides a score boost.
* **Level Completion:** Bonus points are often awarded for completing a zone quickly.
* **High Score:** The game tracks the highest score for the session.

---

## 💡 Tips for Survival

1. **Don't Hoard Plutonium:** Carrying plutonium drains your shield rapidly. Plan your route so you can pick it up and deposit it in a container as quickly as possible.
2. **Use Mats Wisely:** Mats are a double-edged sword. You can use them to trap robots in a dead end, but if you drop one in a narrow corridor, you might trap yourself with an enemy.
3. **Watch the Patterns:** Laser doors have a specific rhythm. distinct from the random movement of robots. Patience is safer than rushing a laser.
4. **Map the Zone:** Later levels (Zone 4, 7, 10+) introduce more complex layouts. Mental mapping of where the containers are relative to the plutonium is essential.
5. **Dig for Shortcuts:** If you find a shovel, look for walls that appear textured or cracked. Digging a tunnel can help you bypass dangerous robot patrol routes.

---

### 📜 Technical Details

* **Memory:** Requires 48KB RAM (Runs on Atari 800, XL, and XE models).
* **Video:** PAL/NTSC compatible (Gremlin Graphics was a UK publisher, so PAL is native).
* **Emulation:** Works perfectly in **Altirra** or **Atari800**. Ensure the system is set to XL/XE hardware model for best compatibility.
