const fs = require('node:fs');
const path = require('node:path');

const entryPath = path.join(__dirname, '..', 'dist', 'emr-backend', 'src', 'main.js');
const launcherPath = path.join(__dirname, '..', 'dist', 'main.js');

if (!fs.existsSync(entryPath)) {
  throw new Error(`Compiled backend entry not found: ${entryPath}`);
}

fs.writeFileSync(
  launcherPath,
  "require('./emr-backend/src/main.js');\n",
);
