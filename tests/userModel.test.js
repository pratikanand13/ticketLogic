require('dotenv').config();
const mongoose = require("mongoose");
const User = require("../src/models/user");

describe("User Model Unit Tests", () => {
  let testUsers = [];

  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGO_CONNECTION_URI);
    } catch (error) {
      console.error("Failed to connect to the database:", error);
      throw error; // Re-throw to fail the tests if we can't connect
    }
  });

  afterEach(async () => {
    try {
      // Delete only the users created during the tests
      for (const user of testUsers) {
        await User.findByIdAndDelete(user._id);
      }
      testUsers = []; // Clear the array for the next test
    } catch (error) {
      console.error("Failed to clean up test users:", error);
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error("Failed to close connection:", error);
    }
  });

  it("should create and save a user successfully", async () => {
    const userData = {
      username: "testuser",
      email: "testuser@example.com",
      password: "password123",
    };
    const user = new User(userData);
    const savedUser = await user.save();
    testUsers.push(savedUser); // Add to testUsers array

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.password).toBe(userData.password);
    expect(savedUser.tasks).toEqual([]);
  });

  it("should not save a user without required fields", async () => {
    const userWithoutRequiredFields = new User({ username: "testuser" });
    await expect(userWithoutRequiredFields.save()).rejects.toThrow();
  });

  it("should not save a user with a duplicate username", async () => {
    const userData = {
      username: "uniqueuser",
      email: "unique@example.com",
      password: "password123",
    };
    const user = await new User(userData).save();
    testUsers.push(user); // Add to testUsers array

    const duplicateUser = new User({
      username: "uniqueuser",
      email: "another@example.com",
      password: "anotherpassword",
    });

    await expect(duplicateUser.save()).rejects.toThrow(/E11000 duplicate key error/);
  });

  it("should not save a user with a duplicate email", async () => {
    const userData = {
      username: "emailuser",
      email: "duplicate@example.com",
      password: "password123",
    };
    const user = await new User(userData).save();
    testUsers.push(user); // Add to testUsers array

    const duplicateUser = new User({
      username: "anotheremailuser",
      email: "duplicate@example.com",
      password: "anotherpassword",
    });

    await expect(duplicateUser.save()).rejects.toThrow(/E11000 duplicate key error/);
  });
});