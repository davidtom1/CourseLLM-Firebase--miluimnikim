# Use the official Node.js image with TypeScript support as base
FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm

# Install Python 3.12
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-venv \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install uv (Python package manager)
RUN pip install --no-cache-dir uv

# Set Python 3.12 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.12 1

# Install pnpm globally
RUN npm install -g pnpm

# Install Firebase CLI
RUN npm install -g firebase-tools

# Create a directory for the workspace
WORKDIR /workspaces/CourseLLM-Firebase

# Copy the dev container setup scripts
COPY .devcontainer/setup.sh /tmp/setup.sh
RUN chmod +x /tmp/setup.sh

# Install common development utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    nano \
    vim \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for development
ENV NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true \
    FIRESTORE_EMULATOR_HOST=localhost:8080 \
    FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
    NODE_ENV=development

# Expose development ports
EXPOSE 3000 9002 8000 8080 9099 5001 4000 9400

# Default command
CMD ["/bin/bash"]
