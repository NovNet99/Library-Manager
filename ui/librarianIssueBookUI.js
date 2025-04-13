const backButton = document.getElementById("backButton");
const librarianUsername = localStorage.getItem("librarianUsername");
const librarianNameDisplay = document.getElementById("librarianName");
const confirmationMessage = document.getElementById("confirmationMessage");
const issueBookForm = document.getElementById("issueBookForm");
const studentSelect = document.getElementById("studentSelect");
const bookSelect = document.getElementById("bookSelect");
const dueDateInput = document.getElementById("dueDate");

// Set librarian name
librarianNameDisplay.textContent = `Welcome, ${librarianUsername}`;

// Set default due date (2 weeks from today)
const defaultDueDate = new Date();
defaultDueDate.setDate(defaultDueDate.getDate() + 14);
dueDateInput.value = defaultDueDate.toISOString().split("T")[0];

// Populate dropdowns on load
populateDropdowns();

async function populateDropdowns() {
  try {
    // Get all students
    const students = await window.electronAPI.getAllStudents();
    studentSelect.innerHTML = '<option value="" disabled selected>Select a student</option>';
    if (students && students.length > 0) {
      students.forEach((student) => {
        const option = document.createElement("option");
        option.value = student.username;
        option.textContent = student.username;
        studentSelect.appendChild(option);
      });
    } else {
      studentSelect.innerHTML += '<option value="" disabled>No students found</option>';
    }

    // Get available books
    const books = await window.electronAPI.getBooks();
    bookSelect.innerHTML = '<option value="" disabled selected>Select a book</option>';
    const availableBooks = books.filter((book) => book.available);
    if (availableBooks.length > 0) {
      availableBooks.forEach((book) => {
        const option = document.createElement("option");
        option.value = book.isbn;
        option.textContent = `${book.title} (ISBN: ${book.isbn})`;
        bookSelect.appendChild(option);
      });
    } else {
      bookSelect.innerHTML += '<option value="" disabled>No available books</option>';
    }
  } catch (error) {
    showConfirmation("Error loading data: " + error.message, false);
    console.error("Populate dropdowns error:", error);
  }
}

// Handle form submission
issueBookForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = studentSelect.value;
  const isbn = bookSelect.value;
  const dueDate = dueDateInput.value;

  if (!username || !isbn || !dueDate) {
    showConfirmation("Please fill all fields.", false);
    return;
  }

  // Validate due date (not in the past)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDueDate = new Date(dueDate);
  selectedDueDate.setHours(0, 0, 0, 0);
  if (selectedDueDate < today) {
    showConfirmation("Due date cannot be in the past.", false);
    return;
  }

  try {
    const result = await window.electronAPI.issueBook({ username, isbn, dueDate });
    showConfirmation(result.message, result.success);
    if (result.success) {
      issueBookForm.reset();
      dueDateInput.value = defaultDueDate.toISOString().split("T")[0]; // Reset due date
      await populateDropdowns(); // Refresh available books
    }
  } catch (error) {
    showConfirmation("Error issuing book: " + error.message, false);
    console.error("Issue book error:", error);
  }
});

backButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/librarian-database.html");
});

function showConfirmation(message, success) {
  confirmationMessage.textContent = message;
  confirmationMessage.style.color = success ? "green" : "red";
  setTimeout(() => (confirmationMessage.textContent = ""), 3000);
}