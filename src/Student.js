class Student {
  constructor(name, studentId) {
    this.name = name;
    this.studentId = studentId;
    this.borrowedBooks = [];
  }

  borrowBook(book) {
    if (book.borrowBook().success) {
      this.borrowedBooks.push(book);
      return { success: true, message: `You borrowed ${book.title}.` };
    }
    return { success: false, message: "Book is not available." };
  }

  returnBook(book) {
    const index = this.borrowedBooks.findIndex(b => b.isbn === book.isbn);
    if (index !== -1) {
      book.returnBook();
      this.borrowedBooks.splice(index, 1);
      return { success: true, message: `You returned ${book.title}.` };
    }
    return { success: false, message: "You haven't borrowed this book." };
  }
}

module.exports = Student;