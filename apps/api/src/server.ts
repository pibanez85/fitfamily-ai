import { getEnv } from "./config/env";
import { createApp } from "./app";

const env = getEnv();
const app = createApp(env);

app.listen(env.PORT, () => {
  console.log(`FitFamily AI API listening on http://localhost:${env.PORT}`);
});
