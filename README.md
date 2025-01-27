# π Pietro

Set of utilities to deal with PDF files: splitting into individual pages,
extracting text and images.

This modules relies on CLI binaries (qpdf, imagemagick, poppler-utils, etc), so
it provide good interoperability, it runs every command from inside a Docker
container.

It will be slower than other implementation, but it is portable.

_This package has been created out of the need to centralize common pattern of
PDF handling I needed for various projects. The way it names files and folders
makes sense to me, they might not suit you._

```js
import { extractPages, extractImages, extractText } from 'pietro';


// Extract each page of the pdf into its own file
await extractPages('./bigFile.pdf', './pages');
// ./pages/
// ./pages/001.pdf
// ./pages/...
// ./pages/401.pdf

// Extract the text of a given pdf into a txt file
await extractText('./pages/001.pdf', './text/001.txt');
// ./text/
// ./text/001.txt

// Extract all images from a given pdf file.
// ./raw contains ALL images, including presentational ones and masks
// ./illustrations only contains "real" illustration images
await extractImages('./pages/001.pdf', ./images');
// ./images/
// ./images/001/
// ./images/001/raw/
// ./images/001/raw/001.png
// ./images/001/raw/...
// ./images/001/raw/227.png
// ./images/001/illustrations/
// ./images/001/illustrations/1.png
// ./images/001/illustrations/...
// ./images/001/illustrations/5.png
```
