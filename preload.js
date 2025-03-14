//contextBridge:
//Provides a secure way to expose APIs from the main process to the renderer process.
//Prevents direct access to Node.js modules from the renderer (important for security).

//ipcRenderer:
//Allows the renderer process to send messages to the main process and receive responses.
const { contextBridge, ipcRenderer } = require("electron");

//Exposes the Node.js, Chrome, and Electron versions to the renderer process.
//The renderer can now access these using window.versions.node(), window.versions.chrome(), etc.
contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // we can also expose variables, not just functions
});

//Allows the renderer process to send a set-title event to the main process.
//This allows changing the window title from the renderer.
contextBridge.exposeInMainWorld("electronAPI", {
  //ipcRenderer.send('set-title', title) sends the title value to the main process.
  //The main process listens for this event and updates the window title.
  loadPage: (file) => ipcRenderer.send("load-page", file)
});
