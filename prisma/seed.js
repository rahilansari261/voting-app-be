"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Create sample users
    const hashedPassword = await bcryptjs_1.default.hash('password123', 12);
    const user1 = await prisma.user.upsert({
        where: { email: 'john@example.com' },
        update: {},
        create: {
            name: 'John Doe',
            email: 'john@example.com',
            passwordHash: hashedPassword
        }
    });
    const user2 = await prisma.user.upsert({
        where: { email: 'jane@example.com' },
        update: {},
        create: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            passwordHash: hashedPassword
        }
    });
    console.log('✅ Created users:', { user1: user1.name, user2: user2.name });
    // Create sample polls
    const poll1 = await prisma.poll.upsert({
        where: { id: 'poll-1' },
        update: {},
        create: {
            id: 'poll-1',
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
    const poll2 = await prisma.poll.upsert({
        where: { id: 'poll-2' },
        update: {},
        create: {
            id: 'poll-2',
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
    const poll3 = await prisma.poll.upsert({
        where: { id: 'poll-3' },
        update: {},
        create: {
            id: 'poll-3',
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
    // Get poll options for voting
    const poll1Options = await prisma.pollOption.findMany({
        where: { pollId: poll1.id }
    });
    const poll2Options = await prisma.pollOption.findMany({
        where: { pollId: poll2.id }
    });
    // Create some sample votes
    const votes = [
        // User 1 votes on poll 1
        { userId: user1.id, pollOptionId: poll1Options[0].id }, // JavaScript
        { userId: user1.id, pollOptionId: poll1Options[1].id }, // Python (this should fail due to unique constraint)
        // User 2 votes on poll 1
        { userId: user2.id, pollOptionId: poll1Options[0].id }, // JavaScript
        // User 1 votes on poll 2
        { userId: user1.id, pollOptionId: poll2Options[0].id }, // React
        // User 2 votes on poll 2
        { userId: user2.id, pollOptionId: poll2Options[1].id }, // Vue.js
    ];
    for (const vote of votes) {
        try {
            await prisma.vote.create({
                data: vote
            });
            console.log(`✅ Created vote for user ${vote.userId} on option ${vote.pollOptionId}`);
        }
        catch (error) {
            console.log(`⚠️  Skipped duplicate vote for user ${vote.userId} on option ${vote.pollOptionId}`);
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
//# sourceMappingURL=seed.js.map