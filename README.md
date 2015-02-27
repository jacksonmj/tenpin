<h1>Ten-pin bowling</h1>

<h2>What is this?</h2>
This is "a program to keep score of a ten-pin bowling game for up to 6 people", created for a technical assessment.

It is written in Javascript, and is entirely client-side.

<h2>Assumptions</h2>
- Only one person/device will be keeping the score for each game, results for a game in progress do not need to be simultaneously displayed on other devices.

<h2>External libraries/programs used</h2>
- jQuery
- QUnit for unit tests
- [Less](http://lesscss.org/) for CSS

No setup is required for a development environment (provided that internet access is available), since jQuery, less.js, and QUnit are loaded from CDNs, and compilation of less is done inside the browser.

In production, compilation of less should instead be done at the time of deployment and style.less+less.js should be replaced with style.css in index.html.
