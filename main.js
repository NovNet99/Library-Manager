const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron/main");

//A Node.js module used to handle and manipulate file paths.
const path = require("node:path");
const fs = require("fs");
const bookDataFilePath = path.join(__dirname, "books.json");

process.env.NODE_ENV = "development";
const isDev = process.env.NODE_ENV !== "production";

let mainWindow;

//Creates the initial window when loading the application.
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: isDev ? 1300 : 800,
    height: 600,
    webPreferences: {
      //Loads preload.js to expose safe APIs for the renderer process.
      preload: path.join(__dirname, "preload.js"),
    },
  });

  //Removes the default top bar menu.
  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  //Loads the index.html front end code in the created window.
  mainWindow.loadFile("index.html");
};

//Waits until Electron has finished initializing.
app.whenReady().then(() => {
  //Calls the create window function when the app is ready.
  createWindow();

  //On macOS, apps don’t exit when closing the last window. This reopens a new window if none are open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

//Loads a different HTML file allowing view switching.
ipcMain.on("load-page", (event, file) => {
  if (mainWindow) {
    mainWindow.loadFile(file); // Load the requested HTML file
  }
});

//Receives book data from input fields and saves it in a JSON file.
ipcMain.handle("saveBook", async (_, book) => {
  try {
    // Check if the file exists
    let books = [];
    if (fs.existsSync(bookDataFilePath)) {
      const data = fs.readFileSync(bookDataFilePath);
      books = JSON.parse(data);
    }

    // Add the new book to the array
    books.push(book);

    // Save the updated array to the file
    fs.writeFileSync(bookDataFilePath, JSON.stringify(books, null, 2));

    dialog.showMessageBox({
      message: "Book saved successfully!",
      buttons: ["OK"],
    });
  } catch (error) {
    console.error("Error saving book:", error);
    dialog.showErrorBox("Error", "Failed to save the book.");
  }
});

//Gets the book data from the JSON file and returns said data to the database code.
ipcMain.handle("getBooks", async () => {
  try {
    if (fs.existsSync(bookDataFilePath)) {
      const data = fs.readFileSync(bookDataFilePath, "utf8");
      return JSON.parse(data);
    }
    return []; // Return an empty array if the file doesn't exist
  } catch (error) {
    console.error("Error loading books:", error);
    return [];
  }
});

//Fires when all windows are closed.
//On Windows & Linux, it quits the app.
//On macOS (darwin), it doesn’t quit immediately (apps should stay open until the user explicitly quits).
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
