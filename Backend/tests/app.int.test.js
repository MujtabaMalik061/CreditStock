import request from "supertest";
import app from "../src/app.js";

describe("Integration: base routes", () => {
  it("GET / returns the welcome string", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("Welcome to the Server API");
  });
});
