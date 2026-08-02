const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SQL_STATEMENTS = [
  // 1. Add SUPER_ADMIN to Role enum
  `ALTER TABLE users MODIFY COLUMN role ENUM('STUDENT','INSTRUCTOR','ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'STUDENT'`,

  // 2. Create unions table
  `CREATE TABLE IF NOT EXISTS unions (
    id VARCHAR(191) NOT NULL,
    nameAr VARCHAR(191) NOT NULL,
    nameEn VARCHAR(191) NOT NULL,
    descriptionAr LONGTEXT NOT NULL,
    descriptionEn LONGTEXT NOT NULL,
    logo VARCHAR(191) NULL,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    PRIMARY KEY (id)
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  // 3. Create entities table
  `CREATE TABLE IF NOT EXISTS entities (
    id VARCHAR(191) NOT NULL,
    nameAr VARCHAR(191) NOT NULL,
    nameEn VARCHAR(191) NOT NULL,
    descriptionAr LONGTEXT NOT NULL,
    descriptionEn LONGTEXT NOT NULL,
    logo VARCHAR(191) NULL,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    unionId VARCHAR(191) NOT NULL,
    ownerId VARCHAR(191) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    INDEX entities_unionId_idx (unionId),
    INDEX entities_ownerId_idx (ownerId),
    CONSTRAINT entities_unionId_fkey FOREIGN KEY (unionId) REFERENCES unions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT entities_ownerId_fkey FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  // 4. Create initiatives table
  `CREATE TABLE IF NOT EXISTS initiatives (
    id VARCHAR(191) NOT NULL,
    titleAr VARCHAR(191) NOT NULL,
    titleEn VARCHAR(191) NOT NULL,
    descriptionAr LONGTEXT NOT NULL,
    descriptionEn LONGTEXT NOT NULL,
    entityId VARCHAR(191) NOT NULL,
    leaderId VARCHAR(191) NOT NULL,
    status ENUM('DRAFT','ACTIVE','COMPLETED') NOT NULL DEFAULT 'DRAFT',
    startDate DATETIME(3) NULL,
    endDate DATETIME(3) NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    INDEX initiatives_entityId_idx (entityId),
    INDEX initiatives_leaderId_idx (leaderId),
    CONSTRAINT initiatives_entityId_fkey FOREIGN KEY (entityId) REFERENCES entities(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT initiatives_leaderId_fkey FOREIGN KEY (leaderId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  // 5. Create events table
  `CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(191) NOT NULL,
    titleAr VARCHAR(191) NOT NULL,
    titleEn VARCHAR(191) NOT NULL,
    descriptionAr LONGTEXT NOT NULL,
    descriptionEn LONGTEXT NOT NULL,
    image VARCHAR(191) NULL,
    venue VARCHAR(191) NULL,
    startDate DATETIME(3) NOT NULL,
    endDate DATETIME(3) NOT NULL,
    capacity INT NOT NULL DEFAULT 0,
    registeredCount INT NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('DRAFT','SUBMITTED','APPROVED','PUBLISHED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
    organizerId VARCHAR(191) NOT NULL,
    entityId VARCHAR(191) NULL,
    refundPolicy LONGTEXT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    INDEX events_organizerId_idx (organizerId),
    INDEX events_entityId_idx (entityId),
    INDEX events_status_idx (status),
    CONSTRAINT events_organizerId_fkey FOREIGN KEY (organizerId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT events_entityId_fkey FOREIGN KEY (entityId) REFERENCES entities(id) ON DELETE SET NULL ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  // 6. Create event_registrations table
  `CREATE TABLE IF NOT EXISTS event_registrations (
    id VARCHAR(191) NOT NULL,
    eventId VARCHAR(191) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    status ENUM('REGISTERED','ATTENDED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'REGISTERED',
    paymentId VARCHAR(191) NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY event_registrations_eventId_userId_key (eventId, userId),
    INDEX event_registrations_userId_idx (userId),
    CONSTRAINT event_registrations_eventId_fkey FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT event_registrations_userId_fkey FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  // 7. Create competitions table
  `CREATE TABLE IF NOT EXISTS competitions (
    id VARCHAR(191) NOT NULL,
    titleAr VARCHAR(191) NOT NULL,
    titleEn VARCHAR(191) NOT NULL,
    descriptionAr LONGTEXT NOT NULL,
    descriptionEn LONGTEXT NOT NULL,
    image VARCHAR(191) NULL,
    mode ENUM('INDIVIDUAL','TEAM') NOT NULL DEFAULT 'INDIVIDUAL',
    maxTeamSize INT NOT NULL DEFAULT 1,
    startDate DATETIME(3) NOT NULL,
    endDate DATETIME(3) NOT NULL,
    status ENUM('DRAFT','OPEN','JUDGING','COMPLETED') NOT NULL DEFAULT 'DRAFT',
    prizes LONGTEXT NULL,
    rules LONGTEXT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    PRIMARY KEY (id)
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  // 8. Create competition_teams table
  `CREATE TABLE IF NOT EXISTS competition_teams (
    id VARCHAR(191) NOT NULL,
    competitionId VARCHAR(191) NOT NULL,
    name VARCHAR(191) NOT NULL,
    leaderId VARCHAR(191) NOT NULL,
    score DOUBLE NULL,
    rank INT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    INDEX competition_teams_competitionId_idx (competitionId),
    CONSTRAINT competition_teams_competitionId_fkey FOREIGN KEY (competitionId) REFERENCES competitions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT competition_teams_leaderId_fkey FOREIGN KEY (leaderId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  // 9. Create competition_participants table
  `CREATE TABLE IF NOT EXISTS competition_participants (
    id VARCHAR(191) NOT NULL,
    competitionId VARCHAR(191) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    teamId VARCHAR(191) NULL,
    score DOUBLE NULL,
    rank INT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY competition_participants_competitionId_userId_key (competitionId, userId),
    INDEX competition_participants_competitionId_idx (competitionId),
    INDEX competition_participants_userId_idx (userId),
    CONSTRAINT competition_participants_competitionId_fkey FOREIGN KEY (competitionId) REFERENCES competitions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT competition_participants_userId_fkey FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT competition_participants_teamId_fkey FOREIGN KEY (teamId) REFERENCES competition_teams(id) ON DELETE SET NULL ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
];

async function runMigration() {
  console.log('Starting migration...');

  for (let i = 0; i < SQL_STATEMENTS.length; i++) {
    const sql = SQL_STATEMENTS[i];
    const firstLine = sql.trim().split('\n')[0].substring(0, 80);
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ [${i + 1}/${SQL_STATEMENTS.length}] ${firstLine}`);
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
        console.log(`⚠️  [${i + 1}/${SQL_STATEMENTS.length}] Already exists: ${firstLine}`);
      } else {
        console.error(`❌ [${i + 1}/${SQL_STATEMENTS.length}] FAILED: ${firstLine}`);
        console.error(`   Error: ${error.message}`);
      }
    }
  }

  console.log('\nMigration completed!');
  await prisma.$disconnect();
}

runMigration().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
