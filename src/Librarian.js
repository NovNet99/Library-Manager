const Book = require("./Book");
const fs = require("fs");
const path = require("path");

class Librarian {
  constructor(userName, librarianCode, database) {
    this.userName = userName;
    this.librarianCode = librarianCode;
    this.database = database;
    this.requestsFilePath = path.join(__dirname, "../data/requests.json");
    this.borrowedBooksFilePath = path.join(__dirname, "../data/borrowedBooks.json");
    this.finesFilePath = path.resolve(__dirname, "../data/fines.json");
    this.usersFilePath = path.resolve(__dirname, "../data/students.json");
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
      //If the filepath exists, sets requests to its data. Otherwise, sets requests to an empty object.
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
        //Gets all the books in the database.
      const books = this.database.getBooks();
      const allRequests = [];
      //Iterates over each username in the requests object.
      Object.keys(requests).forEach((username) => {
        //For each username, iterates over their array of requests.
        requests[username].forEach((req) => {
          const book = books.find((b) => b.isbn === req.isbn) || {};
          allRequests.push({
            ...req,
            author: book.author,
            genre: book.genre,
            username,
          });
        });
      });
      return allRequests;
    } catch (error) {
      console.error("Error fetching all requests:", error.message);
      return [];
    }
  }

  approveRequest(username, isbn, dueDate) {
    try {
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
      //Gets the requests for that specific student.
      const studentRequests = requests[username] || [];
      //Gets the index of the approved book in the requests.
      const requestIndex = studentRequests.findIndex((req) => req.isbn === isbn);
      if (requestIndex === -1) return { success: false, message: "Request not found." };
      //Removes the request from the request list for that student.
      const [request] = studentRequests.splice(requestIndex, 1);
      //Refreshes that students requests and writes it to the request file.
      requests[username] = studentRequests;
      fs.writeFileSync(this.requestsFilePath, JSON.stringify(requests, null, 2));

      //Gets the borrowed books for that specific student and pushes the borrowed book to that list.
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
      //Saves (writes) the updated borrowed books to the file.
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
      //Gets the students requests list and removes the declined request from the list.
      //Updates the file.
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
      const books = this.database.getBooks(); // Load book details
      const allBorrowedBooks = [];
      Object.keys(borrowedBooks).forEach((username) => {
        const booksWithFines = this.database.calculateBooksWithFines(borrowedBooks[username]);
        booksWithFines.forEach((book) => {
          const bookDetails = books.find((b) => b.isbn === book.isbn) || {};
          allBorrowedBooks.push({
            ...book,
            author: bookDetails.author || "",
            genre: bookDetails.genre || "",
            username,
          });
        });
      });
      return allBorrowedBooks;
    } catch (error) {
      console.error("Error fetching borrowed books:", error.message);
      return [];
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
      const fine = this.database.calculateBookFine(book);
      if (fine > 0) {
        return { success: false, message: "Cannot return book: Outstanding fines must be cleared." };
      }
      studentBooks.splice(bookIndex, 1);
      borrowedBooks[username] = studentBooks;
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));
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
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 2);
      studentBooks[bookIndex].dueDate = newDueDate.toISOString().split("T")[0];
      borrowedBooks[username] = studentBooks;
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));
      const fines = this.database.calculateTotalFines(studentBooks);
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
      studentBooks.splice(bookIndex, 1);
      borrowedBooks[username] = studentBooks;
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));
      const fines = this.database.calculateTotalFines(studentBooks);
      const finesData = fs.existsSync(this.finesFilePath)
        ? JSON.parse(fs.readFileSync(this.finesFilePath, "utf-8"))
        : {};
      finesData[username] = fines;
      fs.writeFileSync(this.finesFilePath, JSON.stringify(finesData, null, 2));
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
    return this.database.calculateTotalFines(studentBooks);
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
  
      // Check book existence and availability
      const book = this.database.getBookByIsbn(isbn);
      if (!book) {
        return { success: false, message: "Book not found." };
      }
      if (!book.available) {
        return { success: false, message: "Book is not available." };
      }
  
      // Check if user already borrowed the book
      if (!this.borrowedBooksFilePath || typeof this.borrowedBooksFilePath !== "string") {
        throw new Error("Invalid borrowedBooksFilePath");
      }
      const borrowedBooks = fs.existsSync(this.borrowedBooksFilePath)
        ? JSON.parse(fs.readFileSync(this.borrowedBooksFilePath, "utf-8"))
        : {};
      borrowedBooks[username] = borrowedBooks[username] || [];
      if (borrowedBooks[username].some((b) => b.isbn === isbn)) {
        return { success: false, message: "Cannot issue book: User already has this book borrowed." };
      }
  
      // Validate due date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDueDate = new Date(dueDate);
      selectedDueDate.setHours(0, 0, 0, 0);
      if (selectedDueDate < today) {
        return { success: false, message: "Due date cannot be in the past." };
      }
  
      // Remove pending request if it exists
      if (!this.requestsFilePath || typeof this.requestsFilePath !== "string") {
        throw new Error("Invalid requestsFilePath");
      }
      const requests = fs.existsSync(this.requestsFilePath)
        ? JSON.parse(fs.readFileSync(this.requestsFilePath, "utf-8"))
        : {};
      requests[username] = requests[username] || [];
      const requestIndex = requests[username].findIndex((req) => req.isbn === isbn);
      if (requestIndex !== -1) {
        requests[username].splice(requestIndex, 1);
        fs.writeFileSync(this.requestsFilePath, JSON.stringify(requests, null, 2));
      }
  
      // Update borrowedBooks.json
      borrowedBooks[username].push({
        title: book.title,
        isbn: book.isbn,
        approvalDate: today.toISOString().split("T")[0],
        dueDate: dueDate,
      });
      fs.writeFileSync(this.borrowedBooksFilePath, JSON.stringify(borrowedBooks, null, 2));
  
      // Update book availability
      book.available = false;
      this.database.saveBooks();
  
      return { success: true, message: `Book ${book.title} issued to ${username} successfully.` };
    } catch (error) {
      console.error("Error issuing book:", error.message);
      return { success: false, message: `Failed to issue book: ${error.message}` };
    }
  }
}

module.exports = Librarian;