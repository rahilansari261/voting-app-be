import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword
    }
  });

  console.log('✅ Created users:', { user1: user1.name, user2: user2.name });

  // Create sample polls
  const poll1 = await prisma.poll.create({
    data: {
      question: 'What is your favorite programming language?',
      isPublished: true,
      creatorId: user1.id,
      options: {
        create: [
          { text: 'JavaScript' },
          { text: 'Python' },
          { text: 'Java' },
          { text: 'Go' }
        ]
      }
    }
  });

  const poll2 = await prisma.poll.create({
    data: {
      question: 'Which framework do you prefer for frontend development?',
      isPublished: true,
      creatorId: user2.id,
      options: {
        create: [
          { text: 'React' },
          { text: 'Vue.js' },
          { text: 'Angular' },
          { text: 'Svelte' }
        ]
      }
    }
  });

  const poll3 = await prisma.poll.create({
    data: {
      question: 'What is your preferred database?',
      isPublished: false, // Unpublished poll
      creatorId: user1.id,
      options: {
        create: [
          { text: 'PostgreSQL' },
          { text: 'MySQL' },
          { text: 'MongoDB' },
          { text: 'Redis' }
        ]
      }
    }
  });

  console.log('✅ Created polls:', { 
    poll1: poll1.question, 
    poll2: poll2.question, 
    poll3: poll3.question 
  });

  // Get poll options for voting with proper error handling
  const poll1Options = await prisma.pollOption.findMany({
    where: { pollId: poll1.id }
  });

  const poll2Options = await prisma.pollOption.findMany({
    where: { pollId: poll2.id }
  });

  // Validate that we have enough options
  if (poll1Options.length < 2) {
    throw new Error(`Poll 1 should have at least 2 options, but found ${poll1Options.length}`);
  }

  if (poll2Options.length < 2) {
    throw new Error(`Poll 2 should have at least 2 options, but found ${poll2Options.length}`);
  }

  // Create some sample votes with proper type safety
  const votes: Array<{ userId: string; pollOptionId: string; description?: string }> = [
    // User 1 votes on poll 1
    { userId: user1.id, pollOptionId: poll1Options[0]!.id, description: 'JavaScript' },
    { userId: user1.id, pollOptionId: poll1Options[1]!.id, description: 'Python (this should fail due to unique constraint)' },
    
    // User 2 votes on poll 1
    { userId: user2.id, pollOptionId: poll1Options[0]!.id, description: 'JavaScript' },
    
    // User 1 votes on poll 2
    { userId: user1.id, pollOptionId: poll2Options[0]!.id, description: 'React' },
    
    // User 2 votes on poll 2
    { userId: user2.id, pollOptionId: poll2Options[1]!.id, description: 'Vue.js' },
  ];

  for (const vote of votes) {
    try {
      await prisma.vote.create({
        data: {
          userId: vote.userId,
          pollOptionId: vote.pollOptionId
        }
      });
      console.log(`✅ Created vote for user ${vote.userId} on option ${vote.pollOptionId} (${vote.description})`);
    } catch (error) {
      console.log(`⚠️  Skipped duplicate vote for user ${vote.userId} on option ${vote.pollOptionId} (${vote.description})`);
    }
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
