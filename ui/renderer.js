/*Realistically, the JavaScript code could (and probably should) be written here instead of within script tags in the HTML files.*/

//Selects the HTML element with the ID info.
const versionInfo = document.getElementById("versionInfo");
//Sets its text content to display the versions of Chrome, Node.js, and Electron.
versionInfo.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`;

//--------INDEX.HTML CODE FUNCTIONALITY--------
const enterAppButton = document.getElementById("enterAppBtn");
const userEnterAppButton = document.getElementById("userEnterAppBtn");

enterAppButton.addEventListener("click", () => {
  //Tell the main process to load database.html
  window.electronAPI.loadPage("database.html");
});

userEnterAppButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/user-signup.html");
});
