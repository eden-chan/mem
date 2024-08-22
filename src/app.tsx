import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { createEffect, createSignal, Suspense } from "solid-js";
import { ImageManager } from "./components/ImageManager";
import styles from "./app.module.css";
import Auth from "./components/auth";
import Account from "./components/Account";
import { supabase } from "./components/SupabaseClient";
import { AuthSession } from "@supabase/supabase-js";

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
