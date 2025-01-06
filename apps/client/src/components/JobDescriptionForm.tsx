import React, { useState } from "react";

const JobDescriptionForm = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/extract-ats-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription }),
      });

      const data = await res.json();
      setResponse(data); // Display or handle the response as needed
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h1>Extract ATS Tags</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Enter the job description"
          rows={10}
          cols={50}
          required
        />
        <button type="submit">Extract Tags</button>
      </form>
      {response && (
        <div>
          <h2>Extracted Tags:</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default JobDescriptionForm;
