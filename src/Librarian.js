const Book = require("./Book");

class Librarian{
  constructor(userName, librarianCode, database) {
    this.userName = userName;
    this.librarianCode = librarianCode;
    this.database = database;
  }

  addBook(title, author, isbn) {
    const book = new Book(title, author, isbn);
    this.database.addBook(book);
    return { success: true, message: "Book added successfully." };
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
}

module.exports = Librarian;
