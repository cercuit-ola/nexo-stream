import { Link } from 'react-router-dom';
import { Gift, DollarSign, Lock, Check } from 'lucide-react';
import nexolLogo from '@/assets/nexolpay-logo.png';

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">Nexol</span>
            <span className="text-xl font-bold text-emerald-400">Pay</span>
          </Link>
          <ul className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <li><a href="#features" className="hover:text-slate-900">Features</a></li>
            <li><a href="#company" className="hover:text-slate-900">Company</a></li>
            <li><a href="#products" className="hover:text-slate-900">Products</a></li>
            <li><a href="#security" className="hover:text-slate-900">Security</a></li>
          </ul>
          <Link
            to="/signup"
            className="bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-slate-800 transition"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-3xl -z-0" />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center relative">
          <div>
            <span className="inline-block text-xs font-semibold text-emerald-500 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full mb-6">
              NOW LIVE ON BASE MAINNET
            </span>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              The Future of <br />
              <span className="text-emerald-400">Digital Finance.</span>
            </h1>
            <p className="mt-6 text-slate-600 text-lg max-w-md leading-relaxed">
              Redeem gift cards, off-ramp crypto, and schedule your savings with ease on the most secure platform built on Base. Experience borderless payments with zero hidden fees.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                to="/signup"
                className="bg-slate-900 text-white font-medium px-7 py-3 rounded-full hover:bg-slate-800 transition"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="text-slate-700 font-medium px-7 py-3 rounded-full border border-slate-200 hover:bg-slate-50 transition"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Visual mock */}
          <div className="relative h-[500px] flex items-center justify-center">
            <div className="absolute w-64 h-[440px] bg-orange-200 rounded-[2.5rem] rotate-[-8deg] shadow-2xl flex items-end justify-center pb-10">
              <div className="bg-white rounded-2xl px-6 py-3 shadow-lg rotate-[-4deg]">
                <p className="text-xs font-semibold text-slate-700">Gift Card</p>
                <p className="text-xs text-slate-500">Selection</p>
              </div>
            </div>
            <div className="relative w-64 h-[440px] bg-slate-50 border border-slate-200 rounded-[2.5rem] rotate-[6deg] shadow-2xl p-5">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-semibold text-slate-400 mb-1">SCHEDULER</p>
                <p className="text-sm font-bold text-slate-900 mb-3">NexolVault</p>
                <div className="space-y-2">
                  <div className="h-2 bg-emerald-100 rounded w-full" />
                  <div className="h-2 bg-slate-100 rounded w-3/4" />
                  <div className="grid grid-cols-4 gap-1 mt-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-6 bg-slate-100 rounded text-[8px] flex items-center justify-center text-slate-400">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-7 bg-emerald-400 rounded text-[10px] flex items-center justify-center text-white font-semibold">
                    Buy Now
                  </div>
                  <div className="h-7 bg-slate-100 rounded text-[10px] flex items-center justify-center text-slate-600">
                    Schedule Release
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Financial tools built for you</h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">
              Our ecosystem is designed to bridge the gap between traditional finance and the decentralized world.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Gift, title: 'Gift Card Redemption', desc: 'Convert your USDC and crypto assets into premium gift cards from 500+ global brands instantly with zero extra fees.' },
              { icon: DollarSign, title: 'Freelancer Escrow', desc: 'Seamlessly swap your crypto to local currency. Fast, secure, and regulated withdrawals directly to your bank account.' },
              { icon: Lock, title: 'Nexol VaultScheduler', desc: 'Automate your financial future. Schedule recurring daily or weekly savings from your wallet into dedicated vaults.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-7 rounded-2xl border border-slate-100 hover:shadow-md transition">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCHEDULING */}
      <section id="products" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="bg-emerald-100/60 rounded-3xl aspect-square flex items-center justify-center p-12">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-48 h-64">
              <p className="text-xs font-semibold text-slate-400 mb-2">Savings Scheduler</p>
              <div className="space-y-2 mt-3">
                <div className="h-2 bg-slate-100 rounded" />
                <div className="h-2 bg-slate-100 rounded w-4/5" />
                <div className="h-2 bg-slate-100 rounded w-3/5" />
                <div className="h-2 bg-emerald-200 rounded w-2/5 mt-4" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              Save smarter with automated scheduling
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Never miss a beat in your wealth-building journey. With Nexol Vault, you can set up automated transfers from your USDC wallet to your Emergency Fund or Savings Vault in just a few taps.
            </p>
            <ul className="mt-6 space-y-3">
              {['Daily or weekly automated transfers', 'Real-time exchange rate approximations', 'Secure vaults powered by smart contracts'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section id="security" className="py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-widest text-slate-400 mb-4">
            ECOSYSTEM PARTNERS & SECURITY
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-slate-300" />
            <span className="text-lg font-semibold text-slate-700 tracking-wide">STELLAR FOUNDATION</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-3xl p-12 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to upgrade your financial life?
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto">
            Join 10,000+ users who trust NexolPay for their daily crypto transactions and savings.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="bg-emerald-400 text-slate-900 font-semibold px-7 py-3 rounded-full hover:bg-emerald-300 transition"
            >
              Get Started Now
            </Link>
            <a
              href="mailto:hello@nexolpay.com"
              className="bg-slate-800 text-white font-medium px-7 py-3 rounded-full hover:bg-slate-700 transition"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="company" className="border-t border-slate-100 py-14 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-lg font-bold text-slate-900">Nexol</span>
              <span className="text-lg font-bold text-emerald-400">Pay</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              The all-in-one financial dashboard for the modern digital era. Built on Base for speed, security, and low fees.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-500 text-xs font-bold">
                𝕏
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-500 text-xs font-bold">
                in
              </a>
            </div>
          </div>
          {[
            { title: 'Product', links: ['Gift Cards', 'Off-ramp', 'Vaults', 'API Docs'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Security', 'Contact'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-slate-900 mb-4">{col.title}</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="hover:text-slate-900">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-100 flex flex-wrap justify-between gap-3 text-xs text-slate-400">
          <span>© 2025 NexolPay Technologies. All rights reserved.</span>
          <span>Built with precision on Base Blockchain.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
