'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import enMessages from '../../messages/en.json'

const universities = [
  { name: "MIT", icon: "🏛️" },
  { name: "Stanford", icon: "🎯" },
  { name: "Harvard", icon: "📖" },
  { name: "Berkeley", icon: "🌉" },
  { name: "CMU", icon: "🎨" },
  { name: "Princeton", icon: "🔬" }
]

// Real university count based on actual document analysis
const TOTAL_UNIVERSITIES = 27

export default function HomePage() {
  // Use real document counts for consistent data across all pages
  const totalCourses = 128  // Real English document count
  const categories = 26     // Real category count
  
  // Load English translations
  const messages = enMessages
  
  // Create features array from translations
  const features = [
    {
      title: messages.home.features.universityQuality.title,
      description: messages.home.features.universityQuality.description,
      icon: "🎓"
    },
    {
      title: messages.home.features.comprehensiveCoverage.title,
      description: messages.home.features.comprehensiveCoverage.description,
      icon: "📚"
    },
    {
      title: messages.home.features.completelyFree.title,
      description: messages.home.features.completelyFree.description,
      icon: "🆓"
    },
    {
      title: messages.home.features.selfPaced.title,
      description: messages.home.features.selfPaced.description,
      icon: "⏰"
    }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale="en" />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {messages.home.hero.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                {messages.home.hero.subtitle}
              </p>
              <p className="text-lg mb-12 text-blue-200 max-w-3xl mx-auto">
                {messages.home.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/courses" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  {messages.home.hero.cta}
                </Link>
                <Link href="/universities" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                  {messages.home.universities.title}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-2">{totalCourses}+</div>
                <div className="text-gray-600">{messages.home.stats.courses}</div>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-4xl font-bold text-purple-600 mb-2">{categories}</div>
                <div className="text-gray-600">{messages.home.stats.subjects}</div>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-4xl font-bold text-green-600 mb-2">{TOTAL_UNIVERSITIES}</div>
                <div className="text-gray-600">{messages.home.stats.universities}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Universities Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {messages.home.universities.title}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {messages.home.universities.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {universities.map((university, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">{university.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{university.name}</h3>
                  <Link href="/universities" className="text-blue-600 hover:text-blue-800 font-medium">
                    {messages.home.universities.learnMore}
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/universities" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                {messages.home.hero.cta}
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose {messages.home.hero.title}?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {messages.home.hero.description}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-lg shadow-md">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {messages.home.cta.title}
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              {messages.home.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                {messages.home.cta.button}
              </Link>
              <Link href="/tutorial" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                {messages.nav.tutorial}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer locale="en" />
    </div>
  )
}