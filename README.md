# 🌄 Zenith Ring Planner

[![Deploy to GitHub Pages](https://github.com/Motouom/zenith-ring-planner/actions/workflows/deploy.yml/badge.svg)](https://github.com/Motouom/zenith-ring-planner/actions/workflows/deploy.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Zenith Ring Planner** is a modern, privacy-focused personal productivity suite that combines financial planning, goal tracking, and personal development tools. Built with a mobile-first approach, it offers a seamless experience across all devices while maintaining data privacy and offline functionality.

🔗 **Live Demo**: [https://victoire-motouom.github.io/zenith-ring-planner/](https://victoire-motouom.github.io/zenith-ring-planner/)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- GitHub account (for deployment)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Motouom/zenith-ring-planner.git
   cd zenith-ring-planner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

4. **Run tests**:
   ```bash
   npm test
   ```

## 🚀 Deployment

### GitHub Pages

1. **Fork** this repository to your GitHub account
2. **Clone** your forked repository:
   ```bash
   git clone https://github.com/yourusername/zenith-ring-planner.git
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

### Other Deployment Options

#### Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMotouom%2Fzenith-ring-planner)

## 🛠️ Tech Stack

### Core Technologies
- [React 18](https://reactjs.org/) - Frontend library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn UI](https://ui.shadcn.com/) - Beautifully designed components
- [React Router](https://reactrouter.com/) - Client-side routing
- [React Query](https://tanstack.com/query/latest) - Server state management
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper for offline storage

### Development Tools
- [ESLint](https://eslint.org/) - JavaScript/TypeScript linting
- [Prettier](https://prettier.io/) - Code formatting
- [Husky](https://typicode.github.io/husky/) - Git hooks
- [Jest](https://jestjs.io/) - Testing framework
- [Testing Library](https://testing-library.com/) - React component testing
- [GitHub Actions](https://github.com/features/actions) - CI/CD pipeline

## ✨ Key Features

### 🏆 Core Functionality
- **Budget Management**: Track income and expenses with detailed transaction history and categorization
- **Goal Setting**: Set and track financial and personal goals with progress tracking
- **Task Management**: Organize daily tasks with priority levels and due dates
- **Habit Tracking**: Build and maintain positive habits with streak tracking
- **Reflection Journal**: Daily and weekly reflection prompts for personal growth
- **Data Visualization**: Beautiful charts and graphs to visualize your progress

### ⚙️ Enhanced Settings & Customization
- **User Profile**
  - Personal information management
  - Theme customization (light/dark/system)
  - Timezone and date format preferences
  - Notification preferences

- **Data Management**
  - Cloud backup and sync
  - Import/export functionality (CSV/JSON/PDF)
  - Data encryption and security
  - Bulk operations

### 🎯 Zenith Enhancement Planner (ZEP)
- **Time Blocking**
  - Visual drag-and-drop scheduling
  - Color-coded categories
  - Recurring time blocks
  - Buffer time management

- **Advanced Task Management**
  - Natural language task input
  - Multiple view modes (Kanban, Gantt, Calendar)
  - Smart prioritization
  - Task templates

- **Productivity Analytics**
  - Time tracking and reporting
  - Focus mode with Pomodoro timer
  - Distraction analysis
  - Weekly productivity insights

### 📊 Advanced Reporting
- **Financial Analytics**
  - Income vs. expenses trends
  - Net worth tracking
  - Category spending analysis
  - Budget forecasting

- **Productivity Reports**
  - Time allocation breakdown
  - Task completion rates
  - Habit formation tracking
  - Goal progress visualization

### 🌈 User Experience
- **Mobile-First**: Fully responsive design that works on any device
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Accessibility**: Built with WCAG 2.1 AA compliance in mind
- **Offline Support**: Progressive Web App (PWA) functionality for offline use
- **Privacy-Focused**: Your data stays on your device
- **Customizable Dashboard**: Drag-and-drop widgets for personalized views
- **Keyboard Shortcuts**: Power-user navigation and actions
- **Multi-language Support**: Localization for global users

### ⚙️ Development

### Prerequisites
- Node.js 18 or later
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Motouom/zenith-ring-planner.git
   cd zenith-ring-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Tests

```bash
npm test
# or
yarn test
```

### Building for Production

```bash
npm run build
# or
yarn build
```

## 🔄 Integration & Extensibility

### 🔌 Native Integrations
- **Calendar Sync**: Google, Apple, Outlook, iCal
- **Cloud Storage**: Google Drive, iCloud, Dropbox
- **Productivity Tools**: Slack, Notion, Todoist
- **Automation**: Zapier, IFTTT, Make.com

### 🤝 Collaboration Features
- Shared projects and goals
- Team task management
- Real-time updates
- Role-based access control

## 🚀 Deployment

### GitHub Pages
1. Update the `homepage` field in `package.json`
2. Run: `npm run deploy`

### Self-Hosting
1. Run `npm run build`
2. Deploy the `dist` folder to your hosting service

## 🔒 Data Management

- All data is stored locally in your browser
- No data is sent to external servers
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

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- Inspired by Miyamoto Musashi's "The Book of Five Rings"
- Built with modern web technologies and the power of the open-source community
- Special thanks to all contributors who have helped improve this project

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📊 Project Status

This project is actively maintained. We're currently working on:
- [ ] Enhanced data export/import functionality
- [ ] Additional visualization options
- [ ] Mobile app version
- [ ] Browser extension

## 🌟 Show Your Support

If you find this project helpful, please consider giving it a ⭐️ on [GitHub](https://github.com/Motouom/zenith-ring-planner).

## 📬 Contact

For questions or feedback, please open an issue on GitHub or contact [your-email@example.com](mailto:your-email@example.com).
# zenith-ring-planner
