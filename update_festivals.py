#!/usr/bin/env python3
"""Keep festivals.json showing only festivals that are on today or upcoming.

For every festival entry, the script looks at all dates written as YYYY-MM-DD
(start date, end date, deadline, and so on) and takes the latest one as the
day the festival ends.

- Latest date is today or later  -> kept (on today, or upcoming).
- Latest date is before today    -> removed (completed).
- Entries with no dates at all   -> kept untouched.

Optional: python update_festivals.py --roll
  Instead of removing a completed festival, move all its dates forward by
  whole years (an estimate of its next edition) so the list never empties.

Safety: if removing completed festivals would leave the file empty, nothing
is changed and a warning is printed, so the website never shows a blank page.

Run it by hand:  python update_festivals.py
Or let .github/workflows/update-festivals.yml run it every day.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

DATE_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")


def add_years(d: date, years: int) -> date:
    try:
        return d.replace(year=d.year + years)
    except ValueError:  # 29 Feb moved to a non-leap year
        return d.replace(year=d.year + years, day=28)


def collect_dates(node, found):
    if isinstance(node, dict):
        for v in node.values():
            collect_dates(v, found)
    elif isinstance(node, list):
        for v in node:
            collect_dates(v, found)
    elif isinstance(node, str):
        m = DATE_RE.match(node)
        if m:
            try:
                found.append(date(int(m[1]), int(m[2]), int(m[3])))
            except ValueError:
                pass


def shift_dates(node, years):
    if isinstance(node, dict):
        return {k: shift_dates(v, years) for k, v in node.items()}
    if isinstance(node, list):
        return [shift_dates(v, years) for v in node]
    if isinstance(node, str):
        m = DATE_RE.match(node)
        if m:
            try:
                return add_years(date(int(m[1]), int(m[2]), int(m[3])), years).isoformat()
            except ValueError:
                return node
    return node


def ended(entry, today):
    """Return the latest date in the entry if it is before today, else None."""
    dates = []
    collect_dates(entry, dates)
    if dates and max(dates) < today:
        return max(dates)
    return None


def entry_lists(data):
    if isinstance(data, list):
        yield data
    elif isinstance(data, dict):
        for v in data.values():
            if isinstance(v, list) and v and all(isinstance(x, dict) for x in v):
                yield v


def clean(data, today, roll):
    """Edit data in place. Returns (changed, would_be_empty)."""
    changed = 0
    for entries in entry_lists(data):
        kept = []
        for entry in entries:
            latest = ended(entry, today) if isinstance(entry, dict) else None
            if latest is None:
                kept.append(entry)
                continue
            changed += 1
            if roll:
                years = 1
                while add_years(latest, years) < today:
                    years += 1
                kept.append(shift_dates(entry, years))
        if not kept and entries:
            return changed, True
        entries[:] = kept
    return changed, False


def find_file(args):
    if args:
        return Path(args[0])
    skip = {".git", "node_modules"}
    for p in sorted(Path(".").rglob("festivals.json")):
        if not skip.intersection(p.parts):
            return p
    sys.exit("festivals.json not found. Pass its path: python update_festivals.py path/to/festivals.json")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    roll = "--roll" in sys.argv
    path = find_file(args)
    data = json.loads(path.read_text(encoding="utf-8"))
    changed, empty = clean(data, date.today(), roll)
    if empty:
        print(f"{path}: every festival has finished. Left unchanged so the site is not blank. Add new festivals.")
        return
    if changed == 0:
        print(f"{path}: nothing to update.")
        return
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    action = "rolled forward" if roll else "removed"
    print(f"{path}: {action} {changed} completed festival(s).")


if __name__ == "__main__":
    main()
