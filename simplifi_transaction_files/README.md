# HOW TO USE THIS SCRIPT TO IMPORT TRANSACTIONS INTO SIMPLIFI


## Download Transactions

- Download transactions from your financial institutions desktop website.
- Select the OFX/QFX/Quicken file export option and save to the `simplifi_transaction_files/original_ofx_files` directory.

- Alternativly if a financial institution requires you to export as individual statements, create a directory such as `td-visa` inside of the `simplifi_transaction_files/original_ofx_files`, and then save  statement files within `td-visa`. The resulting combined export will use the directory name (td-visa.csv).

## Run terminal command

- Right click the `simplifi_transaction_files` folder -> choose "Services" option -> choose "New Terminal At Folder"`.

- Then type `./run.sh` and hit enter (this command runs the entire process from start to finish including conversion, removing duplicates transactions that appear in the previous exports archive, archiving, and copying empty template files for the next import run).

- If no errors are shown in the terminal, the process completed successfully. Move on to validate.

## Validate / Import into Simplifi

- The formatted files will appear in the most recent `simplifi_transaction_files/archive/YYYY-MM-DD_to_YYYY-MM-DD/generated_simplifi_csv_files` directory.

- Validate that the format looks correct in the `.csv` files before importing into Simplifi.

- Upload the files to Simplifi using their import option ** (take care to select the correct account in their dropdown when uploading as undoing imports is manual and tedious) **


## Tips (VERY IMPORTANT TO READ)

- Bookmark the directories for easy access in the future. For example, bookmark `simplifi_transaction_files/original_ofx_files` for easy access when downloading OFX files from your financial institution, and bookmark `simplifi_transaction_files/archive` to easily find the generated CSV files for import into Simplifi.

- Take care with consistently naming the OFX files when downloading from your financial institution. For example, if you inconsisently named your files between imports `scotiabank-cc` and `scotiabank-visa`, the script will treat those as two separate accounts and not remove duplicate transactions between the two exports.

- Save empty template files for each of your accounts in the `simplifi_transaction_files/template/original_ofx_files` directory. This way when you download the OFX files from your financial institution you don't need to worry about consistently naming the files each time.

- Take advantage of Simplifi's rules feature to automatically categorize transactions and assign tags. This will save you a lot of time and effort in the long run (At this point I download the transactions, import into Simplifi, and then quickly skim through at my leisure to make sure all my transfers are categorized correctly)

- If you run into a permission issue when running the `./run.sh` script, try running `chmod +x ./run.sh` in the terminal to give it execute permissions.