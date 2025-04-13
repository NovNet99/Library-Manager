const Book = require("./Book");
const fs = require("fs");
const path = require("path");

class Librarian {
  constructor(userName, librarianCode, database) {
    this.userName = userName;
    this.librarianCode = librarianCode;
    this.database = database;
    this.requestsFilePath = path.join(__dirname, "../requests.json");
    this.borrowedBooksFilePath = path.join(__dirname, "../borrowedBooks.json");
    this.finesFilePath = path.resolve(__dirname, "../fines.json");
    this.usersFilePath = path.resolve(__dirname, "../students.json");
  }

  addBook(title, author, isbn, available, genre) {
    const book = new Book(title, author, isbn, available, genre);
    return this.database.addBook(book);
  }

  removeBook(isbn) {
    return this.database.removeBook(isbn);
  }

  searchBook(searchParams) {
    return this.database.searchBook(searchParams);
  }

  getBooks() {
    return this.database.getBooks();
  }

  editBook(originalIsbn, updatedBook) {
    return this.database.updateBook(originalIsbn, updatedBook);
  }

  getAllRequests() {
    try {
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
      const books = this.database.getBooks();
      Object.keys(requests).forEach((username) => {
        requests[username] = requests[username].map((req) => {
          const book = books.find((b) => b.isbn === req.isbn) || {};
          return { ...req, author: book.author, genre: book.genre };
        });
      });
      return requests;
    } catch (error) {
      console.error("Error fetching all requests:", error.message);
      return {};
    }
  }

  approveRequest(username, isbn, dueDate) {
    try {
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
      const studentRequests = requests[username] || [];
      const requestIndex = studentRequests.findIndex((req) => req.isbn === isbn);
      if (requestIndex === -1) return { success: false, message: "Request not found." };
      const [request] = studentRequests.splice(requestIndex, 1);
      requests[username] = studentRequests;
      fs.writeFileSync(this.requestsFilePath, JSON.stringify(requests, null, 2));

      const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
        ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
        : {};
      borrowedBooks[username] = borrowedBooks[username] || [];
      borrowedBooks[username].push({
        title: request.title,
        isbn: request.isbn,
        approvalDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        dueDate: dueDate,
      });
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));

      /*const book = this.database.getBookByIsbn(isbn);
      if (book) {
        book.available = false;
        this.database.saveBooks();
      }*/

