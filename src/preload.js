//contextBridge:
//Provides a secure way to expose APIs from the main process to the renderer process.
//Prevents direct access to Node.js modules from the renderer (important for security).

//ipcRenderer:
//Allows the renderer process to send messages to the main process and receive responses.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

//Exposes these functions to the renderer allowing it to use them.
contextBridge.exposeInMainWorld("electronAPI", {
  /*--------------------GENERAL ELECTRON EXPOSED FUNCTIONS--------------------*/
  loadPage: (file) => ipcRenderer.send("load-page", file),

  /*--------------------FUNCTIONS RELATED TO REGISTRATION--------------------*/
  registerUser: (userData) => ipcRenderer.invoke("register-user", userData),
  loginUser: (userData) => ipcRenderer.invoke("login-user", userData),

  /*--------------------FUNCTIONS RELATED TO USER METHODS--------------------*/
  getBooks: () => ipcRenderer.invoke("get-books"),

  /*--------------------FUNCTIONS RELATED TO LIBRARY DATABASE MANAGEMENT--------------------*/
  getLibrarianData: (username) =>
    ipcRenderer.invoke("get-librarian-data", username),
  addBook: (book) => ipcRenderer.invoke("add-book", book),
  removeBook: (isbn) => ipcRenderer.invoke("remove-book", isbn),
  editBook: (isbn, updatedBook) =>
    ipcRenderer.invoke("edit-book", isbn, updatedBook),
  searchBooks: (searchParams) =>
    ipcRenderer.invoke("search-books", searchParams),

  /*--------------------FUNCTIONS RELATED TO BOOK BORROWING MANAGEMENT--------------------*/
  requestBook: (isbn) => ipcRenderer.invoke("request-book", isbn),
  getAllRequests: () => ipcRenderer.invoke("get-all-requests"),
  unrequestBook: (isbn) => ipcRenderer.invoke("unrequest-book", isbn),
  getStudentRequests: (username) =>
    ipcRenderer.invoke("get-student-requests", username),
  approveRequest: (data) => ipcRenderer.invoke("approve-request", data),
  declineRequest: (data) => ipcRenderer.invoke("decline-request", data),
  getBorrowedBooks: (username) =>
    ipcRenderer.invoke("get-borrowed-books", username),

  /*--------------------FUNCTIONS RELATED TO FINE MANAGEMENT--------------------*/
  getDueDateStatus: (username) =>
    ipcRenderer.invoke("get-due-date-status", username),
  getFines: (username) => ipcRenderer.invoke("get-fines", username),

  /*--------------------FUNCTIONS RELATED TO LIBRARIAN FINE MANAGEMENT AND BOOK RETURNS--------------------*/
  getAllBorrowedBooksWithFines: () =>
    ipcRenderer.invoke("get-all-borrowed-books-with-fines"),
  confirmBookReturn: (data) => ipcRenderer.invoke("confirm-book-return", data),
  confirmPayment: (data) => ipcRenderer.invoke("confirm-payment", data),
  confirmPaymentAndReturn: (data) =>
    ipcRenderer.invoke("confirm-payment-and-return", data),

  /*--------------------FUNCTIONS RELATED TO ISSUING BOOKS--------------------*/
  getAllStudents: () => ipcRenderer.invoke("get-all-students"),
  issueBook: (data) => ipcRenderer.invoke("issue-book", data),
});
