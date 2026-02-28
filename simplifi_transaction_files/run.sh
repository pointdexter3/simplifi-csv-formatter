#!/bin/bash

# Navigate to the project root (one level up from this script's location)
cd "$(dirname "$0")/.." || exit 1

# runs the entire script with one command, including installing dependencies if needed 
#   (run_script exists in package.json and runs all_in_one, which runs all the individual steps in sequence)
npm run run_script
