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
                title: 'What infill percentage should I use?',
                body: 'Start around 10–20% for visual mockups, 20–40% for general prototypes, and 40–80% for loaded functional parts — then test.',
            },
            {
                title: 'How does infill affect price?',
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
                title: 'What are the most common STL errors?',
                body: 'Typical issues: non-manifold holes, flipped normals, overlapping faces, self-intersections, and unit mismatches (mm vs inch).',
            },
            {
                title: 'What should I check before uploading?',
                body: 'Use a slicer or mesh inspector, such as the free WOW3D STL checker that runs in your browser, and aim for a closed, watertight solid when possible.',
            },
            {
                title: 'Fix it with auto repair',
                body: 'In the WOW3D STL checker, "Run auto repair" fills holes, stitches gaps, removes duplicate and internal faces and unifies face orientation in one step, and you can download the repaired STL. STL, OBJ and PLY files uploaded to the auto-quote get the same repair automatically, and you can switch back to quoting the original.',
            },
            {
                title: 'If it still will not print',
                body: 'Walls that look fine on screen can still be too thin or unsupported. WOW3D may review and suggest fixes.',
            },
        ],
        faqs: [
            {
                q: 'Can I still get a quote if my STL has holes?',
                a: 'Yes. The auto-quote repairs holes and gaps automatically, prices the repaired file and lists what was fixed. Errors it cannot fix, such as self-intersections or very large holes, are reviewed by our team, who will suggest how to fix them.',
            },
            {
                q: 'Are STEP files error-free?',
                a: 'CAD sources are accurate, but mesh conversion can introduce resolution or face issues — check after convert.',
            },
        ],
        ctaHref: '/stl-checker',
        ctaLabel: 'Check my file for free',
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
                title: 'Why does wall thickness matter?',
                body: 'Walls that are too thin can fail during printing, finishing, or shipping. Recommended minimums differ by process and material.',
            },
            {
                title: 'What minimum wall thickness should I start with?',
                body: 'Often start at 1.0–1.5mm+ for FDM and about 0.6–1.0mm for small SLA/DLP features, then tune to geometry.',
            },
            {
                title: 'Pins, text, and ribs',
                body: 'Tiny protrusions and lettering below process resolution can smear. Thicken critical details or adjust engraving depth.',
            },
            {
                title: 'Checked automatically on upload',
                body: 'When you upload to the WOW3D auto-quote, wall thickness is measured automatically. If a significant area is thinner than 1mm for FDM or 0.6mm for SLA/DLP, you get a warning and the areas are marked in the 3D viewer. Changing the scale or print method recalculates the check, so you can see right away whether scaling up clears it.',
            },
        ],
        faqs: [
            {
                q: 'Does the quote warn me about thin walls?',
                a: 'Yes. Wall thickness is measured on upload, and if much of the surface is below the minimum you get a warning with the thinnest value. Thin walls are not fixed automatically, so thicken them in your design or consider SLA/DLP.',
            },
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
                title: 'Why do supports increase cost?',
                body: 'Support material, extra print time, and removal/finishing labor can all affect the quote.',
            },
            {
                title: 'How can I reduce support cost?',
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
                title: 'Why do 3D printed parts need tolerances?',
                body: 'Parts shrink/expand, have layer error, and shift in finishing. CAD-exact fits can be too tight or too loose.',
            },
            {
                title: 'How much clearance should I leave for assembly?',
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
                title: 'When should a print be split?',
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
    {
        slug: 'capstone-design-prototype-guide',
        path: '/guides/capstone-design-prototype-guide',
        title: 'Capstone design prototyping guide — schedule, modeling & print checklist',
        h1: 'Capstone design prototype',
        h1Accent: 'guide',
        description:
            'A semester-based guide to capstone design prototyping: shaping the idea, 3D modeling, first-round print and test, final build, and presentation prep.',
        eyebrow: 'Capstone Guide',
        sections: [
            {
                title: 'Step 1 · Shape the idea',
                body: 'Write down the problem, core functions, size, and use environment. If you are stuck, idea consulting can suggest structure, materials, and a suitable process.',
            },
            {
                title: 'Step 2 · 3D modeling',
                body: 'Export STL or STEP from CAD such as Fusion 360, SolidWorks, or Inventor. If modeling is hard for your team, we can model from sketches or drawings.',
            },
            {
                title: 'Step 3 · First print & test',
                body: 'Print a low-cost FDM PLA version to check size, assembly, and motion, then fix problem areas before the final build.',
            },
            {
                title: 'Step 4 · Final prototype',
                body: 'Use SLA/DLP resin plus finishing for presentation looks, and PETG or ABS for functional parts. Leave fit allowances on mating parts (see the tolerance guide).',
            },
            {
                title: 'Step 5 · Budget & documents',
                body: 'Check the amount in auto-quote, then request a quote, transaction statement, or tax invoice for research-foundation payment.',
            },
            {
                title: 'Tip · Plan backwards from the deadline',
                body: 'Start the first print 3–4 weeks before the final presentation and place the final order at least 2 weeks before. Typical receipt is about 3–7 days.',
            },
        ],
        faqs: [
            {
                q: 'When should we order a capstone prototype?',
                a: 'Place the final order at least 2 weeks before the presentation, and start 3–4 weeks ahead if you want a first-round test print.',
            },
            {
                q: 'Can we make a capstone prototype without CAD skills?',
                a: 'Yes. Send sketches, drawings, or reference images and we can model a print-ready file for you, then print it.',
            },
            {
                q: 'How can we cut cost on a small capstone budget?',
                a: 'Test with FDM PLA first, lower infill for non-structural parts, and order all files together — files with the same print method and material share one minimum charge.',
            },
        ],
        ctaHref: '/services/capstone',
        ctaLabel: 'Capstone prototyping service',
    },
    {
        slug: 'name-tag-studio',
        path: '/guides/name-tag-studio',
        title: 'Name Tag Studio guide — text, fonts, plates to STL and quote',
        h1: 'Name Tag Studio',
        h1Accent: 'how-to guide',
        description:
            'How to pick text, fonts, plate shape and holes in Name Tag Studio, clear thin-stroke warnings, then save STL or continue to a live quote.',
        eyebrow: 'Name Tag Guide',
        sections: [
            {
                title: 'Open the tool',
                body: 'Name Tag Studio is the default on /maker. Switch to AI 3D Maker when you need a logo or sketch extrusion.',
            },
            {
                title: 'Text and fonts',
                body: 'Set font, size, alignment and letter spacing per line. Bold recommended fonts print more reliably than thin scripts.',
            },
            {
                title: 'Plate, hole, emboss/engrave',
                body: 'Choose rounded rectangle, capsule, circle, letter outline and hole placement, plus emboss or engrave. Preview colours are for design only; pick print colour with the material at quote time.',
            },
            {
                title: 'Printability checks',
                body: 'Warnings appear for strokes under 0.8 mm or text outside the plate. Fix with a bolder font or larger plate before requesting a quote.',
            },
            {
                title: 'STL and order',
                body: 'Save STL or request a quote to load the model into the live quote, then pick material and options. After confirmation, typical receipt is about 3–7 days.',
            },
        ],
        faqs: [
            {
                q: 'Name Tag Studio or AI 3D Maker?',
                a: 'Use Name Tag Studio for text-first tags and badges; use AI 3D Maker for logo and sketch silhouette extrusion.',
            },
            {
                q: 'Can I print in two colours?',
                a: 'Preview plate and text colours are for design review. Print colour is chosen with the material at quote time; two-colour prints need a consultation.',
            },
        ],
        ctaHref: '/maker',
        ctaLabel: 'Open Name Tag Studio',
    },
    {
        slug: 'ai-3d-maker-2-5d',
        path: '/guides/ai-3d-maker-2-5d',
        title: 'AI 3D Maker 2.5D guide — logos, sketches, badges, keycaps',
        h1: 'AI 3D Maker',
        h1Accent: '2.5D guide',
        description:
            'Turn logos, sketches and SVGs into silhouette 2.5D, combine badge or keycap templates and layers, then save STL or continue to a live quote.',
        eyebrow: 'AI 3D Maker Guide',
        sections: [
            {
                title: 'When to use it',
                body: 'Best for planar silhouettes with thickness—logos, badges, keycaps. For solid meshes from product photos, use photo → AI 3D quote.',
            },
            {
                title: 'Prepare inputs',
                body: 'White background with black lines (PNG/JPEG) or SVG looks sharpest. Colour photos and gradients can become a solid blob—try logo mode and background removal.',
            },
            {
                title: 'Templates and layers',
                body: 'Pick round or square badge or 1U keycap templates, then set base, logo extrusion, rim thickness (mm) and bevel. Magnet, pin and MX stem mounts are available.',
            },
            {
                title: 'Preview and quote',
                body: 'Check size and placement in the 3D result, then save STL or request a quote. After ordering, typical receipt is about 3–7 days.',
            },
        ],
        faqs: [
            {
                q: 'AI 3D Maker vs photo → AI 3D?',
                a: 'Maker is for sketch/logo 2.5D extrusion. Photo → AI 3D builds a solid mesh from real photos and continues to quote and order.',
            },
            {
                q: 'How do I set keycap size?',
                a: 'The 1U keycap template uses an 18 mm Cherry MX 1U baseline; you can change the side length within the allowed range.',
            },
        ],
        ctaHref: '/maker?mode=draw',
        ctaLabel: 'Open AI 3D Maker',
    },
]
