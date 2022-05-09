# Seasons in Pentameter

This website is a collaboration between Laurel Schwulst, Tiger Dingsun, and Marie Otsuka.

## About
You can read more about our inspiration and process on [Laurel’s website](writings.laurel.world/seasons-in-motion/)

## Languages
Descriptions of each season from the [Japanese Wikipedia entry](https://ja.wikipedia.org/wiki/%E4%B8%83%E5%8D%81%E4%BA%8C%E5%80%99) were converted to English via Google Translate, and then further edited. Additional language versions are based on Google-translated results of the edited English phrases. We would appreciate any comments on [this spreadsheet](https://docs.google.com/spreadsheets/d/1d4N9fETwsFQEJjlt6dW0xDTpplRdwrYduZziOfRbN1w/edit#gid=0) if you have any suggestions for better translations.

## How it was built
The site is built as a static website, with json data loaded on the client side.

### Files
- The `audio` folder contains all of loops
- The `data` folder contains:
	- `seasons.json` has all data for the 72 seasons, including translations
	- `languages.json` is a list of available languages, organized by 2-letter language codes (ISO 639-1)

### Dependencies
The site relies on the following libraries:
- [Day.js](https://day.js.org/) for date management
- [Howler.js](https://howlerjs.com/) for audio managemenet

## Sharing
The dynamic social share image is provided by a proxy server at
https://penta-proxy.herokuapp.com/image

This will display the “season of the server”, and may be differrent from your current date depending on where you live. To reflect the original seasoons, the server’s timezone is set to Japan.
