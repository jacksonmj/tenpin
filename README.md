<h1>Ten-pin bowling</h1>

<h2>What is this?</h2>
This is "a program to keep score of a ten-pin bowling game for up to 6 people", created for a technical assessment.

It is written in Javascript, and is entirely client-side.

<h2>Assumptions</h2>
- Only one person/device will be keeping the score for each game, results for a game in progress do not need to be simultaneously displayed on other devices.
- The browser will not crash or be accidentally closed. There is currently no saving facility, refreshing the browser window will clear all the data.
- "up to 6 people" is assumed to a lower limit on how many people it must support, so this program does not currently limit the number of people.

<h2>External libraries/programs used</h2>
- jQuery
- QUnit for unit tests
- [Less](http://lesscss.org/) for CSS

No setup is required for a development environment (provided that internet access is available), since jQuery, less.js, and QUnit are loaded from CDNs, and compilation of less is done inside the browser.

In production, compilation of less should instead be done at the time of deployment and style.less+less.js should be replaced with style.css in index.html.

<h2>Structure</h2>
The code is divided into various model classes (in tenpin-model.js), containing all the scoring logic, and view+controller classes (in tenpin-view.js), which handle all the user interaction.

The model classes have reasonably complete unit tests (in tests.js, run using tests.html), but the view classes currently have none.

Tested on various versions of Internet Explorer (down to IE6), and recent versions of Firefox and Chrome.

<h2>Known issues:</h2>
- Looks ugly on IE6.
- For IE6, the external Javascript libraries may need to be served from the same protocol as the tenpin page (HTTP page and HTTPS libraries don't seem to work). The protocol is specified for the libraries to make development easier (so it can be opened from file:/// and the libraries will still work and don't need downloading).
- Respond.js (used for IE8 and older) doesn't seem to work with less.js - either compile less elsewhere, or remove Respond.js temporarily.
- Data is not saved, closing/refreshing/crashing the browser will cause all data to be lost.
