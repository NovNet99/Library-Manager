const fs = require("fs");

//UserManager Class
class UserManager {
  constructor(filePath) {
    //Takes the file path where we want to store user register data.
    this.filePath = filePath;
    //Grabs the user register data list.
    this.users = this.loadUsers();
  }

  //Grabs the user register data list.
  loadUsers() {
    if (!fs.existsSync(this.filePath)) {
      // If the file doesn't exist, create it with an empty array
      fs.writeFileSync(this.filePath, JSON.stringify([]));
      return [];
    }
    return JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
  }

  //Saves the users to the file path where user register data is stored.
  saveUsers() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.users, null, 2));
  }

  //Checks if the username is already taken i.e. is already in the users list.
  isUsernameTaken(username) {
    return this.users.some((user) => user.username === username);
  }

  //Handles user registration logic.
  registerUser(username, password, confirmPassword) {
    if (this.isUsernameTaken(username)) {
      return { success: false, message: "Username already taken." };
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match." };
    }

    //If checks are valid, it pushes the new user registration data to the users list and then saves that list.
    this.users.push({ username, password });
    this.saveUsers();
    return { success: true, message: "User registered successfully!" };
  }
}

//Export the class.
module.exports = UserManager;
