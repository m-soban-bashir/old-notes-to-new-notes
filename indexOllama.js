import notesConverter from "./functions/converter.js";
import dotenv from "dotenv";

dotenv.config();

console.log("🤖 Starting Ollama-powered medical notes conversion");
console.log("🏠 Using local Ollama instance - No external API costs!");
console.log("📊 Model:", process.env.OLLAMA_MODEL || "qwen3-coder:30b");
console.log("================================================");

console.time("Total Execution Time");
await notesConverter();
console.timeEnd("Total Execution Time");

console.log("================================================");
console.log("✨ Ollama conversion completed!");