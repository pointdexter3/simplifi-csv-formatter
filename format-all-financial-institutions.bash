#!/bin/bash

# run the command like
#  ./format-all-financial-institutions.bash "2023-12-20"

from_date=$1

root_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" && . "$root_directory/scripts/format-all-common.bash"

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
    local root_directory="$PWD"


    # optional script_filename parameter, if not empty string, use it, otherwise use default
    if [ $# -gt 1 ] && [ -n "$2" ]; then
      script_filename="$2"
    else
      script_filename="${csv_filename%.*}.bash"
    fi

    # check if script file exists
    check_file_exists_and_not_empty "$root_directory/scripts/fi-formatter-scripts/$script_filename" || exit 1

    cd "$root_directory/csv-raw/" || exit 1

    # combine individual statement files into a single csv if a folder exists of the same name
    combine_csv_files "$csv_filename"

    if check_file_exists "$csv_filename"; then
      if check_file_exists_and_not_empty "$csv_filename"; then
        echo "File FOUND:       '$csv_filename'"
        "$root_directory/scripts/fi-formatter-scripts/$script_filename" "$csv_filename" "$root_directory/generated-old" \
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

process_fi_csv_file "bmo-chequing.csv" "fi-formatter.bash" \
  "$from_date" "0" "3,4,5" "" 3 ""
process_fi_csv_file "bmo-mastercard.csv" "fi-formatter.bash" \
  "$from_date" "0" "3,5,6" "invert numbers" 3 ""
process_fi_csv_file "pc-financial-mastercard.csv" "fi-formatter.bash" \
  "$from_date" "0" "1,4,6" "" 4 ""
process_fi_csv_file "scotiabank-visa.csv" "fi-formatter.bash" \
  "$from_date" "0" "1,2,3" "" 1 ""
process_fi_csv_file "tangerine-chequing.csv" "fi-formatter.bash" \
  "$from_date" "0" "1,3,5" "" 1 ""
process_fi_csv_file "tangerine-savings.csv" "fi-formatter.bash" \
  "$from_date" "0" "1,3,5" "" 1 ""
process_fi_csv_file "rbc-visa-csv-export.csv" "fi-formatter.bash" \
  "$from_date" "0" "3,5,7" "" 3 ""
process_fi_csv_file "rbc-visa-manual-copy.csv" "fi-formatter.bash" \
  "$from_date" "0" "1,2,3" "invert numbers" 1 "3,4"
process_fi_csv_file "td-visa.csv" "fi-formatter.bash" \
  "$from_date" "0" "1,2,3" "invert numbers" 1 "3,4"

