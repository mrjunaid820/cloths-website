import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Star, 
  Quote, 
  ShieldCheck, 
  Scissors, 
  Clock, 
  Award 
} from 'lucide-react';
import { Hero } from '../components/Hero';
import { CategorySection } from '../components/CategorySection';
import { ProductCard } from '../components/ProductCard';
import { CollectionCarousel } from '../components/CollectionCarousel';
import { LookbookSection } from '../components/LookbookSection';
import { SeasonalCampaignBanner } from '../components/SeasonalCampaignBanner';
import { api } from '../api';

export function HomePage({ onNavigate, onSelectProduct, onQuickView }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [
          featData, 
          newData, 
          bestData, 
          trendData, 
          saleData,
          campaignData,
          lookbookData
        ] = await Promise.all([
          api.getProducts({ isFeatured: 'true', limit: 8 }),
          api.getProducts({ isNew: 'true', limit: 8 }),
          api.getProducts({ sort: 'popular', limit: 8 }),
          api.getProducts({ limit: 8, sort: 'rating' }),
          api.getProducts({ hasDiscount: 'true', limit: 8 }),
          api.getActiveCampaign().catch(() => null),
          api.getLookbooks().catch(() => [])
        ]);

        setFeaturedProducts(featData.products || []);
        setNewArrivals(newData.products || []);
        setBestSellers(bestData.products || []);
        setTrendingProducts(trendData.products || []);
        setSaleProducts(saleData.products || []);
        // Seasonal filtered by wedding or festive tags
        const seasonal = (featData.products || []).concat(newData.products || []).filter(p => 
          p.category === 'Shalwar Qameez' || p.category === 'Suits' || p.category === 'Dresses'
        );
        setSeasonalProducts(seasonal.length > 0 ? seasonal : (featData.products || []));
        setActiveCampaign(campaignData?.campaign || null);
        setLookbooks(lookbookData?.lookbooks || []);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const testimonials = [
    {
      name: 'Princess Ameera Al-Saud',
      city: 'Riyadh',
      text: 'The bespoke embroidered velvet shawl and sherwani exceeded every couture expectation. The craftsmanship is worthy of royal celebrations.',
      rating: 5,
      role: 'Private Haute Client'
    },
    {
      name: 'Julian Montgomery',
      city: 'London & New York',
      text: 'Unstructured cashmere tailoring that rivals the finest Savile Row houses. The hand feel of the Super 150s Merino wool is extraordinary.',
      rating: 5,
      role: 'Architect & Collector'
    },
    {
      name: 'Dr. Soraya Malek',
      city: 'Dubai',
      text: 'Their Nidha silk abayas are whisper-light, exquisitely draping with subtle crystal finishing. The international express delivery arrived in 48 hours.',
      rating: 5,
      role: 'Fashion Editor'
    }
  ];

  return (
    <div className="w-full transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* 1. Hero Section */}
      <Hero onNavigate={onNavigate} />

      {/* 2. Curated Categories Section */}
      <CategorySection onSelectCategory={(catName) => onNavigate('shop', { category: catName })} />

      {/* 3. Seasonal Campaign Banner (if active) */}
      {activeCampaign && (
        <SeasonalCampaignBanner 
          campaign={activeCampaign} 
          onNavigate={onNavigate} 
        />
      )}

      {/* 4. New Arrivals Collection Carousel */}
      <CollectionCarousel
        title="New Arrivals"
        subtitle="Exclusive modern silhouettes and tailored seasonal additions fresh from the workshop."
        badge="Fresh Drop"
        products={newArrivals}
        onSelectProduct={onSelectProduct}
        onQuickView={onQuickView}
        onNavigate={onNavigate}
        viewAllLink={{ page: 'shop', params: { filter: 'new' } }}
      />

      {/* 5. Best Sellers Collection Carousel */}
      <CollectionCarousel
        title="Best Sellers"
        subtitle="Our most celebrated menswear, womenswear, and bespoke imperial attire."
        badge="Most Coveted"
        products={bestSellers}
        onSelectProduct={onSelectProduct}
        onQuickView={onQuickView}
        onNavigate={onNavigate}
        viewAllLink={{ page: 'shop', params: { filter: 'popular' } }}
      />

      {/* 6. Editorial Fashion Lookbook with Interactive Hotspots */}
      <LookbookSection
        lookbooks={lookbooks}
        onSelectProduct={onSelectProduct}
        onQuickView={onQuickView}
      />

      {/* 7. Trending Products Collection Carousel */}
      <CollectionCarousel
        title="Trending This Season"
        subtitle="Sought-after styles setting new benchmarks in Pakistani luxury dressing."
        badge="Popular Now"
        products={trendingProducts}
        onSelectProduct={onSelectProduct}
        onQuickView={onQuickView}
        onNavigate={onNavigate}
        viewAllLink={{ page: 'shop', params: {} }}
      />

      {/* 8. Editorial Runway Spotlight Banner */}
      <section className="relative my-12 bg-stone-950 text-white overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 sm:p-16 lg:p-20 flex flex-col justify-center items-start z-10">
            <span className="text-xs tracking-[0.3em] uppercase text-amber-300 font-semibold mb-4">
              Artisanal Heritage
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-tight mb-6">
              The Intersection of Royal Eastern Embroidery & Italian Sartorial Lineage.
            </h2>
            <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed mb-8 max-w-lg">
              Each garment in our imperial archives is spun from natural fibers—pure mulberry silks, raw spun cottons, and fine virgin wools. Master artisans hand-stitch delicate zardozi needlework and precise horn button closures over dozens of dedicated workshop hours.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('shop', { category: 'Shalwar Qameez' })}
                className="bg-white text-stone-950 text-xs tracking-widest uppercase font-bold py-3.5 px-6 hover:bg-stone-200 transition-colors"
              >
                Explore Heritage Line
              </button>
              <button
                onClick={() => onNavigate('about')}
                className="border border-stone-600 text-stone-200 text-xs tracking-widest uppercase font-semibold py-3.5 px-6 hover:border-white hover:text-white transition-colors"
              >
                Read The Atelier Story
              </button>
            </div>
          </div>

          <div className="relative min-h-[380px] lg:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop"
              alt="Artisanal Embroidery"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent lg:hidden" />
          </div>
        </div>
      </section>

      {/* 9. Seasonal / Festive Collection Carousel */}
      <CollectionCarousel
        title="Seasonal Festive Capsule"
        subtitle="Intricate gold bullion, velvet shawls, and ceremonial couture for festive gatherings."
        badge="Festive 2026"
        products={seasonalProducts}
        onSelectProduct={onSelectProduct}
        onQuickView={onQuickView}
        onNavigate={onNavigate}
        viewAllLink={{ page: 'shop', params: { category: 'Shalwar Qameez' } }}
      />

      {/* 10. Sale & Limited Privilege Carousel (if discounted items exist) */}
      {saleProducts.length > 0 && (
        <CollectionCarousel
          title="Privilege Reductions"
          subtitle="Exceptional archival pieces at celebratory pricing for a limited time."
          badge="Special Offer"
          products={saleProducts}
          onSelectProduct={onSelectProduct}
          onQuickView={onQuickView}
          onNavigate={onNavigate}
          viewAllLink={{ page: 'shop', params: { filter: 'sale' } }}
        />
      )}

      {/* 7. Client Testimonials */}
      <section className="py-24 border-t transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs tracking-[0.25em] uppercase font-semibold block mb-2" style={{ color: 'var(--text-muted)' }}>
              Patron Acclaim
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Voices of Distinction
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div 
                key={idx} 
                className="p-8 border rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                <div>
                  <div className="flex text-amber-500 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 opacity-25 mb-2" style={{ color: 'var(--accent-primary)' }} />
                  <p className="text-xs sm:text-sm italic font-serif leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                    "{t.text}"
                  </p>
                </div>
                <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h4 className="font-semibold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                    {t.name}
                  </h4>
                  <span className="text-[11px] tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {t.role} — {t.city}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
