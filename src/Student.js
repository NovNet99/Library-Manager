class Student{
  constructor(userName, database) {
    this.userName = userName;
    this.role = "student";
    this.borrowedBooks = [];
    this.requests = []; // New array for book requests
    this.database = database;
  }

  requestBook(isbn) {
    const book = this.database.getBookByIsbn(isbn); // Assume this method exists
    if (!book) {
      return { success: false, message: "Book not found." };
    }
    if (!book.available) {
      return { success: false, message: "Book is not available." };
    }
    if (this.requests.some((req) => req.isbn === isbn)) {
      return { success: false, message: "Book already requested." };
    }
    this.requests.push({ isbn, title: book.title, requestedAt: new Date().toISOString() });
    return { success: true, message: `Requested ${book.title} successfully.` };
  }

  borrowBook(book) {
    if (book.borrowBook().success) {
      this.borrowedBooks.push(book);
      return { success: true, message: `You borrowed ${book.title}.` };
    }
    return { success: false, message: "Book is not available." };
  }

  returnBook(book) {
    const index = this.borrowedBooks.findIndex((b) => b.isbn === book.isbn);
    if (index !== -1) {
      book.returnBook();
      this.borrowedBooks.splice(index, 1);
      return { success: true, message: `You returned ${book.title}.` };
    }
    return { success: false, message: "You haven't borrowed this book." };
  }

  getBooks() {
    return this.database.getBooks();
  }

  getRequests() {
    return this.requests;
  }
}

module.exports = Student;
