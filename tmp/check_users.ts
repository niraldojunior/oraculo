import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emails = ['niraldojunior@gmail.com', 'niraldo.junior@vtal.com'];
  
  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      console.log(`User found: ${email}`);
      console.log(JSON.stringify(user, null, 2));
    } else {
      // Check Collaborator table as well, just in case
      const collaborator = await prisma.collaborator.findUnique({
        where: { email }
      });
      if (collaborator) {
        console.log(`Collaborator found: ${email}`);
        console.log(JSON.stringify(collaborator, null, 2));
      } else {
        console.log(`User/Collaborator NOT found: ${email}`);
      }
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
