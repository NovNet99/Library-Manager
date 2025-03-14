const { app, BrowserWindow, ipcMain, Menu } = require("electron/main");

//A Node.js module used to handle and manipulate file paths.
const path = require("node:path");

//This function changes the window title when called.
function handleSetTitle(event, title) {
  //Gets the webContents of the window that sent the IPC event.
  const webContents = event.sender;
  //Retrieves the BrowserWindow instance associated with the renderer process.
  const win = BrowserWindow.fromWebContents(webContents);
  //Changes the window title.
  win.setTitle(title);
}

//Creates the initial window when loading the application.
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      //Loads preload.js to expose safe APIs for the renderer process.
      preload: path.join(__dirname, "preload.js"),
    },
  });

  //Removes the default top bar menu.
  Menu.setApplicationMenu(null);

  //Loads the index.html front end code in the created window.
  win.loadFile("index.html");
};

//Waits until Electron has finished initializing.
app.whenReady().then(() => {
  //Handles an IPC request called 'ping', replying 'pong'.
  ipcMain.handle("ping", () => "pong");
  //Listens for the 'set-title' event and calls handleSetTitle.
  ipcMain.on("set-title", handleSetTitle);

  //Calls the create window function when the app is ready.
  createWindow();

  //On macOS, apps don’t exit when closing the last window. This reopens a new window if none are open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

//Fires when all windows are closed. 
//On Windows & Linux, it quits the app. 
//On macOS (darwin), it doesn’t quit immediately (apps should stay open until the user explicitly quits).
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
