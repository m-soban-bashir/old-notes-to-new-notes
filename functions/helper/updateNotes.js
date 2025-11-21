

import axios from "axios";
const updateNotes = async (payload) => {

// console.log("updating notes for patientId:", payload);

    const res = await axios.post(
        process.env.HCMD_NOTES_UPDATE_URL,
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


export default updateNotes;