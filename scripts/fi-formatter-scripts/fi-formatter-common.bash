#!/bin/bash

function remove_noise() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    sed -E -e 's/\$//g' \
        -e 's/#//g' \
        -e 's/\[.*\]\s?//g' \
        -e 's/B\/M//g' \
        -e 's/ +/ /g' \
        "$filename" >"$temp_file" && mv "$temp_file" "$filename"

    # remove commas between double quotes (and single quotes)
    awk -F'["'\'']' -v OFS='"' '{ for (i=2; i<=NF; i+=2) gsub(",", "", $i) } 1' "$filename" >"$temp_file" && mv "$temp_file" "$filename"

    # remove single quotes, double quotes, remove leading and trailing spaces in each column. remove spaces at end of line
    sed -E -e 's/["'\'']//g' -e 's/\, +/,/g' -e 's/ +\,/,/g' -e 's/ +$//g' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

function filter_by_date() {
    local filename=$1
    local from_date=$2
    local date_column=$3
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    if [[ -n "$from_date" && -n "$date_column" ]]; then
        # awk -F, -v from_date="$from_date" '$1 >= from_date' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
        awk -F, -v from_date="$from_date" -v date_column="$date_column" '$date_column >= from_date' "$filename" >"$temp_file" &&
            mv "$temp_file" "$filename"

    else
        echo "From date not supplied. All transactions returned"
    fi
}

# Keep only specified columns in a CSV file.
# Columns are specified as a comma-separated string of integers.
# For example, to keep the first, third, and fifth columns, use "1,3,5".
function keep_columns() {
    local input_file=$1
    local columns_to_keep=$2
    local temp_file=$(mktemp "$input_file.XXXXXXXXXX")

    if [[ ! "$columns_to_keep" =~ ^[1-9][0-9]*(,[1-9][0-9]*)*$ ]]; then
        echo "Error: Columns to keep must be a comma-separated string of integers starting from 1."
        exit 1
    fi

    # Use awk to keep specified columns
    awk -F, -v cols="${columns_to_keep}" '{
        n = split(cols, selected_cols, ",")
        for (i = 1; i <= NF; i++) {
            for (j = 1; j <= n; j++) {
                if (i == selected_cols[j]) {
                    printf "%s%s", $i, (j == n ? "" : ",")
                }
            }
        }
        print ""
                
    }' "$input_file" >"$temp_file" && mv "$temp_file" "$input_file"
}

sort_by_date() {
    local filename=$1
    local date_column=$2
    local reverse_sort=$3
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    if [[ -n "$date_column" ]]; then
        if [[ "$reverse_sort" -eq 1 ]]; then
            sort -k"$date_column" -t, -r "$filename" >"$temp_file" && mv "$temp_file" "$filename"
        else
            sort -k"$date_column" -t, "$filename" >"$temp_file" && mv "$temp_file" "$filename"
        fi
    else
        echo "Date column not supplied. File not sorted"
    fi
}

# Find the first line that matches a date pattern and delete all lines above it.
# pattern finds a date (any format) AND a decimal number in the same line
delete_header_and_message_lines() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")
    # date and decimal number in the same line, any order
    date_pattern='^.*?((?:[0-9]{4}[-\/.][0-9]{2}[-\/.][0-9]{2}|[0-9]{8}|[0-9]{2}[-\/.][0-9]{2}[-\/.][0-9]{4}|[0-9]{4}[-\/.][0-9]{2}[-\/.][0-9]{2}).*?[0-9]+\.[0-9]+|[0-9]+\.[0-9]+.*?(?:[0-9]{4}[-\/.][0-9]{2}[-\/.][0-9]{2}|[0-9]{8}|[0-9]{2}[-\/.][0-9]{2}[-\/.][0-9]{4}|[0-9]{4}[-\/.][0-9]{2}[-\/.][0-9]{2})).*$'
    # Use grep to find the line number of the first line containing a date
    date_line=$(grep -En "$date_pattern" "$filename" | head -n 1 | cut -d ':' -f 1)
    # Use sed to delete all lines above the line matching the regex
    sed -n "${date_line},$ p" "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

