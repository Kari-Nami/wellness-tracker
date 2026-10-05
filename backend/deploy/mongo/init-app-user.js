const database = process.env.MONGO_APP_DATABASE || 'wellness_tracker';
const username = process.env.MONGO_APP_USERNAME;
const password = process.env.MONGO_APP_PASSWORD;
if (!username || !password)
  throw new Error('Application database credentials are required.');
db.getSiblingDB(database).createUser({
  user: username,
  pwd: password,
  roles: [{ role: 'readWrite', db: database }],
});
