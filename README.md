# 🎨 AI Image Studio

Transform your images with AI-powered generation.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

\`\`\`bash
# Clone repository
git clone https://github.com/yourusername/ai-studio.git
cd ai-studio

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
\`\`\`

### Running the Application

\`\`\`bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
\`\`\`

Visit http://localhost:5173

## 🧪 Testing

# 1. Install all dependencies
npm run install:all  # If you have this script

# 2. Run backend tests
cd backend && npm test

# 3. Run frontend tests
cd frontend && npm test

# 4. Run E2E tests
npx playwright test

# 5. Generate coverage
npm run test:coverage

# 6. Push to GitHub (triggers CI)
git push origin main

### Run All Tests
\`\`\`bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npx playwright test
\`\`\`

### Coverage
\`\`\`bash
# Backend coverage
cd backend && npm run test:coverage

# Frontend coverage
cd frontend && npm run test:coverage
\`\`\`

## 📋 Features

- ✅ JWT Authentication
- ✅ Image upload & preview
- ✅ AI-powered image generation
- ✅ Multiple art styles
- ✅ Generation history
- ✅ Dark mode
- ✅ Responsive design
- ✅ Accessibility compliant

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **Testing**: Jest + Vitest + Playwright

## 📚 Documentation

- [API Documentation](./OPENAPI.yaml)
- [Evaluation Checklist](./EVAL.md)
- [AI Usage](./AI_USAGE.md)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT