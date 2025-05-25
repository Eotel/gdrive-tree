import { Route, Routes, useLocation, useNavigate } from "solid-app-router";
import { createEffect } from "solid-js";
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

  // Handle auth redirect
  createEffect(() => {
    const savedPath = sessionStorage.getItem("gdrive_auth_return_path");
    if (savedPath && savedPath !== location.pathname && location.pathname === "/") {
      sessionStorage.removeItem("gdrive_auth_return_path");
      navigate(savedPath, { replace: true });
    }
  });

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
