#!/bin/bash

# run the command like
#  ./scotiabank-visa.bash scotiabank-visa.csv "2023-12-20"

# keep the original file, create a new file for the formatted data, fill the new file with the data
original_filename=$1
output_directory=$2
from_date=$3
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# copy file
cp $original_filename $filename

# replace multiple spaces with single space
sed -E "s/ +/ /g" $filename >$filename.tmp && mv $filename.tmp $filename

# change date format from MM/DD/YYYY to YYYY-MM-DD
# pad optionally single digit months and days with a zero. don't pad double digit months and days with zero
awk -F',' -v date_col=1 'BEGIN{OFS=","} {split($date_col, date_arr, "/"); $date_col = sprintf("%04d-%02d-%02d", date_arr[3], date_arr[1], date_arr[2]); print}'\
 $filename >$filename.tmp && mv $filename.tmp $filename

if [ -n "$2" ]; then
    # awk remove all lines where the date is before the from_date in column 3
    awk -F, -v from_date="$from_date" '$1 >= from_date' $filename >$filename.tmp && mv $filename.tmp $filename
else
    echo "From date not supplied. All transactions returned"
fi

# replace date format YYYY-MM-DD with MM/DD/YYYY but only for numbers that are 8 digits long without decimals
sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/"\2\/\3\/\1"/g' $filename >$filename.tmp && mv $filename.tmp $filename

# replace
# (".*"),(".*"),(.*)
# with
# $1,$2,"$3","from Scotiabank VISA"
sed -E 's/(".*"),(".*"),(.*)/\1,\2,"\3","from Scotiabank VISA"/g' $filename >$filename.tmp && mv $filename.tmp $filename

# append line to top of file
# "Date","Payee","Amount","Tags"
(echo '"Date","Payee","Amount","Tags"' && cat $filename) >$filename.tmp && mv $filename.tmp $filename
