import express, { Router } from "express";
import { getCredentials, issueCredential, verifyCredential } from "../controllers/credentials";

const router: Router = express.Router();

router.post("/issue_credential", issueCredential);
router.post("/verify_credential", verifyCredential);
router.get("/get_credentials", getCredentials);


export default router;