# Normalize all dates in a CSV file to YYYY-MM-DD format.
#
# The following date formats are supported:
#   YYYY-MM-DD (no change)
#   MM/DD/YYYY
#   YYYYMMDD
#   DD/MM/YYYY
#   DD-MM-YYYY
#   DD.MM.YYYY
#   DDMMYYYY
#   YYYY/MM/DD
#   YYYY.MM.DD
function normalize_dates() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    awk -F, 'BEGIN{OFS=","} {
        for(i=1; i<=NF; i++) {
            # Check for YYYY-MM-DD format
            if ($i ~ /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) {
                # Do nothing
            }
            # Check for MM/DD/YYYY format
            else if ($i ~ /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/) {
                split($i, date, "/")
                $i = date[3] "-" date[1] "-" date[2]
            }
            # Check for YYYYMMDD format
            else if ($i ~ /^[0-9]{8}$/) {
                $i = substr($i, 1, 4) "-" substr($i, 5, 2) "-" substr($i, 7, 2)
            }
            # Check for DD/MM/YYYY format
            else if ($i ~ /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/) {
                split($i, date, "/")
                $i = date[3] "-" date[2] "-" date[1]
            }
            # Check for DD-MM-YYYY format
            else if ($i ~ /^[0-9]{2}-[0-9]{2}-[0-9]{4}$/) {
                split($i, date, "-")
                $i = date[3] "-" date[2] "-" date[1]
            }
            # Check for DD.MM.YYYY format
            else if ($i ~ /^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$/) {
                split($i, date, ".")
                $i = date[3] "-" date[2] "-" date[1]
            }
            # Check for DDMMYYYY format
            else if ($i ~ /^[0-9]{8}$/) {
                $i = substr($i, 1, 4) "-" substr($i, 5, 2) "-" substr($i, 7, 2)
            }
            # Check for YYYY/MM/DD format
            else if ($i ~ /^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/) {
                split($i, date, "/")
                $i = date[1] "-" date[2] "-" date[3]
            }
            # Check for YYYY.MM.DD format
            else if ($i ~ /^[0-9]{4}\.[0-9]{2}\.[0-9]{2}$/) {
                split($i, date, ".")
                $i = date[1] "-" date[2] "-" date[3]
            }
        }
        print
    }' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

# For bulk import, add a tag column to the CSV file.
# This makes reviewing transactions that are categoized in Simplifi easier.
function simplifi_add_tag_column() {
    local filename=$1
    local tag_from_filename=$2
    local simplifi_tag=""
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")


    if [ "$tag_from_filename" -eq 1 ]; then
        simplifi_tag="from $(basename -- "$filename" | sed 's/\.[^.]*$//' | sed 's/-formatted$//')"
    fi

    awk -F, -v tag="$simplifi_tag" '{print $0 "," tag}' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

function simplifi_rearrange_columns() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    # Use awk to detect column formats, rearrange columns
    awk -F, 'BEGIN{OFS=","} {
        # Assume initial order as date, number, string
        date_col = $1
        number_col = $2
        string_col = $3

        # Check the format of each column
        if (date_col ~ /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/ && number_col ~ /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/ && string_col ~ /^[^0-9]+$/) {
            # Columns are in the expected format, rearrange
            printf("%s,%s,%s", date_col, string_col, number_col)
        } else {
            # Columns are not in the expected format, keep as is
            print $0
        }
        print ""
    }' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

function simplifi_date {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\2\/\3\/\1/g' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

simplifi_add_double_quotes() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    # add double quotes to all columns
    awk -F, 'BEGIN{OFS=","} {
        for(i=1; i<=NF; i++) {
            $i = "\"" $i "\""
        }
        print
    }' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

function simplifi_add_header {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    (echo '"Date","Payee","Amount","Tags"' && cat "$filename") >"$temp_file" && mv "$temp_file" "$filename"
}
