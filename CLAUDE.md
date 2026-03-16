# AR-DeC: Augmented Reality Didactic Companion

## Project Overview
AR-DeC is a mobile educational app combining OCR scanning, AI-powered Intelligent Tutoring (ITS), Augmented Reality overlays, and gamification. Students scan text from textbooks, receive contextual explanations, and see AR visualizations. The project also produces a Scopus Q1 academic article in LaTeX.

## Current Status
- **Phase 0 (RAG)**: COMPLETE — 47 articles, 2,577 chunks in Weaviate
- **Phase 1 (App)**: IN PROGRESS — Expo scaffolded, dependencies installed, src/ empty
- **Phase 2 (Article)**: NOT STARTED — structure planned, BibTeX available
- **Agent Team**: 7 agents with 35 skills defined in agents/

## Architecture
- **Mobile App**: React Native 0.83 + Expo 55 (TypeScript)
- **AR Engine**: ViroReact (ReactVision) ^2.52.1 — ARKit + ARCore
- **OCR**: react-native-mlkit-ocr ^0.3.0 (Google ML Kit, on-device)
- **AI/NLP**: Claude API or local model for word explanations
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **State Management**: Zustand ^5.0.11
- **Navigation**: React Navigation ^7 (native-stack)
- **RAG Pipeline**: Weaviate 1.28.4 (Docker) + text2vec-transformers (all-MiniLM-L6-v2)

## Directory Structure
```
AR-DeC/
├── rag/                          # RAG vector database pipeline (COMPLETE)
│   ├── docker-compose.yml        # Weaviate + text2vec-transformers
│   ├── ingest.py                 # Ingest 47 curated articles
│   ├── query.py                  # Semantic search CLI (search/list/stats)
│   └── requirements.txt          # weaviate-client, rich
├── app/                          # React Native mobile app (IN PROGRESS)
│   ├── App.tsx                   # Entry — needs navigation setup
│   ├── index.ts                  # registerRootComponent
│   ├── app.json                  # Expo config
│   ├── package.json              # All deps installed
│   ├── tsconfig.json             # strict mode
│   ├── assets/                   # icon, splash + empty: images/, models/, sounds/
│   └── src/                      # ALL EMPTY — ready for implementation
│       ├── screens/              # HomeScreen, ScannerScreen, ARViewScreen, ResultScreen, ProfileScreen, QuizScreen
│       ├── components/           # WordCard, PointsAnimation, BadgePopup, ProgressRing, StreakCounter
│       ├── services/             # ocrService, itsService, gamificationService
│       ├── store/                # scanStore, studentStore, gamificationStore (Zustand)
│       ├── models/               # types.ts — all TypeScript interfaces
│       ├── gamification/         # Points, badges, streaks, quiz logic
│       ├── ar/                   # AR scene components for ViroReact
│       └── utils/                # Helpers
├── article/                      # LaTeX academic article (NOT STARTED)
│   ├── main.tex                  # Springer sn-jnl template
│   ├── sections/                 # 10 section files
│   ├── figures/                  # TikZ diagrams
│   └── references.bib            # From Zotero + curated articles
├── agents/                       # Expert agent team (COMPLETE)
│   ├── senior-dev-architect.md   # Tech Lead — coordination, architecture
│   ├── research-scientist.md     # Literature, methodology, academic writing
│   ├── mobile-ar-architect.md    # React Native, ViroReact, OCR
│   ├── its-ai-engineer.md        # ITS engine, LLM integration, adaptive learning
│   ├── gamification-ux-designer.md # Gamification, UX, engagement
│   ├── data-engineer.md          # RAG pipeline, Weaviate, data
│   ├── latex-specialist.md       # LaTeX formatting, figures, submission
│   └── skills/                   # 5 skills per agent (35 total)
├── .claude/
│   ├── used-Data/                # 47 curated Zotero articles (PDFs + ft-cache)
│   └── data zotero/              # Full 567-article Zotero library (raw)
└── CLAUDE.md                     # This file
```

