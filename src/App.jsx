import { Route, Routes, useLocation, useNavigate } from "solid-app-router";
import DebugPage from "./debug/DebugPage";
import Header from "./header";
import Main from "./main";

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // console.log("App navigate", navigate);
  // console.log("App location", location);

  if (location.pathname === "/index.html") {
    navigate("/", { replace: true });
  }

  return (
    <>
      <Header />
      <Routes>
        <Route path="/debug" component={DebugPage} />
        <Route path="/*" component={Main} />
      </Routes>
    </>
  );
};

export default App;
