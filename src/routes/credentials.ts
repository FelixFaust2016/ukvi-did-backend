import express, { Router } from "express";
import {
  getCredentials,
  issueCredential,
  verifyCredential,
  revokeCredential,
} from "../controllers/credentials";

const router: Router = express.Router();

router.post("/issue_credential", issueCredential);
router.post("/verify_credential", verifyCredential);
router.get("/get_credentials", getCredentials);
router.post("/revoke_credential", revokeCredential);   

export default router;
