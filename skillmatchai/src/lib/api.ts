// ── Types matching backend schema ─────────────────────────────────────────────
export interface VolunteerPayload {
  id: string;
  name: string;
  skills: string[];
  availability: string;
}

export interface TaskPayload {
  id: string;
  title: string;
  required_skills: string[];
  urgency_level: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface AllocationResult {
  task_id: string;
  volunteer_id: string;
  confidence_score: number;
  allocation_reasoning: string;
}

export interface AllocationResponse {
  allocations: AllocationResult[];
}

export interface ApiError {
  error: true;
  message: string;
}

// ── File parsers ──────────────────────────────────────────────────────────────

function parseCSVRows(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

export function parseVolunteers(text: string, filename: string): VolunteerPayload[] {
  const isJson = filename.endsWith('.json');
  const rows: Record<string, string>[] = isJson ? JSON.parse(text) : parseCSVRows(text);
  return rows.map((r, i) => ({
    id: r.id || `vol-${i + 1}`,
    name: r.name || `Volunteer ${i + 1}`,
    skills: r.skills
      ? r.skills.split('|').map((s: string) => s.trim()).filter(Boolean)
      : [],
    availability: r.availability || 'available',
  }));
}

export function parseTasks(text: string, filename: string): TaskPayload[] {
  const isJson = filename.endsWith('.json');
  const rows: Record<string, string>[] = isJson ? JSON.parse(text) : parseCSVRows(text);
  const validUrgency = new Set(['Critical', 'High', 'Medium', 'Low']);
  return rows.map((r, i) => ({
    id: r.id || `task-${i + 1}`,
    title: r.title || r.name || `Task ${i + 1}`,
    required_skills: r.required_skills
      ? r.required_skills.split('|').map((s: string) => s.trim()).filter(Boolean)
      : [],
    urgency_level: validUrgency.has(r.urgency_level || r.priority)
      ? (r.urgency_level || r.priority) as TaskPayload['urgency_level']
      : 'Medium',
  }));
}

// ── API client ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function optimizeAllocation(
  volunteers: VolunteerPayload[],
  tasks: TaskPayload[]
): Promise<AllocationResponse | ApiError> {
  const res = await fetch(`${API_BASE}/api/v1/optimize-allocation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volunteers, tasks }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    return {
      error: true,
      message: data.message || `Server error (${res.status})`,
    };
  }

  return data as AllocationResponse;
}
