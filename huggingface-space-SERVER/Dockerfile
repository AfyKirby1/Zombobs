FROM node:18-slim

WORKDIR /app

# Copy package files from huggingface-space-SERVER directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server file from huggingface-space-SERVER directory
COPY server.js ./

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860

# Set environment variable
ENV PORT=7860

# Start the server
CMD ["node", "server.js"]
