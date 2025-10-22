# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Bundle app source
COPY . .

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Define environment variable for the port
ENV PORT=8080

# Run server.js when the container launches
CMD ["node", "server.js"]
