#!/bin/bash

# import common functions (relative to this script)
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" && . "$script_dir/fi-formatter-common.bash"

# keep the original file, create a new file for the formatted data, fill the new file with the data
original_filename=$1
output_directory=$2
from_date=$3
tag_from_filename=$4
keep_columns=$5
invert_numbers=$6
original_date_column_num=$7
combine_debit_credit_columns=$8
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# copy file
cp $original_filename $filename

delete_header_and_message_lines $filename
remove_noise $filename

if [[ -n "$combine_debit_credit_columns" ]]; then
    combine_debit_credit_columns $filename $combine_debit_credit_columns
fi

# Insititution && Product Specific
keep_columns $filename "$keep_columns"

# Institutions sometimes use positive numbers for credit transactions
if [[ -n "$invert_numbers" ]]; then
    invert_numbers $filename
fi

if [[ ! -n "$original_date_column_num" ]]; then
    echo "original_date_column_num must be provided"
    exit 1
fi

# As keep_columns() removed all but Payee, Amount, and Date
new_date_column_position=$(get_new_column_position "$original_date_column_num" "$keep_columns")
normalize_dates $filename
filter_by_date $filename $from_date $new_date_column_position
sort_by_date $filename $new_date_column_position

# Simplifi Specific
simplifi_rearrange_columns $filename
simplifi_add_tag_column $filename $tag_from_filename # update 0 to 1 to add tag column ('from bmo-chequing')
simplifi_date $filename
simplifi_add_double_quotes $filename
simplifi_add_header $filename
