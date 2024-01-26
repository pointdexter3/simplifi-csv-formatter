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
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# copy file
cp $original_filename $filename

delete_header_and_message_lines $filename

remove_noise $filename
normalize_dates $filename

if [[ ! -n "$original_date_column_num" ]]; then
    echo "original_date_column_num must be provided"
    exit 1
fi

# Institutions sometimes use positive numbers for credit transactions
if [[ -n "$invert_numbers" ]]; then
    invert_numbers $filename
fi

# filter_by_date $filename $from_date $original_date_column_num
sort_by_date $filename $original_date_column_num

# Insititution && Product Specific
keep_columns $filename "$keep_columns"

# # Simplifi Specific
simplifi_rearrange_columns $filename
simplifi_add_tag_column $filename $tag_from_filename # update 0 to 1 to add tag column ('from bmo-chequing')
simplifi_date $filename
simplifi_add_double_quotes $filename
simplifi_add_header $filename
