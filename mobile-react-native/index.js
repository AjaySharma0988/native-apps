/**
 * React Native App Entry Point
 */
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { NotificationService } from './src/services/NotificationService';
import { CallKeepService } from './src/services/CallKeepService';

// Initialize background services
NotificationService.configure();
CallKeepService.setup();

AppRegistry.registerComponent(appName, () => App);
