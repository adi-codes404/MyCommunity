/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { User, Issue, Verification, Comment, StatusUpdate, Ward, GamificationEvent } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Default Wards Setup
const DEFAULT_WARDS: Ward[] = [
  {
    id: 'ward-1',
    name: 'Indiranagar Ward',
    city: 'Bengaluru',
    state: 'Karnataka',
    boundary: [
      { lat: 12.960, lng: 77.580 },
      { lat: 12.980, lng: 77.580 },
      { lat: 12.980, lng: 77.600 },
      { lat: 12.960, lng: 77.600 },
    ],
  },
  {
    id: 'ward-2',
    name: 'Koramangala Ward',
    city: 'Bengaluru',
    state: 'Karnataka',
    boundary: [
      { lat: 12.940, lng: 77.560 },
      { lat: 12.960, lng: 77.560 },
      { lat: 12.960, lng: 77.580 },
      { lat: 12.940, lng: 77.580 },
    ],
  },
  {
    id: 'ward-3',
    name: 'Malleswaram Ward',
    city: 'Bengaluru',
    state: 'Karnataka',
    boundary: [
      { lat: 12.980, lng: 77.600 },
      { lat: 13.000, lng: 77.600 },
      { lat: 13.000, lng: 77.620 },
      { lat: 12.980, lng: 77.620 },
    ],
  },
];

