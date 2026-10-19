#!/bin/sh
# Run collection rounds until two consecutive rounds add < 2 % new businesses.
cd "$(dirname "$0")"
while pgrep -f "^python3 (s03_dasoertliche|s04_gelbeseiten|s04b_gs_districts|s06_websites)\.py" >/dev/null; do sleep 30; done
r=1; low=0
while [ $r -le 6 ]; do
  python3 run_round.py $r > data/round$r.log 2>&1
  pct=$(grep -o 'ROUND [0-9]*: .*(+[0-9]*, [0-9.]* %)' data/round$r.log | sed 's/.*, \([0-9.]*\) %)/\1/')
  echo "round $r: $pct %"
  if [ -n "$pct" ] && [ $r -gt 1 ] && awk "BEGIN{exit !($pct < 2)}"; then low=$((low+1)); else low=0; fi
  [ $low -ge 2 ] && break
  r=$((r+1))
done
python3 s07_enrich.py && python3 s08_export.py
echo DONE
