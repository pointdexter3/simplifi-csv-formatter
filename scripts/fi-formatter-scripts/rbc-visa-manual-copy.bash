#!/bin/bash

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
#
# 1. YOU MUST MANUALLY COPY/PASTE RBC TRANSACTIONS FROM LIST INTO MAC NUMBERS APP
# 2. UPDATE THE DATE FORMAT TO YYYY-MM-DD
# 3. THEN EXPORT AS CSV
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# run the command like
#  ./rbc-visa-manual-copy.bash rbc.csv "2023-12-20"

# keep the original file, create a new file for the formatted data, fill the new file with the data
original_filename=$1
output_directory=$2
from_date=$3
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# copy file
cp $original_filename $filename

# delete lines 1 (including header, will add it back later)
sed "1d" $filename >$filename.tmp && mv $filename.tmp $filename

if [ -n "$2" ]; then
    # awk remove all lines where the date is before the from_date in column 3
    awk -F, -v from_date="$from_date" '$1 >= from_date' $filename >$filename.tmp && mv $filename.tmp $filename
else
    echo "From date not supplied. All transactions returned"
fi

# replace date format YYYY-MM-DD with MM/DD/YYYY but only for numbers that are 8 digits long without decimals
sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/"\2\/\3\/\1"/g' $filename >$filename.tmp && mv $filename.tmp $filename

# remove commas between double quotes
awk -F'"' -v OFS='"' '{ for (i=2; i<=NF; i+=2) gsub(",", "", $i) } 1' $filename >$filename.tmp && mv $filename.tmp $filename

# replace dollar sign with nothing
sed -E 's/\$//g' $filename >$filename.tmp && mv $filename.tmp $filename

# remove double quotes in order to merge Debit and Credit columns 
#   (will add them back later. Credit column formatted with double quotes "-3000.3")
sed -E 's/"//g' $filename >$filename.tmp && mv $filename.tmp $filename

# merge Debit and Credit columns into one column
awk -F"," -v OFS="," '{gsub(/[$,]/, "", $3); gsub(/[$,]/, "", $4); if($4 != "") $3 = $3 + $4; $4 = ""; print $0}' $filename >$filename.tmp && mv $filename.tmp $filename


# INVERT NUMBERS (I DON'T KNOW HOW TO DO THIS PROPERLY)
# add an extra minus sign (-) before all numbers with a decimal point
sed -E 's/([0-9]+\.[0-9]+)/-\1/g' $filename >$filename.tmp && mv $filename.tmp $filename
# replace -- with nothing
sed -E 's/--//g' $filename >$filename.tmp && mv $filename.tmp $filename

# replace
# (.*),(.*),(.*),(.*),(.*),,
# with
# "$1","$2","$3","from RBC VISA"
sed -E 's/(.*),(.*),(.*),(.*),(.*),,/"\1","\2","\3","from RBC VISA"/g' $filename >$filename.tmp && mv $filename.tmp $filename


# append line to top of file
# "Date","Payee","Amount","Tags"
(echo '"Date","Payee","Amount","Tags"' && cat $filename) >$filename.tmp && mv $filename.tmp $filename
