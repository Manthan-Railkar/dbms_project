export interface Player {
  id: string;
  number: number;
  name: string;
  role: 'Batter' | 'All-rounder' | 'Bowler' | 'Wicketkeeper';
  battingStyle?: string;
  bowlingStyle?: string;
}

export interface Team {
  id: string;
  name: string;
  city: string;
  color: string;
  badgeType: 'blue-swoosh' | 'red-lion' | 'purple-knight' | 'yellow-eagle';
  players: Player[];
}

export interface Tournament {
  id: string;
  name: string;
  format: 'T20' | 'ODI' | 'Custom';
  startDate: string;
  endDate?: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  capacity?: number;
}

export interface Umpire {
  id: string;
  name: string;
  certification?: string;
}

export const INITIAL_TOURNAMENTS: Tournament[] = [
  { id: '1', name: 'SPIT Premier League 2026', format: 'T20', startDate: '2026-10-26' },
  { id: '2', name: 'Indian Premier T20 Championship 2026', format: 'T20', startDate: '2026-03-15' },
  { id: '3', name: 'Inter-College Trophy 2026', format: 'T20', startDate: '2026-11-01' },
  { id: '4', name: 'ICC Champions Trophy 2026', format: 'ODI', startDate: '2026-06-01' }
];

export const INITIAL_VENUES: Venue[] = [
  { id: '1', name: 'Wankhede Stadium', city: 'Mumbai', capacity: 33108 },
  { id: '2', name: 'M. Chinnaswamy Stadium', city: 'Bengaluru', capacity: 40000 },
  { id: '3', name: 'MA Chidambaram Stadium', city: 'Chennai', capacity: 38200 },
  { id: '4', name: 'Arun Jaitley Stadium', city: 'New Delhi', capacity: 41842 },
  { id: '5', name: 'SPIT Ground', city: 'Mumbai', capacity: 2500 }
];

