const fs = require("fs");
const path = require("path");

class Student {
  constructor(userName, database) {
    this.userName = userName;
    this.role = "student";
    this.borrowedBooks = [];
    this.database = database;
    this.requestsFilePath = path.join(__dirname, "../requests.json");
    this.borrowedBooksFilePath = path.join(__dirname, "../borrowedBooks.json");
    this.finesFilePath = path.join(__dirname, "../fines.json");
    this.requests = this.loadRequests(); // Ensure this runs last to sync with file
    this.fines = this.loadFines();
  }

  searchBook(searchParams) {
    return this.database.searchBook(searchParams);
  }

  loadRequests() {
    try {
      if (fs.existsSync(this.requestsFilePath)) {
        const fileContent = fs.readFileSync(this.requestsFilePath, "utf-8");
        if (!fileContent.trim()) {
          fs.writeFileSync(this.requestsFilePath, JSON.stringify({}, null, 2));
          return [];
        }
        const requests = JSON.parse(fileContent);
        return requests[this.userName] || [];
      } else {
        fs.writeFileSync(this.requestsFilePath, JSON.stringify({}, null, 2));
        return [];
      }
    } catch (error) {
      console.error(`Error loading requests for ${this.userName}:`, error.message);
      fs.writeFileSync(this.requestsFilePath, JSON.stringify({}, null, 2)); // Reset on error
      return [];
    }
  }

  requestBook(isbn) {
    try {
      // Check for outstanding fines
      const fines = this.calculateFines();
      if (fines > 0) {
        return { success: false, message: "Cannot request book: Outstanding fines must be cleared." };
      }
  
      const book = this.database.getBookByIsbn(isbn);
      if (!book) return { success: false, message: "Book not found." };
      if (!book.available) return { success: false, message: "Book is not available." };
      if (this.requests.some((req) => req.isbn === isbn)) return { success: false, message: "Book already requested." };
      
      const request = { isbn, title: book.title, requestedAt: new Date().toISOString() };
      this.requests.push(request);
  
      // Persist to requests.json
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
      requests[this.userName] = this.requests;
      fs.writeFileSync(this.requestsFilePath, JSON.stringify(requests, null, 2));
  
      return { success: true, message: `Requested ${book.title} successfully.` };
    } catch (error) {
      console.error(`Error requesting book ${isbn} for ${this.userName}:`, error.message);
      return { success: false, message: "Failed to request book." };
    }
  }

  unrequestBook(isbn) {
    try {
      const initialLength = this.requests.length;
      this.requests = this.requests.filter((req) => req.isbn !== isbn);
      if (this.requests.length < initialLength) {
        const requests = JSON.parse(fs.readFileSync(this.requestsFilePath));
        requests[this.userName] = this.requests;
        fs.writeFileSync(this.requestsFilePath, JSON.stringify(requests, null, 2));
        return { success: true, message: "Book request removed." };
      }
      return { success: false, message: "Book was not requested." };
    } catch (error) {
      console.error("Error removing request:", error.message);
      return { success: false, message: "Failed to remove request." };
    }
  }

  getStudentRequests() {
    try {
      const requests = this.requests;
      const books = this.database.getBooks();
      return requests.map((req) => {
        const book = books.find((b) => b.isbn === req.isbn) || {};
        return { ...req, author: book.author, genre: book.genre };
      });
    } catch (error) {
      console.error(`Error fetching requests for ${this.userName}:`, error.message);
      return [];
    }
  }

  getBorrowedBooks() {
    try {
      const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
        ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
        : {};
      return borrowedBooks[this.userName] || [];
    } catch (error) {
      console.error(`Error fetching borrowed books for ${this.userName}:`, error.message);
      return [];
    }
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

  loadFines() {
    try {
      if (fs.existsSync(this.finesFilePath)) {
        const fileContent = fs.readFileSync(this.finesFilePath, "utf-8");
        if (!fileContent.trim()) {
          fs.writeFileSync(this.finesFilePath, JSON.stringify({}, null, 2));
          return 0;
        }
        const fines = JSON.parse(fileContent);
        return fines[this.userName] || 0;
      } else {
        fs.writeFileSync(this.finesFilePath, JSON.stringify({}, null, 2));
        return 0;
      }
    } catch (error) {
      console.error(`Error loading fines for ${this.userName}:`, error.message);
      fs.writeFileSync(this.finesFilePath, JSON.stringify({}, null, 2));
      return 0;
    }
  }

  saveFines() {
    try {
      const fines = fs.existsSync(this.finesFilePath)
        ? JSON.parse(fs.readFileSync(this.finesFilePath, "utf-8"))
        : {};
      fines[this.userName] = this.fines;
      fs.writeFileSync(this.finesFilePath, JSON.stringify(fines, null, 2));
    } catch (error) {
      console.error(`Error saving fines for ${this.userName}:`, error.message);
    }
  }

  calculateFines() {
    const borrowedBooks = this.getBorrowedBooks();
    let totalFines = 0;
    const today = new Date();

    borrowedBooks.forEach((book) => {
      const dueDate = new Date(book.dueDate);
      if (today > dueDate) {
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        totalFines += daysOverdue * 5; // $5 per day overdue
      }
    });

    this.fines = totalFines;
    this.saveFines();
    return totalFines;
  }

  getDueDateStatus() {
    const borrowedBooks = this.getBorrowedBooks();
    const today = new Date();
    return borrowedBooks.map((book) => {
      const dueDate = new Date(book.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      let color = "green";
      if (daysUntilDue < 0) {
        color = "red";
      } else if (daysUntilDue <= 2) {
        color = "yellow";
      }
      return {
        ...book,
        daysUntilDue: daysUntilDue >= 0 ? `Due in ${Math.abs(daysUntilDue)} day(s)` : `Overdue by ${Math.abs(daysUntilDue)} day(s)`,
        notificationColor: color,
      };
    });
  }

  getFines() {
    return this.calculateFines();
  }
}

module.exports = Student;