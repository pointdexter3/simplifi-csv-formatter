#!/bin/bash

function combine_debit_credit_columns() {
    local filename=$1
    local debit_credit_columns=$2
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    awk -v debit_credit="$debit_credit_columns" -F, -v OFS="," '{
        split(debit_credit, columns, /,/);
        gsub(/[$,]/, "", $(columns[1]));
        gsub(/[$,]/, "", $(columns[2]));

        # Check if the value in the second column is a credit
        if ($(columns[2]) ~ /^[-+]?[0-9]+\.[0-9]+$/) {

            # If its not negative, make it negative
            if ($(columns[2]) >= 0) {
                $(columns[2]) = -$(columns[2]);
            }

            # Copy credit into debit column
            $(columns[1]) = $(columns[2]);
        }

        $(columns[2]) = "";
        print $0;
    }' "$filename" > "$temp_file" && mv "$temp_file" "$filename"
}


# get the new position of a column after keep_columns() is executed.
# assume the column exists in the list of columns_to_keep
function get_new_column_position() {
    local original_column_num="$1"
    local columns_to_keep="$2"

    # Split the columns into an array
    IFS=',' read -ra columns_array <<<"$columns_to_keep"

    # Find the index of the original column in the array
    for i in "${!columns_array[@]}"; do
        if [[ "${columns_array[$i]}" -eq "$original_column_num" ]]; then
            new_column_index="$i"
            break
        fi
    done

    # Increment the index by 1 to get the new position
    echo "$((new_column_index + 1))"
}

function remove_noise() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    # remove windows CRLF as it causes issues (newline)
    tr -d '\r' <"$filename" >"$temp_file" && mv "$temp_file" "$filename"

    # remove $, #, [anything], replace multiple spaces with one space
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

    # remove empty lines
    sed '/^[[:space:]]*$/d' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

# Make positive decimal numbers negative and visa versa.
function invert_numbers() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")
    # INVERT NUMBERS - add 'extra minus -, and then remove double minus --' (I DON'T KNOW HOW TO DO THIS PROPERLY)
    sed -E 's/([0-9]+\.[0-9]+)/-\1/g' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
    sed -E 's/--//g' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
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
    local filename=$1
    local columns_to_keep=$2
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

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
                
    }' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

function sort_by_date() {
    local filename=$1
    local date_column=$2
    local reverse_sort=$3
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    if [[ -n "$date_column" ]]; then
        if [[ "$reverse_sort" -eq 1 ]]; then
            sort -k"$date_column","$date_column"n -t, -r "$filename" >"$temp_file" && mv "$temp_file" "$filename"
        else
            sort -k"$date_column","$date_column"n -t, "$filename" >"$temp_file" && mv "$temp_file" "$filename"
        fi
    else
        echo "Date column not supplied. File not sorted"
    fi
}

# Find the first line that matches a date pattern and delete all lines above it.
# pattern finds a date (any format) AND a decimal number in the same line
function delete_header_and_message_lines() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")
    # date and decimal number in the same line, any order
    date_pattern='^.*?((?:[0-9]{4}[-\/.][0-9]{1,2}[-\/.][0-9]{1,2}|[0-9]{8}|[0-9]{1,2}[-\/.][0-9]{1,2}[-\/.][0-9]{4}|[0-9]{4}[-\/.][0-9]{1,2}[-\/.][0-9]{1,2}).*?[0-9]+\.[0-9]+|[0-9]+\.[0-9]+.*?(?:[0-9]{4}[-\/.][0-9]{1,2}[-\/.][0-9]{1,2}|[0-9]{8}|[0-9]{1,2}[-\/.][0-9]{1,2}[-\/.][0-9]{4}|[0-9]{4}[-\/.][0-9]{1,2}[-\/.][0-9]{1,2})).*$'
    # Use grep to find the line number of the first line containing a date
    date_line=$(grep -En "$date_pattern" "$filename" | head -n 1 | cut -d ':' -f 1)
    # Use sed to delete all lines above the line matching the regex
    sed -n "${date_line},$ p" "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

