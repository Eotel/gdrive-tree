import { NavLink } from "solid-app-router";
import { For } from "solid-js";

const Tabs = () => {
  const tabs = [
    { path: "/", label: "My Drive" },
    { path: "/shared", label: "Shared with me" },
    { path: "/shared-drives", label: "Shared Drives" },
  ];

  return (
    <div class="tabs">
      <For each={tabs}>
        {(tab) => (
          <NavLink href={tab.path} activeClass="tab-active" class="tab tab-lifted" end>
            {tab.label}
          </NavLink>
        )}
      </For>
      <div class="flex-grow tab tab-lifted" style="cursor: default;"></div>
    </div>
  );
};

export default Tabs;
