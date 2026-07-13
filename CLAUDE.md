# CLAUDE.md

## Project Name

Super Tic Tac Toe

---

# Project Goal

Build a modern cross-platform Ultimate Tic Tac Toe game that works on:

* Web
* Mobile
* Tablet

The game must support:

* Classic Tic Tac Toe
* Super Tic Tac Toe
* Local Multiplayer
* AI Opponent
* Online Multiplayer (future)
* Multiple Rule Variants
* Custom Themes
* Future Competitive Features

The codebase must be scalable, maintainable, and production-ready.

---

# Core Architecture Rules

## Rule 1

Game Logic MUST be completely separated from UI.

Never place game logic inside React components.

---

## Rule 2

All game logic must exist inside:

/game-engine

The game engine should be framework-independent.

---

## Rule 3

Every game rule must be configurable.

Do NOT hardcode any rules.

Rules must be loaded through Rule Presets.

---

## Rule 4

Future multiplayer support must already be considered during development.

The engine must work identically for:

* Local play
* AI play
* Online play

---

# Technology Stack

Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Framer Motion

Animations

* Framer Motion
* Three.js
* React Three Fiber

Mobile

* React Native
* Expo

Future Backend

* Node.js
* Socket.IO
* PostgreSQL

Alternative Backend

* Supabase

---

# Folder Structure

/src

/components

/screens

/game-engine

/game-engine/rules

/game-engine/models

/game-engine/utils

/game-engine/validators

/game-engine/ai

/hooks

/services

/assets

/types

/themes

---

# Game Modes

## Mode 1

Classic Tic Tac Toe

Traditional 3x3 board.

---

## Mode 2

Super Tic Tac Toe

Main board contains 9 individual Tic Tac Toe boards.

Total playable cells:

81

---

# Super Tic Tac Toe Rules

## Board Structure

Main Board:

3x3

Each section contains:

3x3

Total Boards:

9

Total Cells:

81

---

# Move Redirection Rule

When a player places a mark inside a cell:

The coordinate of that cell determines the board where the next player must play.

Example:

Player X plays:

Board E
Top Right Cell

Top Right corresponds to Board C.

Player O must play inside Board C.

---

# Board Ownership

If a player wins a small board:

That board becomes owned by that player.

The board is locked.

No further moves can be made there.

---

# Global Win Condition

The 9 small boards create a larger Tic Tac Toe board.

Winning 3 owned boards in a row:

* Horizontal
* Vertical
* Diagonal

wins the entire match.

---

# Rule Preset System

The engine MUST support multiple rule variants.

Never hardcode one version.

---

## Preset A

Classic Ultimate Rules

Won Board:
Free Move Anywhere

Draw Board:
Free Move Anywhere

---

## Preset B

Control Draw Rules (Original Game Concept)

Won Board:
Free Move Anywhere

Draw Board:
Control Board

If a player is sent to a drawn board:

The player who redirected them there chooses which playable board they must play in next.

Restrictions:

Destination board must:

* Not be won
* Not be drawn
* Have empty cells

This mechanic creates strategic board control.

---

## Preset C

Portal Draw Rules

Won Board:
Free Move Anywhere

Draw Board:
Portal Board

If a player is sent to a drawn board:

That player may choose any valid playable board.

---

## Preset D

Custom Rules

Players can configure:

* Won Board Behavior
* Draw Board Behavior
* Free Move Behavior
* Board Redirection Rules

---

# AI Requirements

Support:

Easy

Medium

Hard

Future:

Expert

Easy:
Random Moves

Medium:
Priority Logic

Hard:
Minimax

Future:
Advanced Minimax + Heuristics

---

# Landing Page Requirements

Main Menu

Play

Settings

Themes

Statistics

Future Online Mode

---

# Play Menu

Classic Tic Tac Toe

Super Tic Tac Toe

---

# Match Setup

Game Mode

Rule Preset

Theme

Opponent Type

Difficulty

Start Game

---

# UI Requirements

Modern

Colorful

Premium

Smooth

Responsive

Mobile Friendly

---

# Visual Features

Animated Backgrounds

3D Floating Shapes

Particle Effects

Glow Effects

Board Hover Effects

Turn Transition Effects

Victory Animations

Confetti

Dynamic Color Changes

---

# Turn Feedback

Player X Turn

Background gradually shifts toward Player X color.

Player O Turn

Background gradually shifts toward Player O color.

---

# Victory Screen

Large animated winner reveal.

Replay button.

Return to menu button.

Statistics summary.

---

# Audio Support

Prepare architecture for:

* Click sounds
* Hover sounds
* Victory sounds
* Background music

Do not hardcode audio implementation.

---

# Future Features

Online Multiplayer

Friends System

Accounts

Achievements

Leaderboards

Ranked Matches

Spectator Mode

Replays

Tournament Mode

Cosmetics

Seasonal Themes

---

# Code Quality Requirements

TypeScript Strict Mode

Reusable Components

Reusable Hooks

Modular Architecture

No Duplicate Logic

Strong Typing

Maintainable Folder Structure

Unit Test Ready

Production Ready

Scalable First
