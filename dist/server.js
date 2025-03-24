"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_1 = __importDefault(require("./routes/users"));
const credentials_1 = __importDefault(require("./routes/credentials"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send("Hello world");
});
app.use("/api/users", users_1.default);
app.use("/api/credential", credentials_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
