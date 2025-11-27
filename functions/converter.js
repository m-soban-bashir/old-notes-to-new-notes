import fetchPatients from "./helper/fetchPatients.js";
import fs from "fs";
import getApiResponce from "./helper/openaiResult.js";
import updateNotes from "./helper/updateNotes.js";
const filePath = "./convertedPatients/convertedPatients.json";
import { jsonrepair } from "jsonrepair";
import { processAll } from "./helper/updateAll.js";
import { processRos } from "./helper/updateRos.js";

// ✅ cleaner JSON parser
function formatAIResponse(aiOutput) {
  try {
    const text = aiOutput
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonrepair(text));
  } catch (err) {
    console.error("❌ Failed to parse AI output:", err.message);
    console.log("🚨 Raw AI Output:", aiOutput);
    throw err;
  }
}

const consoleFunction = () => {
  console.log("************************************************");
};

const notesConverter = async () => {
  consoleFunction();
  console.log("fetching the data of all the patients");

  const data = await fetchPatients();
  console.log(data?.data?.rows?.length, "data fetched");
  consoleFunction();

  const patients = data?.data?.rows || [];


  let processedPatients = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    if (fileContent.trim()) {
      processedPatients = JSON.parse(fileContent);
    }
  }


  const processedIds = new Set(processedPatients.map(p => p.id));

  for (const patient of patients) {

    if (processedIds.has(patient.id)) {
      console.log(`⏩ Skipping already processed patient: ${patient.lastName}, ${patient.firstName}`);
      continue;
    }

    consoleFunction();
    console.log("getting the notes of", patient.lastName, patient.firstName);

    const notes = patient.patientNotes || [];
    if (notes.length === 0) continue;

    const note = notes[0];
    const notesJson = note.notesJson || {};
    const labs = note.notesJson.labs || {};
    const subjectiveAndDailyUpdates = note.notesJson.subjectiveAndDailyUpdates || {}
    const all = note.notesJson.all || {}
    const ros = note.notesJson.ros || {}
    const assessmentPlan = note.notesJson.assessmentPlan || {}

    delete note.notesJson.assessmentPlan
    delete note.notesJson.ros
    delete note.notesJson.all
    delete note.notesJson.labs;
    delete note.notesJson.subjectiveAndDailyUpdates

    console.log("getting open ai responses (parallel)");

    const [
      openAiResponseWithoutLabs,
      openAiResponseWithLabs,
      subjectiveAndDailyUpdatesonly,
      openAiResponseAll,
      openAiResponseRos,
      openAiResponseAssessmentPlan
    ] = await Promise.all([
      getApiResponce(notesJson),
      getApiResponce(labs, true),
      getApiResponce(subjectiveAndDailyUpdates, false, true),
      getApiResponce(all, false, false, true),
      getApiResponce(ros.value, false, false, false,true),
      getApiResponce(assessmentPlan, false, false, false,false,true),


    ]);

    console.log("received all open ai responses");

    let parsedData = {};
    let parsedLabs = {}
    let parsedSubjectiveAndDailyUpdatesonly = {}
    let parsedAll = []
    let parsedRos = []
    let parsedAssessMentPlan = {}




    try {
      parsedData = formatAIResponse(openAiResponseWithoutLabs);
      parsedLabs = formatAIResponse(openAiResponseWithLabs);
      parsedSubjectiveAndDailyUpdatesonly = formatAIResponse(subjectiveAndDailyUpdatesonly);
      parsedAll = formatAIResponse(openAiResponseAll);
      parsedRos = formatAIResponse(openAiResponseRos);
      parsedAssessMentPlan = formatAIResponse(openAiResponseAssessmentPlan);
      

// console.log(parsedAll,"ParsedAll")
console.log(parsedAssessMentPlan,"parsedAssessMentPlan")

    } catch (err) {
      console.error("❌ Could not parse AI response for", patient.lastName, patient.firstName);
      continue;
    }

    const payload = {
      patientId: patient.id,
      customNotes: {
        ...parsedData,
        labs: parsedLabs,
        subjectiveAndDailyUpdates: parsedSubjectiveAndDailyUpdatesonly,
        assessmentPlan:parsedAssessMentPlan.assessmentPlan
      }
    };

    const rosUpdate = await processRos(parsedRos,patient.id)
    const allUpdate = await processAll(parsedAll,patient.id)
    console.log(rosUpdate,"ros")
    const updated = await updateNotes(payload);
    if (updated.status === 1) {
      const newData = {
        id: patient.id,
        name: `${patient.lastName}, ${patient.firstName}`,
      };

      processedPatients.push(newData);

      fs.writeFileSync(filePath, JSON.stringify(processedPatients, null, 2), "utf8");
      console.log("✅ Data saved successfully!");
    }

    console.log("updated the notes of", patient.lastName, patient.firstName);
  }
};

export default notesConverter;
