# Simplifi CSV Formatter for Canadians 🇨🇦



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
- Select the CSV file option and save to the `/csv-raw` directory
- Rename the `.csv` files to one of the following supported filenames (or simply overrite one of the existing empty files)

|CSV Supported File Names    |
|----------------------------|
|bmo-chequing.csv            |
|bmo-mastercard.csv          |
|pc-financial-mastercard.csv |
|scotiabank-visa.csv         |
|tangerine-chequing.csv      |
|tangerine-savings.csv       |
|rbc-visa-csv-export.csv     |
|rbc-visa-manual-copy.csv    |
|td-visa.csv                 |

## Run terminal command

- Right click the `/csv-extractor` folder -> choose "Services" option -> choose "New Terminal At Folder"`.
- Copy/paste the following command into the terminal and hit enter `./format-all-financial-institutions.bash "2023-12-20"` (The date in quotes is the oldest transaction date you wish to import. The date may be omitted).

## Validate / Import into Simplifi

- The formatted files will appear in the `/generated` directory.
- Validate that the format looks correct in the `.csv` files before importing into Simplifi.
- Upload the files to Simplifi using their import option ** (take care to select the correct account in their dropdown when uploading) **
