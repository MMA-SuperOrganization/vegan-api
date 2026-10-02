import fs from 'fs';
import path from 'path';
import { apiManifest } from '../src/routes/api-manifest.js';

const toPascal = (str) => {
  const camel = toCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};
const toCamel = (str) => {
  return str.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
};

const schemas = {
  users: 'firebaseUid: { type: String, required: true, unique: true }, email: { type: String, sparse: true }, displayName: String, avatarUrl: String, role: { type: String, enum: ["USER", "ADMIN"], default: "USER" }, status: { type: String, enum: ["ACTIVE", "SUSPENDED", "DELETED"], default: "ACTIVE" }, onboardingCompleted: { type: Boolean, default: false }, fcmTokens: [{}], lastLoginAt: Date, deletedAt: Date'
};

const modName = 'users';
const routes = apiManifest.filter(r => r.module === modName);
const dir = path.join(process.cwd(), 'src', 'modules', modName);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const pascalName = toPascal(modName);
const camelName = toCamel(modName);

let routesStr = `import { Router } from 'express';\nimport { asyncHandler } from '../../common/utils/async-handler.js';\nimport { validate } from '../../common/middlewares/validate.js';\nimport { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate.js';\nimport { authorize } from '../../common/middlewares/authorize.js';\nimport { ROLES } from '../../common/constants/roles.js';\n\nexport const create${pascalName}Routes = ({ ${camelName}Controller, ${camelName}Validation }) => {\n  const router = Router();\n`;

routes.forEach((route) => {
  let authMid = '';
  if (route.auth === 'user') authMid = `authenticate, `;
  else if (route.auth === 'admin') authMid = `authenticate, authorize(ROLES.ADMIN), `;
  else if (route.auth === 'owner') authMid = `authenticate, `;
  else if (route.auth === 'optional') authMid = `optionalAuthenticate, `;
  else if (route.auth === 'firebase') authMid = `authenticate, `;

  routesStr += `  router.${route.method.toLowerCase()}('${route.path}', ${authMid}validate(${camelName}Validation.${route.operationId}), asyncHandler(${camelName}Controller.${route.operationId}));\n`;
});
routesStr += `  return router;\n};\n`;
fs.writeFileSync(path.join(dir, `${modName}.routes.js`), routesStr);

let ctrlStr = `import { sendSuccess } from '../../common/utils/api-response.js';\n\nexport const create${pascalName}Controller = ({ ${camelName}Service }) => ({\n`;
routes.forEach((route) => {
  ctrlStr += `  async ${route.operationId}(req, res) {\n    const result = await ${camelName}Service.${route.operationId}(req);\n    return sendSuccess(res, { data: result || {}, message: '${route.operationId} success' });\n  },\n`;
});
ctrlStr += `});\n`;
fs.writeFileSync(path.join(dir, `${modName}.controller.js`), ctrlStr);

let svcStr = `import { AppError } from '../../common/errors/app-error.js';\n\nexport const create${pascalName}Service = ({ ${camelName}Repository }) => ({\n`;
routes.forEach((route) => {
  svcStr += `  async ${route.operationId}(req) {\n`;
  if (route.method === 'GET' && route.path.includes('/:id')) {
    svcStr += `    return await ${camelName}Repository.findById(req.params.id || req.params.idOrSlug || req.params.userId || 'dummy');\n`;
  } else if (route.method === 'GET') {
    svcStr += `    return await ${camelName}Repository.findAll(req.query);\n`;
  } else if (route.method === 'POST') {
    svcStr += `    return await ${camelName}Repository.create({ ...req.validated.body, userId: req.auth?.userId });\n`;
  } else if (route.method === 'PATCH' || route.method === 'PUT') {
    svcStr += `    return await ${camelName}Repository.update(req.params.id || req.params.targetId || req.auth?.userId || 'dummy', req.validated.body);\n`;
  } else if (route.method === 'DELETE') {
    svcStr += `    return await ${camelName}Repository.delete(req.params.id || req.params.targetId || req.auth?.userId || 'dummy');\n`;
  } else {
    svcStr += `    return {};\n`;
  }
  svcStr += `  },\n`;
});
svcStr += `});\n`;
fs.writeFileSync(path.join(dir, `${modName}.service.js`), svcStr);

let valStr = `import { z } from 'zod';\nimport { objectId, paginationSchema } from '../../common/validators/common.schemas.js';\n\nexport const create${pascalName}Validation = () => ({\n`;
routes.forEach((route) => {
  valStr += `  ${route.operationId}: z.object({\n`;
  if (route.path.includes('/:id'))
    valStr += `    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),\n`;
  if (route.method === 'GET') valStr += `    query: paginationSchema.passthrough(),\n`;
  if (['POST', 'PUT', 'PATCH'].includes(route.method))
    valStr += `    body: z.object({}).passthrough(),\n`;
  valStr += `  }),\n`;
});
valStr += `});\n`;
fs.writeFileSync(path.join(dir, `${modName}.validation.js`), valStr);

let repoStr = `export const create${pascalName}Repository = ({ ${pascalName}Model }) => ({\n`;
repoStr += `  async findById(id) { return ${pascalName}Model.findById(id).lean(); },\n`;
repoStr += `  async findAll(query) { return ${pascalName}Model.find({}).limit(20).lean(); },\n`;
repoStr += `  async create(data) { return ${pascalName}Model.create(data); },\n`;
repoStr += `  async update(id, data) { return ${pascalName}Model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean(); },\n`;
repoStr += `  async delete(id) { return ${pascalName}Model.findByIdAndDelete(id).lean(); }\n`;
repoStr += `});\n`;
fs.writeFileSync(path.join(dir, `${modName}.repository.js`), repoStr);

const schemaDef = schemas[modName];
let modStr = `import mongoose from 'mongoose';\n\nconst schema = new mongoose.Schema({\n  ${schemaDef}\n}, { timestamps: true, versionKey: false });\n\nexport const ${pascalName}Model = mongoose.model('${pascalName}', schema);\n`;
fs.writeFileSync(path.join(dir, `${modName}.model.js`), modStr);

let idxStr = `export * from './${modName}.routes.js';\nexport * from './${modName}.controller.js';\nexport * from './${modName}.service.js';\nexport * from './${modName}.repository.js';\nexport * from './${modName}.model.js';\nexport * from './${modName}.validation.js';\n`;
fs.writeFileSync(path.join(dir, `index.js`), idxStr);
console.log('Restored module users');
