const versionInfo = document.getElementById("versionInfo");
const studentAccessButton = document.getElementById("studentAccessButton");
const librarianAccessButton = document.getElementById("librarianAccessButton");

versionInfo.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`;

studentAccessButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/student-register.html");
});

librarianAccessButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/librarian-register.html");
});
