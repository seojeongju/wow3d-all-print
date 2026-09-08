import type { GuideLandingConfig } from './seo-guide-pages'

/** EN copies for NEW_SEO_GUIDES — same slugs/paths/ctaHref */
export const NEW_SEO_GUIDES_EN: GuideLandingConfig[] = [
    {
        slug: 'how-to-reduce-3d-printing-cost',
        path: '/guides/how-to-reduce-3d-printing-cost',
        title: 'How to lower 3D printing cost',
        h1: 'How to lower',
        h1Accent: '3D printing cost',
        description:
            'Practical ways to reduce quotes by tuning layer height, infill, supports, material, and split printing.',
        eyebrow: 'Cost Saving',
        sections: [
            {
                title: 'Raise layer height when fine detail is not required',
                body: 'For FDM, ~0.2mm layers often cut print time and machine cost when ultra-fine finish is not needed.',
            },
            {
                title: 'Lower infill to match the use case',
                body: 'Visual prototypes often work at 15–20% infill. Raise infill only for load-bearing functional parts.',
            },
            {
                title: 'Orient parts to need less support',
                body: 'Heavy overhangs add support material and cleanup time. Reorienting can lower cost.',
            },
            {
                title: 'Pick material and process for the goal',
                body: 'For look-and-feel checks, PLA or Standard resin is often enough instead of expensive engineering materials.',
            },
        ],
        faqs: [
            {
                q: 'What lowers price the fastest?',
                a: 'Lower infill and higher layer height usually move the quote most. Compare options in live auto-quote.',
            },
            {
                q: 'Can I cut cost without killing quality?',
                a: 'Keep critical visible faces finer and use economical settings for hidden or internal areas.',
            },
        ],
        ctaHref: '/quote',
        ctaLabel: 'Compare quote options',
    },
    {
        slug: 'choosing-infill-density',
        path: '/guides/choosing-infill-density',
        title: 'How to choose infill density',
        h1: 'Infill density',
        h1Accent: 'selection guide',
        description:
            'How infill affects strength, weight, price, and print time — with starting ranges by use case.',
        eyebrow: 'Infill',
        sections: [
            {
                title: 'What is infill?',
                body: 'It is how densely the inside of a part is filled. Higher means more material, time, and strength; lower means lighter and cheaper.',
            },
            {
                title: 'Suggested ranges',
                body: 'Start around 10–20% for visual mockups, 20–40% for general prototypes, and 40–80% for loaded functional parts — then test.',
            },
            {
                title: 'Link to price',
                body: 'Higher infill raises material and machine time together. Change the slider in auto-quote to see the difference instantly.',
            },
        ],
        faqs: [
            {
                q: 'Is 100% infill always better?',
                a: 'No. Weight, cost, and time jump a lot, and mid-density infill is enough for many uses.',
            },
            {
                q: 'Does infill matter for thin-wall models?',
                a: 'Thin walls limit what infill can do — wall thickness design often matters more.',
            },
        ],
        ctaHref: '/quote',
        ctaLabel: 'Check quotes by infill',
    },
    {
        slug: 'fixing-stl-file-errors',
        path: '/guides/fixing-stl-file-errors',
        title: 'How to fix STL file errors',
        h1: 'STL file errors',
        h1Accent: 'how to fix',
        description:
            'Check and repair open meshes, flipped normals, bad intersections, and other STL issues before printing.',
        eyebrow: 'STL Repair',
        sections: [
            {
                title: 'Common errors',
                body: 'Typical issues: non-manifold holes, flipped normals, overlapping faces, self-intersections, and unit mismatches (mm vs inch).',
            },
            {
                title: 'Check before upload',
                body: 'Use a slicer or mesh inspector and aim for a closed, watertight solid when possible.',
            },
            {
                title: 'If it still will not print',
                body: 'Walls that look fine on screen can still be too thin or unsupported. WOW3D may review and suggest fixes.',
            },
        ],
        faqs: [
            {
                q: 'Can I still get a quote with a broken STL?',
                a: 'Analysis may still run, but production can need repairs. Fixing early saves time.',
            },
            {
                q: 'Are STEP files error-free?',
                a: 'CAD sources are accurate, but mesh conversion can introduce resolution or face issues — check after convert.',
            },
        ],
        ctaHref: '/guides/3d-printing-file-preparation',
        ctaLabel: 'View file prep guide',
    },
    {
        slug: 'minimum-wall-thickness',
        path: '/guides/minimum-wall-thickness',
        title: 'Minimum wall thickness for 3D printing',
        h1: 'Minimum wall thickness',
        h1Accent: 'guide',
        description:
            'Practical minimum wall thickness for FDM and SLA, plus tips to avoid collapse and failed prints.',
        eyebrow: 'Wall Thickness',
        sections: [
            {
                title: 'Why wall thickness matters',
                body: 'Walls that are too thin can fail during printing, finishing, or shipping. Recommended minimums differ by process and material.',
            },
            {
                title: 'Starting points',
                body: 'Often start at 1.0–1.5mm+ for FDM and about 0.6–1.0mm for small SLA/DLP features, then tune to geometry.',
            },
            {
                title: 'Pins, text, and ribs',
                body: 'Tiny protrusions and lettering below process resolution can smear. Thicken critical details or adjust engraving depth.',
            },
        ],
        faqs: [
            {
                q: 'Is meeting the minimum enough?',
                a: 'Minimums are starting points. Add thickness for loads, assembly, and post-processing.',
            },
            {
                q: 'Same rules for clear resin?',
                a: 'Clear resin optics change with thickness — tune for visual goals as well as strength.',
            },
        ],
        ctaHref: '/quote',
        ctaLabel: 'Upload a file to check printability',
    },
    {
        slug: 'why-support-costs',
        path: '/guides/why-support-costs',
        title: 'Why support structures add cost',
        h1: 'Why supports',
        h1Accent: 'add cost',
        description:
            'Why supports are needed and how material, time, and cleanup show up in your quote.',
        eyebrow: 'Support Cost',
        sections: [
            {
                title: 'What are supports?',
                body: 'Temporary structures that hold overhangs and bridges in mid-air. They must be removed and finished after printing.',
            },
            {
                title: 'What drives cost',
                body: 'Support material, extra print time, and removal/finishing labor can all affect the quote.',
            },
            {
                title: 'How to reduce it',
                body: 'Reorient the part, split the model, or add fillets so fewer overhangs need supports.',
            },
        ],
        faqs: [
            {
                q: 'Can I always print without supports?',
                a: 'It depends on geometry and process. Overhangs steeper than ~45° often need supports.',
            },
            {
                q: 'Do SLA prints use supports too?',
                a: 'Yes. Resin builds commonly need supports for platform attachment and overhangs.',
            },
        ],
        ctaHref: '/guides/how-to-reduce-3d-printing-cost',
        ctaLabel: 'View cost-saving guide',
    },
    {
        slug: '3d-printing-tolerances',
        path: '/guides/3d-printing-tolerances',
        title: '3D printing tolerances',
        h1: '3D printing',
        h1Accent: 'tolerance guide',
        description:
            'Practical clearance and fit guidance for assembled parts across print processes.',
        eyebrow: 'Tolerance',
        sections: [
            {
                title: 'Why tolerances matter',
                body: 'Parts shrink/expand, have layer error, and shift in finishing. CAD-exact fits can be too tight or too loose.',
            },
            {
                title: 'Practical clearances',
                body: 'Many teams test ~0.2–0.4mm per side on FDM and ~0.1–0.25mm on SLA. Always validate with coupons for material and size.',
            },
            {
                title: 'Validate critical fits first',
                body: 'Print a small mating sample before the full part to lock clearance and reduce scrap cost.',
            },
        ],
        faqs: [
            {
                q: 'Can I match CNC metal tolerances?',
                a: 'Usually you need more clearance than machining. Ultra-tight fits may need finishing or another process.',
            },
            {
                q: 'What if my tolerance is strict?',
                a: 'Tell us the target fit and mating method — we can help pick process and design clearance.',
            },
        ],
        ctaHref: '/services/prototype',
        ctaLabel: 'View prototype service',
    },
    {
        slug: 'splitting-large-3d-prints',
        path: '/guides/splitting-large-3d-prints',
        title: 'How to split large 3D prints',
        h1: 'Large prints',
        h1Accent: 'how to split',
        description:
            'How to split and assemble oversized models that exceed build volume — with design tips.',
        eyebrow: 'Large Prints',
        sections: [
            {
                title: 'When to split',
                body: 'When the part exceeds max build size, or when orientation/supports/material waste improve with segments.',
            },
            {
                title: 'Split design tips',
                body: 'Cut on less-visible faces and add pins, slots, or bolt bosses so alignment stays accurate.',
            },
            {
                title: 'Bonding and assembly',
                body: 'Choose adhesives or fasteners that match the material, and keep load paths away from split planes when possible.',
            },
        ],
        faqs: [
            {
                q: 'How does splitting affect the quote?',
                a: 'Each piece is printed and totaled. You reduce the risk of losing one huge failed build.',
            },
            {
                q: 'Can I order large FDM parts?',
                a: 'Yes. Upload a file or contact us to confirm size and split options.',
            },
        ],
        ctaHref: '/services/fdm',
        ctaLabel: 'FDM printing service',
    },
    {
        slug: 'graduation-project-checklist',
        path: '/guides/graduation-project-checklist',
        title: 'Graduation project print checklist',
        h1: 'Graduation project',
        h1Accent: 'checklist',
        description:
            'Lead time, files, wall thickness, budget, and finishing checks before student / graduation 3D printing.',
        eyebrow: 'Graduation Checklist',
        sections: [
            {
                title: 'Schedule',
                body: 'Leave buffer for production and shipping — ideally quote/order 1+ week before due date. Typical receipt is about 3–7 days.',
            },
            {
                title: 'Files',
                body: 'Confirm units (mm), real size, mesh errors, and whether splits are needed. STL/3MF are the most reliable.',
            },
            {
                title: 'Design & options',
                body: 'Decide wall thickness, infill, supports, and finishing (paint, etc.) early to avoid same-day changes.',
            },
            {
                title: 'Budget',
                body: 'Get a baseline from auto-quote, then tune options to fit your budget.',
            },
        ],
        faqs: [
            {
                q: 'What if I have no 3D file?',
                a: 'You can generate an AI 3D mesh from product photos (JPG/PNG) and continue to quote/order. For precise drawings, request modeling or product-development help.',
            },
            {
                q: 'Any tip specific to graduation projects?',
                a: 'Prefer SLA when look matters for presentation; prefer FDM when structure/function demo matters more.',
            },
        ],
        ctaHref: '/services/graduation',
        ctaLabel: 'Graduation 3D printing service',
    },
]
