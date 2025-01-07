#!/bin/bash 

apt install -y lsof lshw  curl 
HW=$(lshw -short)
#. RAM
 echo "$HW" | grep 'System Memory' | awk '{print $3}' | sed -s 's/iB/B/g' # 32GB

# processor 
 echo "$HW" | grep 'processor' | awk '{$1=$2=""; print $0}' | head -n1 | awk '{$1=$1; print}'
# cores 
 echo "$HW" | grep 'processor' | awk '{$1=$2=""; print $0}' | wc -l 
