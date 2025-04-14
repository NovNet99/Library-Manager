const fs = require("fs");
const Book = require("./Book");

class DatabaseController {
  constructor(filePath) {
    this.filePath = filePath;
    this.books = this.loadBooks();
    this.FINE_PER_DAY = 5;
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
    //Writes the books in books attribute to the books file.
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
    //Gets the book by the index.
    const index = this.books.findIndex(b => b.isbn === isbn);
    //If the index is valid, removes using splice which removes 1 item at the given index.
    //Then, the new books attribute without the book is written back to the books file.
    if (index !== -1) {
      this.books.splice(index, 1);
      this.saveBooks();
      return { success: true, message: "Book removed successfully." };
    }
    return { success: false, message: "Book not found." };
  }

  updateBook(originalIsbn, updatedBook) {
    //Gets the index of the original book using the original ISBN.
    const index = this.books.findIndex(b => b.isbn === originalIsbn);
    //Returns error if book not found.
    if (index === -1) {
      return { success: false, message: "Book not found." };
    }
  
    //Checks if the new ISBN is already taken by another book.
    if (updatedBook.isbn !== originalIsbn) {
      const existingBook = this.books.find(b => b.isbn === updatedBook.isbn);
      if (existingBook) {
        return { success: false, message: "Another book with this ISBN already exists." };
      }
    }
  
    //Replaces the old book with a new book instance at the same position using updated book data.
    this.books[index] = new Book(
      updatedBook.title,
      updatedBook.author,
      updatedBook.isbn,
      updatedBook.available,
      updatedBook.genre
    );
    //Calls the saveBooks() function which overwrites the books variable to the books file.
    this.saveBooks();
    return { success: true, message: "Book updated successfully." };
  }

  //Filters the books according to the parameters. If the parameter is empty, it ignores it.
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

  calculateBookFine(book, today = new Date()) {
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    const dueDate = new Date(book.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const timeDiff = today - dueDate;
    if (timeDiff > 0) {
      const daysOverdue = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return daysOverdue * this.FINE_PER_DAY;
    }
    return 0;
  }

  calculateTotalFines(books, today = new Date()) {
    return books.reduce((total, book) => total + this.calculateBookFine(book, today), 0);
  }

  calculateBooksWithFines(books, today = new Date()) {
    today.setHours(0, 0, 0, 0);
    return books.map((book) => {
      const dueDate = new Date(book.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const timeDiff = dueDate - today;
      const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      const fine = this.calculateBookFine(book, today);
      return {
        ...book,
        daysUntilDue,
        fine,
      };
    });
  }

}

module.exports = DatabaseController;
