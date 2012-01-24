#!/bin/sh
#
# Notes:
#
# You need to have ffprobe here
# which is avilable in modern versions
# of ffmpeg through a make install.
#
cat ../playlist.js | grep yt | awk -F \" ' { print $2 } ' | awk -F : ' { print $2 } ' > ytlist.dat

cd archive
for i in `cat ../ytlist.dat`; do
  echo "<< Attempting $i >>"
  [ -e $i.mp3 ] || ../youtube-dl.py -c --extract-audio -f 5 -- $i
done
