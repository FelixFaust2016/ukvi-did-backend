import express, { Router } from "express";
import {
  addIssuer,
  addUser,
  deleteUser,
  getUsers,
  signIn,
  updateUser,
} from "../controllers/user";

const router: Router = express.Router();

router.post("/add_user", addUser);
router.post("/:id", updateUser);
router.post("/delete/:id", deleteUser);
router.get("/", getUsers);
router.post("/sign_in", signIn);
router.post("/add_issuer", addIssuer);

export default router;
