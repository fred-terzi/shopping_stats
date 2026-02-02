import { ShoppingApp } from './app';
import './style.css';

/**
 * Main entry point for the Shopping Stats application
 */

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ShoppingApp();
  void app.init();
});