interface DatabaseSchema {
  users: User[];
  issues: Issue[];
  verifications: Verification[];
  comments: Comment[];
  status_updates: StatusUpdate[];
  wards: Ward[];
  gamification_events: GamificationEvent[];
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    issues: [],
    verifications: [],
    comments: [],
    status_updates: [],
    wards: DEFAULT_WARDS,
    gamification_events: [],
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        // Ensure default wards are loaded if not present
        if (!this.data.wards || this.data.wards.length === 0) {
          this.data.wards = DEFAULT_WARDS;
        }
      } else {
        this.seed();
      }
    } catch (e) {
      console.error('Error loading database, seeding...', e);
      this.seed();
    }
  }

  public save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  private seed() {
    console.log('Seeding initial data for My Community...');
    
    // Create standard users of different roles (strictly Indian, with Alex, Emily, and Marcus removed)
    const seedUsers: User[] = [
      {
        id: 'user-admin',
        name: 'Aarav Sharma',
        email: 'aarav@communityhero.in',
        phone: '+91 98111 22233',
        age: 35,
        locality: 'Malleswaram 15th Cross',
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        role: 'admin',
        ward_id: 'ward-1',
        points: 450,
        badges: ['First Report', 'Verified Contributor', 'Problem Solver', 'Streak Hero'],
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'user-authority-1',
        name: 'Commissioner Rajesh Gowda',
        email: 'rajesh.gowda@bbmp.gov.in',
        phone: '+91 94480 99999',
        age: 52,
        locality: 'Jayanagar 4th Block',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'authority',
        ward_id: 'ward-1',
        points: 100,
        badges: ['Problem Solver'],
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'user-authority-2',
        name: 'Inspector Priya Sharma',
        email: 'priya.sharma@ksp.gov.in',
        phone: '+91 94480 88888',
        age: 31,
        locality: 'Koramangala 5th Block',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'authority',
        ward_id: 'ward-2',
        points: 80,
        badges: [],
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'user-citizen-1',
        name: 'Siddharth Roy',
        email: 'sid@gmail.com',
        phone: '+91 98450 12345',
        age: 27,
        locality: 'Indiranagar 12th Main',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        role: 'citizen',
        ward_id: 'ward-1',
        points: 125,
        badges: ['First Report', 'Verified Contributor'],
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'user-citizen-2',
        name: 'Ananya Iyer',
        email: 'ananya@gmail.com',
        phone: '+91 98333 44455',
        age: 24,
        locality: 'Whitefield Inner Ring Road',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        role: 'citizen',
        ward_id: 'ward-2',
        points: 240,
        badges: ['First Report', 'Verified Contributor', 'Streak Hero'],
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'user-volunteer-1',
        name: 'Kabir Verma',
        email: 'kabir@gmail.com',
        phone: '+91 98222 33344',
        age: 29,
        locality: 'HSR Layout Sector 2',
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        role: 'volunteer',
        ward_id: 'ward-3',
        points: 310,
        badges: ['First Report', 'Verified Contributor', 'Problem Solver'],
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    const categories = ['roads', 'water', 'sanitation', 'garbage', 'lighting', 'drainage', 'civic_behavior', 'other'];
    const statusList = ['reported', 'verified', 'assigned', 'in_progress', 'resolved', 'closed'];
    const severities = ['low', 'medium', 'high', 'critical'];

    const addresses = [
      '1024 100 Feet Road', '405 Double Road', '89 HAL 2nd Stage',
      '12th Main Road & 5th Cross', 'Koramangala 80 Feet Road', 'Malleswaram 15th Cross',
      'CMH Road Metro Station', '789 Residency Road', 'Brigade Road Crossing'
    ];

    const problemTitles: Record<string, string[]> = {
      roads: ['Massive Pothole', 'Crumbling Asphalt', 'Sunken Manhole Cover', 'Unmarked Speed Breaker'],
      water: ['Water Pipe Burst', 'Leaking Fire Hydrant', 'Low Water Pressure', 'Contaminated Water Tap'],
      sanitation: ['Public Toilet Unclean', 'Overflowing Sewage', 'Illegal Dumping Site', 'Stagnant Water Pool'],
      garbage: ['Overflowing Public Dumpster', 'Piles of Uncollected Trash', 'Litter in Park', 'Debris on Sidewalk'],
      lighting: ['Broken Streetlight Pole', 'Flickering Street Lamp', 'Dark Alley Area', 'Unlighted Crosswalk'],
      drainage: ['Blocked Storm Drain', 'Clogged Drainage Pipe', 'Street Flooding after Rain', 'Broken Sewer Lid'],
      civic_behavior: ['Public Nuisance / Loud Music', 'Vandalism/Graffiti on Public Wall', 'Double Parking blocking exit', 'Encroached Footpath'],
      other: ['Broken Bench in Playground', 'Damaged Guard Rail', 'Leaning Electric Pole', 'Abandoned Vehicle']
    };

    const problemDescs: Record<string, string[]> = {
      roads: [
        'A deep pothole has opened up in the middle of the driving lane. Cars are swerving to avoid it, creating extreme danger.',
        'The asphalt is severely crumbling at the corner, creating gravel piles that cause motorcyclists to slide.',
        'The manhole cover has sunken about 4 inches below the road surface, causing extremely harsh impact on vehicle suspensions.',
        'An unmarked speed breaker is placed on a fast lane, causing safety hazards for night drivers.'
      ],
      water: [
        'Potable water is gushing out of the pavement, creating a huge puddle and wasting precious clean water.',
        'The fire hydrant is constantly dripping and forming moss on the sidewalk, causing pedestrians to slip.',
        'Water pressure has dropped significantly in our block, making it difficult to get water above the first floor.',
        'Water coming from the community tap is discolored and has a distinct chemical smell.'
      ],
      sanitation: [
        'The public toilet smells unbearable and there is no running water or soap available.',
        'Sewage water is bubbling up from the drain and flowing onto the sidewalk, creating severe health hazards.',
        'People have started dumping medical and household waste behind the community school.',
        'Stagnant water has pooled in the vacant lot and is breeding a massive swarm of mosquitoes.'
      ],
      garbage: [
        'The main municipal dumpster is completely full and trash is spilling all over the walkway.',
        'Trash has not been collected in over 4 days, causing stray dogs to tear open bags and spread garbage.',
        'The municipal park is filled with plastic bags, empty bottles, and food wraps. It is highly unhygienic.',
        'Construction debris has been dumped on the walking path, forcing elderly residents to walk on the main road.'
      ],
      lighting: [
        'The light bulb is smashed and the electrical wire is exposed from the base. Needs immediate attention.',
        'The street lamp is constantly flickering, which is highly distracting and has caused safety concerns in the neighborhood.',
        'The entire lane is pitch black at night, making it unsafe for women and children to walk after sunset.',
        'The zebra crossing lamp is completely dead, making pedestrians invisible to fast cars.'
      ],
      drainage: [
        'Plastic bags and dry leaves have completely clogged the sewer grate on our street corner.',
        'Rainwater does not drain at all because the underground pipes are completely blocked by silt.',
        'Even minor rain floods the entire road up to knee height because the main stormwater drain is broken.',
        'The metal lid of the sewer is broken in half, leaving a gaping 2-foot hole on the pavement.'
      ],
      civic_behavior: [
        'A local establishment is playing extremely loud music well past midnight on a weekday, disturbing students.',
        'Vandals have painted offensive graffiti across the heritage library walls.',
        'Multiple commercial vehicles are double-parked on a narrow two-way street, creating gridlock.',
        'Shopkeepers have extended their displays completely onto the footpath, forcing pedestrians onto the busy street.'
      ],
      other: [
        'The main swing set in the children’s playground has a broken chain, creating a major hazard.',
        'The steel guard rail protecting cars from falling into the canal has been bent and broken from a previous crash.',
        'An electric pole is leaning at a precarious 15-degree angle towards a residential building.',
        'An old rust-bucket van has been abandoned here for 6 months, acting as a breeding ground for pests.'
      ]
    };

    const mediaPiles: Record<string, string[]> = {
      roads: [
        'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600',
        'https://images.unsplash.com/photo-1599740831144-48606c45f479?w=600'
      ],
      water: [
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
        'https://images.unsplash.com/photo-1527115611129-d6e99235747f?w=600'
      ],
      sanitation: [
        'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600',
        'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=600'
      ],
      garbage: [
        'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600',
        'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600'
      ],
      lighting: [
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600',
        'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=600'
      ],
      drainage: [
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600',
        'https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=600'
      ],
      civic_behavior: [
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600'
      ],
      other: [
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600',
        'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600'
      ]
    };

    const seedIssues: Issue[] = [];
    const seedVerifications: Verification[] = [];
    const seedComments: Comment[] = [];
    const seedStatusUpdates: StatusUpdate[] = [];
    const seedGamificationEvents: GamificationEvent[] = [];

    // Let's generate 50 realistic issues distributed across 3 wards
    for (let i = 1; i <= 50; i++) {
      const ward = DEFAULT_WARDS[(i % 3)];
      const category = categories[i % categories.length] as any;
      const severity = severities[i % severities.length] as any;
      const status = statusList[i % statusList.length] as any;

      // Coordinate randomizing within the ward boundary bounding box
      const latMin = Math.min(...ward.boundary.map(c => c.lat));
      const latMax = Math.max(...ward.boundary.map(c => c.lat));
      const lngMin = Math.min(...ward.boundary.map(c => c.lng));
      const lngMax = Math.max(...ward.boundary.map(c => c.lng));
      
      const lat = latMin + Math.random() * (latMax - latMin);
      const lng = lngMin + Math.random() * (lngMax - lngMin);

      const titleList = problemTitles[category];
      const title = titleList[Math.floor(Math.random() * titleList.length)] + ` at ${ward.name}`;
      const descList = problemDescs[category];
      const description = descList[Math.floor(Math.random() * descList.length)];
      const mediaList = mediaPiles[category];
      const media_urls = [mediaList[Math.floor(Math.random() * mediaList.length)]];

      const reportedBy = seedUsers[3 + (i % 3)].id; // Citizen or volunteer user
      const address = `${addresses[i % addresses.length]}, ${ward.city}`;

      const createdDaysAgo = Math.floor(Math.random() * 20) + 1;
      const created_at = new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString();
      const updated_at = new Date(Date.now() - (createdDaysAgo / 2) * 24 * 60 * 60 * 1000).toISOString();
      
      const upvotes = Math.floor(Math.random() * 25);
      const downvotes = Math.floor(Math.random() * 3);
      
      const upvoted_by: string[] = [];
      const downvoted_by: string[] = [];
      // populate upvoters randomly from our seedUsers
      seedUsers.forEach(u => {
        if (Math.random() > 0.4) upvoted_by.push(u.id);
      });

      const resolved_at = (status === 'resolved' || status === 'closed') 
        ? new Date(Date.now() - (createdDaysAgo / 3) * 24 * 60 * 60 * 1000).toISOString() 
        : undefined;

      const issueId = `issue-${i}`;

      const issue: Issue = {
        id: issueId,
        title,
        description,
        category,
        severity,
        status,
        media_urls,
        location: { lat, lng },
        address,
        ward_id: ward.id,
        reported_by: reportedBy,
        upvotes: upvoted_by.length,
        downvotes,
        upvoted_by,
        downvoted_by,
        created_at,
        updated_at,
        resolved_at,
        ai_summary: `AI analyzed: High probability of a recurring ${category} issue. Resolution advised to safeguard residents.`
      };

      if (status === 'assigned' || status === 'in_progress') {
        issue.assigned_to = 'user-authority-1';
      }

      seedIssues.push(issue);

      // Create a gamification event for the report
      seedGamificationEvents.push({
        id: `event-rep-${i}`,
        user_id: reportedBy,
        event_type: 'reported',
        points_awarded: 10,
        created_at
      });

      // Let's create some verifications for issues that are verified or assigned or resolved
      if (['verified', 'assigned', 'in_progress', 'resolved', 'closed'].includes(status)) {
        const verifier = seedUsers[(i + 1) % seedUsers.length].id;
        seedVerifications.push({
          id: `verification-${i}`,
          issue_id: issueId,
          user_id: verifier,
          verdict: 'confirm',
          comment: 'Verified this personally. It is causing massive local disruption.',
          created_at: new Date(new Date(created_at).getTime() + 4 * 60 * 60 * 1000).toISOString(),
        });

        // Event for verification
        seedGamificationEvents.push({
          id: `event-ver-${i}`,
          user_id: verifier,
          event_type: 'verified',
          points_awarded: 5,
          created_at: new Date(new Date(created_at).getTime() + 4 * 60 * 60 * 1000).toISOString()
        });
      }

      // Add a couple of realistic comments
      if (i % 2 === 0) {
        const commenter = seedUsers[(i + 2) % seedUsers.length].id;
        seedComments.push({
          id: `comment-${i}-1`,
          issue_id: issueId,
          user_id: commenter,
          text: 'I live nearby and can confirm this. Extremely annoying during rush hour!',
          created_at: new Date(new Date(created_at).getTime() + 8 * 60 * 60 * 1000).toISOString()
        });

        seedGamificationEvents.push({
          id: `event-com-${i}`,
          user_id: commenter,
          event_type: 'verified', // Treated as contribution
          points_awarded: 2,
          created_at: new Date(new Date(created_at).getTime() + 8 * 60 * 60 * 1000).toISOString()
        });
      }

      // Add status updates for tracking timelines
      if (status !== 'reported') {
        seedStatusUpdates.push({
          id: `status-update-${i}-1`,
          issue_id: issueId,
          updated_by: 'user-admin',
          old_status: 'reported',
          new_status: 'verified',
          note: 'Community members have verified this. Status upgraded.',
          created_at: new Date(new Date(created_at).getTime() + 6 * 60 * 60 * 1000).toISOString()
        });

        if (['assigned', 'in_progress', 'resolved'].includes(status)) {
          seedStatusUpdates.push({
            id: `status-update-${i}-2`,
            issue_id: issueId,
            updated_by: 'user-authority-1',
            old_status: 'verified',
            new_status: status === 'resolved' ? 'resolved' : 'assigned',
            note: status === 'resolved' ? 'Repair work is fully completed!' : 'Assigned to the civic engineering department.',
            created_at: new Date(new Date(created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
            evidence_url: status === 'resolved' ? 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600' : undefined
          });

          if (status === 'resolved') {
            seedGamificationEvents.push({
              id: `event-res-${i}`,
              user_id: reportedBy,
              event_type: 'resolved',
              points_awarded: 20,
              created_at: new Date(new Date(created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }
      }
    }

    this.data.users = seedUsers;
    this.data.issues = seedIssues;
    this.data.verifications = seedVerifications;
    this.data.comments = seedComments;
    this.data.status_updates = seedStatusUpdates;
    this.data.gamification_events = seedGamificationEvents;
    
    this.save();
    console.log('Database seeded successfully with 50 issues, 6 users, and associated verifications, comments, and milestones.');
  }

  // Getters
  public getUsers(): User[] {
    return this.data.users;
  }

  public getIssues(): Issue[] {
    return this.data.issues;
  }

  public getVerifications(): Verification[] {
    return this.data.verifications;
  }

  public getComments(): Comment[] {
    return this.data.comments;
  }

  public getStatusUpdates(): StatusUpdate[] {
    return this.data.status_updates;
  }

  public getWards(): Ward[] {
    return this.data.wards;
  }

  public getGamificationEvents(): GamificationEvent[] {
    return this.data.gamification_events;
  }

  // Setters / Actions
  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }

  public updateUser(userId: string, updates: Partial<User>) {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      this.save();
    }
  }

  public addIssue(issue: Issue) {
    this.data.issues.push(issue);
    this.save();
  }

  public updateIssue(issueId: string, updates: Partial<Issue>) {
    const issue = this.data.issues.find(i => i.id === issueId);
    if (issue) {
      Object.assign(issue, updates);
      issue.updated_at = new Date().toISOString();
      this.save();
    }
  }

  public addVerification(ver: Verification) {
    this.data.verifications.push(ver);
    this.save();
  }

  public addComment(comment: Comment) {
    this.data.comments.push(comment);
    this.save();
  }

  public addStatusUpdate(update: StatusUpdate) {
    this.data.status_updates.push(update);
    this.save();
  }

  public addGamificationEvent(event: GamificationEvent) {
    this.data.gamification_events.push(event);
    this.save();
  }
}

export const db = new Database();
