import express, { Router } from "express";
import { addApplicant, deleteApplicant, getApplicants } from "../controllers/applicants";

const router: Router = express.Router();

router.post("/add_applicant", addApplicant);
router.get("/get_applicants", getApplicants);
router.post("/delete_applicant/:id", deleteApplicant);


export default router;
