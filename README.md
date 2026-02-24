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


# How to use:
- git clone / download the repo.

## Download Transactions

- Download transactions from your financial institutions desktop website.
- Select the OFX/QFX/Quicken file export option and save to the `/original_ofx_files` directory

- Alternativly if a financial institution requires you to export as individual statements, create a directory such as `td-visa` inside of the `/original_ofx_files`, and then save  statement files within `td-visa`. The resulting combined export will use the directory name (td-visa.csv).

## Run terminal command

- Right click the `/csv-extractor` folder -> choose "Services" option -> choose "New Terminal At Folder"`.

- Run `npm install` to install the dependencies.

- Then run `npm run all_in_one` (this command runs the entire process from start to finish including conversion, removing duplicates transactions that appear in previous exports, archiving, and copying empty template files for the next run).

- If no errors are shown in the terminal, the process completed successfully. Move on to validate.

## Validate / Import into Simplifi

- The formatted files will appear in the most recent `archive/YYYY-MM-DD_to_YYYY-MM-DD/generated_simplifi_csv_files` directory.

- Validate that the format looks correct in the `.csv` files before importing into Simplifi.

- Upload the files to Simplifi using their import option ** (take care to select the correct account in their dropdown when uploading as undoing imports is manual and tedious) **


## Tips (VERY IMPORTANT TO READ)

- Take care with consistently naming the OFX files when downloading from your financial institution. For example, if you inconsisently named your files between imports `scotiabank-cc` and `scotiabank-visa`, the script will treat those as two separate accounts and not remove duplicate transactions between the two exports.

- Save empty template files for each of your accounts in the `template/original_ofx_files` directory. This way when you download the OFX files from your financial institution you don't need to worry about consistently naming the files each time.

- Take advantage of Simplifi's rules feature to automatically categorize transactions and assign tags. This will save you a lot of time and effort in the long run (At this point I download the transactions, import into Simplifi, and then quickly skim through at my leisure to make sure all my transfers are categorized correctly)
