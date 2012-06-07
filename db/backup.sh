#!/bin/bash
cp dump.rdb dump.backup.rdb
lzma -c dump.backup.rdb > dump.backup.rdb.lz
