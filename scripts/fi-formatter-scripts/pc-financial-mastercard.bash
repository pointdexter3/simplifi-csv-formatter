#!/bin/bash

# run the command like
#  ./pc-financial-mastercard.bash pc-financial-mastercard.csv "2023-12-20"

# keep the original file, create a new file for the formatted data, fill the new file with the data
original_filename=$1
output_directory=$2
from_date=$3
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# copy file
cp $original_filename $filename

# delete lines 1 (including header, will add it back later)
sed "1d" $filename >$filename.tmp && mv $filename.tmp $filename

sed -E 's/"([0-9]{2})\/([0-9]{2})\/([0-9]{4})"/\3-\1-\2/g' $filename >$filename.tmp && mv $filename.tmp $filename

if [ -n "$2" ]; then
    # awk remove all lines where the date is before the from_date in column 3
    awk -F, -v from_date="$from_date" '$4 >= from_date' $filename >$filename.tmp && mv $filename.tmp $filename
else
    echo "From date not supplied. All transactions returned"
fi

# replace date format YYYY-MM-DD with MM/DD/YYYY but only for numbers that are 8 digits long without decimals
sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/"\2\/\3\/\1"/g' $filename >$filename.tmp && mv $filename.tmp $filename


# replace
# (".*"),(".*"),(".*"),("[0-9]{2}\/[0-9]{2}\/[0-9]{4}"),(".*"),(".*")
# with
# $4,$1,$6,"from PC Financial Mastercard"
sed -E 's/(".*"),(".*"),(".*"),("[0-9]{2}\/[0-9]{2}\/[0-9]{4}"),(".*"),(".*")/\4,\1,\6,"from PC Financial Mastercard"/g' $filename >$filename.tmp && mv $filename.tmp $filename

# append line to top of file
# "Date","Payee","Amount","Tags"
(echo '"Date","Payee","Amount","Tags"' && cat $filename) >$filename.tmp && mv $filename.tmp $filename
