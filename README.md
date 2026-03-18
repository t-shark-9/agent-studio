# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Optional App Builds (Mac, Windows, iPhone)

This project now includes optional wrappers so the same codebase can run as:

- Browser app (default)
- Desktop app via Tauri (macOS + Windows)
- iPhone app via Capacitor (iOS project)

### Desktop app (Tauri)

Requirements:

- Rust toolchain (`cargo`, `rustc`)
- Platform build tools (Xcode for macOS, Visual Studio Build Tools for Windows)

Commands:

```sh
npm run desktop:dev
npm run desktop:build
```

Tauri source files are in `src-tauri/`.

### iPhone app (Capacitor)

Commands:

```sh
# First time only (creates ios/ project)
npm run mobile:add:ios

# Build web app and sync native iOS shell
npm run mobile:build

# Open in Xcode
npm run mobile:ios
```

This creates/syncs the iOS native shell from the web build and opens it in Xcode.

### Runtime bridge for desktop shell access

The desktop wrapper includes a guarded command bridge in:

- `src-tauri/src/main.rs` (allowlist-based command execution)
- `src/lib/nativeRuntime.ts` (frontend helper)

By default, only safe allowlisted commands are enabled. Extend the allowlist intentionally before enabling broader shell workflows.

## Smart Home Stack

Agent Studio now includes a dedicated smart-home integration layer for:

- Home Assistant
- MQTT brokers
- A local bridge service for Bluetooth, Samsung SmartThings, Apple Home, and Amazon Alexa adapters

### Services to run

```sh
# Integrations API
cd /root/integrations-api
npm install
npm start

# Local bridge service
cd /root/local-device-bridge
npm install
cp bridge.config.example.json ~/.openclaw/device-bridge.json
BRIDGE_TOKEN=change-me npm start
```

### Agent Studio UI

Open the Account modal in Agent Studio and switch to `Connections`.

You can now configure and test:

- `Home Assistant`: direct REST base URL + long-lived token
- `MQTT Broker`: broker URL + optional credentials + topic prefix
- `Local Bluetooth Bridge`: internal bridge URL + optional token
- `Samsung SmartThings`: bridge-backed adapter profile
- `Apple Home`: bridge-backed adapter profile for Homebridge/HomeKit webhooks
- `Amazon Alexa`: bridge-backed adapter profile for Alexa Remote, Node-RED, or Home Assistant flows

### AI action names

These actions can now be executed through `/integrations/execute`:

- `HOME_ASSISTANT_CALL_SERVICE`
- `HOME_ASSISTANT_LIST_STATES`
- `MQTT_PUBLISH`
- `LOCAL_DEVICE_BRIDGE_COMMAND`
- `BLUETOOTH_BRIDGE_COMMAND`
- `SMARTTHINGS_COMMAND`
- `APPLE_HOME_COMMAND`
- `ALEXA_COMMAND`

Example payload:

```json
{
	"action": "MQTT_PUBLISH",
	"params": {
		"topic": "coffee-machine/power/set",
		"payload": {
			"state": "ON"
		},
		"retain": false,
		"qos": 1
	}
}
```
