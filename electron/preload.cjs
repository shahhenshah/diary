const { contextBridge } = require('electron');

// Expose APIs to the renderer process safely
contextBridge.exposeInMainWorld('electronAPI', {
  // You can expose APIs or IPC communication functions here
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron preload script loaded successfully.');
});
