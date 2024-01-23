#!/bin/bash

# run the command like
#  ./format-all-financial-institutions.bash "2023-12-20"

from_date=$1

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

# The csv file may or may not be empty depending on if multiple transactions csv need
#   to be merged (logic contained within the TD script)
function allow_empty_file_exception {
  if [ "$1" = "td-visa.csv" ]; then
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
  echo "----- Formatted files for Simplifi import are placed in /generated folder -----"
  echo "-------------------------------------------------------------------------------"
  echo
  echo
}

print_intro

function process_fi_csv_file {
  (
    local csv_filename="$1"
    local script_filename="$2"
    local from_date=$3
    local tag_from_filename=$4
    local keep_columns=$5
    local invert_numbers=$6
    local script_dir="$PWD"

    # optional script_filename parameter, if not empty string, use it, otherwise use default
    if [ $# -gt 1 ] && [ -n "$2" ]; then
      script_filename="$2"
    else
      script_filename="${csv_filename%.*}.bash"
    fi

    # check if script file exists
    check_file_exists_and_not_empty "$script_dir/fi-formatter-scripts/$script_filename" || exit 1

    cd "$script_dir/../csv-raw/" || exit 1
    if check_file_exists "$csv_filename"; then
      if check_file_exists_and_not_empty "$csv_filename"; then
        echo "File FOUND:       '$csv_filename'"
        "$script_dir/fi-formatter-scripts/$script_filename" "$csv_filename" "$script_dir/../generated" \
          "$from_date" "$tag_from_filename" "$keep_columns" "$invert_numbers"
      elif allow_empty_file_exception "$csv_filename"; then
        "$script_dir/fi-formatter-scripts/$script_filename" "$csv_filename" "$script_dir/../generated" \
          "$from_date" "$tag_from_filename" "$keep_columns" "$invert_numbers"
      else
        echo "File EMPTY:       '$csv_filename'"
      fi
    else
      echo "File NOT FOUND      '$csv_filename'"
    fi
  )
}

process_fi_csv_file "bmo-chequing.csv" "generic.bash" "$from_date" "0" "3,4,5"
process_fi_csv_file "bmo-mastercard.csv" "generic.bash" "$from_date" "0" "3,5,6" "invert numbers"
# process_fi_csv_file "pc-financial-mastercard.csv" "" "$from_date"
# process_fi_csv_file "scotiabank-visa.csv" "" "$from_date"
# process_fi_csv_file "td-visa.csv" "" "$from_date"
# process_fi_csv_file "tangerine-chequing.csv" "" "$from_date"
# process_fi_csv_file "tangerine-savings.csv" "" "$from_date"
# process_fi_csv_file "rbc-visa-csv-export.csv" "" "$from_date"
# process_fi_csv_file "rbc-visa-manual-copy.csv" "" "$from_date"
