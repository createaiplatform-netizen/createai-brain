// src/lib/familyThemes.ts

export type FamilyThemeId =
  | 'nathan'
  | 'nolan'
  | 'carolina'
  | 'jenny'
  | 'shawny'
  | 'shelly'
  | 'dennis'
  | 'nakyllah'
  | 'terri'
  | 'dad';

export type FamilyTheme = {
  id: FamilyThemeId;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
  icon?: string;
  tone: 'playful' | 'calm' | 'grounded' | 'cozy' | 'elegant';
};

export const familyThemes: Record<FamilyThemeId, FamilyTheme> = {
  nathan: {
    id: 'nathan',
    name: 'Nathan',
    primary: '#1B4332',
    secondary: '#2D6A4F',
    background: '#0B2218',
    surface: '#12251B',
    text: '#F4FFF7',
    accent: '#74C69D',
    tone: 'grounded',
    icon: '🌲',
  },
  nolan: {
    id: 'nolan',
    name: 'Nolan',
    primary: '#0F4C75',
    secondary: '#3282B8',
    background: '#0B1C2A',
    surface: '#102133',
    text: '#F5FAFF',
    accent: '#00BFA6',
    tone: 'calm',
    icon: '💡',
  },
  carolina: {
    id: 'carolina',
    name: 'Carolina',
    primary: '#8C4A2F',
    secondary: '#D9A273',
    background: '#1F130E',
    surface: '#2A1810',
    text: '#FFF7F0',
    accent: '#C75B39',
    tone: 'elegant',
    icon: '✨',
  },
  jenny: {
    id: 'jenny',
    name: 'Jenny',
    primary: '#0077B6',
    secondary: '#00B4D8',
    background: '#02141F',
    surface: '#032030',
    text: '#F3FBFF',
    accent: '#90E0EF',
    tone: 'playful',
    icon: '🚢',
  },
  shawny: {
    id: 'shawny',
    name: 'Shawny',
    primary: '#343A40',
    secondary: '#495057',
    background: '#121416',
    surface: '#1C1F22',
    text: '#F8F9FA',
    accent: '#FFC300',
    tone: 'grounded',
    icon: '🚜',
  },
  shelly: {
    id: 'shelly',
    name: 'Shelly',
    primary: '#F48FB1',
    secondary: '#F06292',
    background: '#2A1018',
    surface: '#3A1823',
    text: '#FFF5F8',
    accent: '#FFB6C1',
    tone: 'cozy',
    icon: '🤍',
  },
  dennis: {
    id: 'dennis',
    name: 'Dennis',
    primary: '#264653',
    secondary: '#2A9D8F',
    background: '#0E1A1F',
    surface: '#152227',
    text: '#EAF4F7',
    accent: '#E9C46A',
    tone: 'calm',
    icon: '🛠️',
  },
  nakyllah: {
    id: 'nakyllah',
    name: 'Nakyllah',
    primary: '#FFB4A2',
    secondary: '#FFCDB2',
    background: '#2B1814',
    surface: '#3A211B',
    text: '#FFF6F2',
    accent: '#B5838D',
    tone: 'cozy',
    icon: '🐴',
  },
  terri: {
    id: 'terri',
    name: 'Terri',
    primary: '#8D6E63',
    secondary: '#A1887F',
    background: '#241712',
    surface: '#32201A',
    text: '#FFF5EE',
    accent: '#FFCC80',
    tone: 'grounded',
    icon: '🐎',
  },
  dad: {
    id: 'dad',
    name: 'Dad',
    primary: '#6D4C41',
    secondary: '#8D6E63',
    background: '#1F130F',
    surface: '#2C1B15',
    text: '#FFF3E9',
    accent: '#A5D6A7',
    tone: 'grounded',
    icon: '🌾',
  },
};

export const defaultFamilyTheme: FamilyTheme = familyThemes.nathan;

export function getFamilyTheme(id?: FamilyThemeId | null): FamilyTheme {
  if (!id) return defaultFamilyTheme;
  return familyThemes[id] ?? defaultFamilyTheme;
}
