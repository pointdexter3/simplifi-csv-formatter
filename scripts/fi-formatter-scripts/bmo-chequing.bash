#!/bin/bash

# import common functions (relative to this script)
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" && . "$script_dir/fi-formatter-common.bash"

# keep the original file, create a new file for the formatted data, fill the new file with the data
original_filename=$1
output_directory=$2
from_date=$3
tag_from_filename=$4
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# copy file
cp $original_filename $filename

delete_header_and_message_lines $filename

remove_noise $filename
normalize_dates $filename
filter_by_date $filename $from_date 3
sort_by_date $filename 3

# BMO Specific
keep_columns $filename "3,4,5"

# SIMPLIFI SPECIFIC
simplifi_rearrange_columns $filename
simplifi_add_tag_column $filename 0 # update 0 to 1 to add tag column ('from bmo-chequing')
simplifi_date $filename
simplifi_add_double_quotes $filename
simplifi_add_header $filename
