
import JobDescriptionForm from "../components/JobDescriptionForm";

import { Route, Routes, Link } from 'react-router-dom';

export function App() {
  return (
    <div>
      <h1>ATS Tag Extractor</h1>
      <JobDescriptionForm />
    </div>
  );
}

export default App;
