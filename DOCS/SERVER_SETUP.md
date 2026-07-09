<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Server Setup Guide

[AMENDED 2026-07-09]: Paths corrected to `LOCAL_SERVER/` + `huggingface-space-SERVER/`; launcher flags documented.

This project has **two separate server configurations**:

## Directory Structure

```
Zombobs/
├── LOCAL_SERVER/                 # LOCAL DEVELOPMENT SERVER
│   ├── server.js                 # Local server (port 3000)
│   └── package.json              # Local dependencies (no MongoDB)
│
├── huggingface-space-SERVER/     # HUGGING FACE DEPLOYMENT
│   ├── Dockerfile                # HF Spaces Docker config
│   ├── server.js                 # HF server (port 7860)
│   ├── package.json              # HF deps (+ MongoDB, compression)
│   └── README.md                 # HF deployment notes
│
├── launch.bat                    # Windows double-click launcher
└── launch.ps1                    # PowerShell launcher (local server)
```

## Local Development Server

**Location**: `LOCAL_SERVER/`  
**Port**: `3000` (override with `-Port`, `$env:PORT`, or `$env:ZOMBOBS_PORT`)  
**URL**: http://localhost:3000

### Running Locally

1. **Easy**: Double-click `launch.bat` in the project root
2. **PowerShell**:
   ```powershell
   .\launch.ps1
   .\launch.ps1 -Port 3001
   .\launch.ps1 -NoBrowser
   .\launch.ps1 -KillPort          # free port 3000 if stuck
   ```
3. **Manual**:
   ```powershell
   cd LOCAL_SERVER
   npm install   # first run only
   npm start
   ```

### Launcher behavior (`launch.ps1`)

- Reads version from `LOCAL_SERVER/package.json`
- Requires Node.js **>= 18**
- Checks / optionally kills listeners on the target port
- Installs deps if `node_modules` (or `express`) is missing
- Opens `/landing.html` only after `/health` responds (or `-NoBrowser`)
- Prints Local / Landing / Game / Dashboard / LAN URLs
- Sets `PORT` for `server.js` before `npm start`

### Features

- Static game files + Socket.IO multiplayer lobby
- Health check: `GET /health`
- Dashboard: `/dashboard` (JSON) and `/dashboard/html`
- Enhanced connection logging

## Hugging Face Space Server

**Location**: `huggingface-space-SERVER/`  
**Port**: `7860` (HF Spaces default)  
**Direct URL (for Game Client)**: https://ottertondays-zombs.hf.space  
**Web URL (for Viewing)**: https://huggingface.co/spaces/OttertonDays/zombs

### Deploying to Hugging Face

1. Upload these files to the **root** of your HF Space repository:
   - `Dockerfile`
   - `server.js`
   - `package.json`
2. The Space builds and deploys automatically
3. Server is reachable at your Space URL

### MongoDB Setup (Required for Persistent Highscores)

The Hugging Face server uses MongoDB Atlas for persistent highscore storage. Without MongoDB, highscores stay in-memory and are lost on restart.

> **For detailed MongoDB documentation, see [MongoDB.md](./MONGODB.md)**

#### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account (M0 free tier is sufficient)
3. Create a new project named "Zombobs"

#### Step 2: Create a Cluster
1. Click **Build a Database**
2. Choose **M0 FREE** tier
3. Select a cloud provider and region (closest to Hugging Face Spaces)
4. Name your cluster (e.g., "Zombobs")
5. Click **Create**

#### Step 3: Configure Network Access
1. Go to **Security** → **Network Access**
2. Click **+ ADD IP ADDRESS**
3. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
   - Note: For Hugging Face Spaces, you must allow all IPs since HF IPs are dynamic
4. Click **Confirm**
5. Wait 1-2 minutes for changes to propagate

#### Step 4: Create Database User
1. Go to **Security** → **Database Access**
2. Click **+ ADD NEW DATABASE USER**
3. Choose **Password** authentication
4. Create username and password (save these!)
5. Set privileges to **Read and write to any database** (or specific to `zombobs`)
6. Click **Add User**

#### Step 5: Get Connection String
1. Go to **Database** → **Clusters**
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Select **Node.js** driver, version **6.7 or later**
5. Copy the connection string (format: `mongodb+srv://username:<password>@cluster.mongodb.net/?appName=Zombobs`)
6. Replace `<password>` with your database user's password

#### Step 6: Add to Hugging Face Spaces
1. Go to your Hugging Face Space: https://huggingface.co/spaces/OttertonDays/zombs
2. Click **Settings** → **Secrets**
3. Click **Add new secret**
4. Name: `MONGO_URI`
5. Value: Your complete connection string (with password replaced)
6. Click **Add secret**

#### Step 7: Verify Connection
1. Deploy your server to Hugging Face Spaces
2. Check the Container logs in your Space
3. You should see:
   ```
   [MongoDB] ✅ Connected to MongoDB Highscores
   [highscores] Loaded X highscores from MongoDB
   ```

If you see connection errors, verify:
- Network Access allows `0.0.0.0/0`
- Database user has correct permissions
- Connection string is correct in Hugging Face secrets
- Password doesn't contain special characters that need URL encoding

### Important Notes

- Files must be in the **root** of the HF Space repo (not in a subdirectory)
- The Dockerfile expects files in the root directory
- Port 7860 is required for Hugging Face Spaces
- **MongoDB is optional** — server runs with in-memory cache if MongoDB is unavailable
- Server includes debug logging for MongoDB connection status

## Differences

| Feature | Local Server | Hugging Face Server |
|---------|-------------|---------------------|
| Port | 3000 | 7860 |
| Location | `LOCAL_SERVER/` | `huggingface-space-SERVER/` |
| Launch | `launch.bat` / `launch.ps1` | Auto-deployed |
| MongoDB | Optional (`MONGO_URI`) | Recommended (HF secret) |
| Purpose | Development / LAN co-op | Production |

## Notes

- Both servers share the same Socket.IO lobby protocol
- Local launcher is the supported Windows entry point for day-to-day play
- Hugging Face server is optimized for cloud deployment + persistent highscores
- Local server can optionally use MongoDB by setting `MONGO_URI`
