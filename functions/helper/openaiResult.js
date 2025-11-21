


import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  
});



import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ✅ because __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up from helper → functions → root → prompt/prompt.txt
const prompt = fs.readFileSync(
  path.join(__dirname, "../../prompt/prompt.txt"),
  "utf-8"
);


const getApiResponce = async (oldNotes) => {
  try {
    const response = await client.responses.create({
      model: "gpt-4.1",
      max_output_tokens:32768,
      temperature: 0.2,
      input: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(oldNotes),
            },
          ],
        },
      ],
    });
    console.log(response.usage,"tokens used");
    return response.output_text;
  } catch (error) {
    console.error("❌ Failed to get API response:", error.message);
    throw error;
  }
};


export default getApiResponce;