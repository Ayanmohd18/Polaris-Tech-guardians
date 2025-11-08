interface AppConfig {
  name: string;
  type: 'social' | 'ecommerce' | 'productivity' | 'entertainment' | 'health' | 'education' | 'finance' | 'travel' | 'food' | 'custom';
  features: string[];
  platforms: ('ios' | 'android' | 'web')[];
  backend: boolean;
  database: boolean;
  auth: boolean;
  payments: boolean;
  notifications: boolean;
  location: boolean;
  camera: boolean;
  offline: boolean;
}

interface GeneratedApp {
  id: string;
  config: AppConfig;
  files: { [key: string]: string };
  dependencies: string[];
  buildCommands: string[];
  deploymentConfig: any;
  preview: string;
}

export class MobileAppGenerator {
  private templates = {
    social: {
      features: ['user-profiles', 'messaging', 'feed', 'friends', 'notifications'],
      screens: ['Login', 'Feed', 'Profile', 'Messages', 'Settings']
    },
    ecommerce: {
      features: ['product-catalog', 'cart', 'checkout', 'payments', 'orders'],
      screens: ['Home', 'Products', 'Cart', 'Checkout', 'Orders', 'Profile']
    },
    productivity: {
      features: ['tasks', 'calendar', 'notes', 'collaboration', 'sync'],
      screens: ['Dashboard', 'Tasks', 'Calendar', 'Notes', 'Settings']
    },
    entertainment: {
      features: ['media-player', 'playlists', 'recommendations', 'social'],
      screens: ['Home', 'Player', 'Library', 'Discover', 'Profile']
    },
    health: {
      features: ['tracking', 'analytics', 'reminders', 'goals', 'reports'],
      screens: ['Dashboard', 'Tracking', 'Analytics', 'Goals', 'Profile']
    },
    education: {
      features: ['courses', 'progress', 'quizzes', 'certificates', 'community'],
      screens: ['Home', 'Courses', 'Progress', 'Community', 'Profile']
    },
    finance: {
      features: ['accounts', 'transactions', 'budgets', 'analytics', 'goals'],
      screens: ['Dashboard', 'Accounts', 'Transactions', 'Budget', 'Analytics']
    },
    travel: {
      features: ['bookings', 'itinerary', 'maps', 'reviews', 'sharing'],
      screens: ['Home', 'Search', 'Bookings', 'Trips', 'Profile']
    },
    food: {
      features: ['menu', 'ordering', 'delivery', 'reviews', 'favorites'],
      screens: ['Home', 'Menu', 'Cart', 'Orders', 'Profile']
    }
  };

  async generateApp(prompt: string): Promise<GeneratedApp> {
    const config = this.parsePrompt(prompt);
    const appId = `app_${Date.now()}`;
    
    const files = await this.generateFiles(config);
    const dependencies = this.generateDependencies(config);
    const buildCommands = this.generateBuildCommands(config);
    const deploymentConfig = this.generateDeploymentConfig(config);
    
    return {
      id: appId,
      config,
      files,
      dependencies,
      buildCommands,
      deploymentConfig,
      preview: this.generatePreview(config)
    };
  }

  private parsePrompt(prompt: string): AppConfig {
    const lowerPrompt = prompt.toLowerCase();
    
    // Detect app type
    let type: AppConfig['type'] = 'custom';
    for (const [key, template] of Object.entries(this.templates)) {
      if (lowerPrompt.includes(key) || template.features.some(f => lowerPrompt.includes(f))) {
        type = key as AppConfig['type'];
        break;
      }
    }

    // Extract features
    const features = [];
    if (lowerPrompt.includes('chat') || lowerPrompt.includes('messaging')) features.push('messaging');
    if (lowerPrompt.includes('payment') || lowerPrompt.includes('buy')) features.push('payments');
    if (lowerPrompt.includes('map') || lowerPrompt.includes('location')) features.push('location');
    if (lowerPrompt.includes('camera') || lowerPrompt.includes('photo')) features.push('camera');
    if (lowerPrompt.includes('offline')) features.push('offline');
    if (lowerPrompt.includes('notification')) features.push('notifications');
    if (lowerPrompt.includes('auth') || lowerPrompt.includes('login')) features.push('auth');

    // Detect platforms
    const platforms: ('ios' | 'android' | 'web')[] = [];
    if (lowerPrompt.includes('ios') || lowerPrompt.includes('iphone')) platforms.push('ios');
    if (lowerPrompt.includes('android')) platforms.push('android');
    if (lowerPrompt.includes('web') || lowerPrompt.includes('website')) platforms.push('web');
    if (platforms.length === 0) platforms.push('ios', 'android', 'web');

    return {
      name: this.extractAppName(prompt),
      type,
      features,
      platforms,
      backend: lowerPrompt.includes('backend') || lowerPrompt.includes('api'),
      database: lowerPrompt.includes('database') || lowerPrompt.includes('data'),
      auth: lowerPrompt.includes('auth') || lowerPrompt.includes('login'),
      payments: lowerPrompt.includes('payment') || lowerPrompt.includes('buy'),
      notifications: lowerPrompt.includes('notification'),
      location: lowerPrompt.includes('location') || lowerPrompt.includes('map'),
      camera: lowerPrompt.includes('camera') || lowerPrompt.includes('photo'),
      offline: lowerPrompt.includes('offline')
    };
  }

