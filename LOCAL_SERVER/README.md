# Local Development Server

This directory contains the local development server for Zombobs multiplayer.

## Files

- **`server.js`** - Socket.io server for local development (port 3000)
- **`package.json`** - Node.js dependencies
- **`node_modules/`** - Installed dependencies (auto-generated)

## Running the Server

### Windows
- Double-click `../launch.bat` in the project root
- Or run `../launch.ps1` in PowerShell

### Manual
```bash
cd server
npm install  # First time only
npm start
```

## Server Details

- **Port**: 3000 (default)
- **URL**: http://localhost:3000
- **Socket.io**: Enabled with CORS for all origins
- **Health Check**: Available at `/health`

## Notes

- This is separate from the Hugging Face Space deployment files
- The local server is for development and testing
- Use `../launch.ps1` for the best experience (includes Hugging Face connection testing)

