const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Ensure this path is correct
const User = require('../src/models/user');
const Task = require('../src/models/tasks');

describe('Integration Tests', () => {
  let authToken;
  let userId;
  let taskId;

  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGO_CONNECTION_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } catch (error) {
      console.error("Failed to connect to the database:", error);
      throw error; // Re-throw to fail the tests if we can't connect
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data
      if (userId) {
        await User.findByIdAndDelete(userId);
      }
      if (taskId) {
        await Task.findByIdAndDelete(taskId);
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    } finally {
      // Ensure the connection is closed
      await mongoose.connection.close();
    }
  }, 15000); // Increased timeout to allow for cleanup

  describe('User Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/sign-in')
        .send({
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'password123'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Sign-In Successfully');
    });

    it('should login the user', async () => {
      const res = await request(app)
        .post('/api/v1/log-in')
        .send({
          username: 'testuser',
          password: 'password123'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.id).toBeDefined();
      authToken = res.body.token;
      userId = res.body.id;
    });
  });

  describe('Task Management', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/api/v2/create-task')
        .set('Authorization', `Bearer ${authToken}`)
        .set('id', userId)
        .send({
          title: 'Test Task',
          desc: 'This is a test task'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Task Created');
      taskId = res.body.taskId; // Capture the task ID for later cleanup
    });

    it('should get all tasks', async () => {
      const res = await request(app)
        .get('/api/v2/getAllTasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('id', userId);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
      taskId = res.body.data.tasks[0]._id;
    });

    it('should update a task', async () => {
      const res = await request(app)
        .put(`/api/v2/updateTask/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Task',
          desc: 'This is an updated test task'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Task updated successfully');
    });

    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/api/v2/deleteTasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('id', userId);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Task deleted successfully');
    });
  });
});
