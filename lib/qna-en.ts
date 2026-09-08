/** Korean question (exact DB/curated text) → English Q&A */
export const QNA_EN_BY_QUESTION: Record<string, { question: string; answer: string }> = {
    '사진(이미지) 파일을 3D 모델링으로 변환할 수 있나요?': {
        question: 'Can I turn a photo (image) into a 3D model?',
        answer:
            'Yes. On WOW3D, upload a JPG/PNG product photo and AI converts it into a 3D mesh (STL), then you can continue to live auto-quote and print ordering. In auto-quote, choose “I don’t have a 3D model” and upload a front photo. Adding right/back/left photos can improve shape accuracy. Logged-in members can use this once per day (Korea time). For tight assembly fits or precision dimensions, upload STL or STEP instead.',
    },
    '사진 3D 모델링은 어떤 사진이 좋나요?': {
        question: 'What kind of photo works best for photo-to-3D?',
        answer:
            'Use a photo where the object is large and centered, on a plain bright background, one object per frame, with minimal shadows and reflections. JPG or PNG up to 8MB is supported. Extra right/back/left photos can improve accuracy. You can take the generated STL straight into auto-quote and ordering.',
    },
    '사진(이미지) 3D 모델링은 어떤 사진(이미지)이 좋나요?': {
        question: 'What kind of photo (image) works best for photo-to-3D modeling?',
        answer:
            'Use a photo where the object is large and centered, on a plain bright background, one object per frame, with minimal shadows and reflections. JPG or PNG up to 8MB is supported. Extra right/back/left photos can improve accuracy. You can take the generated STL straight into auto-quote and ordering.',
    },
    '3D 프린팅 자동견적은 어떻게 받나요?': {
        question: 'How do I get a 3D printing auto quote?',
        answer:
            'Upload a 3D model on WOW3D and AI analyzes volume and surface area to return a live auto quote. STL, OBJ, 3MF, and PLY are supported immediately; STEP/STP files are converted on upload, then quoted.',
    },
    '3D 프린팅 출력 비용은 어떻게 산정되나요?': {
        question: 'How is 3D printing cost calculated?',
        answer:
            'WOW3D’s AI auto-quote analyzes model volume (cm³), surface area, print method (FDM/SLA/DLP), material, and options such as infill and layer height in real time, typically within about 10 seconds.',
    },
    '3D 프린팅 견적은 어떤 기준으로 계산되나요?': {
        question: 'What factors go into a 3D printing quote?',
        answer:
            'WOW3D quotes combine volume, surface area, size, process (FDM·SLA·DLP), layer height, infill, material, and finishing. Complex geometry or specialty materials may be reviewed and adjusted by an admin.',
    },
    '회원가입 없이도 3D 프린팅 견적 확인이 가능한가요?': {
        question: 'Can I check a 3D printing quote without signing up?',
        answer:
            'Yes. WOW3D lets you review pricing and options without an account—just upload a file to see estimated cost quickly.',
    },
    '출력 가능한 파일 형식은 무엇인가요?': {
        question: 'Which file formats can I upload for printing?',
        answer:
            'STL and OBJ are supported by default. For other formats, contact support. On the live quote flow we also support 3MF and PLY immediately, and STEP/STP after conversion on upload.',
    },
    '어떤 3D 파일 형식을 업로드할 수 있나요?': {
        question: 'Which 3D file formats can I upload?',
        answer:
            'STL, OBJ, 3MF, and PLY quote instantly. STEP and STP convert on upload, then quote. If CAD conversion is difficult, prepare STL or 3MF for more reliable results.',
    },
    '3D 프린터 출력대행은 어떤 파일 형식을 지원하나요?': {
        question: 'Which file formats does 3D print outsourcing support?',
        answer:
            'WOW3D supports STL, OBJ, 3MF, and PLY, and STEP/STP after conversion on upload. You can preview the model in the web 3D viewer before quoting.',
    },
    '배송 기간은 얼마나 걸리나요?': {
        question: 'How long does shipping take?',
        answer:
            'Orders usually ship within 1–3 business days after production starts. Large parts or high quantities may take longer. Track progress on the order status page.',
    },
    '3D 프린팅 제작 기간은 보통 얼마나 걸리나요?': {
        question: 'How long does 3D printing production usually take?',
        answer:
            'After order confirmation we produce, inspect, and ship. Most orders arrive within about 3–7 days on average. Process, quantity, and finishing can change the timeline; rush or specialty work may need a consult.',
    },
    '3D 프린팅 출력물은 얼마나 걸리나요?': {
        question: 'How long until I receive a 3D printed part?',
        answer:
            'Lead time depends on size, process, material, and finishing. As a general guide on the WOW3D site, most orders arrive within about 3–7 days after confirmation, including production, QC, finishing, and shipping.',
    },
    'FDM, SLA, DLP 중 어떤 3D 프린팅 방식을 선택해야 하나요?': {
        question: 'Which should I choose among FDM, SLA, and DLP?',
        answer:
            'Functional prototypes, fit checks, and durability-focused parts usually suit FDM. Appearance models and fine-detail precision parts often suit SLA or DLP.',
    },
    'FDM, SLA, DLP 중 어떤 3D 프린팅 방식이 적합한가요?': {
        question: 'Which 3D printing process fits my needs—FDM, SLA, or DLP?',
        answer:
            'It depends on the goal. FDM is strong on strength and cost for functional parts and tests; SLA excels at smooth surfaces and detail; DLP balances speed and precision for many fine jobs.',
    },
    '레이어 높이가 낮을수록 왜 가격과 시간이 올라가나요?': {
        question: 'Why do lower layer heights raise price and time?',
        answer:
            'Lower layer height means more layers for the same part height, so machine time increases. For example, FDM 0.1mm is finer than 0.2mm but usually takes longer and costs more.',
    },
    '3D 프린팅 전에 파일에서 무엇을 확인해야 하나요?': {
        question: 'What should I check in the file before 3D printing?',
        answer:
            'Confirm units (mm), real-world size, wall thickness, mesh errors, flipped faces, and open geometry. For assemblies, also review tolerances and fit clearance to reduce production issues.',
    },
    '자동견적 금액과 실제 제작 금액이 달라질 수 있나요?': {
        question: 'Can the auto-quote differ from the final production price?',
        answer:
            'Most typical jobs match the auto-quote quickly, but very complex geometry, specialty materials, finishing, or lead-time requirements may be reviewed and adjusted before production.',
    },
    '파일이 열리는데도 출력이 어려운 경우가 있나요?': {
        question: 'Can a file open but still be hard to print?',
        answer:
            'Yes. Even if the model displays, thin walls, non-manifold meshes, bad faces, internal collisions, or hard-to-support structures can block printing. WOW3D can review the file and suggest fixes.',
    },
    '3D 파일 없이 3D 프린팅 견적을 받을 수 있나요?': {
        question: 'Can I get a 3D printing quote without a 3D file?',
        answer:
            'Yes. In auto-quote choose “I don’t have a 3D model,” upload a JPG/PNG product photo, and AI builds an STL mesh before volume/price quoting. For precision dimensions or assembly fits, upload STL or STEP.',
    },
    '사진(이미지)→AI 3D는 하루에 몇 번 사용할 수 있나요?': {
        question: 'How many times per day can I use photo → AI 3D?',
        answer:
            'Logged-in members get one use per day (Korea time). Failed generations do not count against the limit.',
    },
    'AI 3D Maker와 사진(이미지)→AI 3D 견적의 차이는 무엇인가요?': {
        question: 'How does AI 3D Maker differ from photo → AI 3D quote?',
        answer:
            'AI 3D Maker extrudes sketch/logo PNGs into 2.5D shapes. Photo → AI 3D builds a full 3D mesh from real photos, then continues straight into print quoting and ordering.',
    },
    '사진(이미지)→3D와 CAD·STL 업로드 중 무엇을 써야 하나요?': {
        question: 'Should I use photo → 3D or upload CAD/STL?',
        answer:
            'Prefer STL or STEP when assembly fits and precision matter. Photo AI 3D is great for shape checks, prototypes, and figurine-style idea validation.',
    },
    'AI로 만든 3D 모델로 바로 출력 주문할 수 있나요?': {
        question: 'Can I order prints directly from an AI-generated 3D model?',
        answer:
            'Yes. Take the generated STL through auto-quote (material, layer height, infill) into cart and checkout in one flow.',
    },
    '3D 프린팅 출력대행으로 시제품 제작도 가능한가요?': {
        question: 'Can I use print outsourcing for prototypes?',
        answer:
            'Yes. WOW3D focuses on prototypes and proof-of-concept parts—design reviews, functional tests, and investor/demo samples—from single pieces to small batches.',
    },
    '소량 생산이나 대량 생산도 3D 프린팅으로 가능한가요?': {
        question: 'Can 3D printing cover small or larger production runs?',
        answer:
            'WOW3D supports from 1 to hundreds of parts. We combine FDM, SLA, and DLP to balance lead time and unit cost for small-batch and repeat production.',
    },
    '정밀한 3D 프린팅 출력이 필요한데 가능한가요?': {
        question: 'Can you handle high-precision 3D printing?',
        answer:
            'Yes. WOW3D targets industrial-grade precision with about ±0.05mm tolerance control, adjustable layer thickness, and infill settings for functional and fine-detail jobs.',
    },
    '어떤 3D 프린팅 소재를 선택할 수 있나요?': {
        question: 'Which 3D printing materials can I choose?',
        answer:
            'Options include PLA, ABS, PETG, TPU, nylon, PC, and Standard / Tough / Clear / Flexible resins—30+ materials. We can recommend based on use case and budget.',
    },
    'TPU나 레진 같은 특수 소재도 3D 프린팅이 가능한가요?': {
        question: 'Can you print specialty materials like TPU or resin?',
        answer:
            'Yes. We handle FDM materials such as PLA·ABS·PETG·TPU and SLA/DLP resins (Standard·Tough·Clear·Flexible) for flexible parts or high surface quality.',
    },
    '후가공이나 도장 서비스도 함께 가능한가요?': {
        question: 'Do you offer finishing and painting?',
        answer:
            'Yes. Options include sanding, paint, curing, assembly, and packaging—so parts can leave as product-ready finishes, selectable during quoting.',
    },
    '졸업작품이나 개인 제작도 의뢰할 수 있나요?': {
        question: 'Can students or individuals place orders?',
        answer:
            'Yes. Beyond industrial R&D, WOW3D supports education, graduation projects, startups, and personal builds—including small custom jobs.',
    },
    '3D 모델링 파일이 없어도 제작 상담이 가능한가요?': {
        question: 'Can I get a build consult without a 3D modeling file?',
        answer:
            'Yes. Without a 3D file you can upload a product photo (JPG/PNG) for AI conversion to STL, then auto-quote and order. Sketches/logos suit AI 3D Maker; precision CAD-based products can use a modeling consult.',
    },
    '업로드 가능한 파일 용량은 어느 정도인가요?': {
        question: 'What is the maximum upload file size?',
        answer:
            'Uploads are supported up to 100MB and handled securely. After upload, 3D preview and detailed quoting become available.',
    },
    '3D 프린팅 주문 후 진행 상태를 확인할 수 있나요?': {
        question: 'Can I track status after ordering?',
        answer:
            'Yes. After payment the order is received and status is available in My Page—covering shipping details, payment, order number, and progress tracking.',
    },
    '와우쓰리디는 어디에서 제작을 진행하나요?': {
        question: 'Where does WOW3D manufacture parts?',
        answer:
            'WOW3D lists production centers in Hongdae, Gumi, and Jeonju on the site, along with phone and email contact channels.',
    },
}
