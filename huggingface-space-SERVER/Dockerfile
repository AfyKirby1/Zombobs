FROM node:18-slim

WORKDIR /app

# Copy package files (from root or server directory)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server file (from root)
COPY server.js ./

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860

# Set environment variable
ENV PORT=7860

# Start the server
CMD ["node", "server.js"]
