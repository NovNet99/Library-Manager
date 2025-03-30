const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron/main");

//A Node.js module used to handle and manipulate file paths.
const path = require("node:path");
const fs = require("fs");

const UserManager = require("./UserManager");
const Authenticator = require("./Authenticator");
const DatabaseController = require("./DatabaseController");
const Librarian = require("./Librarian");
let librarian = null;

const bookDataFilePath = path.join(__dirname, "../books1.json");

const bookDataDir = path.dirname(bookDataFilePath);
if (!fs.existsSync(bookDataDir)) {
  fs.mkdirSync(bookDataDir, { recursive: true });
}


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
  mainWindow.loadFile("views/index.html");
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

ipcMain.handle(
  "register-user",
  async (event, { username, password, repeatPassword, role, extraData }) => {
    const userManager = new UserManager(role);
    const regsisterData = userManager.registerUser(
      username, password, repeatPassword, extraData
    );

    if (regsisterData.success && role === "librarian") {
      const databaseController = new DatabaseController(bookDataFilePath);
      librarian = new Librarian(username, extraData.librarianCode, databaseController);
    }

    return regsisterData
  }
);

ipcMain.handle("login-user", async (event, { username, password, role }) => {
  const authenticator = new Authenticator(role);
  const loginData = authenticator.login(username, password);

  if (loginData.success && role === "librarian") {
    const databaseController = new DatabaseController(bookDataFilePath);
    const librarianCode = authenticator.userManager.getLibrarianData(username).librarianCode;
    librarian = new Librarian(username, librarianCode, databaseController);
  }
  return loginData;
});

ipcMain.handle("get-librarian-data", async (event, username) => {
  const userManager = new UserManager("librarian");
  return userManager.getLibrarianData(username);
});

ipcMain.handle("get-books", async () => {
  if (!librarian) throw new Error("No librarian logged in");
  const books = librarian.getBooks(); // Use the new method
  return books;
});

ipcMain.handle("add-book", async (event, { title, author, isbn, available, genre }) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.addBook(title, author, isbn, available, genre);
});

ipcMain.handle("edit-book", async (event, isbn, updatedBook) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.editBook(isbn, updatedBook);
});

ipcMain.handle("remove-book", async (event, isbn) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.removeBook(isbn);
});

ipcMain.handle("show-message-box", async (_, message) => {
  return dialog.showMessageBox({
    message: message,
    buttons: ["OK"],
  });
});

//Loads a different HTML file allowing view switching.
ipcMain.on("load-page", (event, file) => {
  if (mainWindow) {
    mainWindow.loadFile(file); // Load the requested HTML file
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
