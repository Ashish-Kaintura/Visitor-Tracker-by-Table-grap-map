import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LocationTracker from "./pages/LocationTracker";
import VisitorTracker from "./pages/VisitorTracker";
import VisitorGraphs from "./pages/VisitorGraphs";
import VisitorMap from "./pages/VisitorMap";
import VisitorsExport from "./pages/VisitorsExport";
import NumberLead from "./pages/NumberLead";

const App = () => (
  <>
    <Router>
      <Routes>
        <Route path="/" element={<VisitorTracker />} />
        <Route path="/visitors/graphs" element={<VisitorGraphs />} />
        <Route path="/visitorsmap" element={<VisitorMap />} />
        <Route path="/visitors/export" element={<VisitorsExport />} />
        <Route path="/visitorsnumber" element={<NumberLead />} />
      </Routes>
    </Router>
  </>
);

export default App;
