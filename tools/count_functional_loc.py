#!/usr/bin/env python3
"""Audit functional source lines in the Zombobs codebase.

Counts non-empty, non-comment lines for source files that are maintained by hand.
Generated mirrors, assets, docs, IDE metadata, dependencies, and vendored bundles
are excluded by default so the result reflects functional codebase size.
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


CODE_EXTENSIONS = {
    ".bat",
    ".css",
    ".gradle",
    ".html",
    ".java",
    ".js",
    ".json",
    ".kt",
    ".ps1",
    ".py",
    ".toml",
    ".xml",
}

DEFAULT_EXCLUDED_DIRS = {
    ".git",
    ".idea",
    ".kiro",
    ".vscode",
    "assets",
    "build",
    "debugs",
    "dist",
    "DOCS",
    "gradle",
    "node_modules",
    "sample_assets",
    "www",
    "Zombobs",
}

DEFAULT_EXCLUDED_FILES = {
    "package-lock.json",
    "socket.io.min.js",
}

LINE_COMMENT_PREFIXES = {
    ".bat": ("rem ", "::"),
    ".gradle": ("//",),
    ".java": ("//",),
    ".js": ("//",),
    ".kt": ("//",),
    ".ps1": ("#",),
    ".py": ("#",),
    ".toml": ("#",),
}

BLOCK_COMMENT_EXTENSIONS = {
    ".css",
    ".gradle",
    ".html",
    ".java",
    ".js",
    ".kt",
}


@dataclass(frozen=True)
class FileCount:
    path: Path
    extension: str
    lines: int


def normalize_parts(path: Path) -> set[str]:
    return {part.lower() for part in path.parts}


def should_skip_file(
    path: Path,
    root: Path,
    excluded_dirs: set[str],
    excluded_files: set[str],
) -> bool:
    relative_path = path.relative_to(root)
    lower_parts = normalize_parts(relative_path)

    if lower_parts & {directory.lower() for directory in excluded_dirs}:
        return True

    if path.name.lower() in {file_name.lower() for file_name in excluded_files}:
        return True

    if ".min." in path.name.lower():
        return True

    return path.suffix.lower() not in CODE_EXTENSIONS


def strip_block_comments(line: str, in_block_comment: bool) -> tuple[str, bool]:
    """Remove /* ... */ and <!-- ... --> comments while preserving code around them."""
    output: list[str] = []
    index = 0

    while index < len(line):
        if in_block_comment:
            css_end = line.find("*/", index)
            html_end = line.find("-->", index)
            ends = [pos for pos in (css_end, html_end) if pos != -1]

            if not ends:
                return "".join(output), True

            end = min(ends)
            index = end + (3 if line.startswith("-->", end) else 2)
            in_block_comment = False
            continue

        css_start = line.find("/*", index)
        html_start = line.find("<!--", index)
        starts = [pos for pos in (css_start, html_start) if pos != -1]

        if not starts:
            output.append(line[index:])
            break

        start = min(starts)
        output.append(line[index:start])
        in_block_comment = True
        index = start + (4 if line.startswith("<!--", start) else 2)

    return "".join(output), in_block_comment


def strip_inline_comment(line: str, extension: str) -> str:
    stripped = line.lstrip().lower()

    for prefix in LINE_COMMENT_PREFIXES.get(extension, ()):
        if stripped.startswith(prefix):
            return ""

    return line


def count_code_lines(path: Path) -> int:
    extension = path.suffix.lower()
    in_block_comment = False
    count = 0

    try:
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    except OSError as exc:
        raise RuntimeError(f"Failed to read {path}: {exc}") from exc

    for line in lines:
        processed = line

        if extension in BLOCK_COMMENT_EXTENSIONS:
            processed, in_block_comment = strip_block_comments(processed, in_block_comment)

        processed = strip_inline_comment(processed, extension).strip()

        if processed:
            count += 1

    return count


def iter_code_files(
    root: Path,
    excluded_dirs: set[str],
    excluded_files: set[str],
) -> Iterable[Path]:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if should_skip_file(path, root, excluded_dirs, excluded_files):
            continue
        yield path


def build_counts(
    root: Path,
    excluded_dirs: set[str],
    excluded_files: set[str],
) -> list[FileCount]:
    counts: list[FileCount] = []

    for path in iter_code_files(root, excluded_dirs, excluded_files):
        line_count = count_code_lines(path)
        if line_count > 0:
            counts.append(
                FileCount(
                    path=path.relative_to(root),
                    extension=path.suffix.lower() or "<none>",
                    lines=line_count,
                )
            )

    return sorted(counts, key=lambda item: (-item.lines, item.path.as_posix()))


def print_text_report(counts: list[FileCount], top: int) -> None:
    total_lines = sum(item.lines for item in counts)
    totals_by_extension: dict[str, tuple[int, int]] = {}

    for item in counts:
        current_lines, current_files = totals_by_extension.get(item.extension, (0, 0))
        totals_by_extension[item.extension] = (
            current_lines + item.lines,
            current_files + 1,
        )

    print("Functional LOC Audit")
    print("====================")
    print(f"Files counted: {len(counts)}")
    print(f"Functional LOC: {total_lines}")
    print()
    print("By file type:")

    for extension, (lines, files) in sorted(
        totals_by_extension.items(),
        key=lambda item: (-item[1][0], item[0]),
    ):
        print(f"  {extension:>8}  {lines:>7} LOC  {files:>4} files")

    print()
    print(f"Top {top} files:")

    for item in counts[:top]:
        print(f"  {item.lines:>7}  {item.path.as_posix()}")


def write_csv(counts: list[FileCount], output_path: Path) -> None:
    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["path", "extension", "lines"])
        for item in counts:
            writer.writerow([item.path.as_posix(), item.extension, item.lines])


def write_json(counts: list[FileCount], output_path: Path) -> None:
    payload = {
        "files": [
            {
                "path": item.path.as_posix(),
                "extension": item.extension,
                "lines": item.lines,
            }
            for item in counts
        ],
        "file_count": len(counts),
        "line_count": sum(item.lines for item in counts),
    }

    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Count functional lines of code in this repository."
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Repository root to scan. Defaults to this script's parent repo.",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=15,
        help="Number of largest files to print.",
    )
    parser.add_argument(
        "--include-dir",
        action="append",
        default=[],
        help="Directory name to include even if excluded by default.",
    )
    parser.add_argument(
        "--exclude-dir",
        action="append",
        default=[],
        help="Additional directory name to exclude.",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        help="Optional CSV output path.",
    )
    parser.add_argument(
        "--json",
        type=Path,
        help="Optional JSON output path.",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = args.root.resolve()

    if not root.exists() or not root.is_dir():
        print(f"ERROR: root path is not a directory: {root}")
        return 1

    excluded_dirs = set(DEFAULT_EXCLUDED_DIRS)
    excluded_dirs.update(args.exclude_dir)
    excluded_dirs.difference_update(args.include_dir)

    counts = build_counts(root, excluded_dirs, set(DEFAULT_EXCLUDED_FILES))
    print_text_report(counts, max(args.top, 0))

    if args.csv:
        write_csv(counts, args.csv)
        print(f"\nCSV written: {args.csv}")

    if args.json:
        write_json(counts, args.json)
        print(f"JSON written: {args.json}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
