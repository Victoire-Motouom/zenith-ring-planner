# 🌄 Zenith Ring Planner

[![Deploy to GitHub Pages](https://github.com/yourusername/zenith-ring-planner/actions/workflows/deploy.yml/badge.svg)](https://github.com/Motouom/zenith-ring-planner/actions/workflows/deploy.yml)

A comprehensive personal planning and productivity application inspired by Miyamoto Musashi's Five Rings philosophy. The app helps users manage their finances, goals, tasks, and daily reflections in one place.

A comprehensive personal planning and productivity application inspired by Miyamoto Musashi's Five Rings philosophy. The app helps users manage their finances, goals, tasks, and daily reflections in one place.

## 🚀 Deployment

### Prerequisites
- Node.js 18+ and npm
- Git
- GitHub account

### Deploy to GitHub Pages

1. **Fork** this repository to your GitHub account
2. **Clone** your forked repository:
   ```bash
   git clone https://github.com/Motouom/zenith-ring-planner.git
   cd zenith-ring-planner
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Update the homepage URL** in `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/zenith-ring-planner"
   ```
5. **Deploy** the app:
   ```bash
   npm run deploy
   ```
6. **Enable GitHub Pages** in your repository settings:
   - Go to Settings > Pages
   - Select `gh-pages` branch as the source
   - Select `/ (root)` as the folder

Your app will be available at: `https://yourusername.github.io/zenith-ring-planner`

## 🌟 Features

### ✅ Implemented

#### 1. Core Functionality
- **Budget Management**: Track income and expenses with transaction history
- **Goal Setting**: Set and track financial and personal goals
- **Task Management**: Organize daily tasks with priority levels
- **Reflection Journal**: Daily journaling for self-improvement

#### 2. User Experience
- **Responsive Design**: Fully responsive layout that works on mobile, tablet, and desktop
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Local-First**: All data stored locally in the browser using IndexedDB
- **Progressive Web App**: Installable on devices for offline use

#### 3. Technical Implementation
- Built with React and TypeScript
- State management with React Context API
- Responsive UI using Tailwind CSS
- Local data persistence with Dexie.js
- Modern build setup with Vite

### 🚧 Pending Implementation

#### 1. Core Features
- [ ] Task categories and tags
- [ ] Goal progress visualization
- [ ] Data export/import functionality
- [ ] Recurring transactions

#### 2. Enhanced Functionality
- [ ] Data backup to cloud storage
- [ ] Multi-device sync
- [ ] Advanced reporting and analytics
- [ ] Customizable categories and tags

## 🛠️ Technical Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS
- **State Management**: React Context API
- **Database**: IndexedDB with Dexie.js
- **Build Tool**: Vite
- **Linting/Formatting**: ESLint, Prettier
- **Version Control**: Git

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/zenith-ring-planner.git
   cd zenith-ring-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:8080](http://localhost:8080) in your browser.

## 📱 Mobile Responsiveness

The application has been optimized for mobile devices with:
- Touch-friendly UI elements
- Responsive layouts that adapt to different screen sizes
- Proper viewport settings for mobile browsers
- Enhanced tap targets for better touch interaction

## 🎨 Theming

The app supports both light and dark modes with:
- System preference detection
- Manual theme switching
- Persistent theme selection
- Smooth transitions between themes

## 📊 Data Management

- All data is stored locally in the browser
- No data is sent to external servers
- Data is encrypted at rest by the browser
- Backup and restore functionality

## 🧪 Testing

### Cross-Browser Testing
- [x] Chrome (latest)
- [x] Firefox (latest)
- [ ] Safari (iOS/macOS)
- [ ] Microsoft Edge

### Performance Optimization
- [x] Code minification
- [ ] Image optimization
- [ ] Lazy loading of components

### Accessibility
- [x] Keyboard navigation
- [ ] ARIA attributes
- [ ] Screen reader testing

## 🚀 Deployment

### Prerequisites
- Static hosting account (Netlify, Vercel, GitHub Pages, etc.)
- GitHub repository (if using CI/CD)

### Deployment Steps
1. Build the production version:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your chosen hosting service.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Miyamoto Musashi's "The Book of Five Rings"
- Built with modern web technologies
- Special thanks to the open-source community

## 📬 Contact

For questions or feedback, please open an issue on GitHub or contact [your-email@example.com](mailto:your-email@example.com).
# zenith-ring-planner
