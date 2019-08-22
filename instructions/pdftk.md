You don't have `pdftk` available on your system.

`pdftk` is needed to split a PDF into smaller chunks.

It is no longer part of the official Ubuntu repositories as of Ubuntu 18.04. You should be able to install it using the following code:
```
sudo add-apt-repository ppa:malteworld/ppa
sudo apt update
sudo apt install pdftk
```
