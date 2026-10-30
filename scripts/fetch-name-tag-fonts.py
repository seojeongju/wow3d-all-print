"""구글 폰트(SIL OFL)를 받아 이름표용으로 자른다.

한글은 KS X 1001 완성형 + 자모 + 라틴, 영문은 라틴만 남긴다.
실행: python scripts/fetch-name-tag-fonts.py
"""
from __future__ import annotations

import urllib.request
from pathlib import Path

from fontTools.subset import Subsetter
from fontTools.subset import Options
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "fonts"
BASE = "https://github.com/google/fonts/raw/main/ofl/"

# 이미 저장소에 있는 파일은 다시 받지 않고 같은 기준으로 다시 자른다.
LOCAL = {
    "GowunDodum-Regular.ttf": OUT / "GowunDodum-Regular.ttf",
    "Jua-Regular.ttf": OUT / "Jua-Regular.ttf",
    "DoHyeon-Regular.ttf": OUT / "DoHyeon-Regular.ttf",
    "BlackHanSans-Regular.ttf": OUT / "BlackHanSans-Regular.ttf",
}

DOWNLOADS = {
    "NanumGothic-Bold.ttf": "nanumgothic/NanumGothic-Bold.ttf",
    "GothicA1-Bold.ttf": "gothica1/GothicA1-Bold.ttf",
    "PoorStory-Regular.ttf": "poorstory/PoorStory-Regular.ttf",
    "Sunflower-Bold.ttf": "sunflower/Sunflower-Bold.ttf",
    "Gaegu-Bold.ttf": "gaegu/Gaegu-Bold.ttf",
    "SingleDay-Regular.ttf": "singleday/SingleDay-Regular.ttf",
    # 한글 디스플레이·굵은 글꼴 (이름표 획 검사 후보)
    "GasoekOne-Regular.ttf": "gasoekone/GasoekOne-Regular.ttf",
    "BagelFatOne-Regular.ttf": "bagelfatone/BagelFatOne-Regular.ttf",
    "KirangHaerang-Regular.ttf": "kiranghaerang/KirangHaerang-Regular.ttf",
    "YeonSung-Regular.ttf": "yeonsung/YeonSung-Regular.ttf",
    "CuteFont-Regular.ttf": "cutefont/CuteFont-Regular.ttf",
    "Dongle-Bold.ttf": "dongle/Dongle-Bold.ttf",
    "BlackAndWhitePicture-Regular.ttf": "blackandwhitepicture/BlackAndWhitePicture-Regular.ttf",
    "Gugi-Regular.ttf": "gugi/Gugi-Regular.ttf",
    "Orbit-Regular.ttf": "orbit/Orbit-Regular.ttf",
    "Dokdo-Regular.ttf": "dokdo/Dokdo-Regular.ttf",
    # 영문 디스플레이
    "LilitaOne-Regular.ttf": "lilitaone/LilitaOne-Regular.ttf",
    "Pacifico-Regular.ttf": "pacifico/Pacifico-Regular.ttf",
    "Bangers-Regular.ttf": "bangers/Bangers-Regular.ttf",
    "BebasNeue-Regular.ttf": "bebasneue/BebasNeue-Regular.ttf",
    "Righteous-Regular.ttf": "righteous/Righteous-Regular.ttf",
    "Boogaloo-Regular.ttf": "boogaloo/Boogaloo-Regular.ttf",
    "Anton-Regular.ttf": "anton/Anton-Regular.ttf",
    "PassionOne-Bold.ttf": "passionone/PassionOne-Bold.ttf",
    "RussoOne-Regular.ttf": "russoone/RussoOne-Regular.ttf",
}

LATIN_ONLY = {
    "LilitaOne-Regular.ttf",
    "Pacifico-Regular.ttf",
    "Bangers-Regular.ttf",
    "BebasNeue-Regular.ttf",
    "Righteous-Regular.ttf",
    "Boogaloo-Regular.ttf",
    "Anton-Regular.ttf",
    "PassionOne-Bold.ttf",
    "RussoOne-Regular.ttf",
}


def ksx1001_hangul() -> str:
    chars: list[str] = []
    for row in range(0xB0, 0xC9):
        for col in range(0xA1, 0xFF):
            try:
                chars.append(bytes([row, col]).decode("cp949"))
            except UnicodeDecodeError:
                pass
    return "".join(chars)


def charset(latin_only: bool) -> str:
    latin = "".join(chr(c) for c in range(0x20, 0x7F))
    latin += "".join(chr(c) for c in range(0xA0, 0x100))
    if latin_only:
        return latin
    jamo = "".join(chr(c) for c in range(0x3131, 0x318F))
    return latin + jamo + ksx1001_hangul()


def download(name: str, rel: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = BASE + rel
    print(f"받는 중 {name}")
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
    notices: list[str] = []
    hangul = charset(False)
    latin = charset(True)
    print(f"한글 세트 {len(hangul)}자, 영문 세트 {len(latin)}자")

    jobs: list[tuple[str, Path]] = []
    for name, path in LOCAL.items():
        jobs.append((name, path))
    for name, rel in DOWNLOADS.items():
        src = cache / name
        if not src.exists() or src.stat().st_size < 1000:
            download(name, rel, src)
        jobs.append((name, src))

    for name, src in jobs:
        dest = OUT / name
        subset(src, dest, latin if name in LATIN_ONLY else hangul)
        size = dest.stat().st_size / 1024
        notice = copyright_line(dest)
        notices.append(notice or name)
        safe = notice.encode("ascii", "replace").decode("ascii")
        print(f"  {name}: {size:.0f}KB  {safe}")

    header = "\n".join(dict.fromkeys(notices))
    license_body = (OUT / "OFL.txt").read_text(encoding="utf-8")
    marker = "-----------------------------------------------------------"
    idx = license_body.find(marker)
    if idx < 0:
        raise SystemExit("OFL.txt 본문을 찾지 못했습니다")
    body = license_body[idx:]
    (OUT / "OFL.txt").write_text(
        header + "\n\nThis Font Software is licensed under the SIL Open Font License, Version 1.1.\n"
        "This license is copied below, and is also available with a FAQ at:\n"
        "http://scripts.sil.org/OFL\n\n\n" + body,
        encoding="utf-8",
    )
    print("OFL.txt 저작권 고지 갱신")


if __name__ == "__main__":
    main()
