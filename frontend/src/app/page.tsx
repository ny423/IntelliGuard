'use client';

import { TransactionDemo } from './components/TransactionDemo';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 py-6">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white text-center md:text-left">IntelliGuard Demo</h1>
            <p className="mt-2 text-xl text-gray-400 text-center md:text-left">
              Wallet Connection & Transaction Hook Demo
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl h-max mx-auto px-4 sm:px-6 lg:px-8">
        <TransactionDemo />
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center text-gray-500 bottom-0">
        <p>Built with Next.js, RainbowKit, and wagmi</p>
      </footer>
    </div>
  );
}
