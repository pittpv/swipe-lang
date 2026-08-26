import './styles.css';
import { api, App } from './app.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

const root = document.getElementById('app');
const app = new App(root);
app.init();

export { api };
