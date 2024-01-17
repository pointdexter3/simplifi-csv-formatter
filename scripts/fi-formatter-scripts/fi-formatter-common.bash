#!/bin/bash

function removeInvalidCharacters() {
    local filename=$1

    # replace dollar sign with nothing
    sed -E 's/\$//g' $filename >$filename.tmp && mv $filename.tmp $filename
    # replace all # with nothing
    sed -E 's/#//g' $filename >$filename.tmp && mv $filename.tmp $filename
    # replace regex (\[.*\]\s?) with nothing
    sed -E "s/\[.*\]\s?//g" $filename >$filename.tmp && mv $filename.tmp $filename
    # replace B/M with nothing
    sed -E "s/B\/M//g" $filename >$filename.tmp && mv $filename.tmp $filename
    # replace multiple spaces with single space
    sed -E "s/ +/ /g" $filename >$filename.tmp && mv $filename.tmp $filename

    # remove commas between double quotes
    awk -F'"' -v OFS='"' '{ for (i=2; i<=NF; i+=2) gsub(",", "", $i) } 1' $filename >$filename.tmp && mv $filename.tmp $filename
    # remove double quotes
    sed -E 's/"//g' $filename >$filename.tmp && mv $filename.tmp $filename

    # remove leading and trailing spaces in each column. also remove spaces at end of line
    sed -E 's/\, +/,/g; s/ +\,/,/g; s/ +$//g;' $filename >$filename.tmp && mv $filename.tmp $filename
}