export const INITIAL_UMPIRES: Umpire[] = [
  { id: '1', name: 'S. Iyer', certification: 'BCCI State Panel' },
  { id: '2', name: 'R. Sharma', certification: 'BCCI State Panel' },
  { id: '3', name: 'Nitin Menon', certification: 'ICC Elite Panel' },
  { id: '4', name: 'Richard Kettleborough', certification: 'ICC Elite Panel' }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'Tech Titans',
    city: 'Mumbai',
    color: '#2563eb',
    badgeType: 'blue-swoosh',
    players: [
      { id: 'p1', number: 1, name: 'Aarav Mehta', role: 'Batter', battingStyle: 'Right-hand bat' },
      { id: 'p2', number: 2, name: 'Rohan Sharma', role: 'Batter', battingStyle: 'Right-hand bat' },
      { id: 'p3', number: 3, name: 'Nikhil Patil', role: 'All-rounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium' },
      { id: 'p4', number: 4, name: 'Arjun Rao', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast' },
      { id: 'p5', number: 5, name: 'Kunal Verma', role: 'Bowler', battingStyle: 'Left-hand bat', bowlingStyle: 'Left-arm spin' },
      { id: 'p6', number: 6, name: 'Aditya Kulkarni', role: 'Wicketkeeper', battingStyle: 'Right-hand bat' },
      { id: 'p7', number: 7, name: 'Varun Dhawan', role: 'All-rounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium' },
      { id: 'p8', number: 8, name: 'Yash Gupta', role: 'Batter', battingStyle: 'Left-hand bat' },
      { id: 'p9', number: 9, name: 'Siddharth Roy', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast-medium' },
      { id: 'p10', number: 10, name: 'Aniket Joshi', role: 'Bowler', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm legbreak' },
      { id: 'p11', number: 11, name: 'Tushar Kadam', role: 'All-rounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak' },
      { id: 'p12', number: 12, name: 'Rahul Jain', role: 'Batter', battingStyle: 'Right-hand bat' },
      { id: 'p13', number: 13, name: 'Omkar Gole', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium' }
    ]
  },
  {
    id: 'team-2',
    name: 'Code Strikers',
    city: 'Pune',
    color: '#dc2626',
    badgeType: 'red-lion',
    players: [
      { id: 'p14', number: 1, name: 'Rohit Desai', role: 'Batter', battingStyle: 'Right-hand bat' },
      { id: 'p15', number: 2, name: 'Mayank Singh', role: 'Batter', battingStyle: 'Left-hand bat' },
      { id: 'p16', number: 3, name: 'Dev Kulkarni', role: 'All-rounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium' },
      { id: 'p17', number: 4, name: 'Ishan Pawar', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast' },
      { id: 'p18', number: 5, name: 'Pranav Joshi', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Left-arm orthodox' },
      { id: 'p19', number: 6, name: 'Sameer Khan', role: 'Wicketkeeper', battingStyle: 'Right-hand bat' },
      { id: 'p20', number: 7, name: 'Chirag Solanki', role: 'All-rounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm medium' },
      { id: 'p21', number: 8, name: 'Omkar Shinde', role: 'Batter', battingStyle: 'Right-hand bat' },
      { id: 'p22', number: 9, name: 'Harsh Vardhan', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast' },
      { id: 'p23', number: 10, name: 'Tanmay Bhatia', role: 'Bowler', battingStyle: 'Left-hand bat', bowlingStyle: 'Slow left-arm' },
      { id: 'p24', number: 11, name: 'Deepesh Kumar', role: 'All-rounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak' },
      { id: 'p25', number: 12, name: 'Vivek Nair', role: 'Batter', battingStyle: 'Right-hand bat' },
      { id: 'p26', number: 13, name: 'Sanket Sawant', role: 'Bowler', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm fast' }
    ]
  },
  {
    id: 'team-3',
    name: 'Byte Blasters',
    city: 'Bengaluru',
    color: '#7c3aed',
    badgeType: 'purple-knight',
    players: [
      { id: 'p27', number: 1, name: 'Virat Kohli', role: 'Batter' },
      { id: 'p28', number: 2, name: 'Faf du Plessis', role: 'Batter' },
      { id: 'p29', number: 3, name: 'Glenn Maxwell', role: 'All-rounder' },
      { id: 'p30', number: 4, name: 'Rajat Patidar', role: 'Batter' },
      { id: 'p31', number: 5, name: 'Dinesh Karthik', role: 'Wicketkeeper' },
      { id: 'p32', number: 6, name: 'Mohammed Siraj', role: 'Bowler' },
      { id: 'p33', number: 7, name: 'Cameron Green', role: 'All-rounder' },
      { id: 'p34', number: 8, name: 'Lockie Ferguson', role: 'Bowler' },
      { id: 'p35', number: 9, name: 'Yash Dayal', role: 'Bowler' },
      { id: 'p36', number: 10, name: 'Karn Sharma', role: 'Bowler' },
      { id: 'p37', number: 11, name: 'Swapnil Singh', role: 'All-rounder' }
    ]
  },
  {
    id: 'team-4',
    name: 'Cyber Kings',
    city: 'Chennai',
    color: '#eab308',
    badgeType: 'yellow-eagle',
    players: [
      { id: 'p38', number: 1, name: 'Ruturaj Gaikwad', role: 'Batter' },
      { id: 'p39', number: 2, name: 'Devon Conway', role: 'Batter' },
      { id: 'p40', number: 3, name: 'Shivam Dube', role: 'All-rounder' },
      { id: 'p41', number: 4, name: 'Ravindra Jadeja', role: 'All-rounder' },
      { id: 'p42', number: 5, name: 'MS Dhoni', role: 'Wicketkeeper' },
      { id: 'p43', number: 6, name: 'Matheesha Pathirana', role: 'Bowler' },
      { id: 'p44', number: 7, name: 'Tushar Deshpande', role: 'Bowler' },
      { id: 'p45', number: 8, name: 'Mustafizur Rahman', role: 'Bowler' },
      { id: 'p46', number: 9, name: 'Sameer Rizvi', role: 'Batter' },
      { id: 'p47', number: 10, name: 'Shardul Thakur', role: 'All-rounder' },
      { id: 'p48', number: 11, name: 'Ajinkya Rahane', role: 'Batter' }
    ]
  }
];
