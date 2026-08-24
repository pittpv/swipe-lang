import './styles.css';
import { api, App } from './app.js';

const root = document.getElementById('app');
const app = new App(root);
app.init();

export { api };
