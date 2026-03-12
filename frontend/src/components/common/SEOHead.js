import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEOHead({
  title = 'GadgetGlam — Premium Phone Accessories in Pakistan',
  description = 'Shop top-rated phone cases, chargers, earphones and more at GadgetGlam. Best accessories for iPhone, Samsung & all brands.',
  keywords = 'phone accessories, phone cases, mobile charger, gadgets Pakistan',
  canonical,
  ogImage = 'https://www.gadgetglam.pk/og-image.jpg',
  ogType = 'website',
  product,   // pass product object for product pages
  category   // pass category name for category pages
}) {
  const fullTitle = title.includes('GadgetGlam') ? title : `${title} | GadgetGlam`;
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : '');

  // Product structured data (JSON-LD)
  const productSchema = product ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images?.[0] || ogImage,
    "brand": { "@type": "Brand", "name": product.brand || 'GadgetGlam' },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "PKR",
      "availability": product.stock_status === 'In Stock'
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "url": url
    },
    "aggregateRating": product.reviews_count > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.ratings_avg,
      "reviewCount": product.reviews_count
    } : undefined
  }) : null;

  // Breadcrumb schema for category pages
  const breadcrumbSchema = category ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.gadgetglam.pk" },
      { "@type": "ListItem", "position": 2, "name": category, "item": url }
    ]
  }) : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description"  content={description} />
      <meta name="keywords"     content={keywords} />
      <meta name="robots"       content="index, follow" />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={ogImage} />
      <meta property="og:url"         content={url} />
      <meta property="og:type"        content={ogType} />

      {/* Twitter */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImage} />

      {/* Structured Data */}
      {productSchema    && <script type="application/ld+json">{productSchema}</script>}
      {breadcrumbSchema && <script type="application/ld+json">{breadcrumbSchema}</script>}
    </Helmet>
  );
}
