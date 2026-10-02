import fs from "fs";
import path from "path";
import { apiManifest } from "../src/routes/api-manifest.js";
import yaml from "yaml";

const header = {
  openapi: "3.1.0",
  info: {
    title: "Vegan Support API (MMA302)",
    version: "0.1.0",
    description: "Backend API cho Vegan Support Mobile Application.",
  },
  servers: [{ url: "http://localhost:3000/api/v1", description: "Local development" }],
  security: [{ bearerAuth: [] }],
  tags: [...new Set(apiManifest.map((m) => m.module))].map((tag) => ({ name: tag })),
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "Firebase ID Token" },
    },
    schemas: {
      SuccessEnvelope: {
        type: "object",
        required: ["success", "message", "data", "meta"],
        properties: {
          success: { type: "boolean", const: true },
          message: { type: "string" },
          data: {},
          meta: { type: ["object", "null"] },
        },
      },
    },
    responses: {
      GenericSuccess: {
        description: "Success",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/SuccessEnvelope" } },
        },
      },
    },
  },
};

apiManifest.forEach((route) => {
  const openApiPath = route.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
  if (!header.paths[openApiPath]) header.paths[openApiPath] = {};

  const parameters = [];
  const matches = route.path.match(/:([a-zA-Z0-9_]+)/g);
  if (matches) {
    matches.forEach((m) => {
      parameters.push({
        name: m.substring(1),
        in: "path",
        required: true,
        schema: { type: "string" },
      });
    });
  }

  header.paths[openApiPath][route.method.toLowerCase()] = {
    tags: [route.module],
    summary: route.operationId,
    operationId: route.operationId,
    parameters: parameters,
    responses: {
      200: { $ref: "#/components/responses/GenericSuccess" },
    },
  };

  if (route.auth === "public") {
    header.paths[openApiPath][route.method.toLowerCase()].security = [];
  }
});

const output = yaml.stringify(header);
fs.writeFileSync(path.join(process.cwd(), "docs", "openapi.yaml"), output);
console.log("Generated openapi.yaml with " + Object.keys(header.paths).length + " paths.");
