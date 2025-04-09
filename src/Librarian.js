const Book = require("./Book");

class Librarian {
  constructor(userName, librarianCode, database) {
    this.userName = userName;
    this.librarianCode = librarianCode;
    this.database = database;
  }

  addBook(title, author, isbn, available, genre) {
    const book = new Book(title, author, isbn, available, genre);
    const result = this.database.addBook(book);
    return result;
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
    // Remove the old book using the original ISBN
    return this.database.updateBook(originalIsbn, updatedBook);
  }
}

module.exports = Librarian;