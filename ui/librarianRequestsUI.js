const backButton = document.getElementById("backButton");
const librarianUsername = localStorage.getItem("librarianUsername");
const librarianNameDisplay = document.getElementById("librarianName");
const confirmationMessage = document.getElementById("confirmationMessage");
const requestsList = document.getElementById("requestsList");
const dueDateInput = document.getElementById("dueDate");

// Set librarian name
librarianNameDisplay.textContent = `Welcome, ${librarianUsername}`;

// Set default due date (e.g., 2 weeks from today)
const defaultDueDate = new Date();
defaultDueDate.setDate(defaultDueDate.getDate() + 14);
dueDateInput.value = defaultDueDate.toISOString().split("T")[0];

// Display requests on load
displayRequests();

async function displayRequests() {
  const requests = await window.electronAPI.getAllRequests();
  requestsList.innerHTML = "";
  if (Object.keys(requests).length === 0) {
    requestsList.innerHTML = "<p>No requests pending.</p>";
    return;
  }
  Object.entries(requests).forEach(([username, userRequests]) => {
    if (userRequests.length > 0) {
      const section = document.createElement("div");
      section.className = "request-section";
      section.innerHTML = `<h3>${username}</h3>`;
      const list = document.createElement("div");
      list.className = "request-items";
      userRequests.forEach((request) => {
        const item = document.createElement("div");
        item.className = "request-item";
        item.innerHTML = `
          <div class="request-details">
            <p><strong>Title:</strong> ${request.title}</p>
            <p><strong>ISBN:</strong> ${request.isbn}</p>
            <p><strong>Requested At:</strong> ${new Date(request.requestedAt).toLocaleDateString()}</p>
          </div>
          <div class="request-actions">
            <button type="button" onclick="approveRequest('${username}', '${request.isbn}')">Approve</button>
            <button type="button" onclick="declineRequest('${username}', '${request.isbn}')">Decline</button>
          </div>
        `;
        list.appendChild(item);
      });
      section.appendChild(list);
      requestsList.appendChild(section);
    }
  });
}

async function approveRequest(username, isbn) {
  const dueDate = dueDateInput.value;
  if (!dueDate) {
    confirmationMessage.textContent = "Please set a due date.";
    confirmationMessage.style.color = "red";
    setTimeout(() => (confirmationMessage.textContent = ""), 3000);
    return;
  }
  const result = await window.electronAPI.approveRequest({ username, isbn, dueDate });
  confirmationMessage.textContent = result.message;
  confirmationMessage.style.color = result.success ? "green" : "red";
  setTimeout(() => (confirmationMessage.textContent = ""), 3000);
  if (result.success) displayRequests();
}

async function declineRequest(username, isbn) {
  const result = await window.electronAPI.declineRequest({ username, isbn });
  confirmationMessage.textContent = result.message;
  confirmationMessage.style.color = result.success ? "green" : "red";
  setTimeout(() => (confirmationMessage.textContent = ""), 3000);
  if (result.success) displayRequests();
}

backButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/librarian-database.html");
});