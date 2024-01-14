#!/bin/bash

# run the command like
#  ./bmo-mastercard.bash bmo-mastercard.csv "2023-12-20"

# keep the original file, create a new file for the formatted data, fill the new file with the data
original_filename=$1
output_directory=$2
from_date=$3
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# copy file
cp $original_filename $filename

# delete lines 1,2,3 (including header, will add it back later)
sed "1,3d" $filename >$filename.tmp && mv $filename.tmp $filename

# INVERT NUMBERS (I DON'T KNOW HOW TO DO THIS PROPERLY)
# add an extra minus sign (-) before all numbers with a decimal point
sed -E 's/([0-9]+\.[0-9]+)/-\1/g' $filename >$filename.tmp && mv $filename.tmp $filename
# replace -- with nothing
sed -E 's/--//g' $filename >$filename.tmp && mv $filename.tmp $filename

# replace date format YYYYMMDD with YYYY-MM-DD but only for numbers that are 8 digits long without decimals
# support multiple occurrences of YYYYMMDD in the same line
sed -E 's/([0-9]{4})([0-9]{2})([0-9]{2})/\1-\2-\3/g' $filename >$filename.tmp && mv $filename.tmp $filename

if [ -n "$2" ]; then
    # awk remove all lines where the date is before the from_date in column 3
    awk -F, -v from_date="$from_date" '$3 >= from_date' $filename >$filename.tmp && mv $filename.tmp $filename
else
    echo "From date not supplied. All transactions returned"
fi

# replace date format YYYY-MM-DD with MM/DD/YYYY but only for numbers that are 8 digits long without decimals
# support multiple occurrences of YYYY-MM-DD in the same line
sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\2\/\3\/\1/g' $filename >$filename.tmp && mv $filename.tmp $filename

# replace
# (.*,.*),(\d{1,2}/\d{1,2}/\d{4}),(.*),(.*),(.*)
# with
# "$2","$5","$4","from BMO Mastercard"
sed -E 's/(.*,.*),([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}),(.*),(.*),(.*)/"\2","\5","\4","from BMO Mastercard"/g' $filename >$filename.tmp && mv $filename.tmp $filename

# replace all # with nothing
sed -E 's/#//g' $filename >$filename.tmp && mv $filename.tmp $filename

# replace multiple spaces with single space
sed -E "s/ +/ /g" $filename >$filename.tmp && mv $filename.tmp $filename

# bash sort file
sort -k1 -t, $filename >$filename.tmp && mv $filename.tmp $filename

# delete all lines of the csv where

# append line to top of file
# "Date","Payee","Amount","Tags"
(echo '"Date","Payee","Amount","Tags"' && cat $filename) >$filename.tmp && mv $filename.tmp $filename
