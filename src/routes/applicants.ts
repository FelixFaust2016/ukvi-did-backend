import express, { Router } from "express";
import { addApplicant, deleteApplicant } from "../controllers/applicants";

const router: Router = express.Router();

router.post("/add_applicant", addApplicant);
router.post("/delete_applicant/:id", deleteApplicant);

export default router;
