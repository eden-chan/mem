import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { createEffect, createSignal, Suspense } from "solid-js";
import { ImageManager } from "./components/ImageManager";
import styles from "./app.module.css";
import Auth from "./components/Auth";
import Account from "./components/Account";
import { supabase } from "./components/SupabaseClient";
import { AuthSession } from "@supabase/supabase-js";
import { StorageService } from "./utils/StorageService";

function SSTForm() {
  const [uploadStatus, setUploadStatus] = createSignal<string | null>(null);
  const [fileStorage, setFileStorage] = createSignal<StorageService | null>(
    null,
  );

  createEffect(async () => {
    setFileStorage(new StorageService());
  });

  const uploadFile = async (file: File) => {
    if (!fileStorage()) {
      console.error("FileStorage not initialized");
      return;
    }

    const uploadedUrl = await fileStorage()!.uploadFile(file);
    if (uploadedUrl) {
      console.log("[SSTForm] Uploaded image:", uploadedUrl);
      setUploadStatus("Upload successful");
    } else {
      setUploadStatus("Upload failed");
    }
  };

  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const file = (e.target as HTMLFormElement).file.files?.[0];
          if (file) {
            await uploadFile(file);
          }
        }}
      >
        <input
          name="file"
          type="file"
          accept="image/png, image/jpeg, image/jpg"
        />
        <button type="submit">Upload</button>
      </form>
      {uploadStatus() && <p>{uploadStatus()}</p>}
    </>
  );
}

export default function App() {
  const [session, setSession] = createSignal<AuthSession | null>(null);

  createEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Memetic</Title>
          <div class={styles.app}>
            <h1 class={styles.title}>Memetic</h1>
            <SSTForm />
            <div class="container" style={{ padding: "50px 0 100px 0" }}>
              {!session() ? <Auth /> : <Account session={session()!} />}
            </div>
            <ImageManager />
            <Suspense>{props.children}</Suspense>
          </div>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
