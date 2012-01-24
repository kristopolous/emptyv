#!/bin/bash
#
# Notes:
# You need ot have a version of ffmpeg
# That can emit wavs (pretty easy) and
# a version of sox that can read in wavs
# 
# You may have to custom compile to get this.
#
cd archive
for i in *.mp3; do
  wav=${i/.mp3/.wav}
  stat=${i/.mp3/.stats}

  echo "<< Doing $i >>"
  if [ ! -e $stat ]; then
    if [ ! -e $wav ]; then
      echo "<< $i -> $wav >>"
      ffmpeg -i $i -f wav -ac 1 -ar 22050 -f wav -- $wav
    fi
    sox -- "$wav" -n stats >& $stat
  fi
  [ -e $wav ] && rm -- $wav
done
