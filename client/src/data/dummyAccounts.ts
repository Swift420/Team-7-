import { User } from '../types';

export const DUMMY_EDITORS: User[] = [
  {
    id: 'user-editor-1',
    name: 'Sarah Jenkins',
    email: 'sarah.editor@journal.io',
    role: 'editor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    title: 'Lead Editor, Tech & Data',
    bio: 'Oversees technology deep dives, architecture analyses, and publication workflows.',
    password: 'editor123'
  },
  {
    id: 'user-editor-2',
    name: 'Marcus Vance',
    email: 'marcus.writer@journal.io',
    role: 'editor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    title: 'Senior Investigative Editor',
    bio: 'Specializes in computational journalism, privacy, and systemic algorithmic trends.',
    password: 'editor123'
  },
  {
    id: 'user-editor-3',
    name: 'Elena Rostova',
    email: 'elena.dev@journal.io',
    role: 'editor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    title: 'Visual Journalism & AI Editor',
    bio: 'Bridges data visualization, creative coding, and modern web publication.',
    password: 'editor123'
  }
];

export const DUMMY_VIEWERS: User[] = [
  {
    id: 'user-viewer-1',
    name: 'Alex Morgan',
    email: 'alex.viewer@reader.io',
    role: 'viewer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    title: 'Data Analyst & Reader',
    bio: 'Passionate reader exploring cutting-edge data stories and technology articles.',
    password: 'viewer123'
  },
  {
    id: 'user-viewer-2',
    name: 'Clara Oswald',
    email: 'clara.student@reader.io',
    role: 'viewer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    title: 'Design Student & Viewer',
    bio: 'Learning UI/UX systems, reading published editorial articles and research papers.',
    password: 'viewer123'
  }
];

export const ALL_DUMMY_USERS: User[] = [...DUMMY_EDITORS, ...DUMMY_VIEWERS];
