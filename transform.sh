cat timeline | awk ' { if (NR % 3 == 1 ) { printf "[\"%s\", ", $0 } if (NR % 3 == 2) { printf "%d, 0, 0],\n", $0} } ' 
