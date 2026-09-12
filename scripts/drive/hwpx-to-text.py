#!/usr/bin/env python3
"""한글(.hwpx) 파일에서 본문 텍스트를 뽑습니다.

자기소개서는 드라이브에 hwpx로 저장되어 있는데, 검사기는 텍스트를 받습니다.
hwpx는 zip 안에 든 OWPML XML이라 표준 라이브러리만으로 읽을 수 있습니다.

    python3 scripts/drive/hwpx-to-text.py 자소서.hwpx > 자소서.txt
    python3 scripts/drive/hwpx-to-text.py 자소서.hwpx | node scripts/claim-lint.mjs --job "제조 AI·데이터"

문항과 답변처럼 문단이 이어지는 글에는 충분하지만, 표가 많은 이력서에서는 칸의 순서가
읽는 순서와 달라질 수 있습니다. 그래서 드라이브에는 hwpx 옆에 txt를 함께 두는 것을
규칙으로 합니다.
"""

from __future__ import annotations

import re
import sys
import zipfile
from xml.etree import ElementTree

# OWPML 문단 네임스페이스. 버전에 따라 조금씩 달라 접미사로 판별합니다.
PARAGRAPH = "}p"
TEXT = "}t"
LINE_BREAK = "}lineBreak"


def _section_files(archive: zipfile.ZipFile) -> list[str]:
    names = [name for name in archive.namelist() if re.fullmatch(r"Contents/section\d+\.xml", name)]
    return sorted(names, key=lambda name: int(re.findall(r"\d+", name)[-1]))


def _paragraph_text(paragraph: ElementTree.Element) -> str:
    pieces: list[str] = []
    for node in paragraph.iter():
        tag = node.tag
        if tag.endswith(TEXT):
            pieces.append(node.text or "")
        elif tag.endswith(LINE_BREAK):
            pieces.append("\n")
    return "".join(pieces)


def hwpx_text(path: str) -> str:
    with zipfile.ZipFile(path) as archive:
        sections = _section_files(archive)
        if not sections:
            raise ValueError(f"{path}: Contents/section*.xml 이 없습니다. hwpx가 맞는지 확인하세요.")

        lines: list[str] = []
        for name in sections:
            root = ElementTree.fromstring(archive.read(name))
            for node in root.iter():
                if not node.tag.endswith(PARAGRAPH):
                    continue
                text = _paragraph_text(node).strip()
                if text:
                    lines.append(text)

    # 빈 문단이 이어지면 한 줄로 줄입니다.
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)) + "\n"


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    try:
        sys.stdout.write(hwpx_text(argv[1]))
    except (OSError, ValueError, zipfile.BadZipFile, ElementTree.ParseError) as error:
        print(f"읽지 못했습니다: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
