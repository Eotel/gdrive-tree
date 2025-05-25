import { For, Show, createSignal, onMount } from "solid-js";
import { tokenClient } from "./src/init";

const TestSharedDrives = () => {
  const [authStatus, setAuthStatus] = createSignal("Waiting for initialization...");
  const [apiResults, setApiResults] = createSignal({});
  const [driveContents, setDriveContents] = createSignal({});
  const [selectedDrive, setSelectedDrive] = createSignal("");
  const [sharedDrives, setSharedDrives] = createSignal([]);
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);

  onMount(() => {
    // Check if APIs are loaded
    const checkInterval = setInterval(() => {
      if (window.gapi && window.gapi.client && window.google && tokenClient) {
        clearInterval(checkInterval);
        setAuthStatus("Ready to authenticate");
      }
    }, 100);
  });

  const authenticate = async () => {
    setAuthStatus("Authenticating...");

    return new Promise((resolve, reject) => {
      tokenClient.callback = (resp) => {
        if (resp.error) {
          reject(resp);
          return;
        }
        setAuthStatus("Authenticated successfully");
        setIsAuthenticated(true);
        resolve(resp);
      };

      if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: "consent" });
      } else {
        tokenClient.requestAccessToken({ prompt: "" });
      }
    });
  };

  const testListSharedDrives = async () => {
    setApiResults({ loading: "Loading shared drives..." });
    try {
      const response = await gapi.client.drive.drives.list({
        pageSize: 100,
        fields: "*",
      });

      const drives = response.result.drives || [];
      setSharedDrives(drives);
      setApiResults({
        endpoint: "drives.list",
        count: drives.length,
        drives: drives.map((d) => ({
          id: d.id,
          name: d.name,
          kind: d.kind,
          capabilities: d.capabilities,
        })),
      });
    } catch (err) {
      setApiResults({ error: err.message || err });
    }
  };

  const testListSharedWithMe = async () => {
    setApiResults({ loading: "Loading shared with me files..." });
    try {
      const response = await gapi.client.drive.files.list({
        q: "sharedWithMe = true",
        pageSize: 100,
        fields: "files(id, name, mimeType, owners, shared, sharingUser, parents)",
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      const files = response.result.files || [];
      setApiResults({
        endpoint: "files.list (sharedWithMe)",
        count: files.length,
        files: files.slice(0, 10).map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          owners: f.owners?.map((o) => o.displayName),
          sharingUser: f.sharingUser?.displayName,
          parents: f.parents,
        })),
      });
    } catch (err) {
      setApiResults({ error: err.message || err });
    }
  };

  const testListDriveContents = async () => {
    const driveId = selectedDrive();
    if (!driveId) {
      setDriveContents({ error: "Please select a shared drive first" });
      return;
    }

    setDriveContents({ loading: "Loading drive contents..." });
    try {
      const response = await gapi.client.drive.files.list({
        q: `'${driveId}' in parents and trashed = false`,
        pageSize: 100,
        fields: "files(id, name, mimeType, parents)",
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        corpora: "drive",
        driveId: driveId,
      });

      const files = response.result.files || [];
      setDriveContents({
        driveId: driveId,
        count: files.length,
        files: files.map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          parents: f.parents,
        })),
      });
    } catch (err) {
      setDriveContents({ error: err.message || err });
    }
  };

  const testMyDriveWithCorpora = async () => {
    setApiResults({ loading: "Testing different corpora values..." });
    try {
      const tests = [];

      // Test 1: Default (user)
      const test1 = await gapi.client.drive.files.list({
        q: "'root' in parents and trashed = false",
        pageSize: 10,
        fields: "files(id, name)",
      });
      tests.push({
        test: "Default (no corpora)",
        count: test1.result.files?.length || 0,
      });

      // Test 2: user corpora
      const test2 = await gapi.client.drive.files.list({
        q: "'root' in parents and trashed = false",
        pageSize: 10,
        fields: "files(id, name)",
        corpora: "user",
      });
      tests.push({
        test: "corpora: 'user'",
        count: test2.result.files?.length || 0,
      });

      // Test 3: allDrives corpora
      const test3 = await gapi.client.drive.files.list({
        pageSize: 10,
        fields: "files(id, name, parents)",
        corpora: "allDrives",
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });
      tests.push({
        test: "corpora: 'allDrives'",
        count: test3.result.files?.length || 0,
        sampleFiles: test3.result.files?.slice(0, 3).map((f) => f.name),
      });

      setApiResults({
        endpoint: "Corpora tests",
        tests: tests,
      });
    } catch (err) {
      setApiResults({ error: err.message || err });
    }
  };

  return (
    <div style="max-width: 1000px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h1>Google Drive API Test - Shared Drives</h1>

      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h2>1. Authentication</h2>
        <button class="btn" onClick={authenticate} disabled={isAuthenticated()}>
          {isAuthenticated() ? "Authenticated" : "Authenticate"}
        </button>
        <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 5px;">
          {authStatus()}
        </pre>
      </div>

      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <h2>2. Test API Endpoints</h2>
        <button class="btn" onClick={testListSharedDrives} disabled={!isAuthenticated()}>
          List Shared Drives
        </button>
        <button class="btn" onClick={testListSharedWithMe} disabled={!isAuthenticated()}>
          List Shared With Me
        </button>
        <button class="btn" onClick={testMyDriveWithCorpora} disabled={!isAuthenticated()}>
          Test Corpora Values
        </button>
        <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 5px; overflow-x: auto;">
          {JSON.stringify(apiResults(), null, 2)}
        </pre>
      </div>

      <Show when={sharedDrives().length > 0}>
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h2>3. Test Shared Drive Contents</h2>
          <select
            onChange={(e) => setSelectedDrive(e.target.value)}
            style="padding: 5px; margin-right: 10px;"
          >
            <option value="">Select a shared drive</option>
            <For each={sharedDrives()}>
              {(drive) => <option value={drive.id}>{drive.name}</option>}
            </For>
          </select>
          <button class="btn" onClick={testListDriveContents} disabled={!selectedDrive()}>
            List Drive Contents
          </button>
          <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 5px; overflow-x: auto;">
            {JSON.stringify(driveContents(), null, 2)}
          </pre>
        </div>
      </Show>
    </div>
  );
};

export default TestSharedDrives;
