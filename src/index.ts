import express from "express";
import { Pool } from "./pool.js";
let pool = new Pool();
const app = express();
app.use(express.json());
pool.start();
app.post(`/message`, async (req, res) => {
    try {
      console.log(req);
      const { message } = req.body;
      console.log(`Received message: ${message}`);
      const reply = await pool.sendMessage(message || "Hello");
      return res.json({
        response: reply
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        message: "Something went wrong",
        error: `${e}`,
      });
    }
});

app.listen(3000, () => {
    console.log(`🚀 Server ready at: http://localhost:3000`);
});