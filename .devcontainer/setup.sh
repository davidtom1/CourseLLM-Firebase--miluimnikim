#!/bin/bash
set -e

echo "🚀 Setting up CourseLLM development environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}Checking Node.js...${NC}"
node --version
npm --version

# Check Python version
echo -e "${BLUE}Checking Python...${NC}"
python --version
pip --version

# Install/update pnpm
echo -e "${BLUE}Installing pnpm...${NC}"
npm install -g pnpm@latest
pnpm --version

# Install/update uv
echo -e "${BLUE}Installing uv...${NC}"
pip install --upgrade uv
uv --version

# Install Node dependencies
echo -e "${BLUE}Installing Node dependencies...${NC}"
cd /workspaces/CourseLLM-Firebase
pnpm install

# Install Python dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
uv sync --python 3.12

# Create .env.local from .env.example if it doesn't exist
if [ ! -f /workspaces/CourseLLM-Firebase/.env.local ]; then
    echo -e "${YELLOW}Creating .env.local from .env.example...${NC}"
    cp /workspaces/CourseLLM-Firebase/.env.example /workspaces/CourseLLM-Firebase/.env.local
    echo -e "${YELLOW}⚠️  Please update .env.local with your API keys!${NC}"
fi

# Install Firebase CLI if not already installed
echo -e "${BLUE}Checking Firebase CLI...${NC}"
if ! command -v firebase &> /dev/null; then
    echo -e "${BLUE}Installing Firebase CLI...${NC}"
    npm install -g firebase-tools
fi
firebase --version

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}📚 Next steps:${NC}"
echo -e "   1. Update .env.local with your API keys"
echo -e "   2. Follow the instructions in SETUP.md"
echo -e "   3. Run 'npm run dev' to start development"

exit 0
