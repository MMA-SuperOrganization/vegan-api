import fs from 'fs';
import path from 'path';
import { apiManifest } from '../src/routes/api-manifest.js';

const toPascal = (str) => {
  const camel = toCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};
const toCamel = (str) => {
  return str.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
};

const moduleNames = [...new Set(apiManifest.map(r => r.module))];

let containerStr = `import { logger } from './config/logger.js';
import { env } from './config/env.js';
import { createFirebaseAuthVerifier } from './providers/firebase/firebase-auth.provider.js';
import { createR2StorageProvider } from './providers/r2/r2-storage.provider.js';
`;

moduleNames.forEach(mod => {
  const p = toPascal(mod);
  containerStr += `import { create${p}Controller, create${p}Service, create${p}Repository, create${p}Validation, ${p}Model } from './modules/${mod}/index.js';\n`;
});

containerStr += `\nexport const configureContainer = () => {\n  const providers = {\n    firebaseAuth: createFirebaseAuthVerifier({ env, logger }),\n    storage: createR2StorageProvider({ env, logger }),\n  };\n\n`;

moduleNames.forEach(mod => {
  const p = toPascal(mod);
  const c = toCamel(mod);
  containerStr += `  const ${c}Repository = create${p}Repository({ ${p}Model });\n`;
  containerStr += `  const ${c}Service = create${p}Service({ ${c}Repository });\n`;
  containerStr += `  const ${c}Controller = create${p}Controller({ ${c}Service });\n`;
  containerStr += `  const ${c}Validation = create${p}Validation();\n\n`;
});

containerStr += `  return {\n    providers,\n    logger,\n`;

moduleNames.forEach(mod => {
  const c = toCamel(mod);
  containerStr += `    ${c}Controller,\n    ${c}Validation,\n`;
});

containerStr += `  };\n};\n`;
fs.writeFileSync(path.join(process.cwd(), 'src', 'container.js'), containerStr);

let routesStr = `import { Router } from 'express';\n`;
moduleNames.forEach(mod => {
  const p = toPascal(mod);
  routesStr += `import { create${p}Routes } from '../modules/${mod}/index.js';\n`;
});

routesStr += `\nexport const configureRoutes = (container) => {\n  const router = Router();\n`;

moduleNames.forEach(mod => {
  const p = toPascal(mod);
  const c = toCamel(mod);
  routesStr += `  router.use(create${p}Routes({\n    ${c}Controller: container.${c}Controller,\n    ${c}Validation: container.${c}Validation\n  }));\n`;
});

routesStr += `\n  return router;\n};\n`;
fs.writeFileSync(path.join(process.cwd(), 'src', 'routes', 'index.js'), routesStr);

console.log('Successfully regenerated container.js and routes/index.js');
