import React from 'react';
import { Award, Heart, Sparkles, Users, Crown, Star, Gem, Leaf } from 'lucide-react';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              About <span className="text-blue-200">BlueBells</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Where timeless elegance meets modern sophistication in the world of luxury jewelry and lifestyle
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      {/* Our Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">Our Story</h2>
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  Founded on the principles of exceptional craftsmanship and timeless beauty, BlueBells represents the pinnacle of luxury jewelry and lifestyle excellence. Our journey began with a simple vision: to create pieces that celebrate life&apos;s most precious moments.
                </p>
                <p>
                  Each piece in our collection is meticulously handcrafted by master artisans who bring decades of expertise and passion to their work. From the selection of the finest materials to the final polish, every detail reflects our commitment to perfection.
                </p>
                <p>
                  Today, BlueBells stands as a beacon of elegance, offering not just jewelry, but an entire lifestyle experience that encompasses beauty, sophistication, and luxury in every facet.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <Crown className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900">Premium Quality</h3>
                    <p className="text-sm text-gray-600 mt-2">Finest materials sourced globally</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <Heart className="h-8 w-8 text-red-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900">Passionate Craft</h3>
                    <p className="text-sm text-gray-600 mt-2">Made with love and precision</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <Sparkles className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900">Timeless Design</h3>
                    <p className="text-sm text-gray-600 mt-2">Classic elegance meets modern style</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <Users className="h-8 w-8 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900">Personal Touch</h3>
                    <p className="text-sm text-gray-600 mt-2">Customized for your unique story</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide every decision and inspire every creation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Excellence</h3>
                <p className="text-gray-600 leading-relaxed">
                  We pursue perfection in every detail, ensuring that each piece meets the highest standards of quality and craftsmanship.
                </p>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                  <Leaf className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Sustainability</h3>
                <p className="text-gray-600 leading-relaxed">
                  Committed to ethical sourcing and sustainable practices, we ensure our beauty doesn&apos;t come at the cost of our planet.
                </p>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-full p-4 w-16 h-16 mx-auto mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Heritage</h3>
                <p className="text-gray-600 leading-relaxed">
                  Honoring traditional craftsmanship while embracing innovation, we create heirlooms for generations to come.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Collections</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our curated selection of luxury jewelry and lifestyle products
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <Gem className="h-12 w-12 text-blue-200 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Handcrafted Jewelry</h3>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  Exquisite pieces that celebrate elegance and sophistication, each one telling a unique story of craftsmanship and beauty.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Diamond Collections</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Gold Jewelry</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Custom Designs</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <Star className="h-12 w-12 text-purple-200 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Luxury Lifestyle</h3>
                <p className="text-purple-100 mb-6 leading-relaxed">
                  Premium beauty and lifestyle products crafted with the finest ingredients and attention to detail.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Beauty Serums</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Luxury Candles</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Premium Care</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Commitment</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Every piece we create is a testament to our dedication to excellence
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-200 mb-2">100%</div>
                <p className="text-sm text-blue-100">Handcrafted Quality</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-200 mb-2">50+</div>
                <p className="text-sm text-blue-100">Years of Expertise</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-200 mb-2">1000+</div>
                <p className="text-sm text-blue-100">Happy Customers</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-200 mb-2">∞</div>
                <p className="text-sm text-blue-100">Lifetime Memories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Experience BlueBells</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover the perfect piece that tells your unique story. Let us help you create memories that last a lifetime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              Explore Collections
            </button>
            <button className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl">
              Schedule Consultation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}