const fs = require("fs");
const Book = require("./Book");

class DatabaseController {
  constructor(filePath) {
    this.filePath = filePath;
    this.books = this.loadBooks();
  }

  loadBooks() {
    if (fs.existsSync(this.filePath)) {
      return JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    }
    return [];
  }

  saveBooks() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.books, null, 2));
  }

  addBook(book) {
    this.books.push(book);
    this.saveBooks();
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

  searchBook(title) {
    return this.books.filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
  }
}

module.exports = DatabaseController;
