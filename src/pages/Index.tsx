import { Link } from "react-router-dom";
import { ArrowRight, Star, Truck, Shield, Clock, Trophy, Users, Award, Quote, ChevronRight, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import heroImage from "@/assets/hero-stadium.jpg";
import { useEffect, useState } from "react";
import { productService } from "@/services/database";
import type { Product } from "@/types/database";
const features = [{
  icon: Truck,
  title: "Free Shipping",
  description: "On orders over $100"
}, {
  icon: Shield,
  title: "Authentic Products",
  description: "100% genuine items"
}, {
  icon: Clock,
  title: "Fast Delivery",
  description: "2-3 business days"
}];
const stats = [{
  value: "10K+",
  label: "Happy Skaters"
}, {
  value: "500+",
  label: "Products"
}, {
  value: "99%",
  label: "Satisfaction Rate"
}, {
  value: "24/7",
  label: "Support"
}];
const testimonials = [{
  name: "Coach Elena Petrova",
  role: "Head Coach, JP Skating Academy",
  image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
  quote: "The quality of equipment from JP Skating Club is unmatched. Our academy skaters have shown remarkable improvement since we switched to their gear.",
  rating: 5
}, {
  name: "Coach Michael Chen",
  role: "Youth Development Director",
  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  quote: "As a coach, I need equipment I can trust. JP Skating delivers professional-grade gear that helps young skaters develop their skills with confidence.",
  rating: 5
}, {
  name: "Coach Sarah Williams",
  role: "National Team Coach",
  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
  quote: "From training sessions to competition day, JP Skating products perform at the highest level. Highly recommended for serious skaters.",
  rating: 5
}];
const partners = [{
  name: "ISU",
  logo: "ISU"
}, {
  name: "Olympic",
  logo: "Olympic"
}, {
  name: "World Skating",
  logo: "WS"
}, {
  name: "US Figure Skating",
  logo: "USFS"
}, {
  name: "Skating Japan",
  logo: "JSF"
}, {
  name: "Figure Skating Fed",
  logo: "FSF"
}];
const categories = [{
  name: "Ice Skates",
  description: "Professional blades",
  image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
  count: "150+"
}, {
  name: "Apparel",
  description: "Performance wear",
  image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
  count: "200+"
}, {
  name: "Protective Gear",
  description: "Safety equipment",
  image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=300&fit=crop",
  count: "50+"
}, {
  name: "Accessories",
  description: "Complete your kit",
  image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  count: "300+"
}];
const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setIsLoading(true);
        const products = await productService.getAll();
        setFeaturedProducts(products.slice(0, 4));
      } catch (error) {
        console.error("Error loading featured products:", error);
        setFeaturedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  return <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${heroImage})`
      }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-transparent" />
        </div>
        
        <div className="container relative mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-medium mb-6 animate-fade-in">
              ⛸️ New Season Collection 2026

            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6">
              Skate Like a
              <span className="block text-accent">Champion</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed">
              Discover premium ice skating gear trusted by world-class athletes. 
              Elevate your performance with authentic, professional-grade equipment used by champions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/store">
                <Button variant="gold" size="xl">
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="heroOutline" size="xl">
                <Play className="w-5 h-5" />
                Watch Video
              </Button>
            </div>
            
            {/* Mini Stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-primary-foreground/20">
              {stats.slice(0, 3).map(stat => <div key={stat.label}>
                  <div className="text-3xl font-bold text-accent">{stat.value}</div>
                  <div className="text-sm text-primary-foreground/70">{stat.label}</div>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-secondary py-8 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(feature => <div key={feature.title} className="flex items-center gap-4 justify-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-primary-foreground bg-primary-foreground">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-primary-foreground">{feature.description}</p>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 bg-muted/30 md:py-[50px]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Shop by Category
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find exactly what you need from our extensive collection of professional skating gear.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(category => <Link key={category.name} to={`/store?category=${category.name}`} className="group relative aspect-[4/3] rounded-2xl overflow-hidden">
                <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-accent text-sm font-medium mb-1">{category.count} Products</div>
                  <h3 className="text-xl font-bold text-primary-foreground">{category.name}</h3>
                  <p className="text-primary-foreground/70 text-sm">{category.description}</p>
                </div>
                <div className="absolute top-4 right-4 w-10 h-10 bg-accent rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-5 h-5 text-accent-foreground" />
                </div>
              </Link>)}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-[96px]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Featured Products
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                Explore our top-rated gear chosen by professional skaters and enthusiasts worldwide.
              </p>
            </div>
            <Link to="/store" className="mt-4 md:mt-0">
              <Button variant="outline">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-4 text-center py-12">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary mx-auto" />
                <p className="text-muted-foreground">Loading featured products...</p>
              </div>
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map(product => <Link key={product.id} to={`/product/${product.id}`} className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img src={product.image_url || ""} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {product.category}
                  </span>
                  <h3 className="font-semibold text-card-foreground mt-1 group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-foreground">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="text-sm text-muted-foreground">
                        {product.rating || 5}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>)
            ) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-muted-foreground">No featured products available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Membership Programme Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
                🎯 EXCLUSIVE BENEFITS
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Join Our Elite <span className="text-accent">Membership Club</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Get exclusive discounts, early access to new products, and join a community of passionate skaters. Choose the perfect membership tier for your skating journey.
              </p>

              {/* Quick Benefit Highlights */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Exclusive Discounts</h4>
                    <p className="text-muted-foreground text-sm">Save 10-30% on all products depending on your tier</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Trophy className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Early Access</h4>
                    <p className="text-muted-foreground text-sm">Be the first to shop new releases and limited editions</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Community Access</h4>
                    <p className="text-muted-foreground text-sm">Join exclusive events and connect with fellow skaters</p>
                  </div>
                </div>
              </div>

              <Link to="/programme">
                <Button variant="gold" size="lg">
                  Explore Membership Tiers
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Right Side - Membership Tiers Preview */}
            <div className="grid grid-cols-1 gap-6">
              {/* Silver Tier */}
              <div className="rounded-xl border border-border bg-card hover:shadow-lg transition-shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Star className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Silver</h3>
                    <p className="text-sm text-muted-foreground">$49/year</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>10% discount on all products</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Early access to new products</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Free shipping over $50</span>
                  </li>
                </ul>
              </div>

              {/* Gold Tier - Highlighted */}
              <div className="rounded-xl border-2 border-accent bg-accent/5 hover:shadow-xl transition-shadow p-6 relative">
                <div className="absolute -top-3 left-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                  ⭐ POPULAR
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Gold</h3>
                    <p className="text-sm text-muted-foreground">$99/year</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-foreground font-medium">
                    <Check className="w-4 h-4 text-accent" />
                    <span>20% discount on all products</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground font-medium">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Free shipping on all orders</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground font-medium">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Priority customer support</span>
                  </li>
                </ul>
              </div>

              {/* Platinum Tier */}
              <div className="rounded-xl border border-border bg-card hover:shadow-lg transition-shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-200 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Platinum</h3>
                    <p className="text-sm text-muted-foreground">$199/year</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>30% discount on all products</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>24/7 priority support</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Personal shopping assistant</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Why Choose <span className="text-accent">JP Skating</span>
            </h2>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto">
              We are committed to providing the best skating gear and experience for athletes of all levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary-foreground mb-3">Premium Quality</h3>
              <p className="text-primary-foreground/70">
                All our products meet ISU quality standards and are used by professional skaters worldwide.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary-foreground mb-3">Expert Support</h3>
              <p className="text-primary-foreground/70">
                Our team of skating experts is here to help you find the perfect gear for your performance.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary-foreground mb-3">Best Prices</h3>
              <p className="text-primary-foreground/70">
                Competitive pricing with regular discounts and exclusive member benefits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coach Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
              Trusted by Professionals
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Coaches Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from top coaches and trainers who trust JP Skating for their teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map(testimonial => <div key={testimonial.name} className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
                <Quote className="w-10 h-10 mb-4 bg-primary text-[#c98e40]" />
                <p className="text-muted-foreground leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-accent text-accent" />)}
                </div>
                <div className="flex items-center gap-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover border-2 border-accent" />
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 text-primary bg-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-12 border-y border-border">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">Trusted by Leading Skating Organizations</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {partners.map(partner => <div key={partner.name} className="text-2xl font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                {partner.logo}
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-primary to-primary/90">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Join the <span className="text-accent">JP Skating</span> Community
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Subscribe to get exclusive deals, early access to new arrivals, and insider tips from pro skaters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-accent" />
            <Button variant="gold">
              Subscribe
            </Button>
          </div>
          <p className="text-primary-foreground/50 text-sm mt-4">
            Join 10,000+ subscribers. No spam, unsubscribe anytime.
          </p>
        </div>
      </section>
    </Layout>;
};
export default Index;
