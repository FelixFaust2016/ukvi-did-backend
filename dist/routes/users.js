"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../controllers/user");
const router = express_1.default.Router();
router.post("/add_user", user_1.addUser);
router.post("/sign_in", user_1.signIn);
router.post("/add_issuer", user_1.addIssuer);
exports.default = router;
