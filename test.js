const request = require("supertest");

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

describe("User API tests", () => {
  const testUsername = "test_user_" + Math.random().toString(36).substring(2, 15);
  const testEmail = `${testUsername}@example.com`;
  const testUsername2 = "test_user_" + Math.random().toString(36).substring(2, 15);
  const testEmail2 = `${testUsername2}@example.com`;
  
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    await request(BASE_URL).post("/api/users/register").send({
      firstName: "Test",
      lastName: "User",
      email: testEmail,
      password: "correctPass",
      avatar: "testAvatar",
      phone: "123-456-7890",
      role: "USER",
    });
  
    // Log in to obtain tokens
    const loginResponse = await request(BASE_URL)
      .post("/api/users/login")
      .send({
        email: testEmail,
        password: "correctPass",
      });
  
    accessToken = loginResponse.body.accessToken;
    refreshToken = loginResponse.body.refreshToken;
  });

  describe("User registration", () => {
    it("should create a new user", async () => {
      const response = await request(BASE_URL).post("/api/users/register").send({
        firstName: "New",
        lastName: "User",
        email: testEmail2,
        password: "correctPass",
        avatar: "testAvatar",
        phone: "123-456-7890",
        role: "USER",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "User created successfully");
      expect(response.body.newUser).toHaveProperty("id");
    });

    it("should fail to create a user with an existing email", async () => {
      const response = await request(BASE_URL).post("/api/users/register").send({
        firstName: "Test",
        lastName: "User",
        email: testEmail,
        password: "correctPass",
        avatar: "testAvatar",
        phone: "123-456-7890",
        role: "USER",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "User already exists");
    });
  });

  describe("User login", () => {
    it("should log in and return tokens", async () => {
      const response = await request(BASE_URL).post("/api/users/login").send({
        email: testEmail,
        password: "correctPass",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
    });

    it("should fail to log in with incorrect credentials", async () => {
      const response = await request(BASE_URL).post("/api/users/login").send({
        email: "testEmail",
        password: "wrongPass",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Update profile", () => {
    it("should update the user profile", async () => {
      const response = await request(BASE_URL)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          phone: "updatedPhone",
          avatar: "updatedAvatar",
          password: "updatedPass",
        });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Profile updated");
      expect(response.body.updatedUser).toHaveProperty("phone", "updatedPhone");
      expect(response.body.updatedUser).toHaveProperty("avatar", "updatedAvatar");
    });
  
    // it("should return 401 for unauthorized profile update", async () => {
    //   const response = await request(BASE_URL).put("/api/users/profile").send({
    //     email: testEmail,
    //     password: "wrongPass",
    //   });

    //   console.log("Response Body:", response.body); // Log the response body
    //   expect(response.status).toBe(401);
    // });
  });  

  describe("Refreshing JWT", () => {
    it("should refresh the token", async () => {
      const refreshResponse = await request(BASE_URL)
        .post("/api/users/refresh")
        .send({
          refreshToken: refreshToken,
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty("accessToken");
    });

    it("should deny refresh with expired or invalid token", async () => {
      const refreshResponse = await request(BASE_URL)
        .post("/api/users/refresh")
        .send({
          refreshToken: "invalidToken",
        });

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body).toHaveProperty("error", "Invalid or expired refresh token");
    });
  });

  describe("User logout", () => {
    it("should log out successfully", async () => {
      const response = await request(BASE_URL).post("/api/users/logout").set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Logged out successfully");
    });
  });

});
