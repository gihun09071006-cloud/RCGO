// Compiles the token contracts using the locally bundled solc (offline),
// since this sandboxed environment cannot reach binaries.soliditylang.org
// to fetch Hardhat's native compiler binaries. Produces artifacts in the
// same on-disk format Hardhat itself would write, so `--no-compile` runs
// of `hardhat test` / scripts can consume them normally.
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "..", "contracts");
const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts");
const ROOT = path.join(__dirname, "..");

const contractFiles = fs
  .readdirSync(CONTRACTS_DIR)
  .filter((f) => f.endsWith(".sol"));

function findImport(importPath) {
  const candidates = [
    path.join(ROOT, "node_modules", importPath),
    path.join(ROOT, importPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { contents: fs.readFileSync(candidate, "utf8") };
    }
  }
  return { error: `File not found: ${importPath}` };
}

const sources = {};
for (const file of contractFiles) {
  sources[`contracts/${file}`] = {
    content: fs.readFileSync(path.join(CONTRACTS_DIR, file), "utf8"),
  };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
      },
    },
  },
};

const output = JSON.parse(
  solc.compile(JSON.stringify(input), { import: findImport })
);

let hasError = false;
for (const err of output.errors || []) {
  if (err.severity === "error") {
    hasError = true;
    console.error(err.formattedMessage);
  } else {
    console.warn(err.formattedMessage);
  }
}
if (hasError) {
  process.exit(1);
}

for (const file of contractFiles) {
  const sourceName = `contracts/${file}`;
  const contractsInFile = output.contracts[sourceName];
  for (const contractName of Object.keys(contractsInFile)) {
    const artifact = contractsInFile[contractName];
    const outDir = path.join(ARTIFACTS_DIR, sourceName);
    fs.mkdirSync(outDir, { recursive: true });

    const artifactJson = {
      _format: "hh-sol-artifact-1",
      contractName,
      sourceName,
      abi: artifact.abi,
      bytecode: "0x" + artifact.evm.bytecode.object,
      deployedBytecode: "0x" + artifact.evm.deployedBytecode.object,
      linkReferences: {},
      deployedLinkReferences: {},
    };

    fs.writeFileSync(
      path.join(outDir, `${contractName}.json`),
      JSON.stringify(artifactJson, null, 2)
    );
  }
}

console.log(`Compiled ${contractFiles.length} contract file(s) with solc ${solc.version()}`);
