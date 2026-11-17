import {
  ApiConfigurationError,
  readApiConfig,
} from "./composition/api-config.js";
import { createApi } from "./composition/create-api.js";

async function main(): Promise<void> {
  const apiConfig = readApiConfig(process.env);
  const application = await createApi();

  try {
    await application.listen(apiConfig.port, apiConfig.host);
    console.info(
      JSON.stringify({ event: "api.started", url: await application.getUrl() }),
    );
  } catch (error: unknown) {
    await application.close();
    throw error;
  }
}

main().catch((error: unknown) => {
  let errorCode = "startup_failed";
  if (error instanceof ApiConfigurationError) {
    errorCode = "invalid_configuration";
  }

  console.error(
    JSON.stringify({
      event: "api.startup_failed",
      code: errorCode,
    }),
  );
  process.exitCode = 1;
});
