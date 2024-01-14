#!/bin/bash

# run the command
#  ./bmo-chequing.bash bmo-chequing.csv

# keep the original file, create a new file for the formatted data, fill the new file with the data
original_filename=$1
output_directory=$2
# from_date=$3 # not used, need to add filtering by date. not a big deal as you can export by date from the bmo website
filename="$output_directory/${original_filename%.*}-formatted.${original_filename##*.}"

# copy file
cp $original_filename $filename

# delete lines 5, 6
sed "5,6d" $filename >$filename.tmp && mv $filename.tmp $filename
# delete first 3 lines
sed "1,3d" $filename >$filename.tmp && mv $filename.tmp $filename

# replace regex (\[.*\]\s?) with nothing
sed -E "s/\[.*\]\s?//g" $filename >$filename.tmp && mv $filename.tmp $filename

# replace B/M with nothing
sed -E "s/B\/M//g" $filename >$filename.tmp && mv $filename.tmp $filename

# replace multiple spaces with single space
sed -E "s/ +/ /g" $filename >$filename.tmp && mv $filename.tmp $filename

# replace date format YYYYMMDD with MM/DD/YYYY but only for numbers that are 8 digits long without decimals
sed -E 's/,([0-9]{4})([0-9]{2})([0-9]{2}),/,\2\/\3\/\1,/g' $filename >$filename.tmp && mv $filename.tmp $filename

# replace
# (.*),(.*),(\d{1,2}/\d{1,2}/\d{4}),(.*),(.*)
# with
# "$3","$5","$4","from BMO Chequing"
sed -E 's/(.*),(.*),([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}),(.*),(.*)/"\3","\5","\4","from BMO Chequing"/g' $filename >$filename.tmp && mv $filename.tmp $filename

# for the following line, remove the space after the first quote. also remove the space before the second quote. either of these spaces may not exist
# ," PAY-PAIE PAY/PAY ",
sed -E 's/," (.*) ",/,"\1",/g' $filename >$filename.tmp && mv $filename.tmp $filename

# replace first line with
# "Date","Payee","Amount","Tags"
sed -E '1s/.*/"Date","Payee","Amount","Tags"/' $filename >$filename.tmp && mv $filename.tmp $filename
