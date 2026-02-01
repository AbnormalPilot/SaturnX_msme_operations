# BusinessAI

**BusinessAI** is a collaborative mobile application designed to streamline MSME (Micro, Small, and Medium Enterprises) operations. Built with React Native and Expo, it leverages AI capabilities to provide intelligent business solutions.

## 🔗 Project Repositories

This is part of a multi-repo project:

- **📱 Mobile App** (This Repo): React Native + Expo client application
- **🔧 MCP Server**: [https://github.com/AbnormalPilot/vyapar-mcp](https://github.com/AbnormalPilot/vyapar-mcp) - Backend tools and APIs
- **🌐 Landing Page**: [https://github.com/AbnormalPilot/BusinessAi](https://github.com/AbnormalPilot/BusinessAi) - Marketing website

## 🚀 Features

*   **AI Voice Assistant**: Integrated voice capabilities for hands-free operation and queries (powered by `expo-speech` and `expo-av`).
*   **Business Insights**: Interactive charts and data visualization using `react-native-gifted-charts`.
*   **Secure Authentication**: Robust user management via Supabase.
*   **Multimedia Support**: Camera integration, image picking, and audio recording features.
*   **Cross-Platform**: Seamless experience on Android, iOS, and Web.
*   **Modern UI**: Sleek and responsive design using `react-native-paper` and vector icons.

## 🛠️ Tech Stack

*   **Framework**: [Expo](https://expo.dev/) (SDK 54) & [React Native](https://reactnative.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
*   **Backend/Auth**: [Supabase](https://supabase.com/)
*   **Icons**: Lucide React Native & Expo Vector Icons

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [Git](https://git-scm.com/)
*   [Expo Go](https://expo.dev/client) app on your mobile device (for testing)

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd SaturnX_msme_operations
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

## 📱 Running the App

Start the development server:

```bash
npx expo start
```

*   **Press `a`** to open in the Android Emulator.
*   **Press `i`** to open in the iOS Simulator.
*   **Press `w`** to open in the web browser.
*   **Scan the QR code** with the Expo Go app on your physical device.

## � Building for Production

For detailed instructions on how to build the APK for Android, please refer to the [Build Guide](BUILD_APK_GUIDE.md).

## �📂 Project Structure

```
SaturnX_msme_operations/
├── app/                 # Expo Router app directory (screens & navigation)
├── components/          # Reusable UI components
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── store/               # Zustand state stores
├── utils/               # Helper functions and utilities
├── assets/              # Images, fonts, and other static assets
└── constants/           # App constants and configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
