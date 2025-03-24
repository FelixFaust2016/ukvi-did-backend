"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const credentials_1 = require("../controllers/credentials");
const router = express_1.default.Router();
router.post("/issue_credential", credentials_1.issueCredential);
router.post("/verify_credential", credentials_1.verifyCredential);
exports.default = router;
