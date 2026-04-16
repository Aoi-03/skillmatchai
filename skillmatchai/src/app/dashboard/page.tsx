'use client';
import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardHeader from './components/DashboardHeader';
import UploadSection from './components/UploadSection';
import KPIBentoGrid from './components/KPIBentoGrid';
import ResultsSection from './components/ResultsSection';
import { AllocationProvider } from '@/lib/AllocationContext';

export default function DashboardPage() {
  return (
    <AllocationProvider>
      <AppLayout>
        <div className="min-h-screen px-6 py-6 xl:px-8 2xl:px-10 max-w-screen-2xl">
          <DashboardHeader />
          <UploadSection />
          <KPIBentoGrid />
          <ResultsSection />
        </div>
      </AppLayout>
    </AllocationProvider>
  );
}