import fs from "fs";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// Support __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const dbPath = path.join(__dirname, "db.sqlite");
const usersJsonPath = path.join(__dirname, "users.json");

// Open database
const db = new Database(dbPath);

// Query all customers
const customers = db
  .prepare("SELECT ID, name, email FROM bookstore_inventory_system_Customers")
  .all();

// Build users.json
const users = {};
for (const { ID, name, email } of customers) {
  users[ID] = {
    id: ID,
    name,
    email,
    roles: ["authenticated-user"],
  };
}

// Write to users.json
fs.writeFileSync(usersJsonPath, JSON.stringify(users, null, 2));
console.log(`users.json created with ${customers.length} users.`);
