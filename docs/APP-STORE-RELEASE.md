# App Store / Play — Release checklist for Giuseppe

**Bundle ID (do not change):** `com.preventivai.app`  
**Display name:** PreventivAI  
**npm / marketing track:** `1.0.0-rc.3` (`package.json`)  
**Native today:** iOS `MARKETING_VERSION = 1.0` (Xcode) · Android `versionName "1.0"` / `versionCode 1`  

### Version alignment — HUMAN DECISION REQUIRED

| Surface | Value | File |
|---------|-------|------|
| npm | `1.0.0-rc.3` | `package.json` |
| iOS marketing | `1.0` | `ios/App/App.xcodeproj/project.pbxproj` |
| Android | `1.0` / code `1` | `android/app/build.gradle` |

Agents **must not** auto-bump to public `1.0.0`. Giuseppe chooses:

- **A)** Keep `1.0.0-rc.3` for TestFlight / internal until beta sign-off  
- **B)** Align native + npm to `1.0.0` at Store submit  

Until then: mismatch is documented, not a code P0.

Agents must **not** touch Apple/Google accounts or signing certificates.

---

## Already in repo (READY)

| Item | Evidence |
|------|----------|
| Bundle / applicationId | `capacitor.config.json`, Xcode, `android/app/build.gradle` |
| Display name | Info.plist `PreventivAI` |
| Camera usage string | `NSCameraUsageDescription` |
| Photo library string | `NSPhotoLibraryUsageDescription` |
| Microphone string | `NSMicrophoneUsageDescription` (voce) |
| Speech recognition string | `NSSpeechRecognitionUsageDescription` |
| Android `RECORD_AUDIO` | `AndroidManifest.xml` |
| Android `allowBackup=false` | manifest |
| ITSAppUsesNonExemptEncryption | `false` |
| Launch / splash storyboard | `UILaunchStoryboardName` |
| PWA icons | `public/icon-192.png`, `icon-512.png` |

---

## Giuseppe must do (HUMAN)

### Apple

1. Apple Developer Program membership active.  
2. Create/confirm App ID `com.preventivai.app`.  
3. Certificates + provisioning (Development → Distribution).  
4. App Store Connect listing: subtitle, description, keywords, support URL.  
5. **Privacy Policy URL** (mandatory) — host page.  
6. App Privacy nutrition labels (data collected: sync account?, analytics none?, contacts none?).  
7. Screenshots (6.7" + 6.1" minimum).  
8. Review notes: offline-first; mic for Preventivo vocale; no account required for core if true.  
9. Age rating questionnaire.  
10. If IAP/trial: complete freemium HUMAN #7+#8 **or** submit without IAP (recommended Oct path).  
11. Archive → upload → TestFlight → external/public.

### Google Play

1. Play Console app with `com.preventivai.app`.  
2. Signing key (Play App Signing).  
3. Store listing + graphic assets.  
4. Data safety form.  
5. Privacy policy URL.  
6. Internal testing track → production.  
7. Microphone permission declaration / justification.

### Capacitor build (Giuseppe machine)

```bash
npm ci
npm test && npm run lint && npm run build
npx cap sync ios
npx cap sync android
npx cap open ios    # Xcode archive
npx cap open android
```

---

## Risk if skipped

| Skip | Store outcome |
|------|----------------|
| Privacy URL | Reject |
| Mic purpose mismatch | Reject |
| IAP without restore | Guideline reject |
| Wrong bundle | New app / lost reviews |

---

## Agent autonomy

| Allowed | Forbidden |
|---------|-------------|
| Permission string copy fixes | Change Bundle ID |
| Version bump **after** Giuseppe GO | Upload to ASC/Play |
| Docs / checklists | Create certificates |
