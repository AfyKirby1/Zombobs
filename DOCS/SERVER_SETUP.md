# Server Setup Guide

This project has **two separate server configurations**:

## 📁 Directory Structure

```
Zombobs/
├── server/                    # LOCAL DEVELOPMENT SERVER
│   ├── server.js             # Local server (port 3000)
│   ├── package.json          # Local dependencies
│   └── README.md             # Local server docs
│
├── huggingface-space/         # HUGGING FACE DEPLOYMENT
│   ├── Dockerfile            # HF Spaces Docker config
│   ├── server.js             # HF server (port 7860)
│   ├── package.json          # HF dependencies
│   └── README.md             # HF deployment docs
│
├── launch.bat                # Windows launcher (local server)
└── launch.ps1                # PowerShell launcher (local server)
```

## 🖥️ Local Development Server

**Location**: `server/` directory  
**Port**: 3000  
**URL**: http://localhost:3000

### Running Locally

1. **Easy Way**: Double-click `launch.bat` in the project root
2. **PowerShell**: Run `launch.ps1` from the project root
3. **Manual**:
   ```bash
   cd server
   npm install  # First time only
   npm start
   ```

### Features

- Tests Hugging Face server connection on startup
- Shows connection status for both servers
- Enhanced logging for client connections/disconnections
- Health check endpoint at `/health`

## ☁️ Hugging Face Space Server

**Location**: `huggingface-space/` directory  
**Port**: 7860 (HF Spaces default)  
**Direct URL (for Game Client)**: https://ottertondays-zombs.hf.space  
**Web URL (for Viewing)**: https://huggingface.co/spaces/OttertonDays/zombs

### Deploying to Hugging Face

1. Upload these files to the **root** of your HF Space repository:
   - `Dockerfile`
   - `server.js`
   - `package.json`

2. The Space will automatically build and deploy

3. Server will be accessible at your Space URL

### MongoDB Setup (Required for Persistent Highscores)

The Hugging Face server uses MongoDB Atlas for persistent highscore storage. Without MongoDB, highscores will be stored in-memory only and lost on server restarts.

> **📖 For detailed MongoDB documentation, see [MongoDB.md](./MONGODB.md)**

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
- **MongoDB is optional** - Server will run with in-memory cache only if MongoDB unavailable
- Server includes debug logging to track MongoDB connection status

## 🔄 Differences

| Feature | Local Server | Hugging Face Server |
|---------|-------------|---------------------|
| Port | 3000 | 7860 |
| Location | `server/` | `huggingface-space/` |
| Launch | `launch.bat` / `launch.ps1` | Auto-deployed |
| Purpose | Development/Testing | Production |

## 📝 Notes

- Both servers have identical functionality
- Only difference is the port number
- Local server includes enhanced logging and connection testing
- Hugging Face server is optimized for cloud deployment
- **Hugging Face server uses MongoDB for persistent highscores** (requires setup above)
- Local server can optionally use MongoDB by setting `MONGO_URI` environment variable

