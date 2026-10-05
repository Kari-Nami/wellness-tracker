import { randomBytes } from 'node:crypto';
import { writeFileSync, existsSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const secret = () => randomBytes(32).toString('hex');
const create = (relative, contents) => { const path=fileURLToPath(new URL(relative,root));if(existsSync(path)){console.log(`Kept existing ${relative}`);return;}writeFileSync(path,contents,{mode:0o600,flag:'wx'});chmodSync(path,0o600);console.log(`Created ${relative}`);};
create('backend/.env.local',`MONGODB_URI=mongodb://127.0.0.1:27017/wellness_tracker?replicaSet=rs0&directConnection=true
JWT_SECRET=${secret()}
JWT_EXPIRES_IN=7d
APP_ORIGIN=http://localhost:5173
PUBLIC_BASE_PATH=/
LOG_LEVEL=info
`);
const rootPassword=secret(),appPassword=secret();
create('backend/.env.docker.local',`COMPOSE_PROJECT_NAME=daywell-local
PUBLIC_BASE_PATH=/wellness
APP_ORIGIN=http://localhost:18081
GATEWAY_HOST_PORT=18081
FRONTEND_HOST_PORT=18082
BACKEND_HOST_PORT=13001
MONGO_ROOT_USERNAME=wellness_admin
MONGO_ROOT_PASSWORD=${rootPassword}
MONGO_APP_USERNAME=wellness_app
MONGO_APP_PASSWORD=${appPassword}
MONGO_APP_DATABASE=wellness_tracker
MONGODB_URI=mongodb://wellness_app:${appPassword}@mongo:27017/wellness_tracker?authSource=wellness_tracker&replicaSet=rs0
MONGO_REPLICA_KEY=${randomBytes(512).toString('base64')}
JWT_SECRET=${secret()}
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
ADMIN_EMAIL=operator@example.com
ADMIN_PASSWORD=${secret()}
ADMIN_DISPLAY_NAME=Administrator
ADMIN_TIMEZONE=Asia/Bangkok
`);
console.log('Local configuration is ready. Secrets were written to ignored files with mode 600.');
