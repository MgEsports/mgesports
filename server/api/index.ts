/**
 * Vercel serverless entry point.
 * Re-exports the Express app from server.ts.
 * Vercel's @vercel/node adapter picks this up automatically.
 */
import app from "../src/server.js";

export default app;
