import axios from "axios";

const getRos = async () => {


    const res = await axios.post(
        process.env.HCMD_PATIENT_ROS_LIST_URL,
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

const updateRos = async (payload) => {

// console.log("updating notes for patientId:", payload);

    const res = await axios.post(
        process.env.HCMD_PATIENT_ROS_UPDATE,
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


const processRos = async (openAiRos, patientId) => {
    // Fetch already present ROS entries
    console.log("OpenAI ROS input:", openAiRos, "Patient ID:", patientId);
    const alreadyPresentRos = await getRos(); // array of {id, name, ...}

    // Map existing ROS for faster lookup (case-insensitive)
    const presentMap = new Map();
    alreadyPresentRos.forEach(item => {
        presentMap.set(item.name.toLowerCase(), item.id);
    });

    // Process OpenAI ROS entries
    const result = await Promise.all(
        openAiRos.map(async rosEntry => {
            const rosValue = rosEntry?.value?.trim();
            const rosLower = rosValue?.toLowerCase();
            let payload;

            if (presentMap.has(rosLower)) {
                // Already exists
                payload = { id: presentMap.get(rosLower), patientId };
            } else {
                // New ROS entry
                payload = { isNew: true, name: rosValue, label: rosValue, patientId };
            }

            console.log("Updating ROS with payload:", payload);
            await updateRos(payload);

            // Return info for final array
            return presentMap.has(rosLower)
                ? { id: presentMap.get(rosLower) }
                : { isNew: true, name: rosValue, label: rosValue };
        })
    );

    return result;
};




export { getRos, updateRos,processRos };