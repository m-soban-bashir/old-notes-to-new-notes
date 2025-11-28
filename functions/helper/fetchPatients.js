const fetchPatients = async () => {
  const queryPayload = {
    query: {
      id:12196,
    //   range: [
    // {
    //   key: "start",
    //   value: ["2025-11-3", "2025-11-3"],
    // },
  // ],
    },
    options: {
      populate: ["patientNote"],
    },
    isCount: true,
    findOne: false,
    dynamicSearch:true
  };

  try {
    const res = await fetch(process.env.HCMD_PATIENT_LIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "developer_mode": "true",
        "x-access-token": process.env.HCMD_ACCESS_TOKEN,

      },
      body: JSON.stringify(queryPayload),
    });



    if (!res.ok) {
      console.error(`❌ Request failed with status ${res.status}`);
      const text = await res.text();
      console.error("Response body:", text);
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("❌ Non-JSON response received:", text);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("❌ Fetch or parsing failed:", error.message);
    return null;
  }
}


export default fetchPatients;
