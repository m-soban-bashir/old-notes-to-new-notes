


// import OpenAI from "openai";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
  
// });

// Ollama client configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3-coder:30b";



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

const promptLabs = fs.readFileSync(
  path.join(__dirname, "../../prompt/labsPrompt.txt"),
  "utf-8"
);

const subjectiveAndDailyUpdatesPrompt = fs.readFileSync(
  path.join(__dirname, "../../prompt/subjectiveAndDailyUpdates.txt"),
  "utf-8"
);
const allPrompt = fs.readFileSync(
  path.join(__dirname, "../../prompt/allPrompt.txt"),
  "utf-8"
);
const rosPrompt = fs.readFileSync(
  path.join(__dirname, "../../prompt/rosPrompt.txt"),
  "utf-8"
);

const assessmentPlanPrompt = fs.readFileSync(
  path.join(__dirname, "../../prompt/assessmentPlan.txt"),
  "utf-8"
);

// const getApiResponce = async (oldNotes, labs=false,subjectiveAndDailyUpdates= false,all=false,ros=false,assessmentPlan=false) => {
//   try {
//     const response = await client.responses.create({
//       model: "gpt-4.1",
//       temperature: 0.2,
//       input: [
//         {
//           role: "system",
//           content: labs ? promptLabs : subjectiveAndDailyUpdates ? subjectiveAndDailyUpdatesPrompt: all ? allPrompt:ros ? rosPrompt: assessmentPlan?assessmentPlanPrompt:prompt,
//         },
//         {
//           role: "user",
//           content: [
//             {
//               type: "input_text",
//               text: JSON.stringify(oldNotes),
//             },
//           ],
//         },
//       ],
//     });
//     console.log(response.usage,"tokens used");
//     return response.output_text;
//   } catch (error) {
//     console.error("❌ Failed to get API response:", error.message);
//     throw error;
//   }
// };



const getApiResponce = async (oldNotes, labs=false,subjectiveAndDailyUpdates= false,all=false,ros=false,assessmentPlan=false) => {
  const dataType = labs ? 'Labs' : 
                   subjectiveAndDailyUpdates ? 'Subjective Updates' : 
                   all ? 'Allergies' : 
                   ros ? 'ROS' : 
                   assessmentPlan ? 'Assessment Plan' :
                   'General Notes';
                   
  try {
    const systemPrompt = labs ? promptLabs : 
                        subjectiveAndDailyUpdates ? subjectiveAndDailyUpdatesPrompt : 
                        all ? allPrompt : 
                        ros ? rosPrompt : 
                        assessmentPlan ? assessmentPlanPrompt :
                        prompt;

    const inputSize = JSON.stringify(oldNotes).length;
    const promptSize = systemPrompt.length;
    
    console.log(`🤖 Using Ollama model: ${OLLAMA_MODEL}`);
    console.log(`📊 Processing ${dataType} data...`);
    console.log(`📏 Input size: ${inputSize} chars, Prompt size: ${promptSize} chars`);
    
    const payload = {
      model: OLLAMA_MODEL,
      prompt: `${systemPrompt}\n\nUser Input:\n${JSON.stringify(oldNotes)}`,
      stream: false,
      options: {
        temperature: 0.2,  // Lower temperature for more consistent output
        top_p: 1,        // Reduced for better focus
        num_predict: 30000,   // Unlimited output tokens
        num_ctx: 20536,    // large context window (64K tokens)
        repeat_penalty: 1.0
      }
    };

    console.log(`⏳ Sending request to Ollama (timeout: 15 minutes)...`);
    const startTime = Date.now();
    
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, payload, {
      timeout: 900000, // 15 minute timeout 
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (response.data && response.data.response) {
      console.log(`✅ ${dataType} response received in ${duration}s`);
      console.log(`📄 Response length: ${response.data.response.length} chars`);
      return response.data.response;
    } else {
      throw new Error("Invalid response format from Ollama");
    }
  } catch (error) {
    console.error(`❌ Failed to get ${dataType} response:`, error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error(`⏰ Timeout occurred - model took too long. Try smaller model like 'qwen3:8b'`);
    } else if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data).substring(0, 500));
    } else if (error.code === 'ECONNREFUSED') {
      console.error("🔌 Connection refused - make sure Ollama is running: 'ollama serve'");
    }
    throw error;
  }
};

export default getApiResponce;