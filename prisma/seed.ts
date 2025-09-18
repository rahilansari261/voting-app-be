import { PrismaClient, User, Poll } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create 4 users
  const hashedPassword = await bcrypt.hash('password123', 12);
  const users: User[] = [];

  for (let i = 1; i <= 4; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@gmail.com` },
      update: {},
      create: {
        name: `User ${i}`,
        email: `user${i}@gmail.com`,
        password: hashedPassword
      }
    });
    users.push(user);
    console.log(`✅ Created user: ${user.name} (${user.email})`);
  }

  // Create 4 polls for each user (16 polls total)
  const pollQuestions = [
    'What is your favorite programming language?',
    'Which framework do you prefer for frontend development?',
    'What is your preferred database?',
    'Which cloud provider do you use most?'
  ];

  const pollOptions = [
    ['JavaScript', 'Python', 'Java', 'Go'],
    ['React', 'Vue.js', 'Angular', 'Svelte'],
    ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
    ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean']
  ];

  const polls: Poll[] = [];

  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex];
    
    if (!user) {
      console.error(`❌ User at index ${userIndex} is undefined`);
      continue;
    }
    
    for (let pollIndex = 0; pollIndex < 4; pollIndex++) {
      const question = pollQuestions[pollIndex];
      const options = pollOptions[pollIndex];
      
      if (!question || !options) {
        console.error(`❌ Question or options at index ${pollIndex} is undefined`);
        continue;
      }
      
      const poll = await prisma.poll.create({
        data: {
          question: question,
          isPublished: true,
          creatorId: user.id,
          options: {
            create: options.map(optionText => ({
              text: optionText
            }))
          }
        }
      });
      polls.push(poll);
      console.log(`✅ Created poll: "${poll.question}" by ${user.name}`);
    }
  }

  console.log(`🎉 Database seed completed successfully! Created ${users.length} users and ${polls.length} polls.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
