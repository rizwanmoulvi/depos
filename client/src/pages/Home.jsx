import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import hederaLogo from '../../assets/hedera-logo-black-a0b1bd4f.svg';
import bonzoLogo from '../../assets/bonzo.png';

export default function Home() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'Secure Escrow',
      description: 'Smart contract-based escrow ensures your deposits are protected and transparently managed on Hedera.',
      icon: '🔒'
    },
    {
      title: 'Yield Generation',
      description: 'Deposits automatically earn yield through Bonzo Finance integration, maximizing returns for both parties.',
      icon: '📈'
    },
    {
      title: 'Instant Settlement',
      description: 'Fast, automated dispute resolution and settlement powered by Hedera\'s high-speed network.',
      icon: '⚡'
    },
    {
      title: 'Full Transparency',
      description: 'All transactions and agreements are recorded on-chain, providing complete transparency and immutability.',
      icon: '👁️'
    }
  ];

  const stats = [
    { value: '$2.5M+', label: 'Total Value Locked' },
    { value: '1,200+', label: 'Active Agreements' },
    { value: '5.2%', label: 'Average APY' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm text-blue-400 font-medium">Now live on Hedera Testnet</span>
            </div>

            <h1 className="text-6xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              The Future of Rental Security Deposits
              <br />
              Secure, Decentralized, and Yield-Generating
            </h1>
            
            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              Rental Agreements Reinvented On Hedera Powered By Bonzo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/role-selection')}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              
              <button
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-lg font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-20 border-t border-white/10">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
            <div className="text-center text-gray-400">Expected</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wide">Core Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
              Built for Modern Rentals
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need for secure, transparent rental agreements
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setActiveFeature(idx)}
                className={`relative p-8 rounded-2xl border transition-all cursor-pointer ${
                  activeFeature === idx
                    ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/50 shadow-xl shadow-blue-500/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-wide">Process</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
              Simple Four-Step Process
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Create Agreement',
                description: 'Landlord sets terms and deposit amount for the rental agreement'
              },
              {
                step: '02',
                title: 'Tenant Deposits',
                description: 'Tenant reviews and deposits USDC into the secure escrow vault'
              },
              {
                step: '03',
                title: 'Earn',
                description: 'Deposits earn yield through Bonzo Finance until agreement ends'
              },
              {
                step: '04',
                title: 'Settle',
                description: 'Tenant gets deposit and share of yield, landlord and platform gets a share of yield'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-7xl font-bold text-white/5 mb-4">{item.step}</div>
                <div className="absolute top-0 left-0 text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 mt-8">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wide">Technology</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
              Powered by Leading Protocols
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Hedera',
                description: 'High-speed, low-cost blockchain with enterprise-grade security',
                color: 'from-purple-500 to-pink-500',
                image: hederaLogo,
                imageType: 'logo'
              },
              {
                name: 'Bonzo Finance',
                description: 'DeFi lending protocol for automatic yield generation',
                color: 'from-blue-500 to-cyan-500',
                image: bonzoLogo,
                imageType: 'logo'
              },
              {
                name: 'Smart Contracts',
                description: 'Audited, secure escrow contracts for transparent agreements',
                color: 'from-green-500 to-emerald-500',
                icon: '📜',
                imageType: 'icon'
              }
            ].map((tech, idx) => (
              <div key={idx} className="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all group">
                {tech.imageType === 'logo' ? (
                  <div className="w-16 h-16 rounded-lg bg-white/95 p-3 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <img 
                      src={tech.image} 
                      alt={tech.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {tech.icon}
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-3">{tech.name}</h3>
                <p className="text-gray-400">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join the future of rental agreements today
              </p>
              <button
                onClick={() => navigate('/role-selection')}
                className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
              >
                Launch App
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p className="mb-4">© 2025 Depos Protocol. Built on Hedera.</p>
            <div className="flex justify-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
