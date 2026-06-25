import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CuraFlow Backend Running",
  });
});

//routes declaration using middleware
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export default app;
