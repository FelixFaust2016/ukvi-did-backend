import express, { Router } from "express";
import { addIssuer, addUser, signIn } from "../controllers/user";

const router: Router = express.Router();

router.post("/add_user", addUser);
router.post("/sign_in", signIn);
router.post("/add_issuer", addIssuer);


export default router;