## App Data Pipeline
```
Camera Feed → OCR (ML Kit) → Text Extraction → Word Tokenization
  → ITS Engine (context analysis + AI explanation)
  → AR Renderer (overlay on camera feed)
  → Gamification (update points/progress)
  → Student Model (update mastery state)
```

## App Build Order
1. `src/models/types.ts` — TypeScript interfaces (ScannedWord, Explanation, StudentProfile, Badge, etc.)
2. `src/store/*` — Zustand stores (scanStore, studentStore, gamificationStore)
3. `src/services/*` — Business logic (ocrService, itsService, gamificationService)
4. `src/components/*` — Reusable UI (WordCard, PointsAnimation, BadgePopup, ProgressRing)
5. `src/screens/*` — App screens (Home, Scanner, ARView, Result, Profile, Quiz)
6. `App.tsx` — Navigation setup (bottom tabs + stack modals)

## Gamification System
- **Points**: Scan (+5), Read (+3), Quiz correct (+10), Daily streak (+20)
- **Levels**: Beginner (0-100), Explorer (100-500), Scholar (500-2000), Master (2000+)
- **Badges**: Explorer (scan milestones), Scholar (quiz mastery), Streak (consecutive days), Subject (domain mastery)
- **Quiz**: MCQ from scanned vocab, 15s timer, combo multiplier

## ITS Components
- **Domain Model**: Vocabulary DB, concept relationships, difficulty levels
- **Student Model**: Per-word mastery via Bayesian Knowledge Tracing (BKT)
- **Tutoring Model**: Adaptive content selection based on Bloom's taxonomy level
- **Interface Model**: AR presentation strategy (text overlay vs. 3D model vs. quiz)

## Research Data
- **47 curated articles** in `.claude/used-Data/` — 2,577 vector chunks in Weaviate
- **Article categories**: mobile_ar_education (6), ar_its_integration (7), ar_gamification (8), its_design (5), ar_review (3), ar_education_general (18)
- **BibTeX**: `.claude/data zotero/XB52Q53Z/references_ce.bib` (existing, Computers & Education formatted)
- **RIS export**: `.claude/data zotero/HXPPAB3G/mobile AR educational - Mar 06, 2026.ris`
- **Full Zotero library**: 567 articles in `.claude/data zotero/`

## Key Commands
```bash
# RAG (Phase 0 — COMPLETE)
cd rag && docker compose up -d          # Start Weaviate
py rag/ingest.py                        # Ingest articles (already done)
py rag/query.py search "query here"     # Semantic search
py rag/query.py list                    # List all 47 articles
py rag/query.py stats                   # DB stats (2,577 chunks)

# App (Phase 1)
cd app && npx expo start                # Start dev server
cd app && npx expo start --android      # Android emulator
cd app && npx expo start --ios          # iOS simulator

# Article (Phase 2)
cd article && pdflatex main.tex && bibtex main && pdflatex main.tex && pdflatex main.tex
```

## Target Journals (Q1 Scopus)
- Computers & Education (IF: 12.0)
- Education and Information Technologies (IF: 5.5, Springer)
- Interactive Learning Environments (IF: 4.7)

## Theoretical Framework
- **ARCS Motivational Model**: Attention (AR visuals), Relevance (contextual scanning), Confidence (adaptive difficulty), Satisfaction (gamification rewards)
- **Bloom's Taxonomy**: Remember (definition) → Understand (examples) → Apply (quiz) → Analyze (related concepts)
- **Design-Based Research (DBR)**: Iterative design-evaluate-refine methodology

## Environment Notes
- Windows 11, Python 3.14 via `py` launcher
- Docker Desktop with Docker Compose v2.40
- Node.js + npm for React Native
- Weaviate on localhost:8080 (Docker volume for persistence)
