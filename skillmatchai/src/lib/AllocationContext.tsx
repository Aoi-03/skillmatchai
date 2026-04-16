'use client';
import React, { createContext, useContext, useState } from 'react';
import { AllocationResult, VolunteerPayload, TaskPayload } from './api';
import { MatchResult } from './mockData';

// Map backend allocation → frontend MatchResult shape
export function mapToMatchResult(
  alloc: AllocationResult,
  tasks: TaskPayload[],
  volunteers: VolunteerPayload[]
): MatchResult {
  const task = tasks.find((t) => t.id === alloc.task_id);
  const volunteer = volunteers.find((v) => v.id === alloc.volunteer_id);
  const score = alloc.confidence_score;

  return {
    id: `match-${alloc.task_id}`,
    taskName: task?.title ?? alloc.task_id,
    taskCategory: task?.urgency_level ?? 'General',
    assignedVolunteer: volunteer?.name ?? (alloc.volunteer_id === 'unassigned' ? 'Unassigned' : alloc.volunteer_id),
    volunteerSkills: volunteer?.skills ?? [],
    confidenceScore: score,
    aiReasoning: alloc.allocation_reasoning,
    status: score === 0 ? 'unmatched' : score >= 75 ? 'matched' : 'partial',
  };
}

interface AllocationState {
  results: MatchResult[];
  volunteers: VolunteerPayload[];
  tasks: TaskPayload[];
  isLoading: boolean;
  error: string | null;
  setResults: (r: MatchResult[]) => void;
  setVolunteers: (v: VolunteerPayload[]) => void;
  setTasks: (t: TaskPayload[]) => void;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
}

const AllocationContext = createContext<AllocationState | null>(null);

export function AllocationProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerPayload[]>([]);
  const [tasks, setTasks] = useState<TaskPayload[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AllocationContext.Provider
      value={{ results, volunteers, tasks, isLoading, error, setResults, setVolunteers, setTasks, setLoading, setError }}
    >
      {children}
    </AllocationContext.Provider>
  );
}

export function useAllocation() {
  const ctx = useContext(AllocationContext);
  if (!ctx) throw new Error('useAllocation must be used inside AllocationProvider');
  return ctx;
}
