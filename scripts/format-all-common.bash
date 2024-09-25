#!/bin/bash

# Check the csv-raw directory for folders with the same name as the csv file
# If a folder exists, combine all the non-empty csv files into a single file within the csv-raw folder.
function combine_csv_files {
  (
    local filename=$1
    local output_file_path="../"
    local filename_without_ext="${filename%.csv}"

    if [ ! -d "./$filename_without_ext" ]; then
      exit
    else
      cd "./$filename_without_ext" || exit
    fi

    # check if there are any non-empty CSV files in the current directory
    if [ -n "$(find . -maxdepth 1 -type f -name '*.csv' -size +0)" ]; then
      # Concatenate non-empty CSV files
      find . -maxdepth 1 -type f -name '*.csv' -size +0 -exec cat {} + >"${output_file_path}${filename}"
      echo "Combined multiple $filename_without_ext csv files."
    fi
  )
}

function check_file_exists_and_not_empty {
  if [ -s "$1" ]; then
    return 0
  else
    return 1
  fi
}

function check_file_exists {
  if [ -e "$1" ]; then
    return 0
  else
    return 1
  fi
}

function print_intro() {
  echo "-------------------------------------------------------------------------------"
  echo "------------------------ Simplifi CSV Formatter -------------------------------"
  echo "-------------------------------------------------------------------------------"
  echo "----- This script will format all CSV files in the /csv-raw folder ------------"
  echo "----- Formatted files for Simplifi import are placed in /generated-old folder -----"
  echo "-------------------------------------------------------------------------------"
  echo
  echo
}
