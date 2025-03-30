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

//Exposes these functions to the renderer allowing it to use them.
contextBridge.exposeInMainWorld("electronAPI", {
  //Exposes loadPage custom function that allows for changing the HTML file being rendered.
  loadPage: (file) => ipcRenderer.send("load-page", file),
  //Exposes save book function which allows saving of book data.
  /*saveBook: (book) => ipcRenderer.invoke("saveBook", book),
  //Exposes getBooks function that grabs book data in main.js and sends it to the database.html script code.
  getBooks: () => ipcRenderer.invoke("getBooks"),

  saveUser: (user) => ipcRenderer.invoke("saveUser", user),*/

  //loginUser: (user) => ipcRenderer.invoke("loginUser", user),
  /*saveUserBook: (username, book) => ipcRenderer.invoke("saveUserBook", username, book),
  getUserBooks: (username) => ipcRenderer.invoke("getUserBooks", username),
  deleteUserBook: (username, book) => ipcRenderer.invoke("deleteUserBook", username, book),
  showMessageBox: (message) => ipcRenderer.invoke("show-message-box", message),*/


  //New Exposes
  registerUser: (userData) => ipcRenderer.invoke("register-user", userData),
  loginUser: (userData) => ipcRenderer.invoke("login-user", userData),

  getLibrarianData: (username) => ipcRenderer.invoke("get-librarian-data", username),

  addBook: (book) => ipcRenderer.invoke("add-book", book),
  getBooks: () => ipcRenderer.invoke("get-books"),
  removeBook: (isbn) => ipcRenderer.invoke("remove-book", isbn),
  editBook: (isbn, updatedBook) => ipcRenderer.invoke("edit-book", isbn, updatedBook),

});
