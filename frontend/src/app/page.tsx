'use client';

import { TransactionDemo } from './components/TransactionDemo';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#D3D3D3] to-[#808080] py-6">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4">
            <Image
              src="/icon.png"
              alt="IntelliGuard Icon"
              width={120}
              height={120}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-4xl font-bold text-black text-center md:text-left">IntelliGuard</h1>
              <p className="mt-2 text-xl text-gray-800 text-center md:text-left">
                Guarding your crypto assets with AI
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl h-max mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#D3D3D3] rounded-lg shadow-lg p-6 border-2 border-black">
          <TransactionDemo />
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center text-gray-800 bottom-0">
        <p>Built with Next.js, RainbowKit, and wagmi</p>
      </footer>
    </div>
  );
}
