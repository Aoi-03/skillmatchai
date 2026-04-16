import React from 'react';
import AppLayout from '@/components/AppLayout';
import VolunteersHeader from './components/VolunteersHeader';
import VolunteersTable from './components/VolunteersTable';

export default function VolunteersPage() {
  return (
    <AppLayout>
      <div className="min-h-screen px-6 py-6 xl:px-8 2xl:px-10 max-w-screen-2xl">
        <VolunteersHeader />
        <VolunteersTable />
      </div>
    </AppLayout>
  );
}