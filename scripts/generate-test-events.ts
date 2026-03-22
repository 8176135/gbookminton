#!/usr/bin/env bun

/**
 * Generate test events for development
 * 
 * Usage:
 *   bun scripts/generate-test-events.ts                    # Interactive mode
 *   bun scripts/generate-test-events.ts --dry-run          # Print only, don't insert
 *   bun scripts/generate-test-events.ts --count 5          # Generate 5 events per category
 */

import { db } from '../src/lib/server/db';
import { event } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

interface EventOptions {
  count: number;
  deadlineHoursBefore: number;
  showDryRun: boolean;
}

const args = process.argv.slice(2);
const options: EventOptions = {
  count: parseInt(getArg('--count') || '2'),
  deadlineHoursBefore: parseInt(getArg('--deadline-hours') || '24'),
  showDryRun: args.includes('--dry-run'),
};

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const LOCATIONS = [
  'Community Centre Court 1',
  'Sports Hall A',
  'Indoor Court 3',
  'Recreation Center',
  'Badminton Club',
];

const TITLES = [
  'Weekly Social Session',
  'Intermediate Training',
  'Beginners Workshop',
  'Tournament Qualifier',
  'Open Play Session',
  'Competitive Match Night',
  'Coaching Clinic',
  'Mixed Doubles Night',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function formatDate(d: Date): string {
  return d.toISOString();
}

interface GeneratedEvent {
  id: string;
  title: string;
  date: Date;
  location: string;
  duration: number;
  description: string;
  capacity: number;
  deadline: Date;
  cost: number;
  isLocked: boolean;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function generateEvent(timeOffsetHours: number): GeneratedEvent {
  const now = new Date();
  const eventDate = new Date(now.getTime() + timeOffsetHours * 60 * 60 * 1000);
  const deadline = new Date(eventDate.getTime() - options.deadlineHoursBefore * 60 * 60 * 1000);
  
  // Duration between 60-180 minutes
  const duration = [60, 90, 120, 150, 180][Math.floor(Math.random() * 5)];
  
  // Capacity between 8-24
  const capacity = [8, 12, 16, 20, 24][Math.floor(Math.random() * 5)];
  
  // Cost between $5-$25
  const cost = Math.floor(Math.random() * 20 + 5) * 100;
  
  const now_ts = now.getTime();
  
  return {
    id: generateUUID(),
    title: randomItem(TITLES),
    date: eventDate,
    location: randomItem(LOCATIONS),
    duration,
    description: `Test event generated at ${now.toISOString()}. Event time offset: ${timeOffsetHours} hours from now.`,
    capacity,
    deadline,
    cost,
    isLocked: false,
    isPrivate: false,
    createdAt: now,
    updatedAt: now,
  };
}

async function printEventSQL(ev: GeneratedEvent): Promise<void> {
  const values = [
    `'${ev.id}'`,
    `'${ev.title}'`,
    ev.date.getTime(),
    `'${ev.location}'`,
    ev.duration,
    `'${ev.description}'`,
    ev.capacity,
    ev.deadline.getTime(),
    ev.cost,
    ev.isLocked ? 1 : 0,
    ev.isPrivate ? 1 : 0,
    ev.createdAt.getTime(),
    ev.updatedAt.getTime(),
  ].join(', ');

  console.log(`INSERT INTO event (id, title, date, location, duration, description, capacity, deadline, cost, isLocked, isPrivate, createdAt, updatedAt) VALUES (${values});`);
  console.log(`  -- ${ev.title}`);
  console.log(`  -- Event: ${formatDate(ev.date)}`);
  console.log(`  -- Deadline: ${formatDate(ev.deadline)}`);
  console.log();
}

async function insertEvent(ev: GeneratedEvent): Promise<void> {
  await db.insert(event).values({
    id: ev.id,
    title: ev.title,
    date: ev.date,
    location: ev.location,
    duration: ev.duration,
    description: ev.description,
    capacity: ev.capacity,
    deadline: ev.deadline,
    cost: ev.cost,
    isLocked: ev.isLocked,
    isPrivate: ev.isPrivate,
    createdAt: ev.createdAt,
    updatedAt: ev.updatedAt,
  });
}

// Time offsets in hours from now
const TIME_CATEGORIES = [
  { label: 'Currently happening', offsets: [0, -0.5, -0.25] },
  { label: 'Upcoming (within 24h)', offsets: [1, 2, 6, 12, 18, 23] },
  { label: 'Upcoming (within 1 week)', offsets: [24, 48, 72, 96, 120, 144, 168] },
  { label: 'Upcoming (within 1 month)', offsets: [200, 300, 400, 500, 600, 700] },
  { label: 'Past (within 24h)', offsets: [-1, -2, -6, -12, -18, -23] },
  { label: 'Past (within 1 week)', offsets: [-26, -48, -72, -96, -120, -144, -170] },
];

async function main() {
  console.log('='.repeat(60));
  console.log('Test Event Generator');
  console.log('='.repeat(60));
  console.log();
  console.log(`Options:`);
  console.log(`  Events per category: ${options.count}`);
  console.log(`  Deadline before event: ${options.deadlineHoursBefore} hours`);
  console.log(`  Dry run: ${options.showDryRun}`);
  console.log();
  console.log('Current time:', new Date().toISOString());
  console.log();

  const allEvents: GeneratedEvent[] = [];
  
  // Use requested count or default list per category
  const countsPerCategory = options.count > 2 
    ? Array(TIME_CATEGORIES.length).fill(options.count)
    : TIME_CATEGORIES.map(c => c.offsets.length);

  for (let catIdx = 0; catIdx < TIME_CATEGORIES.length; catIdx++) {
    const cat = TIME_CATEGORIES[catIdx];
    console.log(`\n--- ${cat.label} ---\n`);
    
    const count = countsPerCategory[catIdx];
    for (let i = 0; i < count && i < cat.offsets.length; i++) {
      const ev = generateEvent(cat.offsets[i]);
      allEvents.push(ev);
      await printEventSQL(ev);
    }
  }

  console.log('='.repeat(60));
  console.log(`Total events to insert: ${allEvents.length}`);
  console.log('='.repeat(60));

  if (options.showDryRun) {
    console.log('\n[DRY RUN] No events inserted. Run without --dry-run to insert.\n');
    return;
  }

  // Ask for confirmation
  console.log('\nProceed with insertion? (yes/no)');
  
  // For non-interactive use
  if (process.env.CI || process.stdin.isTTY === false) {
    console.log('[CI mode] Skipping insertion. Use --dry-run or pipe "yes".');
    return;
  }

  const input = await readLine();
  
  if (input.toLowerCase() !== 'yes' && input.toLowerCase() !== 'y') {
    console.log('\nAborted. No events inserted.\n');
    return;
  }

  console.log('\nInserting events...\n');
  
  let inserted = 0;
  let failed = 0;
  
  for (const ev of allEvents) {
    try {
      await insertEvent(ev);
      inserted++;
      console.log(`  ✓ Inserted: ${ev.title} (${formatDate(ev.date)})`);
    } catch (err: any) {
      failed++;
      console.log(`  ✗ Failed: ${ev.title} - ${err.message}`);
    }
  }

  console.log();
  console.log('='.repeat(60));
  console.log(`Done! Inserted: ${inserted}, Failed: ${failed}`);
  console.log('='.repeat(60));
}

function readLine(): Promise<string> {
  return new Promise((resolve) => {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('', (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

main().catch(console.error);