function determine_date_format() {
    local filename=$1
    local found_format="UNKNOWN"
    local ambiguous_default_format="USA"
    local override_condition=false

    # List of words that, if present in the filename, will trigger the override
    local override_keywords=("bmo")

    # Check if any of the override keywords are present in the filename
    for keyword in "${override_keywords[@]}"; do
        if [[ $filename == *"$keyword"* ]]; then
            override_condition=true
            break
        fi
    done

    is_single_line=$(awk 'END{print (NR==1) ? "true" : "false"}' "$filename")

    # Use awk to process the lines from the file
    found_format=$(awk -v is_single_line="$is_single_line" -v override="$override_condition" -v ambiguous_default_format="$ambiguous_default_format" -F, '
    BEGIN {
        OFS=",";
        found="false";
        last_line=(is_single_line == "true") ? "true" : "false";
    }
    # MAIN PROCESSING LOGIC
    {    
        # ITERATE THROUGH COLUMNS OF CURRENT LINE
        for(i=1; i<=NF; i++) {
            if (found == "false") {

                # DETERMINE IF COLUMN IS ON LAST LINE
                if (i == NF && NR == FNR) {
                    last_line="true"
                }

                if ($i ~ /^([0-9]{1,2})[\/.-]+([0-9]{1,2})[\/.-]+([0-9]{4})$/) {
                    split($i, date, "/")

                    if (date[1] > 12) {
                        print "DD/MM/YYYY"
                        found="true"
                        exit
                    }
                    if (date[2] > 12) {
                        print "MM/DD/YYYY"
                        found="true"
                        exit
                    }

                    # LAST LINE DEFAULT TO AMBIGUOUS DATES (where months or dates cannot be certain)
                    if (found == "false" && last_line=="true"){
                        if (ambiguous_default_format=="USA") {
                            print "MM/DD/YYYY"
                        } else {
                            print "DD/MM/YYYY"
                        }
                        found="true"
                        exit
                    }
                }

                if ($i ~ /^([0-9]{4})[\/.-]+([0-9]{1,2})[\/.-]+([0-9]{1,2})$/) {
                    split($i, date, "/")
                    if (date[2] > 12) {
                        print "YYYY/DD/MM"
                        found="true"
                        exit
                    }

                    if (date[3] > 12) {
                        print "YYYY/MM/DD"
                        found="true"
                        exit
                    }

                    # LAST LINE DEFAULT AMBIGUOUS DATES
                    if (found == "false" && last_line=="true"){
                        print "YYYY/MM/DD"
                        found="true"
                        exit
                    }
                }

                # require OVERRIDE for YYYYMMDD to avoid possible issues
                if (override == "true" && $i ~ /^(20[0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/) {
                    print "YYYYMMDD"
                    found="true"
                    exit
                }
            }
        }
    }' "$filename")

    echo "$found_format"
}

# Normalize all dates in a CSV file to YYYY-MM-DD format.
#
# The following date formats are supported (where "/" can be "/", ".", or "-"):
#   YYYY/MM/DD
#   MM/DD/YYYY and DD/MM/YYYY
#   YYYYMMDD
function normalize_dates() {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    format=$(determine_date_format "$filename")
    # echo "$format" #DEBUG

    awk -F, -v format="$format" 'BEGIN{OFS=","} {
        for(i=1; i<=NF; i++) {
            #######################################################################
            #### FORMATS BELOW USING "/" IN THE FORMAT MAY BE USING "/" "." "-"
            #######################################################################
            if (format == "MM/DD/YYYY" && $i ~ /^([0-9]{1,2})[\/.-]+([0-9]{1,2})[\/.-]+([0-9]{4})$/) {
                split($i, date, /[\/.-]/)
                $i = sprintf("%04d-%02d-%02d", date[3], date[1], date[2])
            } else if (format == "DD/MM/YYYY" && $i ~ /^([0-9]{1,2})[\/.-]+([0-9]{1,2})[\/.-]+([0-9]{4})$/) {
                split($i, date, /[\/.-]/)
                $i = sprintf("%04d-%02d-%02d", date[3], date[2], date[1])
            } else if (format == "YYYYMMDD" && $i ~ /^(20[0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/) {
                year = substr($i, 1, 4)
                month = substr($i, 5, 2)
                day = substr($i, 7, 2)
                date[1] = year
                date[2] = month
                date[3] = day
                $i = sprintf("%04d-%02d-%02d", date[1], date[2], date[3])
            } else if (format == "YYYY/MM/DD" && $i ~ /^([0-9]{4})[\/.-]+([0-9]{1,2})[\/.-]+([0-9]{1,2})$/) {
                split($i, date, /[\/.-]/)
                $i = sprintf("%04d-%02d-%02d", date[1], date[2], date[3])
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

function simplifi_date {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\2\/\3\/\1/g' "$filename" >"$temp_file" && mv "$temp_file" "$filename"
}

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

function simplifi_add_header {
    local filename=$1
    local temp_file=$(mktemp "$filename.XXXXXXXXXX")

    (echo '"Date","Payee","Amount","Tags"' && cat "$filename") >"$temp_file" && mv "$temp_file" "$filename"
}
