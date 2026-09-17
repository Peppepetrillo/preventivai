# PreventivAI — Final Beta Handoff

**Date:** 2026-09-17  
**Purpose:** Human handoff GitHub → Xcode → iPhone Device QA  
**Freeze:** No new features. No signing/deploy from agents.

━━━━━━━━━━━━━━━━━━━━━━━━━━  
PREVENTIVAI — FINAL BETA HANDOFF  
━━━━━━━━━━━━━━━━━━━━━━━━━━  

SOURCE BRANCH: `cursor/final-beta-polish-74ac`  

COMMIT: `8761810` (pull branch tip; handoff chore `1aa3fc7`)

TEST: **1857 PASS** / 0 FAIL  

BUILD: OK  

LINT: OK (0 errors; 14 preexisting warnings)  

CAPACITOR: OK (`npx cap sync ios`)  

IOS PROJECT: READY  
- Path: `ios/App/App.xcodeproj` (+ `CapApp-SPM`)  
- Open on Giuseppe’s Mac after pull + sync  

BUNDLE ID: `com.preventivai.app` (unchanged)  

VERSION:  
| Surface | Value | Location |
|---------|-------|----------|
| npm | `1.0.0-rc.3` | `package.json` |
| iOS MARKETING_VERSION | `1.0` | `ios/App/App.xcodeproj/project.pbxproj` |
| iOS CURRENT_PROJECT_VERSION | `1` | same |
| iOS deployment target | `15.0` | same |
| Android versionName | `1.0` | `android/app/build.gradle` |
| Android versionCode | `1` | same |
| Capacitor appId | `com.preventivai.app` | `capacitor.config.json` |

VERSION MISMATCH: **YES** (npm `1.0.0-rc.3` vs native `1.0`)  

HUMAN DECISION: **#11** — do not auto-bump to public `1.0.0`; Giuseppe chooses TestFlight rc vs Store `1.0.0` (`docs/APP-STORE-RELEASE.md`, `docs/HUMAN-DECISIONS.md`)  

Info.plist permissions present:  
- `NSCameraUsageDescription`  
- `NSPhotoLibraryUsageDescription`  
- `NSMicrophoneUsageDescription`  
- `NSSpeechRecognitionUsageDescription`  

GITHUB: PUSHED  

PR: draft (keep draft — no merge)  

DEVICE QA: **NOT TESTED** (`docs/DEVICE-QA-RELEASE.md`)  

APPLE SIGNING: **NOT DONE**  

TESTFLIGHT: **NOT DONE**  

STORE: **NOT READY**  

---

## NEXT HUMAN STEP

1. Pull branch `cursor/final-beta-polish-74ac`  
2. On Mac: `npm ci && npm run build && npx cap sync ios`  
3. Open `ios/App/App.xcodeproj` in Xcode  
4. Select physical iPhone + team signing (Giuseppe)  
5. Run  
6. Execute `docs/DEVICE-QA-RELEASE.md`  
7. Report **P0/P1 only**  

Companion: `docs/FINAL-BETA-POLISH-REPORT.md`, `docs/APP-STORE-RELEASE.md`, `docs/PREVENTIVAI-2.0-BACKLOG.md`
