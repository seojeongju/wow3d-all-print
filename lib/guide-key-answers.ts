/**
 * 가이드 "핵심 답변" (AEO — 결론 먼저).
 * 페이지 상단에 질문에 대한 답을 2~3문장으로 먼저 보여 줘 검색 스니펫·AI 답변이 그대로 인용하기 쉽게 한다.
 * 수치는 각 가이드 본문·FAQ(lib/seo-guide-pages*.ts)에 이미 있는 값만 사용한다 — 본문 수치를 바꾸면 여기도 함께 수정.
 */
export type GuideKeyAnswer = { ko: string; en: string }

export const GUIDE_KEY_ANSWERS: Record<string, GuideKeyAnswer> = {
    'how-to-reduce-3d-printing-cost': {
        ko: '3D프린팅 가격을 가장 빨리 낮추는 방법은 인필을 낮추고 레이어 높이를 올리는 것입니다. 외형 확인용이면 인필 15~20%, FDM 레이어 0.2mm 전후로도 충분한 경우가 많고, 서포트가 덜 생기는 방향으로 놓고 PLA·Standard 레진처럼 목적에 맞는 소재를 고르면 비용이 더 줄어듭니다.',
        en: 'The fastest way to lower a 3D printing price is to reduce infill and raise the layer height. For visual prototypes, 15–20% infill and an FDM layer height around 0.2 mm are often enough; orienting the part to need less support and choosing a fit-for-purpose material such as PLA or Standard resin cuts cost further.',
    },
    'choosing-infill-density': {
        ko: '인필은 외형 목업 10~20%, 일반 시제품 20~40%, 기능·하중 부품 40~80%를 출발점으로 잡으세요. 인필이 높을수록 강도는 올라가지만 재료비와 출력 시간이 함께 늘어나며, 100%가 항상 좋은 것은 아닙니다.',
        en: 'Start with 10–20% infill for visual mock-ups, 20–40% for general prototypes and 40–80% for functional or load-bearing parts. Higher infill adds strength but also material cost and print time, and 100% is rarely necessary.',
    },
    'fixing-stl-file-errors': {
        ko: 'STL 오류(열린 구멍, 뒤집힌 면, 겹친 면, 단위 불일치)는 출력 전에 점검해 닫힌 솔리드로 만들어야 합니다. 와우쓰리디 무료 STL 점검기나 자동견적에 올리면 구멍 메우기·틈 이어붙이기·면 방향 통일을 자동으로 처리하고, 자동으로 고칠 수 없는 오류는 담당자가 검토합니다.',
        en: 'STL errors — open holes, flipped normals, overlapping faces and unit mismatches — should be fixed before printing so the model is a closed (watertight) solid. Upload to WOW3D’s free STL checker or instant quote and holes, gaps and face orientation are repaired automatically; errors that can’t be fixed automatically are reviewed by our team.',
    },
    'minimum-wall-thickness': {
        ko: '3D프린팅 최소 벽 두께는 FDM 1.0~1.5mm 이상, SLA·DLP 소형 부품 0.6~1.0mm 전후가 출발점입니다. 와우쓰리디 자동견적은 FDM 1mm·SLA/DLP 0.6mm보다 얇은 부분이 많으면 경고하고 위치를 표시하며, 하중·조립이 있는 부품은 더 두껍게 설계하는 것이 안전합니다.',
        en: 'A safe starting point for minimum wall thickness is 1.0–1.5 mm or more for FDM and about 0.6–1.0 mm for small SLA/DLP parts. WOW3D’s instant quote warns and highlights areas thinner than 1 mm (FDM) or 0.6 mm (SLA/DLP); parts under load or assembly should be designed thicker.',
    },
    'why-support-costs': {
        ko: '서포트는 공중에 떠 있는 오버행·브리지를 받치는 임시 구조로, 서포트 재료·추가 출력 시간·제거와 후처리 작업이 견적에 반영됩니다. 45도 이상 오버행에는 서포트가 필요한 경우가 많으며, 모델 방향을 바꾸거나 분할 출력·필렛 설계로 서포트를 줄이면 비용을 낮출 수 있습니다.',
        en: 'Supports are temporary structures that hold up overhangs and bridges, so their material, extra print time and removal/finishing work are included in the quote. Overhangs beyond 45 degrees usually need support; reorienting the model, splitting it or adding fillets reduces support and cost.',
    },
    '3d-printing-tolerances': {
        ko: '3D프린팅 조립 부품은 CAD 치수 그대로가 아니라 여유를 두고 설계해야 합니다. FDM은 면당 0.2~0.4mm, SLA는 0.1~0.25mm 정도에서 시작해 테스트하는 경우가 많고, 핵심 결합부는 작은 시편으로 먼저 출력해 공차를 확정하는 것이 안전합니다.',
        en: 'Parts that fit together need clearance rather than exact CAD dimensions. A common starting point is 0.2–0.4 mm per face for FDM and 0.1–0.25 mm for SLA, and it is safest to print a small test coupon of critical joints before the final part.',
    },
    'splitting-large-3d-prints': {
        ko: '장비 최대 출력 크기를 넘는 모델은 여러 부품으로 나눠 출력한 뒤 조립합니다. 눈에 덜 띄는 면으로 자르고 핀·슬롯 같은 정렬 구조를 넣으면 조립 정밀도가 올라가며, 견적은 부품별 재료·출력 시간을 합산해 정해집니다.',
        en: 'Models larger than the printer’s build volume are printed in several parts and assembled. Cut along less visible faces and add alignment features such as pins or slots; the quote is the sum of each part’s material and print time.',
    },
    'graduation-project-checklist': {
        ko: '졸업작품 3D프린팅은 제출일 1주 이상 전에 견적·주문하는 것이 안전합니다(평균 수령 3~7일). 파일 단위(mm)·실제 크기·메쉬 오류를 확인하고, 발표용 외관이 중요하면 SLA, 구조·기능 시연이 중요하면 FDM을 우선 검토하세요.',
        en: 'For a graduation project, get your quote and order in at least a week before the deadline (orders typically arrive in 3–7 days). Check units (mm), real size and mesh errors, and choose SLA when appearance matters most or FDM for structural and functional demos.',
    },
    'capstone-design-prototype-guide': {
        ko: '캡스톤디자인 시제품은 최종 발표 3~4주 전에 FDM PLA로 1차 출력을 시작하고, 최소 2주 전에는 최종 주문을 마치는 것을 권장합니다. CAD를 다루지 못해도 스케치·도면으로 3D 모델링을 맡길 수 있고, 산학협력단 결제용 견적서·거래명세서·세금계산서를 발행합니다.',
        en: 'For a capstone design prototype, start a first FDM PLA print 3–4 weeks before the final presentation and place the final order at least 2 weeks before. Teams without CAD skills can outsource 3D modeling from sketches or drawings, and we issue the quotes, statements and tax invoices universities need for payment.',
    },
}

