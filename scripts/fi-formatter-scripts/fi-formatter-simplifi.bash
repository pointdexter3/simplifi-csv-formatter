#!/bin/bash

# For bulk import, add a tag column to the CSV file.
# This makes reviewing transactions that are categoized in Simplifi easier.
# Off by default
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

# Rearrange the columns Date, Payee, Amount.
# Assume 3 columns
# Date: format -> YYYY-MM-DD
# Payee: format -> any character catch
# Amount: format -> decimal number
function simplifi_rearrange_columns() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    # Use awk to detect column formats, rearrange columns
    awk -F, 'BEGIN{OFS=","} {
        if (NR == 1) {
            # Save the original order for the first line
            original_order = $0

            # Find the positions of date, number, and string columns in the first line
            for (i = 1; i <= NF; i++) {
                if ($i ~ /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) {
                    date_position = i
                } else if ($i ~ /^[-+]?[0-9]*\.[0-9]+$/) {
                    number_position = i
                } else {
                    string_position = i
                }
            }

            # Check if all positions are found
            if (date_position && number_position && string_position) {
                # Columns in the expected format for the first line, rearrange
                header_positions[date_position] = 1
                header_positions[string_position] = 2
                header_positions[number_position] = 3
                printf("%s,%s,%s\n", $header_positions[1], $header_positions[2], $header_positions[3])
            } else {
                # print $original_order "ERROR"
                printf("%s %s\n", "ERROR: original_order not defined:", 777)
            }
        } else {
            # Process subsequent lines based on the saved positions
            if (header_positions[1] && header_positions[2] && header_positions[3]) {
                printf("%s,%s,%s\n", $header_positions[1], $header_positions[2], $header_positions[3])
            } else {
                # Handle the case where header_positions are not defined
                printf "ERROR: header_positions not defined\n"
            }
        }
    }' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}
# Update Date Format
# Before:   YYYY-MM-DD
# After:    MM/DD/YYYY
function simplifi_date {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\2\/\3\/\1/g' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

# Add double quotes around all column values
function simplifi_add_double_quotes() {
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

# Add header
function simplifi_add_header {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    (echo '"Date","Payee","Amount","Tags"' && cat "$filename") >"$temp_file" && mv "$temp_file" "$filename"
}
