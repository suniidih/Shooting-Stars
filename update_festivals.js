#!/usr/bin/env node
/*
 * Keep festivals.json showing only festivals that are on today or upcoming.
 *
 * For every festival entry, the script looks at all dates written as YYYY-MM-DD
 * (start date, end date, deadline, and so on) and takes the latest one as the
 * day the festival ends.
 *
 * - No end date? The site counts the festival as running 10 days from start.
 * - Latest date is today or later  -> kept (on today, or upcoming).
 * - Latest date is before today    -> removed (completed).
 * - Entries with no dates at all   -> kept untouched.
 *
 * Optional: node update_festivals.js --roll
 *   Instead of removing a completed festival, move all its dates forward by
 *   whole years (an estimate of its next edition) so the list never empties.
 *
 * Safety: if removing completed festivals would leave the file empty, nothing
 * is changed and a warning is printed, so the website never shows a blank page.
 *
 * Run it by hand:  node update_festivals.js
 * Or let .github/workflows/update-festivals.yml run it every day.
 *
 * No packages or API keys are needed.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const isObject = v => v !== null && typeof v === "object" && !Array.isArray(v);

// Dates are handled as UTC midnight, so time zones and daylight saving cannot shift them.
// Returns null if the day does not exist (for example 2027-02-30).
function makeDate(year, month, day) {
    const d = new Date(0);
    d.setUTCFullYear(year, month - 1, day); // unlike Date.UTC, keeps years below 100 as written
    const valid = year >= 1 && year <= 9999 &&
        d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
    return valid ? d : null;
}

function parseDate(text) {
    const m = DATE_RE.exec(text);
    return m ? makeDate(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}

const isoDate = d => d.toISOString().slice(0, 10);

function addDays(d, days) {
    const result = new Date(d);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

function addYears(d, years) {
    const year = d.getUTCFullYear() + years, month = d.getUTCMonth() + 1;
    // The fallback handles 29 Feb moved to a non-leap year
    return makeDate(year, month, d.getUTCDate()) || makeDate(year, month, 28);
}

// Today's date on the machine running the script
function localToday() {
    const now = new Date();
    return makeDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function collectDates(node, found = []) {
    if (typeof node === "string") {
        const d = parseDate(node);
        if (d) found.push(d);
    } else if (node !== null && typeof node === "object") {
        Object.values(node).forEach(v => collectDates(v, found));
    }
    return found;
}

function shiftDates(node, years) {
    if (Array.isArray(node)) return node.map(v => shiftDates(v, years));
    if (isObject(node)) {
        return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, shiftDates(v, years)]));
    }
    if (typeof node === "string") {
        const d = parseDate(node);
        const shifted = d && addYears(d, years);
        if (shifted) return isoDate(shifted);
    }
    return node;
}

// Returns the latest date in the entry if it is before today, else null.
function ended(entry, today) {
    const dates = collectDates(entry);
    // Same rule as the website: a festival with a start but no end date
    // is treated as running for 10 days from its start.
    if (Object.hasOwn(entry, "start") && !Object.hasOwn(entry, "end")) {
        dates.push(...collectDates(entry.start).map(d => addDays(d, 10)));
    }
    if (!dates.length) return null;
    const latest = dates.reduce((a, b) => (b > a ? b : a));
    return latest < today ? latest : null;
}

function entryLists(data) {
    if (Array.isArray(data)) return [data];
    if (!isObject(data)) return [];
    return Object.values(data).filter(v => Array.isArray(v) && v.length && v.every(isObject));
}

// Edits data in place.
function clean(data, today, roll) {
    let changed = 0;
    for (const entries of entryLists(data)) {
        const kept = [];
        for (const entry of entries) {
            const latest = isObject(entry) ? ended(entry, today) : null;
            if (latest === null) {
                kept.push(entry);
                continue;
            }
            changed++;
            if (roll) {
                let years = 1;
                while (addYears(latest, years) < today) years++;
                kept.push(shiftDates(entry, years));
            }
        }
        if (!kept.length && entries.length) return { changed, empty: true };
        entries.length = 0;
        for (const entry of kept) entries.push(entry);
    }
    if (changed && isObject(data) && Object.hasOwn(data, "updated")) {
        data.updated = isoDate(today);
    }
    return { changed, empty: false };
}

// All files called festivals.json under dir, skipping .git and node_modules
function searchFiles(dir, found = []) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        if (item.name === ".git" || item.name === "node_modules") continue;
        const full = path.join(dir, item.name);
        if (item.isDirectory()) searchFiles(full, found);
        else if (item.name === "festivals.json") found.push(full);
    }
    return found;
}

// Compare folder by folder, so the same file is picked as in a sorted path list
function comparePaths(a, b) {
    const x = a.split(path.sep), y = b.split(path.sep);
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
        if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
    }
    return x.length - y.length;
}

function findFile(args) {
    if (args.length) return path.normalize(args[0]);
    const [first] = searchFiles(".").sort(comparePaths);
    if (first) return first;
    console.error("festivals.json not found. Pass its path: node update_festivals.js path/to/festivals.json");
    process.exit(1);
}

function main() {
    const argv = process.argv.slice(2);
    const args = argv.filter(a => !a.startsWith("--"));
    const roll = argv.includes("--roll");
    const file = findFile(args);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const { changed, empty } = clean(data, localToday(), roll);
    if (empty) {
        console.log(`${file}: every festival has finished. Left unchanged so the site is not blank. Add new festivals.`);
        return;
    }
    if (changed === 0) {
        console.log(`${file}: nothing to update.`);
        return;
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
    const action = roll ? "rolled forward" : "removed";
    console.log(`${file}: ${action} ${changed} completed festival(s).`);
}

main();
