import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildQuoteHowToSchema,
  buildPhotoTo3DHowToSchema,
  buildWebPageSchema,
} from "@/lib/aeo-schema";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  absoluteUrl,
  buildQuoteOgImages,
  OG_QUOTE_IMAGE_ALT,
  OG_QUOTE_IMAGE_HEIGHT,
  OG_QUOTE_IMAGE_PATH,
  OG_QUOTE_IMAGE_WIDTH,
  SITE_URL,
} from "@/lib/site-url";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

function quotePath(locale: AppLocale) {
  return getPathname({ locale, href: "/quote" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = (routing.locales.includes(localeParam as AppLocale)
    ? localeParam
    : routing.defaultLocale) as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Quote" });

  const quoteTitle = t("metaTitle");
  const quoteDescription = t("metaDescription");
  const path = quotePath(locale);
  const canonical = `${SITE_URL}${path}`;
  const quoteOgImages = buildQuoteOgImages();
  const quotePrimaryImage = absoluteUrl(OG_QUOTE_IMAGE_PATH);
  const keywords = t.raw("metaKeywords") as string[];

  return {
    title: quoteTitle,
    description: quoteDescription,
    keywords,
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "ko_KR",
      url: canonical,
      siteName: "(주)와우쓰리디",
      title: quoteTitle,
      description: quoteDescription,
      images: quoteOgImages,
    },
    twitter: {
      card: "summary_large_image",
      title: quoteTitle,
      description: quoteDescription,
      images: [quotePrimaryImage],
    },
    alternates: {
      canonical,
      languages: {
        ko: `${SITE_URL}${quotePath("ko")}`,
        en: `${SITE_URL}${quotePath("en")}`,
        "x-default": `${SITE_URL}${quotePath("ko")}`,
      },
    },
    other: {
      "og:image:secure_url": quotePrimaryImage,
    },
  };
}

export default async function QuoteLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  const locale = (routing.locales.includes(localeParam as AppLocale)
    ? localeParam
    : routing.defaultLocale) as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Quote" });

  const quoteTitle = t("metaTitle");
  const quoteDescription = t("metaDescription");
  const path = quotePath(locale);

  const schemas = [
    buildWebPageSchema({
      name: quoteTitle,
      description: quoteDescription,
      path,
      imagePath: OG_QUOTE_IMAGE_PATH,
      imageWidth: OG_QUOTE_IMAGE_WIDTH,
      imageHeight: OG_QUOTE_IMAGE_HEIGHT,
      imageCaption: OG_QUOTE_IMAGE_ALT,
    }),
    buildCollectionPageSchema({
      name: t("collectionName"),
      description: t("collectionDesc"),
      path,
      imagePath: OG_QUOTE_IMAGE_PATH,
    }),
    buildBreadcrumbSchema([
      { name: t("breadcrumbHome"), path: locale === "en" ? "/en" : "/" },
      { name: t("breadcrumbQuote"), path },
    ]),
    buildQuoteHowToSchema(),
    buildPhotoTo3DHowToSchema(),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      {children}
    </>
  );
}
