import type { ServiceLandingConfig } from './seo-service-pages'

/** EN copies for SERVICE_LANDINGS — same slugs/paths/CTA hrefs */
export const SERVICE_LANDINGS_EN: ServiceLandingConfig[] = [
    {
        slug: 'printing',
        path: '/services/printing',
        title: '3D Printing Service · Print-on-Demand | WOW3D',
        h1: '3D Printing',
        h1Accent: '· Print Service',
        description:
            'Need 3D printing or print-on-demand? Upload your file on WOW3D, get an instant auto-quote, and place your order.',
        keywords: [
            '3D printing service',
            '3D print on demand',
            '3D printing company',
            'STL printing',
            'prototype printing',
        ],
        eyebrow: 'Printing Service',
        bullets: [
            'Instant auto-quote for STL·OBJ·3MF·PLY; STEP·STP auto-converted',
            'No 3D file? Product photo → AI 3D → auto-quote',
            'FDM·SLA·DLP processes and 30+ materials',
            'After order confirmation: produce, inspect, ship — typically 3–7 days',
        ],
        faqs: [
            {
                q: 'Which files can I send for 3D printing?',
                a: 'STL, OBJ, 3MF, and PLY get an instant auto-quote. STEP·STP are converted on upload, then quoted.',
            },
            {
                q: 'How do I check the print price?',
                a: 'Upload on the auto-quote page and choose process, material, and options to see pricing in real time.',
            },
            {
                q: 'What kind of 3D printing company is WOW3D?',
                a: 'A Seoul-based print and prototype specialist covering auto-quote through production, QC, and shipping in one place.',
            },
        ],
        primaryCta: { label: 'Get a 3D printing quote', href: '/quote' },
        secondaryCta: { label: 'Compare print methods', href: '/print-methods' },
        relatedGuides: [
            { href: '/guides/3d-printing-quote-guide', title: 'How quotes are calculated' },
            { href: '/guides/fdm-vs-sla-vs-dlp', title: 'FDM vs SLA vs DLP' },
        ],
    },
    {
        slug: 'prototype',
        path: '/services/prototype',
        title: 'Prototype & Product Mockup | 3D Printed Prototypes',
        h1: 'Prototype · Mockup',
        h1Accent: 'Production',
        description:
            'Validate prototypes and product mockups quickly with 3D printing — from look & feel to assembly and function tests.',
        keywords: ['prototype manufacturing', 'product mockup', '3D printed prototype'],
        eyebrow: 'Prototype',
        bullets: [
            'Design validation, investor samples, and assembly test prototypes',
            'SLA/DLP for appearance; FDM for functional trials',
            'Small iterative runs to shorten improvement cycles',
        ],
        faqs: [
            {
                q: 'Which process fits prototypes best?',
                a: 'SLA/DLP for look and detail; FDM for strength, assembly, and functional tests.',
            },
            {
                q: 'How long does a product mockup take?',
                a: 'After order confirmation, production, QC, and shipping usually means receipt within about 3–7 days, depending on process and quantity.',
            },
            {
                q: 'Can 3D printed prototypes be post-processed?',
                a: 'Yes — sanding, painting, curing, and related options can be selected at quote time.',
            },
        ],
        primaryCta: { label: 'Prototype auto-quote', href: '/quote' },
        secondaryCta: {
            label: 'Materials for prototypes',
            href: '/guides/best-materials-for-3d-printing-prototypes',
        },
        relatedGuides: [
            { href: '/guides/3d-printing-turnaround-time', title: 'Turnaround guide' },
            { href: '/guides/best-materials-for-3d-printing-prototypes', title: 'Prototype materials' },
        ],
    },
    {
        slug: 'fdm',
        path: '/services/fdm',
        title: 'FDM Printing · PLA Print Service · Large FDM Parts',
        h1: 'FDM Printing',
        h1Accent: 'Service',
        description:
            'FDM printing, PLA print service, and large FDM builds when strength and cost matter for prototypes and functional parts.',
        keywords: ['FDM printing', 'PLA print service', 'large FDM print'],
        eyebrow: 'FDM',
        bullets: [
            'PLA·ABS·PETG·TPU and other FDM materials',
            'Strong fit for functional prototypes, assemblies, and larger parts',
            'Tune layer height and infill for price vs strength',
        ],
        faqs: [
            {
                q: 'When is PLA print service a good fit?',
                a: 'PLA offers good dimensional stability and ease of finishing — common for prototypes, education, and appearance mockups.',
            },
            {
                q: 'Can you print large FDM parts?',
                a: 'Parts beyond build volume can be split and assembled. See our large-print splitting guide.',
            },
            {
                q: 'FDM or SLA — which should I choose?',
                a: 'Choose FDM for durability and cost; SLA when surface precision matters more.',
            },
        ],
        primaryCta: { label: 'FDM auto-quote', href: '/quote' },
        secondaryCta: { label: 'PLA vs PETG comparison', href: '/guides/pla-vs-abs-vs-petg' },
        relatedGuides: [
            { href: '/guides/fdm-vs-sla-vs-dlp', title: 'FDM vs SLA' },
            { href: '/guides/splitting-large-3d-prints', title: 'Splitting large prints' },
        ],
    },
    {
        slug: 'sla',
        path: '/services/sla',
        title: 'SLA Printing · Resin 3D Printing · Precision Prints',
        h1: 'SLA · Resin',
        h1Accent: 'Precision Prints',
        description:
            'SLA and resin 3D printing when smooth surfaces and fine detail matter most.',
        keywords: ['SLA printing', 'resin 3D printing', 'precision 3D printing'],
        eyebrow: 'SLA / Resin',
        bullets: [
            'Standard·Tough·Clear·Flexible resin options',
            'Great for visual validation, precision models, and master patterns',
            'Wash and cure post-processing included in a consistent workflow',
        ],
        faqs: [
            {
                q: 'When should I choose resin 3D printing?',
                a: 'When surface quality, fine detail, and appearance prototypes matter — SLA/DLP resin is recommended.',
            },
            {
                q: 'What tolerances can precision printing hold?',
                a: 'It depends on process, material, and finishing. Leave clearance for assemblies using our tolerance guide.',
            },
            {
                q: 'What is the difference between SLA and DLP?',
                a: 'Both use resin. SLA scans with a laser; DLP cures a full layer at once — speed and machine traits differ.',
            },
        ],
        primaryCta: { label: 'SLA auto-quote', href: '/quote' },
        secondaryCta: {
            label: 'Compare resin types',
            href: '/guides/standard-vs-tough-vs-clear-vs-flexible-resin',
        },
        relatedGuides: [
            { href: '/guides/fdm-vs-sla-vs-dlp', title: 'FDM vs SLA vs DLP' },
            { href: '/guides/3d-printing-tolerances', title: '3D printing tolerances' },
        ],
    },
    {
        slug: 'graduation',
        path: '/services/graduation',
        title: 'Graduation Project 3D Printing · Student Prints',
        h1: 'Graduation',
        h1Accent: 'Project Prints',
        description:
            'Print service for graduation and student projects — with guidance on deadlines, budget, and file prep checklists.',
        keywords: ['graduation project 3D printing', 'student 3D printing'],
        eyebrow: 'Graduation',
        bullets: [
            'Deadline counseling aligned to submission dates',
            'Confirm budget first with auto-quote',
            'Guides for wall thickness, supports, and file readiness',
        ],
        faqs: [
            {
                q: 'How early should I order a graduation print?',
                a: 'Receipt often takes about 3–7 days after confirmation — we recommend quoting and ordering at least a week ahead.',
            },
            {
                q: 'Can students use auto-quote without signing up?',
                a: 'Yes. Upload a file and check pricing without creating an account.',
            },
            {
                q: 'What should I check in a graduation project file?',
                a: 'Units (mm), wall thickness, mesh errors, split needs, and support placement.',
            },
        ],
        primaryCta: { label: 'Get a graduation quote', href: '/quote' },
        secondaryCta: {
            label: 'Graduation checklist',
            href: '/guides/graduation-project-checklist',
        },
        relatedGuides: [
            { href: '/guides/graduation-project-checklist', title: 'Graduation checklist' },
            { href: '/guides/3d-printing-turnaround-time', title: 'Turnaround time' },
        ],
    },
    {
        slug: 'small-batch',
        path: '/services/small-batch',
        title: 'Small-Batch 3D Production · Custom Parts',
        h1: 'Small Batch',
        h1Accent: '· Custom Parts',
        description:
            'Small-batch and low-volume production without tooling — from one unit to repeat runs of custom parts.',
        keywords: ['small batch 3D printing', 'low volume production', 'custom parts'],
        eyebrow: 'Small Batch',
        bullets: [
            'Low-volume lots without mold investment',
            'Repeat orders with locked specs',
            'Combine FDM·SLA·DLP by use case',
        ],
        faqs: [
            {
                q: 'From how many units is small-batch possible?',
                a: 'From one piece. Higher quantities allow process and batch optimizations for unit cost and lead time.',
            },
            {
                q: 'Can custom parts use auto-quote?',
                a: 'Standard shapes can be quoted automatically; special tolerances or finishing may need admin review.',
            },
            {
                q: 'Is quality consistent on repeat orders?',
                a: 'Reordering the same file, options, and material applies the same production standards.',
            },
        ],
        primaryCta: { label: 'Small-batch quote', href: '/quote' },
        secondaryCta: { label: 'Contact us', href: '/contact' },
        relatedGuides: [
            { href: '/guides/how-to-reduce-3d-printing-cost', title: 'Ways to lower cost' },
            { href: '/guides/3d-printing-tolerances', title: 'Tolerance guide' },
        ],
    },
    {
        slug: 'modeling',
        path: '/services/modeling',
        title: '3D Modeling Service · Product Modeling · Print-Ready STL',
        h1: '3D Modeling',
        h1Accent: 'Service',
        description:
            'Commission 3D modeling and print-ready STL from sketches, drawings, or references.',
        keywords: ['3D modeling service', 'product modeling', 'print-ready STL'],
        eyebrow: 'Modeling',
        bullets: [
            'Model and revise for printability',
            'Commission from drawings, sketches, or photos',
            'Hand off finished STL and continue to auto-quote',
        ],
        faqs: [
            {
                q: 'How do I request 3D modeling?',
                a: 'Send references and requirements via product development or Contact — we consult, then proceed.',
            },
            {
                q: 'Does it include print-ready STL?',
                a: 'Yes. We deliver print-suitable STL/3MF that can flow into auto-quote.',
            },
            {
                q: 'Can I print without modeling?',
                a: 'If you already have a file, upload it on auto-quote for print service directly.',
            },
            {
                q: 'Modeling service vs photo → AI 3D — which should I pick?',
                a: 'Precision dimensions, assembly tolerances, or drawing-based products fit modeling. Fast form checks, prototypes, or figure ideas fit photo → AI 3D auto-quote.',
            },
            {
                q: 'I only have photos — can I get a quote without modeling?',
                a: 'Yes. Use photo → AI 3D on auto-quote to generate a mesh, then quote and order. For tight tolerances, consider modeling.',
            },
        ],
        primaryCta: { label: 'Ask about modeling', href: '/expert' },
        secondaryCta: { label: 'Photo → AI 3D quote', href: '/quote?entry=photo' },
        relatedGuides: [
            { href: '/guides/3d-printing-file-preparation', title: 'File prep guide' },
            { href: '/guides/photo-to-3d-printing-quote', title: 'Photo → 3D quote guide' },
            { href: '/guides/fixing-stl-file-errors', title: 'Fixing STL errors' },
        ],
    },
    {
        slug: 'photo-to-3d',
        path: '/services/photo-to-3d',
        title: 'Photo to 3D Modeling · AI 3D Conversion · Print from Photos',
        h1: 'Photo → AI 3D',
        h1Accent: 'Print Quote',
        description:
            'No 3D file? Turn product photos (JPG/PNG) into an AI 3D model, then auto-quote and order prints on WOW3D in one flow.',
        keywords: [
            'photo to 3D modeling',
            'image to 3D',
            '3D print from photo',
            'AI 3D modeling',
            'quote without 3D file',
        ],
        eyebrow: 'Photo to 3D',
        bullets: [
            'JPG·PNG product photos → AI mesh STL',
            'Immediate 3D viewer, auto-quote, and order handoff',
            'Signed-in members: 1 run/day (KST); multi-view extras supported',
        ],
        faqs: [
            {
                q: 'Can a photo be converted into a 3D model?',
                a: 'Yes. Upload JPG/PNG product photos and AI builds a 3D STL, then continues to auto-quote and print ordering.',
            },
            {
                q: 'Can I get a print quote without a 3D file?',
                a: 'Yes. On auto-quote choose “I don’t have a 3D model”, upload product photos, and AI creates an STL before quoting.',
            },
            {
                q: 'What photos work best for photo → 3D?',
                a: 'Large centered subjects, plain bright backgrounds, and low shadow/reflection. Extra right/back/left views can improve accuracy.',
            },
            {
                q: 'Photo → AI 3D vs AI 3D Maker?',
                a: 'Maker is for sketch/logo 2.5D extrusion. Photo → AI 3D builds a mesh from real photos and goes straight to print quote/order.',
            },
            {
                q: 'Can precision parts be done from photos?',
                a: 'Good for form checks and prototype validation. For assembly tolerances and exact dimensions, upload STL or STEP instead.',
            },
        ],
        primaryCta: { label: 'Make 3D from a photo', href: '/quote?entry=photo' },
        secondaryCta: {
            label: 'Photo → 3D guide',
            href: '/guides/photo-to-3d-printing-quote',
        },
        relatedGuides: [
            { href: '/guides/photo-to-3d-printing-quote', title: 'Photo → 3D quote guide' },
            { href: '/guides/3d-printing-quote-guide', title: 'How quotes are calculated' },
        ],
    },
]
