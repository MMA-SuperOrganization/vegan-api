import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import all validation factories (we will dynamically import them)
const modulesDir = path.join(__dirname, '../src/modules');

async function loadAllValidations() {
  const validations = {};
  const modules = fs.readdirSync(modulesDir);
  
  for (const mod of modules) {
    const modPath = path.join(modulesDir, mod);
    if (!fs.statSync(modPath).isDirectory()) continue;
    
    const valFiles = fs.readdirSync(modPath).filter(f => f.endsWith('.validation.js'));
    
    for (const valFile of valFiles) {
      const valPath = `file:///${path.join(modPath, valFile).replace(/\\/g, '/')}`;
      try {
        const exported = await import(valPath);
        // Find the factory function (e.g. createUsersValidation)
        const factoryKey = Object.keys(exported).find(k => k.startsWith('create') && k.endsWith('Validation'));
        if (factoryKey) {
          const valObject = exported[factoryKey]();
          Object.assign(validations, valObject);
        }
      } catch (err) {
        console.error(`Error loading validation for ${mod}/${valFile}:`, err.message);
      }
    }
  }
  return validations;
}

async function generateDocs() {
  const validations = await loadAllValidations();
  const openapiPath = path.join(__dirname, '../docs/openapi.yaml');
  
  const doc = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
  
  for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation.operationId) continue;
      
      const val = validations[operation.operationId];
      if (!val) continue;
      
      // Reset parameters and requestBody
      operation.parameters = [];
      operation.requestBody = undefined;
      
      // Path and Query params
      if (val.params || val.query) {
        if (val.params) {
          const schema = zodToJsonSchema(val.params, { target: 'openApi3' });
          if (schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
              operation.parameters.push({
                name: propName,
                in: 'path',
                required: schema.required?.includes(propName) || true,
                schema: propSchema,
              });
            }
          }
        }
        if (val.query) {
          const schema = zodToJsonSchema(val.query, { target: 'openApi3' });
          if (schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
              operation.parameters.push({
                name: propName,
                in: 'query',
                required: schema.required?.includes(propName) || false,
                schema: propSchema,
              });
            }
          }
        }
      } else {
        // Keep existing path params from original file if no validation is defined but path has {}
        const pathParams = [...pathKey.matchAll(/\{([^}]+)\}/g)].map(m => m[1]);
        for (const param of pathParams) {
          operation.parameters.push({
            name: param,
            in: 'path',
            required: true,
            schema: { type: 'string' }
          });
        }
      }
      
      // Request Body
      if (val.body) {
        const schema = zodToJsonSchema(val.body, { target: 'openApi3' });
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: schema
            }
          }
        };
      }
      
      // Responses
      operation.responses = {
        '200': {
          description: 'Thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessEnvelope' }
            }
          }
        },
        '400': {
          description: 'Dữ liệu không hợp lệ (Validation Error)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Validation failed' },
                  code: { type: 'string', example: 'VALIDATION_ERROR' },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        path: { type: 'string' },
                        message: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Không có quyền truy cập (Unauthorized)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Unauthorized' }
                }
              }
            }
          }
        },
        '500': {
          description: 'Lỗi máy chủ (Internal Server Error)'
        }
      };
    }
  }
  
  fs.writeFileSync(openapiPath, YAML.stringify(doc));
  console.log('Successfully enriched docs/openapi.yaml based on Zod validations!');
}

generateDocs().catch(console.error);
