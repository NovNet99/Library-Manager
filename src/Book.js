class Book {
  constructor(title, author, isbn, available, genre) {
    this.title = title;
    this.author = author;
    this.isbn = isbn;
    this.available = available;
    this.genre = genre; 
  }

  /*borrowBook() {
    if (this.available) {
      this.available = false;
      return { success: true, message: "Book borrowed successfully." };
    }
    return { success: false, message: "Book is not available." };
  }

  returnBook() {
    this.available = true;
    return { success: true, message: "Book returned successfully." };
  }*/
}

module.exports = Book;
