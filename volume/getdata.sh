#!/bin/sh
#
# Notes:
#
# You need to have ffprobe here
# which is avilable in modern versions
# of ffmpeg through a make install.
#
cat ../js/playlist.js | grep yt | awk -F \" ' { print $2 } ' | awk -F : ' { print $2 } ' > ytlist.dat
echo "hMVW8E5O3uA" >> ytlist.dat

cd archive
for i in `cat ../ytlist.dat`; do
  echo "<< Attempting $i >>"
  [ -e $i.aac ] || ../../tools/youtube-dl.py -c --extract-audio -f 18 -- $i
done
