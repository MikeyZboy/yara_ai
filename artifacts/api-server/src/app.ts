import express, {
  type Express,
  type ErrorRequestHandler,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Railway (and most hosts) sit behind one proxy; this makes req.ip the real client IP.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Browsers may only call the API from origins listed in ALLOWED_ORIGINS
// (comma-separated). The mobile app sends no Origin header, so it is always allowed.
// In development, if ALLOWED_ORIGINS is empty, every origin is allowed.
const allowedOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env["NODE_ENV"] === "production";

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!isProduction && allowedOrigins.length === 0) {
        return callback(null, true);
      }
      callback(null, allowedOrigins.includes(origin));
    },
  }),
);
app.use(express.json({ limit: "10kb" }));

app.use("/api", router);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status =
    typeof err?.status === "number" && err.status >= 400 && err.status < 500
      ? err.status
      : 500;
  if (status >= 500) req.log.error({ err }, "Unhandled error");
  res
    .status(status)
    .json({ error: status === 500 ? "Internal server error" : "Bad request" });
};
app.use(errorHandler);

export default app;
