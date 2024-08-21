import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { ImageManager } from './components/ImageManager';
import styles from "./app.module.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>Memetic</Title>
          <div class={styles.app}>
            <h1 class={styles.title}>Memetic</h1>
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