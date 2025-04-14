const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron/main");

//A Node.js module used to handle and manipulate file paths.
const path = require("node:path");
const fs = require("fs");

//Imports the required modules from the Electron library.
const UserManager = require("./UserManager");
const Authenticator = require("./Authenticator");
const DatabaseController = require("./DatabaseController");
const Librarian = require("./Librarian");
const Student = require("./Student");

//Variables representing the current logged-in user and their role.
//These variables are set to null initially and will be populated when a user registers/logs in.
let librarian = null;
let student = null;

//The path to the JSON file where book data is stored.
const bookDataFilePath = path.join(__dirname, "../data/books.json");
const requestsFilePath = path.join(__dirname, "../data/requests.json");
const borrowedBooksFilePath = path.join(__dirname, "../data/borrowedBooks.json");

const ensureFileExists = (filePath, defaultContent) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
  }
};

ensureFileExists(bookDataFilePath, []);
ensureFileExists(requestsFilePath, {});
ensureFileExists(borrowedBooksFilePath, {});

//Checks if the file exists. If not, it creates an empty JSON file.
const bookDataDir = path.dirname(bookDataFilePath);
if (!fs.existsSync(bookDataDir)) {
  fs.mkdirSync(bookDataDir, { recursive: true });
}

process.env.NODE_ENV = "production";
const isDev = process.env.NODE_ENV !== "production";

let mainWindow;

/*--------------------FUNCTIONS RELATED TO ELECTRON MANAGEMENT--------------------*/

//Creates the initial window when loading the application.
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: isDev ? 1920 : 800,
    height: 1080,
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
  //mainWindow.loadFile("views/test.html");
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
ipcMain.on("load-page", (_, file) => {
  if (mainWindow) {
    mainWindow.loadFile(file);
  }
});

/*--------------------FUNCTIONS RELATED TO METHOD EXPOSURE--------------------*/
//Exposed function for user registration and login.
ipcMain.handle(
  "register-user",
  async (_, { username, password, repeatPassword, role, extraData }) => {
    //Creates a user manager object for the specified role (librarian or student).
    const userManager = new UserManager(role);
    //Registers the user with the given details.
    const regsisterData = userManager.registerUser(
      username, password, repeatPassword, extraData
    );

    //If the registration succeeds and the user is a librarian, create a new librarian object.
    if (regsisterData.success && role === "librarian") {
      const databaseController = new DatabaseController(bookDataFilePath);
      librarian = new Librarian(username, extraData.librarianCode, databaseController);
    }
    //If the registration succeeds and the user is a student, create a new student object.
    if (regsisterData.success && role === "student") {
      const databaseController = new DatabaseController(bookDataFilePath);
      student = new Student(username, databaseController);
    }

    return regsisterData
  }
);

ipcMain.handle("login-user", async (_, { username, password, role }) => {
  const authenticator = new Authenticator(role);
  const loginData = authenticator.login(username, password);

  if (loginData.success && role === "librarian") {
    const databaseController = new DatabaseController(bookDataFilePath);
    const librarianCode = authenticator.userManager.getLibrarianData(username).librarianCode;
    librarian = new Librarian(username, librarianCode, databaseController);
  }

  if (loginData.success && role === "student") {
    const databaseController = new DatabaseController(bookDataFilePath);
    student = new Student(username, databaseController);
  }
  return loginData;
});

ipcMain.handle("get-librarian-data", async (_, username) => {
  const userManager = new UserManager("librarian");
  return userManager.getLibrarianData(username);
});

ipcMain.handle("get-books", async () => {
  if (librarian) {
    const books = librarian.getBooks(); // Use the new method
    return books;
  }
  if (student) {
    const books = student.getBooks(); // Use the new method
    return books;
  }
  throw new Error("No user logged in");
});

ipcMain.handle("add-book", async (_, { title, author, isbn, available, genre }) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.addBook(title, author, isbn, available, genre);
});

ipcMain.handle("edit-book", async (_, isbn, updatedBook) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.editBook(isbn, updatedBook);
});

ipcMain.handle("remove-book", async (_, isbn) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.removeBook(isbn);
});

ipcMain.handle("show-message-box", async (_, message) => {
  return dialog.showMessageBox({
    message: message,
    buttons: ["OK"],
  });
});

ipcMain.handle("search-books", async (event, searchParams) => {

  if(librarian){
    return librarian.searchBook(searchParams);
  }
  else if(student){
    return student.searchBook(searchParams);
  }
  throw new Error("No user logged in");
  
});

/*--------------------FUNCTIONS RELATED TO BOOK BORROWING--------------------*/
ipcMain.handle("request-book", async (_, isbn) => {
  if (!student) throw new Error("No student logged in");
  return student.requestBook(isbn);
});

ipcMain.handle("get-all-requests", async () => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.getAllRequests();
});

ipcMain.handle("unrequest-book", async (_, isbn) => {
  if (!student) throw new Error("No student logged in");
  return student.unrequestBook(isbn);
});

ipcMain.handle("get-student-requests", async (_, username) => {
  if (!student || student.userName !== username) throw new Error("No matching student logged in");
  return student.getStudentRequests();
});

ipcMain.handle("approve-request", async (_, { username, isbn, dueDate }) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.approveRequest(username, isbn, dueDate);
});

ipcMain.handle("decline-request", async (_, { username, isbn }) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.declineRequest(username, isbn);
});

ipcMain.handle("get-borrowed-books", async (_, username) => {
  if (!student || student.userName !== username) throw new Error("No matching student logged in");
  return student.getBorrowedBooks();
});


/*--------------------FUNCTIONS RELATED TO FINE HANDLING--------------------*/
ipcMain.handle("get-due-date-status", async (_, username) => {
  if (!student || student.userName !== username) throw new Error("No matching student logged in");
  return student.getDueDateStatus();
});

ipcMain.handle("get-fines", async (_, username) => {
  if (!student || student.userName !== username) throw new Error("No matching student logged in");
  return student.getFines();
});




/*--------------------FUNCTIONS RELATED TO LIBRARIAN FINE HANDLING AND BOOK RETURNS--------------------*/
ipcMain.handle('get-all-borrowed-books-with-fines', async () => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.getAllBorrowedBooksWithFines();
});

ipcMain.handle('confirm-book-return', async (event, { username, isbn }) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.confirmBookReturn({ username, isbn });
});

ipcMain.handle('confirm-payment', async (event, { username, isbn }) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.confirmPayment({ username, isbn });
});

ipcMain.handle('confirm-payment-and-return', async (event, { username, isbn }) => {
  if (!librarian) throw new Error("No librarian logged in");
  return librarian.confirmPaymentAndReturn({ username, isbn });
});



ipcMain.handle("get-all-students", async () => {
  try {
    if (!librarian) throw new Error("Librarian instance not initialized");
    return await librarian.getAllStudents();
  } catch (error) {
    console.error("IPC get-all-students error:", error.message);
    throw error;
  }
});

ipcMain.handle("issue-book", async (event, { username, isbn, dueDate }) => {
  try {
    if (!librarian) throw new Error("Librarian instance not initialized");
    return await librarian.issueBook({ username, isbn, dueDate });
  } catch (error) {
    console.error("IPC issue-book error:", error.message);
    throw error;
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
