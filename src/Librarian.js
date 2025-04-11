const Book = require("./Book");
const fs = require("fs");
const path = require("path");

class Librarian {
  constructor(userName, librarianCode, database) {
    this.userName = userName;
    this.librarianCode = librarianCode;
    this.database = database;
    this.requestsFilePath = path.join(__dirname, "../requests.json");
    this.borrowedBooksFilePath = path.join(__dirname, "../borrowedBooks.json");
  }

  addBook(title, author, isbn, available, genre) {
    const book = new Book(title, author, isbn, available, genre);
    return this.database.addBook(book);
  }

  removeBook(isbn) {
    return this.database.removeBook(isbn);
  }

  searchBook(title) {
    return this.database.searchBook(title);
  }

  getBooks() {
    return this.database.getBooks();
  }

  editBook(originalIsbn, updatedBook) {
    return this.database.updateBook(originalIsbn, updatedBook);
  }

  getAllRequests() {
    try {
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
      const books = this.database.getBooks();
      Object.keys(requests).forEach((username) => {
        requests[username] = requests[username].map((req) => {
          const book = books.find((b) => b.isbn === req.isbn) || {};
          return { ...req, author: book.author, genre: book.genre };
        });
      });
      return requests;
    } catch (error) {
      console.error("Error fetching all requests:", error.message);
      return {};
    }
  }

  approveRequest(username, isbn, dueDate) {
    try {
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
      const studentRequests = requests[username] || [];
      const requestIndex = studentRequests.findIndex((req) => req.isbn === isbn);
      if (requestIndex === -1) return { success: false, message: "Request not found." };
      const [request] = studentRequests.splice(requestIndex, 1);
      requests[username] = studentRequests;
      fs.writeFileSync(this.requestsFilePath, JSON.stringify(requests, null, 2));

      const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
        ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
        : {};
      borrowedBooks[username] = borrowedBooks[username] || [];
      borrowedBooks[username].push({
        title: request.title,
        isbn: request.isbn,
        approvalDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        dueDate: dueDate,
      });
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));

      /*const book = this.database.getBookByIsbn(isbn);
      if (book) {
        book.available = false;
        this.database.saveBooks();
      }*/

      return { success: true, message: `Approved ${request.title} for ${username}.` };
    } catch (error) {
      console.error("Error approving request:", error.message);
      return { success: false, message: "Failed to approve request." };
    }
  }

  declineRequest(username, isbn) {
    try {
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
      const studentRequests = requests[username] || [];
      const requestIndex = studentRequests.findIndex((req) => req.isbn === isbn);
      if (requestIndex === -1) return { success: false, message: "Request not found." };
      const [request] = studentRequests.splice(requestIndex, 1);
      requests[username] = studentRequests;
      fs.writeFileSync(this.requestsFilePath, JSON.stringify(requests, null, 2));
      return { success: true, message: `Declined ${request.title} for ${username}.` };
    } catch (error) {
      console.error("Error declining request:", error.message);
      return { success: false, message: "Failed to decline request." };
    }
  }
}

module.exports = Librarian;