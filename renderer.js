//Selects the HTML element with the ID info. 
const information = document.getElementById('info')
//Sets its text content to display the versions of Chrome, Node.js, and Electron.
information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`

//Calls window.versions.ping(), which sends an IPC message to the main process.
const func = async () => {
  //Waits for a response ('pong') from the main process.
  const response = await window.versions.ping()
  //Logs 'pong' to the console.
  console.log(response) // prints out 'pong'
}

const setButton = document.getElementById('btn')
const titleInput = document.getElementById('title')
setButton.addEventListener('click', () => {
  const title = titleInput.value
  //Sends an IPC message to the main process to change the window title.
  window.electronAPI.setTitle(title)
})

func()