  private extractAppName(prompt: string): string {
    const match = prompt.match(/(?:app|application)\s+(?:called|named)\s+([a-zA-Z0-9\s]+)/i);
    if (match) return match[1].trim();
    
    const words = prompt.split(' ').filter(w => w.length > 3);
    return words[0] || 'MyApp';
  }

  private async generateFiles(config: AppConfig): Promise<{ [key: string]: string }> {
    const files: { [key: string]: string } = {};

    // React Native App.tsx
    files['App.tsx'] = this.generateReactNativeApp(config);
    
    // Navigation
    files['src/navigation/AppNavigator.tsx'] = this.generateNavigation(config);
    
    // Screens
    const screens = this.getScreensForType(config.type);
    for (const screen of screens) {
      files[`src/screens/${screen}Screen.tsx`] = this.generateScreen(screen, config);
    }

    // Components
    files['src/components/Header.tsx'] = this.generateHeader(config);
    files['src/components/Button.tsx'] = this.generateButton();
    files['src/components/Input.tsx'] = this.generateInput();

    // Services
    if (config.backend) {
      files['src/services/api.ts'] = this.generateApiService(config);
    }
    if (config.auth) {
      files['src/services/auth.ts'] = this.generateAuthService(config);
    }
    if (config.database) {
      files['src/services/database.ts'] = this.generateDatabaseService(config);
    }

    // Configuration files
    files['package.json'] = this.generatePackageJson(config);
    files['metro.config.js'] = this.generateMetroConfig();
    files['babel.config.js'] = this.generateBabelConfig();
    files['tsconfig.json'] = this.generateTsConfig();

    // Platform-specific files
    if (config.platforms.includes('ios')) {
      files['ios/Podfile'] = this.generatePodfile(config);
      files['ios/Info.plist'] = this.generateInfoPlist(config);
    }
    if (config.platforms.includes('android')) {
      files['android/app/build.gradle'] = this.generateAndroidBuildGradle(config);
      files['android/app/src/main/AndroidManifest.xml'] = this.generateAndroidManifest(config);
    }

    return files;
  }

  private generateReactNativeApp(config: AppConfig): string {
    return `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
${config.auth ? "import { AuthProvider } from './src/services/auth';" : ''}

export default function App() {
  return (
    <Provider store={store}>
      ${config.auth ? '<AuthProvider>' : ''}
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      ${config.auth ? '</AuthProvider>' : ''}
    </Provider>
  );
}`;
  }

  private generateNavigation(config: AppConfig): string {
    const screens = this.getScreensForType(config.type);
    return `import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
${screens.map(screen => `import ${screen}Screen from '../screens/${screen}Screen';`).join('\n')}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator>
      ${screens.map(screen => `<Tab.Screen name="${screen}" component={${screen}Screen} />`).join('\n      ')}
    </Tab.Navigator>
  );
}`;
  }

  private generateScreen(screenName: string, config: AppConfig): string {
    const features = this.getScreenFeatures(screenName, config);
    return `import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
${config.auth ? "import { useAuth } from '../services/auth';" : ''}

export default function ${screenName}Screen() {
  ${config.auth ? 'const { user } = useAuth();' : ''}
  const [data, setData] = useState([]);

  useEffect(() => {
    // Load ${screenName.toLowerCase()} data
    loadData();
  }, []);

  const loadData = async () => {
    // Implement data loading
  };

  return (
    <View style={styles.container}>
      <Header title="${screenName}" />
      <ScrollView style={styles.content}>
        ${features.map(feature => this.generateFeatureComponent(feature)).join('\n        ')}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 16 }
});`;
  }

