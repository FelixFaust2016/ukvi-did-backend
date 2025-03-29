import express, { Router } from "express";
import { getDashboardData } from "../controllers/dashboard";
const router: Router = express.Router();

router.get("/", getDashboardData);

export default router;