/**
 * 개별 가이드·소재 추천·활용 사례·서비스 페이지 핵심 답변 (경로 기준, locale 접두어 없는 한국어 경로).
 * 수치는 각 페이지 본문·FAQ(messages, lib/use-case-pages.ts, lib/seo-service-pages*.ts 등)에 있는 값만 사용.
 */
export const PAGE_KEY_ANSWERS: Record<string, GuideKeyAnswer> = {
    // ── 개별 가이드 ──
    '/guides/3d-printing-quote-guide': {
        ko: '3D프린팅 견적은 재료비(필라멘트·레진 사용량), 장비비(출력 시간×방식별 시간당 비용), 서포트·후가공 같은 옵션비를 더해 계산합니다. 레이어 높이가 낮을수록(FDM 0.1mm는 0.2mm보다) 층이 많아 출력 시간이 늘고, 인필이 높을수록 재료와 시간이 늘어 가격이 올라갑니다.',
        en: 'A 3D printing quote adds material cost (filament or resin used), machine cost (print time × the hourly rate for the process) and options such as supports and post-processing. Lower layer heights (FDM 0.1 mm vs 0.2 mm) mean more layers and longer print time, and higher infill uses more material and time, so the price rises.',
    },
    '/guides/3d-printing-file-preparation': {
        ko: '3D프린팅 파일은 STL·OBJ·3MF·PLY면 즉시 자동견적되고 STEP·STP는 자동 변환됩니다. 업로드 전에 단위가 mm인지, 실제 크기가 맞는지, 벽이 너무 얇지 않은지, 메쉬가 닫혀 있고 뒤집힌 면이 없는지를 확인하고, 조립 부품이면 공차 여유를 두세요.',
        en: 'STL, OBJ, 3MF and PLY files get an instant quote, and STEP/STP files are converted automatically. Before uploading, check that units are millimetres, the size is what you intend, walls aren’t too thin and the mesh is closed with no flipped faces — and leave clearance for parts that must fit together.',
    },
    '/guides/pla-vs-abs-vs-petg': {
        ko: '외관 확인용 시제품은 출력이 쉬운 PLA, 내열·내충격이 필요한 하우징·조립 부품은 ABS, 강도와 출력 안정성의 균형이 필요한 기능 부품은 PETG, ABS로도 부족한 고온·고충격 환경은 PC를 고르세요. 열변형 온도는 PLA 약 55~60℃, PETG 약 70~80℃, ABS 약 90~100℃, PC 약 110~130℃입니다.',
        en: 'Choose PLA for easy-to-print visual prototypes, ABS for heat- and impact-resistant housings and assemblies, PETG for functional parts that need a balance of strength and print stability, and PC where even ABS isn’t enough for heat or impact. Heat deflection is roughly 55–60 °C for PLA, 70–80 °C for PETG, 90–100 °C for ABS and 110–130 °C for PC.',
    },
    '/guides/standard-vs-tough-vs-clear-vs-flexible-resin': {
        ko: '외관·디테일 확인용 시제품은 Standard 레진, 조립·체결·기능 시험은 Tough 레진, 커버·창처럼 투명해야 하는 부품은 Clear 레진, 그립·패킹처럼 휘어져야 하는 부품은 Flexible 레진이 적합합니다. Clear 레진은 연마·코팅 같은 후처리를 해야 높은 투명도가 나옵니다.',
        en: 'Use Standard resin for visual and detail prototypes, Tough resin for assembly, snap-fit and functional tests, Clear resin for covers and windows that must be transparent, and Flexible resin for grips and gaskets that need to bend. Clear resin needs post-processing such as polishing and coating to reach high transparency.',
    },
    '/guides/fdm-vs-sla-vs-dlp': {
        ko: '기능 시험·조립 부품은 비용 대비 효율이 좋은 FDM, 매끄러운 표면과 미세 디테일이 중요한 외관·정밀 모형은 SLA, 소형 정밀 부품을 반복 제작할 때는 DLP가 유리합니다. 서포트 없는 복잡 형상·금속 부품은 SLS/SLM/DMLS, 멀티컬러 고해상도 모형은 PolyJet/MJP가 쓰이며, 이 두 방식은 와우쓰리디가 직접 제공하지 않는 참고 공정입니다.',
        en: 'FDM is the cost-effective choice for functional tests and assemblies, SLA suits visual and precision models that need smooth surfaces and fine detail, and DLP is efficient for repeated small precision parts. SLS/SLM/DMLS (support-free complex or metal parts) and PolyJet/MJP (multi-colour, highest resolution) are reference processes that WOW3D does not offer directly.',
    },
    '/guides/3d-printing-turnaround-time': {
        ko: '3D프린팅은 주문 확정 후 제작·검수·발송까지 일반적으로 평균 3~7일 내 수령합니다. 출력 방식, 정밀한 레이어 설정, 수량, 세척·경화·도색 같은 후가공, 파일 오류 수정 여부에 따라 기간이 늘어날 수 있습니다.',
        en: 'After the order is confirmed, production, inspection and shipping typically take 3–7 days on average. The lead time grows with the process chosen, fine layer settings, quantity, post-processing such as washing, curing or painting, and any file fixes that are needed.',
    },
    '/guides/photo-to-3d-printing-quote': {
        ko: '3D 파일이 없어도 JPG·PNG 제품 사진(최대 8MB)을 올리면 AI가 3D 모델(STL)을 만들고 바로 자동견적·출력 주문으로 이어집니다. 로그인 회원 기준 하루 1회(한국 시간)이며, 형상 확인·시제품 검증에는 적합하지만 조립 공차·정밀 치수가 중요한 부품은 STL 또는 STEP 업로드를 권장합니다.',
        en: 'With no 3D file, upload a JPG or PNG product photo (up to 8 MB) and AI creates a 3D model (STL) that flows straight into the instant quote and print order. It’s available once a day for signed-in members (Korea time); it suits shape checks and prototype validation, but parts that need assembly tolerances or precise dimensions should be uploaded as STL or STEP.',
    },
    '/guides/best-materials-for-3d-printing-prototypes': {
        ko: '시제품 소재는 목적에 따라 고릅니다. 외관 확인용은 PLA 또는 Standard 레진, 조립성 테스트는 ABS 또는 Tough 레진, 범용 기능 시제품은 PETG, 투명 커버·창 구조는 Clear 레진이 적합합니다.',
        en: 'Pick prototype materials by purpose: PLA or Standard resin for visual checks, ABS or Tough resin for assembly tests, PETG for general functional prototypes, and Clear resin for transparent covers and windows.',
    },
    '/guides/best-materials-for-transparent-3d-printed-parts': {
        ko: '투명도와 시인성이 가장 중요하면 Clear 레진이 1순위이며, 연마·코팅 후처리를 하면 더 높은 투명도를 얻을 수 있습니다. 완전한 투명보다 구조 강도가 중요한 반투명 커버·보호창은 PETG가 대안이고, 일반 PLA·ABS는 깨끗한 투명 표현이 어렵습니다.',
        en: 'When transparency matters most, Clear resin is the first choice, and polishing and coating raise clarity further. PETG is the alternative for semi-transparent covers and protective windows where strength matters more than full clarity; standard PLA and ABS can’t produce clean transparency.',
    },
    '/guides/best-materials-for-3d-printed-housings-and-cases': {
        ko: '기능성 하우징의 기본 추천은 내충격·내열성과 후가공성이 좋은 ABS입니다. 강도와 출력 안정성의 균형이 필요하면 PETG, 작은 정밀 케이스나 디테일이 중요한 외장은 Tough 레진이 유리하며, 큰 하중이나 열이 걸리는 하우징은 FDM 계열이 더 적합합니다.',
        en: 'ABS is the default for functional housings thanks to its impact and heat resistance and easy post-processing. Choose PETG for a balance of strength and print stability, and Tough resin for small precise cases or detailed exteriors; housings under heavy load or heat are better in FDM materials.',
    },
    '/guides/best-materials-for-heat-resistant-and-impact-resistant-parts': {
        ko: '내열성과 내충격성이 모두 필요한 기능 부품은 ABS를 가장 먼저 검토하세요. PETG는 ABS보다 출력이 안정적이면서 PLA보다 강해 범용 기능 부품에 좋고, Tough 레진은 작은 정밀 부품에 적합하지만 높은 열·반복 충격 환경에서는 FDM 계열이 더 유리합니다.',
        en: 'For functional parts that need both heat and impact resistance, consider ABS first. PETG prints more reliably than ABS and is stronger than PLA, making it good for general functional parts; Tough resin suits small precise parts, but FDM materials do better under high heat or repeated impact.',
    },
    '/guides/best-materials-for-miniatures-and-figurines': {
        ko: '피규어·미니어처처럼 미세 디테일과 매끄러운 표면이 중요한 모델은 Standard 레진이 가장 일반적이고 도색에도 좋습니다. 투명·반투명 파츠는 Clear 레진, 세밀한 조형보다 큰 형태 확인이 목적인 저예산 대형 전시 목업은 PLA가 대안입니다.',
        en: 'For figures and miniatures where fine detail and smooth surfaces matter, Standard resin is the usual choice and takes paint well. Use Clear resin for transparent or translucent parts, and PLA for low-budget large display mock-ups where overall form matters more than fine detail.',
    },

    // ── 활용 사례 ──
    '/use-cases/figures-miniatures': {
        ko: '피규어·미니어처는 레진(DLP·SLA)으로 출력하면 0.05mm 수준의 적층으로 표면이 매끈해 도색 전 손질이 적습니다. 작은 피규어는 DLP Standard 레진, 높이 15cm 이상 흉상은 SLA가 유리하며, 속을 2~3mm 두께로 비우고 배수 구멍을 2개 이상 뚫으면 비용이 줄어듭니다.',
        en: 'Print figures and miniatures in resin (DLP or SLA): layers around 0.05 mm leave a smooth surface that needs little prep before painting. DLP with Standard resin suits small figures and SLA is better for busts over 15 cm; hollowing to a 2–3 mm shell with at least two drain holes lowers the cost.',
    },
    '/use-cases/electronics-enclosures': {
        ko: '전자기기 케이스는 대부분 FDM PETG로 충분하고, 열이 나거나 차량 내부에 두는 케이스는 ABS, 더 높은 강도가 필요하면 PC, 매끈한 외관 목업은 SLA 레진을 권장합니다. 벽 두께는 FDM 기준 1.6~2.4mm, PCB·뚜껑이 끼워지는 부분은 0.2~0.4mm 여유 공차를 주세요.',
        en: 'Most electronics enclosures work well in FDM PETG; use ABS for cases that get hot or live in a vehicle, PC when more strength is needed, and SLA resin for smooth display mock-ups. Design FDM walls 1.6–2.4 mm thick and leave 0.2–0.4 mm clearance where PCBs and lids fit.',
    },
    '/use-cases/jigs-fixtures': {
        ko: '조립·검사 지그와 고정구는 CNC 가공보다 납기와 비용이 크게 줄어드는 3D프린팅이 적합합니다. 일반 지그는 FDM PETG, 반복 하중이나 열이 있는 곳은 PC·ABS, 작은 부품을 정밀하게 맞추는 검사 지그는 SLA Tough 레진을 권장하며, 부품이 닿는 면은 0.1~0.3mm 공차를 주고 1~2개로 먼저 확인하세요.',
        en: 'Assembly and inspection jigs and fixtures are a good fit for 3D printing, with much shorter lead times and lower cost than CNC machining. Use FDM PETG for general jigs, PC or ABS for repeated loads or heat, and SLA Tough resin for precise inspection jigs; give contact faces 0.1–0.3 mm clearance and verify with one or two pieces first.',
    },
    '/use-cases/replacement-parts': {
        ko: '단종·파손된 플라스틱 부품은 원본이나 치수만 있으면 3D 모델로 복원해 출력할 수 있고, 3D 파일이 없으면 사진과 주요 치수로 모델링부터 진행합니다. 일상용은 FDM PETG·ABS(실외·차량용은 ABS), 휘어져야 하는 부품은 TPU, 기어·클립 같은 정밀 부품은 Tough 레진이 적합합니다.',
        en: 'Discontinued or broken plastic parts can be rebuilt as 3D models from the original part or its dimensions; without a 3D file, we start with modeling from photos and key measurements. Use FDM PETG or ABS for everyday parts (ABS outdoors or in vehicles), TPU for parts that must flex, and Tough resin for precise gears and clips.',
    },
    '/use-cases/architectural-models': {
        ko: '건축 모형은 축척을 줄이면 창틀·난간이 출력 가능한 두께보다 얇아지기 쉬우므로, 벽·기둥을 FDM 최소 1.2mm, 레진 최소 0.8mm 이상으로 확보하세요. 매스·대지 모형은 FDM PLA가 비용 효율이 가장 좋고, 창호·난간 등 세부가 많은 상세 모형은 Standard 레진이 선명합니다.',
        en: 'Scaling a building down often makes window frames and railings thinner than can be printed, so keep walls and columns at least 1.2 mm for FDM and 0.8 mm for resin. FDM PLA is the most cost-effective for massing and site models, while Standard resin renders detailed models with windows and railings crisply.',
    },
    '/use-cases/cosplay-props': {
        ko: '코스프레 소품은 FDM PLA로 내부를 적당히 비워 가볍게 출력하고, 300mm를 넘으면 파츠로 나눠 맞춤 핀·홈으로 조립하는 방식이 일반적입니다. 더운 곳이나 실외 행사가 많으면 PETG가 안전하고, 작은 엠블럼·반지는 DLP 레진으로 따로 출력해 붙이면 완성도가 올라갑니다.',
        en: 'Cosplay props are usually printed light in FDM PLA with partial infill, and anything over 300 mm is split into parts joined with alignment pins and slots. PETG is safer for hot or outdoor events, and small emblems or rings printed separately in DLP resin lift the finish.',
    },
    '/use-cases/logos-signage': {
        ko: '입체 로고·네임플레이트는 색상이 다양한 FDM PLA가 가장 많이 쓰이고, 실외에는 PETG·ABS, 배지 크기의 작은 엠블럼은 DLP 레진이 선명합니다. 글자 획은 FDM 기준 최소 1.5mm, 글자 높이는 10mm 이상, 돌출 높이는 바탕판에서 2~5mm를 권장하며, 로고 이미지만 있어도 시작할 수 있습니다.',
        en: '3D logos and nameplates are most often printed in FDM PLA for its colour range; use PETG or ABS outdoors and DLP resin for crisp badge-sized emblems. We recommend strokes of at least 1.5 mm (FDM), letters at least 10 mm tall and 2–5 mm of relief above the base, and you can start from just a logo image.',
    },
    '/use-cases/trophies-awards': {
        ko: '맞춤 트로피·기념품은 표면이 매끈한 SLA Standard 레진으로 출력한 뒤 금·은 도장하는 방식을 주로 권장하며, 수량이 많으면 도장 없이 금속 느낌이 나는 실크 PLA도 좋습니다. 쓰러지지 않도록 받침 폭을 높이의 1/2 이상으로 설계하세요.',
        en: 'Custom trophies and keepsakes are usually printed in smooth SLA Standard resin and painted gold or silver; for larger quantities, silk PLA gives a metallic look without painting. Make the base at least half as wide as the trophy is tall so it doesn’t tip over.',
    },

    // ── 서비스 ──
    '/services/printing': {
        ko: '와우쓰리디는 서울 기반 3D프린팅 출력 대행 업체로, STL·OBJ·3MF·PLY 파일을 올리면 즉시 자동견적하고 STEP·STP는 자동 변환합니다. FDM·SLA·DLP 방식과 30종 이상 소재 중에서 고를 수 있고, 주문 확정 후 평균 3~7일 내 수령합니다.',
        en: 'WOW3D is a Seoul-based 3D printing service: upload STL, OBJ, 3MF or PLY files for an instant quote, with STEP/STP converted automatically. Choose from FDM, SLA and DLP and more than 30 materials, and receive your order in 3–7 days on average after confirmation.',
    },
    '/services/prototype': {
        ko: '3D프린팅 시제품은 외관·디테일 확인은 SLA·DLP, 강도·조립·기능 시험은 FDM으로 만드는 것이 일반적입니다. 주문 확정 후 평균 3~7일 내 수령하며, 연마·도장·경화 같은 후가공도 견적 단계에서 선택할 수 있습니다.',
        en: 'For 3D-printed prototypes, SLA or DLP usually suits appearance and detail checks, and FDM suits strength, assembly and functional tests. Orders arrive in 3–7 days on average after confirmation, and post-processing such as sanding, painting and curing can be selected when quoting.',
    },
    '/services/fdm': {
        ko: 'FDM 출력은 강도와 경제성이 중요한 기능성 시제품·조립 부품·대형 출력에 적합하며 PLA·ABS·PETG·TPU 등을 지원합니다. 레이어 높이와 인필로 가격과 강도를 맞출 수 있고, 장비보다 큰 모델은 분할 출력 후 조립합니다.',
        en: 'FDM printing suits functional prototypes, assemblies and large parts where strength and cost matter, with PLA, ABS, PETG, TPU and more. Layer height and infill let you balance price and strength, and models larger than the printer are split and assembled.',
    },
    '/services/sla': {
        ko: 'SLA 레진 출력은 매끄러운 표면과 미세 디테일이 중요한 외관 시제품·정밀 모형·마스터 원형에 적합하며, Standard·Tough·Clear·Flexible 레진을 고를 수 있습니다. 세척·경화 후처리까지 함께 진행하고, SLA는 레이저로, DLP는 한 레이어를 동시에 경화합니다.',
        en: 'SLA resin printing suits visual prototypes, precision models and master patterns where smooth surfaces and fine detail matter, with Standard, Tough, Clear and Flexible resins. Washing and curing are included; SLA cures with a laser, while DLP cures a whole layer at once.',
    },
    '/services/graduation': {
        ko: '졸업작품 3D프린팅은 평균 3~7일 수령을 고려해 제출 최소 1주 전에 견적·주문하세요. 회원가입 없이 파일만 올려 가격을 확인할 수 있고, 전시용 외관은 SLA·DLP 레진, 작동 시연은 FDM이 적합하며, 같은 출력 방식·같은 소재 파일은 최소 주문금액이 한 번만 적용됩니다.',
        en: 'For a graduation project, quote and order at least a week before the deadline, since orders take 3–7 days on average. You can check the price by uploading a file without signing up; use SLA/DLP resin for display pieces and FDM for working demos, and files in the same process and material share a single minimum order amount.',
    },
    '/services/capstone': {
        ko: '캡스톤디자인 시제품은 아이디어 컨설팅 → 3D 모델링(필요 시 대행) → 견적·주문 → 출력·후가공 → 수령 순서로 진행하며, 산학협력단 결제용 견적서·거래명세서·세금계산서를 발행합니다. 출력만은 평균 3~7일이지만, 모델링과 1차 시제품 수정까지 포함하면 최종 발표 3~4주 전에 시작하세요.',
        en: 'Capstone design prototypes follow idea consulting → 3D modeling (outsourced if needed) → quote and order → printing and finishing → delivery, and we issue the quotes, statements and tax invoices universities need for payment. Printing alone takes 3–7 days on average, but start 3–4 weeks before the final presentation if modeling and a first prototype revision are included.',
    },
    '/services/small-batch': {
        ko: '3D프린팅 소량 생산은 금형 없이 1개부터 가능하고, 수량이 늘면 공정·배치 최적화로 단가와 납기를 조율합니다. 같은 파일·옵션·소재로 재주문하면 동일한 제작 기준을 적용하며, FDM·SLA·DLP를 용도에 맞게 조합할 수 있습니다.',
        en: '3D printing small-batch production starts from a single piece with no tooling, and larger quantities allow unit price and lead time to be optimized through process and batching. Reorders with the same file, options and material follow the same production standard, and FDM, SLA and DLP can be combined to fit each use.',
    },
    '/services/modeling': {
        ko: '3D 모델링 대행은 도면·스케치·사진을 바탕으로 출력 가능한 형상의 STL·3MF를 만들어 주며, 완성 파일은 바로 자동견적으로 이어집니다. 정밀 치수·조립 공차가 필요한 제품은 모델링 의뢰가, 빠른 형상 확인이 목적이면 사진→AI 3D 자동견적이 적합합니다.',
        en: 'Our 3D modeling service turns drawings, sketches or photos into printable STL or 3MF files that go straight into the instant quote. Choose modeling when you need precise dimensions or assembly tolerances, and photo-to-AI 3D quoting when a quick shape check is the goal.',
    },
    '/services/photo-to-3d': {
        ko: 'JPG·PNG 제품 사진만 올리면 AI가 입체 STL을 만들고 바로 3D 뷰어·자동견적·주문으로 이어집니다. 로그인 회원 하루 1회(한국 시간)이며 우·뒤·좌 추가 사진으로 정확도를 높일 수 있고, 조립 공차·정밀 치수가 중요한 부품은 STL·STEP 업로드를 권장합니다.',
        en: 'Upload a JPG or PNG product photo and AI builds a 3D STL that flows straight into the 3D viewer, instant quote and order. It’s available once a day for signed-in members (Korea time), extra right, back and left views improve accuracy, and parts that need assembly tolerances or precise dimensions should be uploaded as STL or STEP.',
    },
}

/** 경로(/en 포함 가능)로 핵심 답변 조회 — 경로 기준 답변 우선, 없으면 가이드 슬러그 기준 */
export function getKeyAnswer(path: string, locale: string): string | null {
    const normalized = path.replace(/^\/en(?=\/|$)/, '') || '/'
    const entry =
        PAGE_KEY_ANSWERS[normalized] ??
        (normalized.startsWith('/guides/') ? GUIDE_KEY_ANSWERS[normalized.slice('/guides/'.length)] : undefined)
    if (!entry) return null
    return locale === 'en' ? entry.en : entry.ko
}

export function getGuideKeyAnswer(slug: string, locale: string): string | null {
    return getKeyAnswer(`/guides/${slug}`, locale)
}
