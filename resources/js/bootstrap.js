// Impor pustaka axios untuk request HTTP
import axios from 'axios';
// Pasang axios ke window global
window.axios = axios;

// Tandai semua request sebagai AJAX
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
