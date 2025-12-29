# ETHMumbai Maxi Checker

## 1. Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## 2. Why Twitter API?
You originally requested **"Login with Twitter"**. To make this work, the app needs permission to talk to Twitter's servers to verify the user's identity. This requires:
1. A Twitter Developer Account.
2. API Keys (Client ID/Secret) plugged into Firebase.

**Don't want to use an API?**
We can switch the code to use **Anonymous Login** (no setup required) or **Google Login** (easier setup). Let me know if you want me to change the code to remove the Twitter requirement!

## 3. Deployment (Manual Google Cloud via GitHub)

Since you don't want to use the Firebase CLI, here is the "Cloud Native" way using **Google Cloud Run**:

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a repo on GitHub, then:
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git push -u origin main
   ```

2. **Deploy to Google Cloud Run**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Search for **Cloud Run**.
   - Click **Create Service**.
   - Choose **"Continuously deploy new revisions from a source repository"**.
   - Connect your **GitHub** account and select this repository.
   - Select **"Dockerfile"** as the build type.
   - Allow **unauthenticated invocations** (so the public can play).
   - Click **Create**.

Google Cloud will now automatically build your Docker container and host it!
