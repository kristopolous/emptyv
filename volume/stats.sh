#!/bin/bash
#
# Notes:
# You need ot have a version of ffmpeg
# That can emit wavs (pretty easy) and
# a version of sox that can read in wavs
# 
# You may have to custom compile to get this.

# bpmcount wants an xserver, any xserver, so I run
# vnc on this server for it, when I need to.
export DISPLAY=qaa.ath.cx:1

cd archive

for mp3 in *.mp3; do
  stat=${mp3/.mp3/.stats}

  echo -n "(( $mp3"
  if [ ! -e $stat ]; then
    # volume sampling
    echo -n " volume"
    sox -- "$mp3" -n stats >& $stat

    # bpm detection
    # from http://superuser.com/questions/129041/any-beat-detection-software-for-linux
    echo -n " bpm"
    bpm=$(../../tools/bpmcount -- "$mp3" 3>&1 1>/dev/null 2>&3 | grep '^[0-9]' | cut -f1)

    echo "bpm $bpm" >> $stat
  fi
  echo " done ))"

done
