#!/bin/sh

cat ../playlist.js | grep yt | awk -F \" ' { print $2 } ' | awk -F : ' { print $2 } ' > ytlist.dat

cd archive
for i in `cat ../ytlist.dat`; do
  echo "<< Attempting $i >>"
  [ -e $i.flv ] || ../youtube-dl.py --max-quality 5 $i
done
