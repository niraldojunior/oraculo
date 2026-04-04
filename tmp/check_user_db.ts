import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const email = 'niraldo.junior@vtal.com';
  console.log(`Checking for user: ${email}`);

  const collaborator = await prisma.collaborator.findUnique({
    where: { email }
  });

  if (collaborator) {
    console.log('Collaborator found:', JSON.stringify(collaborator, null, 2));
  } else {
    console.log('Collaborator not found.');
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    console.log('User found:', JSON.stringify(user, null, 2));
  } else {
    console.log('User not found.');
  }

  await prisma.$disconnect();
}

checkUser().catch(console.error);
