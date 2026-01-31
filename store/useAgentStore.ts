import { create } from 'zustand';

export type AgentType = 'Inventory' | 'Customer' | 'Finance' | 'Marketing' | 'Supplier' | 'Analytics';
export type AgentStatus = 'Active' | 'Idle' | 'Working';

export interface AgentLog {
  id: string;
  agentId: AgentType;
  message: string;
  timestamp: string;
}

export interface Agent {
  id: AgentType;
  name: string;
  icon: string; // Lucide icon name
  status: AgentStatus;
  lastAction: string;
  color: string;
  description: string;
}

interface AgentState {
  agents: Agent[];
  logs: AgentLog[];
  updateAgentStatus: (id: AgentType, status: AgentStatus, action: string) => void;
  addLog: (agentId: AgentType, message: string) => void;
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'Inventory',
    name: 'Inventory Agent',
    icon: 'package',
    status: 'Idle',
    lastAction: 'Checked stock levels',
    color: '#4285F4', // Blue
    description: 'Monitors stock levels, predicts reorders, and manages supplier lists.',
  },
  {
    id: 'Customer',
    name: 'Customer Agent',
    icon: 'users',
    status: 'Active',
    lastAction: 'Analyzing footfall',
    color: '#34A853', // Green
    description: 'Tracks customer preferences, purchase history, and loyalty.',
  },
  {
    id: 'Finance',
    name: 'Finance Agent',
    icon: 'indian-rupee',
    status: 'Idle',
    lastAction: 'Daily tally complete',
    color: '#FBBC04', // Yellow
    description: 'Manages cash flow, daily sales reports, and profit analysis.',
  },
  {
    id: 'Marketing',
    name: 'Marketing Agent',
    icon: 'megaphone',
    status: 'Working',
    lastAction: 'Drafting WhatsApp promo',
    color: '#EA4335', // Red
    description: 'Creates promotions and manages customer communication.',
  },
  {
    id: 'Supplier',
    name: 'Supplier Agent',
    icon: 'truck',
    status: 'Idle',
    lastAction: 'Synced with distributor',
    color: '#AB47BC', // Purple
    description: 'Coordinates key deliveries and supplier payments.',
  },
  {
    id: 'Analytics',
    name: 'Analytics Agent',
    icon: 'bar-chart-2',
    status: 'Active',
    lastAction: 'Updating dashboards',
    color: '#FF7043', // Orange
    description: 'Provides insights on business performance and trends.',
  },
];

export const useAgentStore = create<AgentState>((set) => ({
  agents: INITIAL_AGENTS,
  logs: [],
  updateAgentStatus: (id, status, action) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, status, lastAction: action } : agent
      ),
    })),
  addLog: (agentId, message) =>
    set((state) => ({
      logs: [
        {
          id: Date.now().toString(),
          agentId,
          message,
          timestamp: new Date().toISOString(),
        },
        ...state.logs,
      ],
    })),
}));
