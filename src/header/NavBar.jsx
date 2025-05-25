import { createEffect, createSignal } from "solid-js";

import { checkHasCredential } from "../checkHasCredential";
import { setStore, store } from "../index";
import { clearToken } from "../tokenStorage";

const NavBar = () => {
  const [buttonStyle, setButtonStyle] = createSignal("btn-disabled");

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

  return (
    <navbar class="navbar bg-base-100 mb-2 shadow-xl">
      <div class="navbar-start">
        <a class="normal-case text-xl">GDrive Tree</a>
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
