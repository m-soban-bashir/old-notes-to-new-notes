import notesConverter  from "./functions/converter.js";
import dotenv from "dotenv";
import { processAll } from "./functions/helper/updateAll.js";
dotenv.config();



console.time("Total Execution Time");
await notesConverter();
console.timeEnd("Total Execution Time");