"""네이버 무료(나눔) 폰트를 받아 이름표용으로 자른다.

SIL OFL / 네이버 무료 폰트 라이선스. 굵은 웨이트만 받는다.
실행: python scripts/fetch-name-tag-fonts.py
"""
from __future__ import annotations

import urllib.request
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "fonts"
GOOGLE = "https://github.com/google/fonts/raw/main/ofl/"

# (저장 파일명, 절대 URL 또는 google 상대경로)
DOWNLOADS: list[tuple[str, str]] = [
    # 나눔고딕 · 명조 (google/fonts, 네이버 제작 · SIL OFL)
    ("NanumGothic-Bold.ttf", GOOGLE + "nanumgothic/NanumGothic-Bold.ttf"),
    ("NanumGothic-ExtraBold.ttf", GOOGLE + "nanumgothic/NanumGothic-ExtraBold.ttf"),
    # 나눔바른고딕 · 스퀘어 · 스퀘어라운드 (명조는 획이 가늘어 프리셋에서 제외)
    (
        "NanumBarunGothicBold.ttf",
        "https://cdn.jsdelivr.net/npm/@kfonts/nanum-barun-gothic@0.1.0/NanumBarunGothicBold.ttf",
    ),
    (
        "NanumSquareB.ttf",
        "https://fastly.jsdelivr.net/gh/moonspam/NanumSquare@1.0/NanumSquareB.ttf",
    ),
    (
        "NanumSquareEB.ttf",
        "https://fastly.jsdelivr.net/gh/moonspam/NanumSquare@1.0/NanumSquareEB.ttf",
    ),
    (
        "NanumSquareRoundB.ttf",
        "https://cdn.jsdelivr.net/npm/@kfonts/nanum-square-round@0.1.0/NanumSquareRoundB.ttf",
    ),
    (
        "NanumSquareRoundEB.ttf",
        "https://cdn.jsdelivr.net/npm/@kfonts/nanum-square-round@0.1.0/NanumSquareRoundEB.ttf",
    ),
]

# 이름표 프리셋에 쓰지 않는 옛 구글 폰트 — 받아 둔 뒤 삭제
REMOVE_LEGACY = [
    "NanumMyeongjo-Bold.ttf",
    "NanumMyeongjo-ExtraBold.ttf",
    "GothicA1-Bold.ttf",
    "PoorStory-Regular.ttf",
    "Sunflower-Bold.ttf",
    "Gaegu-Bold.ttf",
    "SingleDay-Regular.ttf",
    "GasoekOne-Regular.ttf",
    "BagelFatOne-Regular.ttf",
    "KirangHaerang-Regular.ttf",
    "YeonSung-Regular.ttf",
    "CuteFont-Regular.ttf",
    "Dongle-Bold.ttf",
    "BlackAndWhitePicture-Regular.ttf",
    "Gugi-Regular.ttf",
    "Orbit-Regular.ttf",
    "Dokdo-Regular.ttf",
    "Jua-Regular.ttf",
    "DoHyeon-Regular.ttf",
    "BlackHanSans-Regular.ttf",
    "GowunDodum-Regular.ttf",
    "LilitaOne-Regular.ttf",
    "Pacifico-Regular.ttf",
    "Bangers-Regular.ttf",
    "BebasNeue-Regular.ttf",
    "Righteous-Regular.ttf",
    "Boogaloo-Regular.ttf",
    "Anton-Regular.ttf",
    "PassionOne-Bold.ttf",
    "RussoOne-Regular.ttf",
]


def ksx1001_hangul() -> str:
    chars: list[str] = []
    for row in range(0xB0, 0xC9):
        for col in range(0xA1, 0xFF):
            try:
                chars.append(bytes([row, col]).decode("cp949"))
            except UnicodeDecodeError:
                pass
    return "".join(chars)


def charset() -> str:
    latin = "".join(chr(c) for c in range(0x20, 0x7F))
    latin += "".join(chr(c) for c in range(0xA0, 0x100))
    jamo = "".join(chr(c) for c in range(0x3131, 0x318F))
    return latin + jamo + ksx1001_hangul()


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"받는 중 {dest.name}")
    urllib.request.urlretrieve(url, dest)


def subset(src: Path, dest: Path, text: str) -> None:
    font = TTFont(src)
    options = Options()
    options.layout_features = ["*"]
    options.glyph_names = True
    options.symbol_cmap = True
    options.legacy_cmap = True
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.name_IDs = ["*"]
    options.drop_tables = ["DSIG"]
    options.hinting = False
    subsetter = Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.save(dest)
    font.close()


def copyright_line(path: Path) -> str:
    font = TTFont(path)
    name = font["name"]
    text = ""
    for record in name.names:
        if record.nameID == 0:
            text = record.toUnicode().split("\n")[0].strip()
            break
    font.close()
    return text


def main() -> None:
    cache = ROOT / "tmp-font-src"
    cache.mkdir(exist_ok=True)
    hangul = charset()
    print(f"문자 세트 {len(hangul)}자")
    notices: list[str] = []

    for name, url in DOWNLOADS:
        src = cache / name
        if not src.exists() or src.stat().st_size < 1000:
            download(url, src)
        dest = OUT / name
        subset(src, dest, hangul)
        size = dest.stat().st_size / 1024
        notice = copyright_line(dest)
        notices.append(notice or name)
        safe = notice.encode("ascii", "replace").decode("ascii")
        print(f"  {name}: {size:.0f}KB  {safe}")

    for name in REMOVE_LEGACY:
        path = OUT / name
        if path.exists():
            path.unlink()
            print(f"삭제 {name}")

    header = "\n".join(dict.fromkeys(notices))
    ofl = OUT / "OFL.txt"
    license_body = ofl.read_text(encoding="utf-8") if ofl.exists() else ""
    marker = "-----------------------------------------------------------"
    idx = license_body.find(marker)
    body = license_body[idx:] if idx >= 0 else license_body
    ofl.write_text(
        header
        + "\n\nNaver Nanum fonts and subset copies used for WOW3D Name Tag Studio.\n"
        "This Font Software is licensed under the SIL Open Font License, Version 1.1,\n"
        "or the applicable Naver free font license terms.\n"
        "http://scripts.sil.org/OFL\n\n\n"
        + body,
        encoding="utf-8",
    )
    print("OFL.txt 저작권 고지 갱신")


if __name__ == "__main__":
    main()
