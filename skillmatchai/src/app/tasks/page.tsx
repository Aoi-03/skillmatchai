import React from 'react';
import AppLayout from '@/components/AppLayout';
import TasksHeader from './components/TasksHeader';
import TasksTable from './components/TasksTable';

export default function TasksPage() {
  return (
    <AppLayout>
      <div className="min-h-screen px-6 py-6 xl:px-8 2xl:px-10 max-w-screen-2xl">
        <TasksHeader />
        <TasksTable />
      </div>
    </AppLayout>
  );
}