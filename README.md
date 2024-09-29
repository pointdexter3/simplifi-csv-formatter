# Simplifi Manual OFX Import Tool for Canadians 🇨🇦



Utility for the budgeting app [Simplifi](https://www.quicken.com/products/simplifi/) intended for those that prefer manually importing OFX files from their banks.


Simplifi requires transaction imports be in a specific format.

|Date     |Payee    |Amount |Tags            |
|---------|---------|-------|----------------|
|3/13/2020|Starbucks|-7     |Vacation        |
|3/15/2020|Uber     |-21.12 |Hawaii, Vacation|
|3/17/2020|Acme     |1735.21|                |

<br><br>
Download transactions from your bank in the .OFX .QFX or Quicken file formats. 
<br><br>

Transactions available for download varies between financial institutions (Some allow previous 2 months, others Years). 
<br><br>
I will update the following table over time.

|Financial Institution|Transaction Availability    |
|---------------------|----------------------------|
|BMO Mastercard       |3 Months                    |
|BMO Chequing         |2 Months                    |
|PC Mastercard        |1 Year                      |
|RBC Visa             |1 Month! (*ALL TRANSACTIONS COPY/PASTE into numbers and format the date to yyyy-mm-dd*)|
|Scotiabank Visa      |1 Year (All transactions?)  |
|TD Visa              |6 Months (Individual statement CSV files)|
|Tangerine Chequing   |5 Years                     |
|Tangerine Savings    |5 Years                     |


# How to use:
- git clone / download the repo.

## Download Transactions

- Download transactions from your financial institutions desktop website.
- Select the OFX/QFX/Quicken file export option and save to the `/original_ofx_files` directory
- Alternativly if a financial institution only exports single months at a time, create a directory such as `td-visa` within `/original_ofx_files` and save within. The resulting combined export will use the directory name (td-visa.csv).

## Run terminal command

- Right click the `/csv-extractor` folder -> choose "Services" option -> choose "New Terminal At Folder"`.

Then run either:
`npm run start` (script will prompt for date range)
`npm run parser 2024-09-01 2024-09-20` (provide date range without prompts)
`npm run parser` (run for all available transactions)

- No errors should be shown in the terminal.

## Validate / Import into Simplifi

- The formatted files will appear in the `/generated_simplifi_csv_files` directory.
- Validate that the format looks correct in the `.csv` files before importing into Simplifi.
- Upload the files to Simplifi using their import option ** (take care to select the correct account in their dropdown when uploading) **
