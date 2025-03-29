import express, { Request, Response } from "express";
import cors from "cors";
import userRoutes from "./routes/users";
import credentialRoutes from "./routes/credentials";
import dashboardRoutes from "./routes/dashboard";

import db from "./dbConfig";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.use("/api/users", userRoutes);
app.use("/api/credential", credentialRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
