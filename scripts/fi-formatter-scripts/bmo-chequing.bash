#!/bin/bash

# run the command
#  ./bmo-chequing.bash bmo-chequing.csv

# keep the original file, create a new file for the formatted data, fill the new file with the data
original_filename=$1
output_directory=$2
from_date=$3 # not used, need to add filtering by date. not a big deal as you can export by date from the bmo website
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# copy file
cp $original_filename $filename

#  delete first 6 lines (including header, will add it back later)
sed "1,6d" $filename >$filename.tmp && mv $filename.tmp $filename

# REMOVE INVALID CHARACTERS
# replace all # with nothing
sed -E 's/#//g' $filename >$filename.tmp && mv $filename.tmp $filename
# replace regex (\[.*\]\s?) with nothing
sed -E "s/\[.*\]\s?//g" $filename >$filename.tmp && mv $filename.tmp $filename
# replace B/M with nothing
sed -E "s/B\/M//g" $filename >$filename.tmp && mv $filename.tmp $filename
# replace multiple spaces with single space
sed -E "s/ +/ /g" $filename >$filename.tmp && mv $filename.tmp $filename


# keep the last 3 columns, remove the rest. remove 2 if there are 5 columns, remove 3 if there are 6 columns
awk -F, '{print $(NF-2) "," $(NF-1) "," $NF}' "$filename" > "$filename.tmp" && mv "$filename.tmp" "$filename"

# replace date format YYYYMMDD with YYYY-MM-DD
sed -E 's/([0-9]{4})([0-9]{2})([0-9]{2})/\1-\2-\3/g' $filename >$filename.tmp && mv $filename.tmp $filename

# $3 is the from_date
if [ -n "$3" ]; then
    # awk remove all lines where the date is before the from_date in column 1
    awk -F, -v from_date="$from_date" '$1 >= from_date' $filename >$filename.tmp && mv $filename.tmp $filename
else
    echo "From date not supplied. All transactions returned"
fi

# replace date format YYYY-MM-DD with MM/DD/YYYY
sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\2\/\3\/\1/g' $filename >$filename.tmp && mv $filename.tmp $filename

# add quotes, and add tag column
sed -E 's/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}),(.*),(.*)/"\1","\2","\3","from BMO Mastercard"/g' $filename >$filename.tmp && mv $filename.tmp $filename

# SORT FILE
# sort -k1 -t, $filename >$filename.tmp && mv $filename.tmp $filename

# ADD HEADER
(echo '"Date","Payee","Amount","Tags"' && cat $filename) >$filename.tmp && mv $filename.tmp $filename
