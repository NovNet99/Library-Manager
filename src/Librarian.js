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
    const removeResult = this.removeBook(originalIsbn);
    if (!removeResult.success) {
      return removeResult;
    }

    // Check if the new ISBN already exists (if it’s different from the original)
    if (updatedBook.isbn !== originalIsbn) {
      const existingBook = this.database.getBooks().find(b => b.isbn === updatedBook.isbn);
      if (existingBook) {
        // Re-add the old book if the new ISBN is a duplicate
        const oldBook = this.database.getBooks().find(b => b.isbn === originalIsbn);
        if (oldBook) this.database.addBook(oldBook);
        return { success: false, message: "A book with the new ISBN already exists." };
      }
    }

    // Add the updated book with the new ISBN
    const bookInstance =
      updatedBook instanceof Book
        ? updatedBook
        : new Book(updatedBook.title, updatedBook.author, updatedBook.isbn, updatedBook.available, updatedBook.genre);
    const addResult = this.database.addBook(bookInstance);
    if (!addResult.success) {
      return addResult; // Propagate any add errors (e.g., duplicates)
    }

    return { success: true, message: "Book updated successfully." };
  }
}

module.exports = Librarian;