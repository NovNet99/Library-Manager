const fs = require("fs");
const path = require("path");

//UserManager Class
class UserManager {
  constructor(role) {
    this.role = role;

    this.filePath = path.join(__dirname, `../${role}s.json`); // students.json, librarians.json, admins.json;
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
  registerUser(username, password, confirmPassword, extraData = {}) {
    if (this.isUsernameTaken(username)) {
      return { success: false, message: "Username already taken." };
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match." };
    }

    let user;

    if (this.role === "student") {
      user = {
        username,
        password,
        role: "student",
      };
    } else if (this.role === "librarian") {
      if (!extraData.librarianCode || extraData.librarianCode !== "LIB123") {
        return { success: false, message: "Invalid librarian code." };
      }
      user = {
        username,
        password,
        role: "librarian",
        librarianCode: extraData.librarianCode,
      };
    } else if (this.role === "admin") {
      user = { username, password, role: "admin" };
    }

    //If checks are valid, it pushes the new user registration data to the users list and then saves that list.
    this.users.push(user);
    this.saveUsers();
    return { success: true, message: `${this.role} registered successfully!` };
  }

  getLibrarianData(username) {
    return this.users.find((user) => user.username === username);
  }
}

//Export the class.
module.exports = UserManager;
