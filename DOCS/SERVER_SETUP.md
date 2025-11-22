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

### Important Notes

- Files must be in the **root** of the HF Space repo (not in a subdirectory)
- The Dockerfile expects files in the root directory
- Port 7860 is required for Hugging Face Spaces

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

