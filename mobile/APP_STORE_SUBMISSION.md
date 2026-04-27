# KudiLoc — Apple App Store Submission

## App Store Connect — Basic Info

| Field | Value |
|---|---|
| **App Name** | KudiLoc |
| **Bundle ID** | com.kudivila.kudiloc |
| **Primary Language** | Portuguese (Portugal) |
| **Category** | Navigation |
| **Secondary Category** | Utilities |
| **Content Rights** | You own or have rights to all content |

---

## Version Information

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Copyright** | © 2026 Kudivila |
| **Support URL** | https://kudiloc.com/support *(or `mailto:admin@kudiloc.com`)* |
| **Marketing URL** | *(leave blank for now)* |
| **Privacy Policy URL** | https://kudiloc.com/privacy *(see note below)* |

> **Note on Privacy Policy URL:** Apple requires a publicly accessible URL for your privacy policy. You already have the policy inside the app at `/legal/privacy`. You need to publish it online. The fastest option is a free Notion page or a GitHub Pages site with the same content.

---

## App Description

> Copy and paste directly into the "Description" field in App Store Connect. Maximum 4000 characters.

```
KudiLoc is the community-powered platform that tells you, in real time, which ATMs near you have cash available.

In Angola, finding an ATM with money can take hours and several kilometres of travel. KudiLoc solves that: users like you report in seconds whether an ATM has cash or not, and that information is instantly available to the whole community.

KEY FEATURES

• Interactive map — see all ATMs in your area with colour-coded pins: green (has cash), red (no cash), grey (out of service).

• Automatic location — the app detects your position and shows the nearest ATMs sorted by walking distance.

• Real-time reports — report an ATM's status in 3 seconds. The map updates instantly.

• ATM list — filter by bank, status, or favourites. Search by name or location.

• Full ATM detail — view report history, reliability score (%), paper availability, and operational status.

• Favourites — save the ATMs you use most for quick access.

• Navigation — open any ATM in Google Maps or Apple Maps with a single tap.

• Leaderboard — the most active community contributors earn reputation points.

HOW IT WORKS
Information is based on crowd-sourced reports from users. The more recent and consistent the reports, the more reliable the data. The platform uses a reputation-weighted algorithm to calculate a reliability score for each ATM.

KudiLoc is not a financial platform. It does not process payments or store banking data.

Available across Angola. Starting in Luanda, growing with the community.
```

---

## Subtitle (30 characters max)

```
Find ATMs with cash near you
```

*(28 characters)*

---

## Keywords (100 characters max, comma-separated)

```
ATM,cash,Angola,Luanda,bank,locator,map,money,multibanco,finder,nearby
```

*(71 characters)*

---

## What's New (version 1.0.0)

```
Initial release of KudiLoc.
```

---

## App Review Information

Fill in these fields in the "App Review Information" section of App Store Connect:

| Field | Value |
|---|---|
| **First Name** | Kiuma |
| **Last Name** | Veloso |
| **Phone** | +244 929 096 652 |
| **Email** | admin@kudiloc.com |

### Demo Account (required — the app requires login)

Apple needs a working test account to review the app. Create one before submitting:

1. Open the app → create an account with a real phone number you have access to
2. Fill in App Store Connect:

| Field | Value |
|---|---|
| **Username** | *(the test phone number, e.g. +244 9XX XXX XXX)* |
| **Password** | *(OTP is not a password — write "Authentication via SMS OTP")* |

### Notes for Reviewer

```
This app uses OTP (SMS) authentication. To log in:

1. Enter the phone number provided above.
2. A 6-digit code will be sent to that number via SMS.
3. Enter the code to access the app.

The app requests location permission to show nearby ATMs (core functionality).
The app is designed for Angola — ATM data is real and refers to Angolan cash machines.
```

---

## Age Rating Questionnaire

Answer as follows in the App Store Connect questionnaire:

| Question | Answer |
|---|---|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Sexual Content or Nudity | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| Alcohol, Tobacco, or Drug Use | None |
| Gambling | None |
| Contests | None |
| User-Generated Content | Yes — users submit ATM status reports |
| Unrestricted Web Access | No |

**Expected result:** 4+

---

## Privacy — Data Collection (App Privacy in App Store Connect)

Fill in the "App Privacy" section with the following:

### Data Collected

| Data Type | Used For | Linked to Identity | Tracking |
|---|---|---|---|
| **Phone Number** | Authentication | Yes | No |
| **Name** | App Functionality | Yes | No |
| **Precise Location** | App Functionality | No | No |
| **Coarse Location** | App Functionality | No | No |
| **User ID** | App Functionality | Yes | No |
| **Product Interaction** | Analytics | No | No |

### Clarifications
- **Phone Number:** used only for OTP authentication. Stored encrypted (AES-256).
- **Location:** used to show nearby ATMs. Not stored permanently or linked to the user profile.
- **Reports:** ATM reports are visible within the platform but are not publicly linked to the user's name.

---

## Pre-Submission Checklist

- [ ] Privacy Policy published at a public URL (e.g. GitHub Pages, Notion, own website)
- [ ] Test account created with a working phone number
- [ ] Screenshots prepared (see below)
- [ ] iOS build uploaded via `eas build --platform ios --profile production`
- [ ] Apple ID, Team ID and ASC App ID filled in `eas.json`

---

## Required Screenshots

The App Store requires screenshots for iPhone. Required sizes:

| Device | Resolution |
|---|---|
| iPhone 6.9" (required) | 1320 × 2868 px |
| iPhone 6.7" (required) | 1290 × 2796 px |

You can take screenshots on the iPhone 16 Pro Max (6.9") and iPhone 15 Pro Max (6.7") simulators via Xcode or:
```
xcrun simctl io booted screenshot screenshot.png
```

**Recommended screenshots (5):**
1. Map with green/red/grey ATM pins
2. ATM detail screen (status, reliability score, distance)
3. ATM list with filters
4. Quick report screen
5. Leaderboard or Profile screen
