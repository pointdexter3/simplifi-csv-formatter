#!/bin/bash

# run the command like
#  ./format-all-financial-institutions.bash "2023-12-20"

from_date=$1

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
    local original_date_column_num=$7
    local separate_debit_credit_columns=$8
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

    # combine individual statement files into a single csv if a folder exists of the same name
    combine_csv_files "$csv_filename"

    if check_file_exists "$csv_filename"; then
      if check_file_exists_and_not_empty "$csv_filename"; then
        echo "File FOUND:       '$csv_filename'"
        "$script_dir/fi-formatter-scripts/$script_filename" "$csv_filename" "$script_dir/../generated" \
          "$from_date" "$tag_from_filename" "$keep_columns" "$invert_numbers" "$original_date_column_num" \
          "$separate_debit_credit_columns"
      else
        echo "File EMPTY:       '$csv_filename'"
      fi
    else
      echo "File NOT FOUND      '$csv_filename'"
    fi
  )
}

# process_fi_csv_file csv_filename script_filename
#   from_date tag_from_filename keep_columns invert_numbers original_date_column_num

process_fi_csv_file "bmo-chequing.csv" "generic.bash" \
  "$from_date" "0" "3,4,5" "" 3 ""
process_fi_csv_file "bmo-mastercard.csv" "generic.bash" \
  "$from_date" "0" "3,5,6" "invert numbers" 3 ""
process_fi_csv_file "pc-financial-mastercard.csv" "generic.bash" \
  "$from_date" "0" "1,4,6" "" 4 ""
process_fi_csv_file "scotiabank-visa.csv" "generic.bash" \
  "$from_date" "0" "1,2,3" "" 1 ""
process_fi_csv_file "tangerine-chequing.csv" "generic.bash" \
  "$from_date" "0" "1,3,5" "" 1 ""
process_fi_csv_file "tangerine-savings.csv" "generic.bash" \
  "$from_date" "0" "1,3,5" "" 1 ""
process_fi_csv_file "rbc-visa-csv-export.csv" "generic.bash" \
  "$from_date" "0" "3,5,7" "" 3 ""
process_fi_csv_file "rbc-visa-manual-copy.csv" "generic.bash" \
  "$from_date" "0" "1,2,3" "invert numbers" 1 "3,4"
process_fi_csv_file "td-visa.csv" "generic.bash" \
  "$from_date" "0" "1,2,3" "invert numbers" 1 "3,4"

