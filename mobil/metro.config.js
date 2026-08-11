// Metro må se hele arbeidsområdet for å finne @skjold/delt, og lete etter
// node_modules i rota der npm hoister dem. Vi legger til Expos standarder
// i stedet for å erstatte dem.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const prosjekt = __dirname;
const rot = path.resolve(prosjekt, "..");

const config = getDefaultConfig(prosjekt);

config.watchFolders = [...(config.watchFolders ?? []), rot];
config.resolver.nodeModulesPaths = [
  path.resolve(prosjekt, "node_modules"),
  path.resolve(rot, "node_modules"),
];

module.exports = config;
