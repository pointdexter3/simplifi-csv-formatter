# Simplifi CSV Formatter for Canadians



Utility for the budgeting app [Simplifi](https://www.quicken.com/products/simplifi/) intended for those that prefer manually importing csv files from their banks.


Simplifi requires transaction imports be in a specific format.

|Date     |Payee    |Amount |Tags            |
|---------|---------|-------|----------------|
|3/13/2020|Starbucks|-7     |Vacation        |
|3/15/2020|Uber     |-21.12 |Hawaii, Vacation|
|3/17/2020|Acme     |1735.21|                |

<br><br>
Canadian Banks are all over the place with the format of their transaction CSV exporting.
<br><br>

Availablility of downloading transactions to CSV varies between financial institutions (Some allow 2 months, others Years). 
<br><br>
I will update the following table over time.

|Financial Institution|CSV Transaction Availability|
|---------------------|----------------------------|
|BMO Mastercard       |3 Months                    |
|BMO Chequing         |2 Months                    |
|PC Mastercard        |1 Year                      |
|RBC Visa             |1 Month! (*ALL TRANSACTIONS COPY/PASTE*)|
|Scotiabank Visa      |1 Year (All transactions?)  |
|TD Visa              |6 Months (Individual statement CSV files)|
|Tangerine Chequing   |5 Years                     |
|Tangerine Savings    |5 Years                     |


# How to use:
- git clone / download the repo.

## Download Transactions

- Download transactions from your financial institutions desktop website.
- Select the CSV file option and save to the `/csv-raw` directory, overwrite the existing file(s) for your corresponding financial institution as the name is important (I can update support for other FI's when I know the format of their CSV export).


## Run terminal command

- Open terminal app on Mac and navigate to the `csv-extractor/scripts/` directory (Alternatively Right click the `/scripts` folder -> choose "Services" option -> choose "New Terminal At Folder"`.
- Copy/paste the following command into the terminal and hit enter `./format-all-financial-institutions.bash "2023-12-20"` (Where the date in quotes is the oldest transaction date you wish to import).


## Run terminal command

- The formatted files will appear in the `/generated` directory.
- Validate using your text editor of choice.
- Upload the files to Simplifi using their import option (take care to select the correct account in their dropdown when uploading.