      return { success: true, message: `Approved ${request.title} for ${username}.` };
    } catch (error) {
      console.error("Error approving request:", error.message);
      return { success: false, message: "Failed to approve request." };
    }
  }

  declineRequest(username, isbn) {
    try {
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
      const studentRequests = requests[username] || [];
      const requestIndex = studentRequests.findIndex((req) => req.isbn === isbn);
      if (requestIndex === -1) return { success: false, message: "Request not found." };
      const [request] = studentRequests.splice(requestIndex, 1);
      requests[username] = studentRequests;
      fs.writeFileSync(this.requestsFilePath, JSON.stringify(requests, null, 2));
      return { success: true, message: `Declined ${request.title} for ${username}.` };
    } catch (error) {
      console.error("Error declining request:", error.message);
      return { success: false, message: "Failed to decline request." };
    }
  }

  getAllBorrowedBooksWithFines() {
    try {
      const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
        ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
        : {};
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight
      Object.keys(borrowedBooks).forEach((username) => {
        borrowedBooks[username] = borrowedBooks[username].map((book) => {
          const dueDate = new Date(book.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          const timeDiff = dueDate - today;
          const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          let fine = 0;
          if (daysUntilDue < 0) {
            fine = Math.abs(daysUntilDue) * 5; // $5 per day overdue
          }
          return { ...book, daysUntilDue, fine };
        });
      });
      return borrowedBooks;
    } catch (error) {
      console.error("Error fetching borrowed books:", error.message);
      return {};
    }
  }

  confirmBookReturn({ username, isbn }) {
    try {
      const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
        ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
        : {};
      const studentBooks = borrowedBooks[username] || [];
      const bookIndex = studentBooks.findIndex((book) => book.isbn === isbn);
      if (bookIndex === -1) {
        return { success: false, message: "Book not found in borrowed list." };
      }
      const book = studentBooks[bookIndex];
      const dueDate = new Date(book.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) {
        return { success: false, message: "Cannot return book: Outstanding fines must be cleared." };
      }
      studentBooks.splice(bookIndex, 1); // Remove book
      borrowedBooks[username] = studentBooks;
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));
      // Update book availability
      const dbBook = this.database.getBookByIsbn(isbn);
      if (dbBook) {
        dbBook.available = true;
        this.database.saveBooks();
      }
      return { success: true, message: `Book ${book.title} returned successfully.` };
    } catch (error) {
      console.error("Error confirming book return:", error.message);
      return { success: false, message: "Failed to return book." };
    }
  }

  confirmPayment({ username, isbn }) {
    try {
      const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
        ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
        : {};
      const studentBooks = borrowedBooks[username] || [];
      const bookIndex = studentBooks.findIndex((book) => book.isbn === isbn);
      if (bookIndex === -1) {
        return { success: false, message: "Book not found in borrowed list." };
      }
      // Extend due date to 2 days from today
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 2);
      studentBooks[bookIndex].dueDate = newDueDate.toISOString().split("T")[0];
      borrowedBooks[username] = studentBooks;
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));
      // Clear fines for this book by recalculating total fines
      const fines = this.calculateFinesForStudent(username);
      const finesData = fs.existsSync(this.finesFilePath)
        ? JSON.parse(fs.readFileSync(this.finesFilePath, "utf-8"))
        : {};
      finesData[username] = fines;
      fs.writeFileSync(this.finesFilePath, JSON.stringify(finesData, null, 2));
      return { success: true, message: `Payment confirmed for ${studentBooks[bookIndex].title}. Due date extended.` };
    } catch (error) {
      console.error("Error confirming payment:", error.message);
      return { success: false, message: "Failed to confirm payment." };
    }
  }

  confirmPaymentAndReturn({ username, isbn }) {
    try {
      const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
        ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
        : {};
      const studentBooks = borrowedBooks[username] || [];
      const bookIndex = studentBooks.findIndex((book) => book.isbn === isbn);
      if (bookIndex === -1) {
        return { success: false, message: "Book not found in borrowed list." };
      }
      const book = studentBooks[bookIndex];
      studentBooks.splice(bookIndex, 1); // Remove book
      borrowedBooks[username] = studentBooks;
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));
      // Clear fines for this book by recalculating total fines
      const fines = this.calculateFinesForStudent(username);
      const finesData = fs.existsSync(this.finesFilePath)
        ? JSON.parse(fs.readFileSync(this.finesFilePath, "utf-8"))
        : {};
      finesData[username] = fines;
      fs.writeFileSync(this.finesFilePath, JSON.stringify(finesData, null, 2));
      // Update book availability
      const dbBook = this.database.getBookByIsbn(isbn);
      if (dbBook) {
        dbBook.available = true;
        this.database.saveBooks();
      }
      return { success: true, message: `Payment confirmed and ${book.title} returned successfully.` };
    } catch (error) {
      console.error("Error confirming payment and return:", error.message);
      return { success: false, message: "Failed to confirm payment and return." };
    }
  }

  calculateFinesForStudent(username) {
    const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
      ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
      : {};
    const studentBooks = borrowedBooks[username] || [];
    let totalFines = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    studentBooks.forEach((book) => {
      const dueDate = new Date(book.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const timeDiff = today - dueDate;
      if (timeDiff > 0) {
        const daysOverdue = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        totalFines += daysOverdue * 5; // $5 per day overdue
      }
    });
    return totalFines;
  }

  getAllStudents() {
    try {
      if (!this.usersFilePath || typeof this.usersFilePath !== "string") {
        throw new Error("Invalid usersFilePath");
      }
      const users = fs.existsSync(this.usersFilePath)
        ? JSON.parse(fs.readFileSync(this.usersFilePath, "utf-8"))
        : [];
      // Filter for students based on role === "student"
      return users
        .filter((user) => user.role === "student")
        .map((user) => ({ username: user.username }));
    } catch (error) {
      console.error("Error fetching students:", error.message);
      return [];
    }
  }

  issueBook({ username, isbn, dueDate }) {
    try {
      // Validate inputs
      if (!username || !isbn || !dueDate) {
        return { success: false, message: "Username, ISBN, and due date are required." };
      }

      // Check fines
      if (!this.finesFilePath || typeof this.finesFilePath !== "string") {
        throw new Error("Invalid finesFilePath");
      }
      const finesData = fs.existsSync(this.finesFilePath)
        ? JSON.parse(fs.readFileSync(this.finesFilePath, "utf-8"))
        : {};
      const userFines = finesData[username] || 0;
      if (userFines > 0) {
        return { success: false, message: "Cannot issue book: User has outstanding fines." };
      }

      // Check book availability
      const book = this.database.getBookByIsbn(isbn);
      if (!book) {
        return { success: false, message: "Book not found." };
      }
      if (!book.available) {
        return { success: false, message: "Book is not available." };
      }

      // Validate due date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDueDate = new Date(dueDate);
      selectedDueDate.setHours(0, 0, 0, 0);
      if (selectedDueDate < today) {
        return { success: false, message: "Due date cannot be in the past." };
      }

      // Update borrowedBooks.json
      if (!this.borrowedBooksFilePath || typeof this.borrowedBooksFilePath !== "string") {
        throw new Error("Invalid borrowedBooksFilePath");
      }
      const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
        ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
        : {};
      borrowedBooks[username] = borrowedBooks[username] || [];
      borrowedBooks[username].push({
        title: book.title,
        isbn: book.isbn,
        approvalDate: today.toISOString().split("T")[0],
        dueDate: dueDate,
      });
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));

      // Update book availability
      //book.available = false;
      this.database.saveBooks();

      return { success: true, message: `Book ${book.title} issued to ${username} successfully.` };
    } catch (error) {
      console.error("Error issuing book:", error.message);
      return { success: false, message: `Failed to issue book: ${error.message}` };
    }
  }
}

module.exports = Librarian;