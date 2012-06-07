#!/bin/bash
cd /lvm/mt80s/db/
cp dump.rdb dump.backup.rdb
lzma -c dump.backup.rdb > dump.backup.rdb.lz
scp dump.backup.rdb.lz mt80s@qaa.ath.cx:/raid/mt80s/db/redis-`date +"%Y%m%d-%H%M"`.rdb.lz
