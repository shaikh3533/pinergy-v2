# Spinergy Master Application Documentation

Welcome to the definitive guide for the **Spinergy Table Tennis Platform**. This document provides an end-to-end overview of the system architecture, tournament administration workflows, and real-time broadcast capabilities.

---

## 🚀 1. Application Overview
Spinergy is a professional-grade table tennis management ecosystem built on **React**, **Supabase (PostgreSQL)**, and **Tailwind CSS**. It bridges the gap between local club play and broadcast-ready tournament management.

### Key Pillars:
*   **Booking Engine**: Real-time table reservation and scheduling.
*   **Pro League Module**: Seasonal player-vs-player tournaments with automated standings.
*   **Davis Cup (Special Events)**: Team-vs-team "Spinergy Specials" with multi-rubber ties.
*   **Live Tournament Arena**: A cinematic theater mode for real-time match telemetry.

---

## 🏆 2. League Management Guide (Standard)
Designed for seasonal individual competitions where players go through a Round Robin phase followed by Knockout Brackets.

### Workflow:
1.  **Creation**: Define tournament type (`Round Robin + Knockouts`, `RR Only`, or `Brackets Only`).
2.  **Registration**: Search for existing players or create new ones on the fly.
3.  **Round Robin Generation**: The engine scientifically generates a round-robin schedule based on the player pool.
4.  **Live Scoring**: Matches are scored in the "Leagues" view. Sets are recorded, and standings are updated **instantly** via database RPCs.
5.  **Tie-Breaking Logic**:
    1.  **Total Wins** (Primary)
    2.  **Point Difference (PD)** (Secondary)
    3.  **Head-to-Head (H2H)** (Tertiary)
6.  **Knockouts**: Admin can promote the **Top 2 or Top 4** qualifiers into Semi-Finals and Finals based on current live rankings.

---

## 🎾 3. Davis Cup (Special Events) Guide
A team-centric tournament format that mimics the professional Davis Cup structure.

### Workflow:
1.  **Event Deployment**: Define groups, number of rubbers per tie (1, 3, or 5), and event dates.
2.  **Assemble Teams**: Create team entries and assign them to specific groups (Group A, B, etc.).
3.  **Roster Setup**: Recruit registered players into team rosters.
4.  **Tie Generation**: One-click generation of group-stage ties.
5.  **Rubber Scoring**: Individual rubbers (Singles or Doubles) are scored. Lineups can be swapped easily after the toss using the 🔄 button.
6.  **Finalization**: Once all rubbers in a tie are complete, "Commit Victory" updates the team's standing in the live ledger.

---

## 📺 4. Live Tournament Arena
The "Theater Mode" homepage is the central hub for public spectators and live broadcasts.

### How it Works:
*   **Live Stream Integration**: Admins select a "Live Link" in Settings. The homepage automatically pulls the telemetry pack (matches, standings, analytics) for the selected event.
*   **Multi-View Dashboard**:
    *   🔴 **Live Feed**: Focused dashboard for active games.
    *   📊 **Ledger**: Historical match lists for the current event.
    *   🏆 **Standings**: Real-time group rankings.
    *   📈 **Analytics**: "Match Efficiency Peak" metric visualizing player/team win rates.
*   **Theater Scale**: Optimized for high-resolution displays to act as a digital scoreboard for the facility.

---

## 🛠️ 5. Technical Architecture
### Database Schema (Supabase)
The app relies on a relational schema designed for high-fidelity data tracking:

| Table | Purpose |
| :--- | :--- |
| `leagues` | Core definitions for seasonal play. |
| `league_players` | Junction table for player participation and live stats. |
| `league_matches` | Stores match results, types, and bracket info. |
| `dc_tournaments` | Configuration for Davis Cup events. |
| `dc_teams` | Team entries and calculated standings (Wins/Losses/Rubbers). |
| `dc_ties` | Team-level encounters ("Ties"). |
| `dc_matches` | Individual "Rubbers" within a tie. |

### Core Database RPCs (SQL)
To ensure data integrity, standings are calculated via PostgreSQL functions:
*   `update_league_player_match_stats`: Automates RR rankings for standard leagues.
*   `increment_dc_team_stats`: Automates team point calculations for Davis Cup.

---

## ⚙️ 6. Deployment & Settings
*   **Live Selector**: Located in `Admin -> Settings`. Use this to toggle between different events for the homepage Arena.
*   **Initial Migration**: Ensure `TOURNAMENT_SYSTEM.sql` and `MIGRATION_DC_SYSTEM_FINAL.sql` are executed in the Supabase SQL editor before running tournaments.

---
*Document Version: 1.0.0 (Arena Update)*
