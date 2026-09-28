# Otofarma Telehealth Dashboard

Admin console for Otofarma. One administrator signs in, then manages applications, device users, and guides. Device users cannot open this console.

The interface is English. The Android companion and the API are separate projects. This console talks to the API only.

- Android: https://github.com/omidshz100/Otofarma-Telehealth-Android
- Backend: https://github.com/omidshz100/Otofarma-Telehealth-Backend

## Requirements

- Node.js with npm
- The Otofarma API running on the same computer at `http://127.0.0.1:8000`

The browser calls `/api`. Vite proxies that path to the API and strips the `/api` prefix, so the console does not call port 8000 directly.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173. The API must already be listening on port 8000. Start it from the backend project with:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

`0.0.0.0` lets tablets reach the API. The dashboard itself stays on this computer.

Other scripts:

```bash
npm run build
npm run preview
npm run lint
```

## Sign in

Use the administrator email and password from the API environment. The default in `.env.example` is `admin@example.com` / `admin12345`.

A device account is rejected with “This console is only for the administrator.” The session token is stored in `sessionStorage` and cleared on sign out. A 401 from the API also sends the browser back to the login page.

## Dashboard

Home shows four counts: applications, device users, install reports sent by phones, and how many apps use Google Play versus a server file. It also lists each application with its package name, source, and version, plus recent API activity.

Quick actions: add an application, create a user, or open the application list to edit a guide.

## Applications

Each application has a name, Android package name, version, and one install source:

| Source | What the device does |
| --- | --- |
| Google Play | Opens the Play Store link |
| Download from server | Downloads the APK uploaded here |

Create the application first. The APK upload is available only after it exists, and only when the source is a server file. The file name must end in `.apk`.

The list can be filtered by name and by source. Edit opens the application. Delete removes it.

There is no Active, Draft, or Inactive status for an application. The guide has its own published state.

## Guides

The guide is edited on the application page. Sections are Overview, Setup, Usage, and Problems. Each block has a title, body, and optional solution. Images and videos can be attached.

**Save draft** stores the text without showing it on the device. **Publish** saves and then publishes. The device shows a guide only after it is published. Publishing does not require a new companion APK, and editing the text does not upload the APK again.

A block with an empty title cannot be saved.

## Users

A device user has:

- Name
- Role label. This is stored and shown in the app. It does not choose which apps the person sees.
- Gmail address. This is also the sign-in email on the tablet.
- Gmail password. This is a copy stored for the tablet. Changing it here does not change the Google account.
- App password. This is the password for the Otofarma app. Both the admin and the signed-in user can see and change it.
- A checkbox list of assigned applications.

The Gmail mailbox is created by the administrator outside this platform. The API does not create mailboxes.

On an existing user, leave a password blank to keep the current value. Passwords must be at least 8 characters when they are set. Copy buttons sit next to the Gmail address and both passwords.

Below the form, **Install status** shows what that user's device last reported: installed or not, the installed version, and the report time. **Notifications** lists the latest stored notices for that user, such as an app assignment, a published guide, or a new APK. The phone notification tray is not part of this version.

## What is not in this version

- More than one administrator
- Roles and access, warnings, and a settings page
- Sign-up and forgot-password screens
- Delivery of notices to the phone tray. That needs Firebase later.
