import { Route, Routes } from "react-router-dom";
import Landing from "@/components/Landing";
import DeploymentStatus from "@/components/DeploymentStatus";

function App(){
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/deploy" element={<DeploymentStatus />} />
      <Route path="/deploy/:id" element={<DeploymentStatus />} />
    </Routes>
  );
}

export default App;