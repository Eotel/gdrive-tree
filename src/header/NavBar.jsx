import { useLocation, useNavigate } from "solid-app-router";
import { createEffect, createSignal } from "solid-js";

import { checkHasCredential } from "../checkHasCredential";
import { setStore, store } from "../index";
import { clearToken } from "../tokenStorage";

const NavBar = () => {
  const [buttonStyle, setButtonStyle] = createSignal("btn-disabled");
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(checkHasCredential);

  createEffect(() => {
    if (store.hasCredential) {
      setButtonStyle(() => "");
    } else {
      setButtonStyle(() => "btn-disabled");
    }
  });

  function handleClick() {
    const token = gapi.client.getToken();
    if (token && token.access_token) {
      google.accounts.oauth2.revoke(token.access_token, () => {
        clearToken();
        setStore("hasCredential", () => false);
      });
    }
  }

  const isDebugPage = () => location.pathname === "/debug";

  return (
    <navbar class="navbar bg-base-100 mb-2 shadow-xl">
      <div class="navbar-start">
        <a class="normal-case text-xl cursor-pointer" onClick={() => navigate("/")}>
          GDrive Tree
        </a>
      </div>
      <div class="navbar-center">
        {!isDebugPage() ? (
          <button
            type="button"
            class="btn btn-ghost btn-sm normal-case"
            onClick={() => navigate("/debug")}
          >
            Debug Tool
          </button>
        ) : (
          <button
            type="button"
            class="btn btn-ghost btn-sm normal-case"
            onClick={() => navigate("/")}
          >
            Back to Tree
          </button>
        )}
      </div>
      <div class="navbar-end">
        <span class={`btn ${buttonStyle()} normal-case text-sm`} onClick={handleClick}>
          Revoke authorisation
        </span>
      </div>
    </navbar>
  );
};

export default NavBar;
