//Selects the HTML element with the ID info.
const versionInfo = document.getElementById("versionInfo");
//Sets its text content to display the versions of Chrome, Node.js, and Electron.
versionInfo.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`;

const enterAppButton = document.getElementById("enterAppBtn");

enterAppButton.addEventListener("click", () => {
  //Tell the main process to load database.html
  window.electronAPI.loadPage("database.html"); 
});