const fs = require("fs");
const Book = require("./Book");

class DatabaseController {
  constructor(filePath) {
    this.filePath = filePath;
    this.books = this.loadBooks();
  }

  loadBooks() {
    if (fs.existsSync(this.filePath)) {
      const rawBooks = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      // Convert raw JSON objects to Book instances
      return rawBooks.map(
        book => new Book(book.title, book.author, book.isbn, book.available, book.genre)
      );
    }
    return [];
  }

  saveBooks() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.books, null, 2));
  }

  addBook(book) {
    // Accept a Book instance or plain object and ensure it’s a Book
    const bookInstance =
      book instanceof Book ? book : new Book(book.title, book.author, book.isbn, book.available, book.genre);
    // Check for duplicates based on ISBN
    const existingBook = this.books.find(b => b.isbn === bookInstance.isbn);
    if (existingBook) {
      return { success: false, message: "Book with this ISBN already exists." };
    }
    this.books.push(bookInstance);
    this.saveBooks();
    return { success: true, message: "Book added successfully." };
  }

  removeBook(isbn) {
    const index = this.books.findIndex(b => b.isbn === isbn);
    if (index !== -1) {
      this.books.splice(index, 1);
      this.saveBooks();
      return { success: true, message: "Book removed successfully." };
    }
    return { success: false, message: "Book not found." };
  }

  updateBook(originalIsbn, updatedBook) {
    const index = this.books.findIndex(b => b.isbn === originalIsbn);
    if (index === -1) {
      return { success: false, message: "Book not found." };
    }
  
    // Check if the new ISBN is already taken by another book
    if (updatedBook.isbn !== originalIsbn) {
      const existingBook = this.books.find(b => b.isbn === updatedBook.isbn);
      if (existingBook) {
        return { success: false, message: "Another book with this ISBN already exists." };
      }
    }
  
    // Replace the old book with a new Book instance at the same position
    this.books[index] = new Book(
      updatedBook.title,
      updatedBook.author,
      updatedBook.isbn,
      updatedBook.available,
      updatedBook.genre
    );
    this.saveBooks();
    return { success: true, message: "Book updated successfully." };
  }

  searchBook({ title = "", author = "", isbn = "", genre = "", available = null }) {
    return this.books.filter((book) => {
      const matchesTitle = title
        ? book.title.toLowerCase().includes(title.toLowerCase())
        : true;
      const matchesAuthor = author
        ? book.author.toLowerCase().includes(author.toLowerCase())
        : true;
      const matchesIsbn = isbn
        ? book.isbn.toLowerCase().includes(isbn.toLowerCase())
        : true;
      const matchesGenre = genre && genre !== "None"
        ? book.genre.toLowerCase() === genre.toLowerCase()
        : true;
      const matchesAvailable = available !== null
        ? book.available === available
        : true;
      return (
        matchesTitle &&
        matchesAuthor &&
        matchesIsbn &&
        matchesGenre &&
        matchesAvailable
      );
    });
  }

  getBooks() {
    this.books = this.loadBooks(); // Reload from file
    return this.books;
  }

  getBookByIsbn(isbn) {
    const books = this.getBooks();
    return books.find((book) => book.isbn === isbn);
  }
}

module.exports = DatabaseController;
