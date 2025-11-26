import axios from "axios";

const getAll = async () => {

if (!process.env.HCMD_PATIENT_ALL_LIST_URL) {
    throw new Error("HCMD_PATIENT_ALL_LIST_URL is not defined in .env!");
}
if (!process.env.HCMD_ACCESS_TOKEN) {
    throw new Error("HCMD_ACCESS_TOKEN is not defined in .env!");
}
    const res = await axios.post(
        process.env.HCMD_PATIENT_ALL_LIST_URL,
       {},
        {
            headers: {
                "developer_mode": "true",
                "Content-Type": "application/json",
                "x-access-token": process.env.HCMD_ACCESS_TOKEN,
            },
        }
    );

return res.data.data.data;

}

const updateAll = async (payload) => {

// console.log("updating notes for patientId:", payload);

    const res = await axios.post(
        process.env.HCMD_PATIENT_ALL_UPDATE,
        payload,
        {
            headers: {
                "developer_mode": "true",
                "Content-Type": "application/json",
                "x-access-token": process.env.HCMD_ACCESS_TOKEN,
            },
        }
    );

return res.data;

}


const processAll = async (openAiAll, patientId) => {
    // Fetch already present allergies
    const alreadyPresentAll = await getAll(); // array of {id, name, ...}

    // Map existing allergies for faster lookup (case-insensitive)
    const presentMap = new Map();
    alreadyPresentAll.forEach(item => {
        presentMap.set(item.name.toLowerCase(), item.id);
    });

    // Process OpenAI allergies
    const result = await Promise.all(
        openAiAll.map(async allergy => {
            const allergyLower = allergy.toLowerCase();
            let payload;
            if (presentMap.has(allergyLower)) {
                payload = { id: presentMap.get(allergyLower), patientId };
            } else {
                payload = { isNew: true, name: allergy, label: allergy, patientId };
            }

            // Update backend for each allergy
            await updateAll(payload);

            // Return the allergy info for final array
            return presentMap.has(allergyLower)
                ? { id: presentMap.get(allergyLower) }
                : { isNew: true, name: allergy, label: allergy };
        })
    );

    return result;
};
















export { getAll, updateAll,processAll };