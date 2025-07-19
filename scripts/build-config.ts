#!/usr/bin/env node

/**
 * Build configuration script for external GitHub servers config
 * This script reads the external config file and injects it into the build
 */

import fs from 'fs';
import path from 'path';

const CONFIG_FILE_PATH = path.join(__dirname, '../config/github-servers.json');
const OUTPUT_FILE_PATH = path.join(__dirname, '../pages/side-panel/src/config/githubServers.json');

function buildGitHubConfig() {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(OUTPUT_FILE_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if external config file exists
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      console.error(`GitHub config file not found at: ${CONFIG_FILE_PATH}`);
      console.error('Please create the config file or check the path.');
      process.exit(1);
    }

    // Read and validate external config
    const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    let config;

    try {
      config = JSON.parse(configContent);
    } catch (parseError) {
      console.error('Invalid JSON in GitHub config file:', parseError.message);
      process.exit(1);
    }

    // Validate config structure
    if (!config.github || !Array.isArray(config.github.servers)) {
      console.error('Invalid config structure. Expected: { github: { servers: [...] } }');
      process.exit(1);
    }

    // Validate each server configuration
    for (const server of config.github.servers) {
      if (!server.id || !server.name || !server.apiUrl || !server.webUrl) {
        console.error('Invalid server configuration. Missing required fields:', server);
        process.exit(1);
      }
    }

    // Write validated config to output
    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(config, null, 2));
    console.log(`GitHub configuration built successfully from ${CONFIG_FILE_PATH}`);
    console.log(`Available servers: ${config.github.servers.map(s => s.name).join(', ')}`);
  } catch (error) {
    console.error('Error building GitHub configuration:', error.message);
    process.exit(1);
  }
}

// Run the build
buildGitHubConfig();