  private generateFeatureComponent(feature: string): string {
    switch (feature) {
      case 'list':
        return `<View style={styles.list}>
          <Text style={styles.title}>Items</Text>
          {/* List items here */}
        </View>`;
      case 'form':
        return `<View style={styles.form}>
          <Text style={styles.title}>Form</Text>
          {/* Form inputs here */}
        </View>`;
      case 'chart':
        return `<View style={styles.chart}>
          <Text style={styles.title}>Analytics</Text>
          {/* Chart component here */}
        </View>`;
      default:
        return `<Text>{/* ${feature} feature */}</Text>`;
    }
  }

  private generateHeader(config: AppConfig): string {
    return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  }
});`;
  }

  private generateButton(): string {
    return `import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, styles[variant]]} 
      onPress={onPress}
    >
      <Text style={[styles.text, styles[\`\${variant}Text\`]]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8
  },
  primary: { backgroundColor: '#007AFF' },
  secondary: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ccc' },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: 'white' },
  secondaryText: { color: '#333' }
});`;
  }

  private generateInput(): string {
    return `import React from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export default function Input({ label, value, onChangeText, placeholder, secureTextEntry }: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  }
});`;
  }

  private generateApiService(config: AppConfig): string {
    return `const API_BASE_URL = 'https://api.${config.name.toLowerCase()}.com';

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint);
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default new ApiService();`;
  }

  private generateAuthService(config: AppConfig): string {
    return `import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const login = async (email: string, password: string) => {
    // Implement login logic
    const userData = { id: '1', email, name: 'User' };
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const register = async (email: string, password: string, name: string) => {
    // Implement registration logic
    const userData = { id: '1', email, name };
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};`;
  }

  private generateDatabaseService(config: AppConfig): string {
    return `import AsyncStorage from '@react-native-async-storage/async-storage';

class DatabaseService {
  async save(key: string, data: any) {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  async load(key: string) {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  }

  async clear() {
    await AsyncStorage.clear();
  }

  async getAllKeys() {
    return AsyncStorage.getAllKeys();
  }
}

export default new DatabaseService();`;
  }

  private generatePackageJson(config: AppConfig): string {
    const dependencies = {
      "react": "18.2.0",
      "react-native": "0.72.0",
      "@react-navigation/native": "^6.1.0",
      "@react-navigation/bottom-tabs": "^6.5.0",
      "@react-navigation/stack": "^6.3.0",
      "react-native-screens": "^3.20.0",
      "react-native-safe-area-context": "^4.5.0",
      "@reduxjs/toolkit": "^1.9.0",
      "react-redux": "^8.0.0"
    };

    if (config.auth) {
      dependencies["@react-native-async-storage/async-storage"] = "^1.18.0";
    }
    if (config.camera) {
      dependencies["react-native-image-picker"] = "^5.0.0";
    }
    if (config.location) {
      dependencies["@react-native-community/geolocation"] = "^3.0.0";
    }
    if (config.notifications) {
      dependencies["@react-native-firebase/messaging"] = "^18.0.0";
    }

    return JSON.stringify({
      name: config.name.toLowerCase().replace(/\s+/g, '-'),
      version: "1.0.0",
      main: "index.js",
      scripts: {
        "android": "react-native run-android",
        "ios": "react-native run-ios",
        "start": "react-native start",
        "test": "jest",
        "lint": "eslint ."
      },
      dependencies,
      devDependencies: {
        "@babel/core": "^7.20.0",
        "@babel/preset-env": "^7.20.0",
        "@babel/runtime": "^7.20.0",
        "@react-native/eslint-config": "^0.72.0",
        "@react-native/metro-config": "^0.72.0",
        "@tsconfig/react-native": "^3.0.0",
        "@types/react": "^18.0.24",
        "@types/react-test-renderer": "^18.0.0",
        "babel-jest": "^29.2.1",
        "eslint": "^8.19.0",
        "jest": "^29.2.1",
        "metro-react-native-babel-preset": "0.76.5",
        "prettier": "^2.4.1",
        "react-test-renderer": "18.2.0",
        "typescript": "4.8.4"
      }
    }, null, 2);
  }

  private generateMetroConfig(): string {
    return `const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const defaultConfig = getDefaultConfig(__dirname);
const config = {};
module.exports = mergeConfig(defaultConfig, config);`;
  }

  private generateBabelConfig(): string {
    return `module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
};`;
  }

  private generateTsConfig(): string {
    return JSON.stringify({
      extends: "@tsconfig/react-native/tsconfig.json"
    }, null, 2);
  }

  private generatePodfile(config: AppConfig): string {
    return `require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '11.0'
install! 'cocoapods', :deterministic_uuids => false

target '${config.name}' do
  config = use_native_modules!
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,
    :fabric_enabled => false,
    :flipper_configuration => FlipperConfiguration.enabled,
    :app_clip_enabled => false
  )

  post_install do |installer|
    react_native_post_install(installer)
  end
end`;
  }

  private generateInfoPlist(config: AppConfig): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>${config.name}</string>
  <key>CFBundleIdentifier</key>
  <string>com.${config.name.toLowerCase()}.app</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSRequiresIPhoneOS</key>
  <true/>
  <key>UILaunchStoryboardName</key>
  <string>LaunchScreen</string>
  <key>UIRequiredDeviceCapabilities</key>
  <array>
    <string>armv7</string>
  </array>
  <key>UISupportedInterfaceOrientations</key>
  <array>
    <string>UIInterfaceOrientationPortrait</string>
  </array>
  ${config.camera ? `<key>NSCameraUsageDescription</key>
  <string>This app needs access to camera</string>` : ''}
  ${config.location ? `<key>NSLocationWhenInUseUsageDescription</key>
  <string>This app needs access to location</string>` : ''}
</dict>
</plist>`;
  }

  private generateAndroidBuildGradle(config: AppConfig): string {
    return `apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

android {
    compileSdkVersion rootProject.ext.compileSdkVersion
    
    defaultConfig {
        applicationId "com.${config.name.toLowerCase()}.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}

dependencies {
    implementation "com.facebook.react:react-native:+"
    implementation "androidx.swiperefreshlayout:swiperefreshlayout:1.0.0"
}`;
  }

  private generateAndroidManifest(config: AppConfig): string {
    return `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.${config.name.toLowerCase()}.app">

    <uses-permission android:name="android.permission.INTERNET" />
    ${config.camera ? '<uses-permission android:name="android.permission.CAMERA" />' : ''}
    ${config.location ? '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />' : ''}

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:theme="@style/AppTheme">
      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>
    </application>
</manifest>`;
  }

  private getScreensForType(type: string): string[] {
    return this.templates[type]?.screens || ['Home', 'Profile', 'Settings'];
  }

  private getScreenFeatures(screenName: string, config: AppConfig): string[] {
    const features = [];
    if (screenName === 'Home') features.push('list');
    if (screenName === 'Profile') features.push('form');
    if (screenName === 'Analytics') features.push('chart');
    return features;
  }

  private generateDependencies(config: AppConfig): string[] {
    const deps = ['react-native', '@react-navigation/native'];
    if (config.auth) deps.push('@react-native-async-storage/async-storage');
    if (config.camera) deps.push('react-native-image-picker');
    if (config.location) deps.push('@react-native-community/geolocation');
    return deps;
  }

  private generateBuildCommands(config: AppConfig): string[] {
    const commands = ['npm install'];
    if (config.platforms.includes('ios')) {
      commands.push('cd ios && pod install && cd ..');
    }
    commands.push('npx react-native run-android');
    if (config.platforms.includes('ios')) {
      commands.push('npx react-native run-ios');
    }
    return commands;
  }

  private generateDeploymentConfig(config: AppConfig): any {
    return {
      ios: {
        bundleId: `com.${config.name.toLowerCase()}.app`,
        appStore: true,
        testFlight: true
      },
      android: {
        packageName: `com.${config.name.toLowerCase()}.app`,
        playStore: true,
        apk: true
      },
      web: config.platforms.includes('web') ? {
        netlify: true,
        vercel: true
      } : null
    };
  }

  private generatePreview(config: AppConfig): string {
    return `
      <div style="padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
        <h3>${config.name}</h3>
        <p><strong>Type:</strong> ${config.type}</p>
        <p><strong>Platforms:</strong> ${config.platforms.join(', ')}</p>
        <p><strong>Features:</strong> ${config.features.join(', ')}</p>
        <div style="margin-top: 10px;">
          <strong>Screens:</strong>
          <ul>
            ${this.getScreensForType(config.type).map(screen => `<li>${screen}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  async buildApp(appId: string): Promise<void> {
    // Simulate build process
    console.log(`Building app ${appId}...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(`App ${appId} built successfully!`);
  }

  async deployApp(appId: string, platform: 'ios' | 'android' | 'web'): Promise<string> {
    // Simulate deployment
    console.log(`Deploying app ${appId} to ${platform}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `https://${platform}.${appId}.com`;
  }
}

export default new MobileAppGenerator();