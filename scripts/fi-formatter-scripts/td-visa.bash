#!/bin/bash

# run the command like
#  ./td-visa.bash td-visa.csv "2023-12-20"

# keep the original file, create a new file for the formatted data, fill the new file with the data
original_filename=$1
output_directory=$2
from_date=$3
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# combine csv all files within a folder (including headers)
# $1 - output_file_name
# $2 - output_file_path
function combine_csv_files {

    # Output filename for combined CSV file
    local output_file_name="combined_output.csv"
    local output_file_path="../"

    # Parse the optional inputs (output_file_name, output_file_path)
    if [ $# -gt 0 ]; then
        output_file_name="$1"
    fi

    # check if there are any non-empty CSV files in the current directory 
    if [ -n "$(find . -maxdepth 1 -type f -name '*.csv' -size +0)" ]; then
        # Concatenate non-empty CSV files
        find . -maxdepth 1 -type f -name '*.csv' -size +0 -exec cat {} + >"${output_file_path}${output_file_name}"
        echo "Combined multiple TD Visa csv files."
    # else
        # echo "No non-empty CSV files found."
    fi
}

function check_file_exists_and_not_empty {
    if [ -s "$1" ]; then
        return 0
    else
        return 1
    fi
}

# combine csv files if applicable
cd ./td-visa-multiple-csv
combine_csv_files $original_filename
cd ..

# check is not empty file, if so, exit
if ! check_file_exists_and_not_empty $original_filename; then
    echo "File EMPTY:       '$original_filename'"
    exit 1
fi

# copy file
cp $original_filename $filename

# # delete lines 1 (including header, will add it back later)
# sed "1d" $filename >$filename.tmp && mv $filename.tmp $filename

# # change date format from MM/DD/YYYY to YYYY-MM-DD
# # pad optionally single digit months and days with a zero. don't pad double digit months and days with zero
awk -F',' -v date_col=1 'BEGIN{OFS=","} {split($date_col, date_arr, "/"); $date_col = sprintf("%04d-%02d-%02d", date_arr[3], date_arr[1], date_arr[2]); print}' \
    $filename >$filename.tmp && mv $filename.tmp $filename

if [ -n "$2" ]; then
    # awk remove all lines where the date is before the from_date in column 3
    awk -F, -v from_date="$from_date" '$1 >= from_date' $filename >$filename.tmp && mv $filename.tmp $filename
else
    echo "From date not supplied. All transactions returned"
fi

# bash sort file
sort -k1 -t, $filename >$filename.tmp && mv $filename.tmp $filename

# # replace date format YYYY-MM-DD with MM/DD/YYYY but only for numbers that are 8 digits long without decimals
sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/"\2\/\3\/\1"/g' $filename >$filename.tmp && mv $filename.tmp $filename

# merge Debit and Credit columns into one column, make Debit negative
awk -F"," -v OFS="," '{if($3 != "" && $3 > 0) $3 = sprintf("%.2f", $3 * -1);} \
    {if($4 != "") $3 = $3 + $4; $4 = ""; print $0}' \
    $filename >$filename.tmp && mv $filename.tmp $filename

# replace
# (".*"),(.*),(.*),(.*),(.*)
# with
# $1,"$2","$3","from TD VISA"
sed -E 's/(.*),(.*),(.*),(.*),(.*)/\1,"\2","\3","from TD VISA"/g' $filename >$filename.tmp && mv $filename.tmp $filename

# # append line to top of file
# # "Date","Payee","Amount","Tags"
(echo '"Date","Payee","Amount","Tags"' && cat $filename) >$filename.tmp && mv $filename.tmp $filename
